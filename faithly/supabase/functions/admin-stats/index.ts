// Aggregate analytics for administrators. Returns counts and totals only —
// never journal entries, prayers or AI conversation content.
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { adminClient, getUser } from '../_shared/supabase.ts';

const day = (d: Date) => d.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorised', 'Please sign in first.');
  const db = adminClient();
  const { data: me } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!me?.is_admin) return errorResponse(403, 'forbidden', 'Administrators only.');

  const now = new Date();
  const ago = (n: number) => new Date(now.getTime() - n * 86400000);
  const count = async (table: string, f?: (q: any) => any) => {
    let q = db.from(table).select('*', { count: 'exact', head: true });
    if (f) q = f(q);
    const { count } = await q;
    return count ?? 0;
  };

  const [users, newUsers30, dau, wau, mau] = await Promise.all([
    count('profiles'),
    count('profiles', (q) => q.gte('created_at', ago(30).toISOString())),
    count('user_activity_days', (q) => q.eq('day', day(now))),
    distinctActive(db, day(ago(7))),
    distinctActive(db, day(ago(30))),
  ]);

  const { data: subs } = await db.from('subscriptions').select('plan, status, amount_pence, created_at').in('status', ['active', 'trialing']);
  const premium = subs?.length ?? 0;
  const monthly = subs?.filter((s) => s.plan === 'monthly').length ?? 0;
  const yearly = subs?.filter((s) => s.plan === 'yearly').length ?? 0;
  const mrrPence = (subs ?? []).reduce((sum, s) => sum + (s.plan === 'yearly' ? Math.round((s.amount_pence ?? 3999) / 12) : (s.amount_pence ?? 599)), 0);
  const { count: everSubscribed } = await db.from('subscriptions').select('*', { count: 'exact', head: true }).not('stripe_subscription_id', 'is', null);

  const { data: usage } = await db.from('usage_tracking').select('kind, input_tokens, output_tokens, estimated_cost_usd, created_at').gte('created_at', ago(30).toISOString()).limit(100000);
  const aiByKind: Record<string, number> = {};
  let aiCost = 0, aiTokens = 0;
  const aiByDay: Record<string, number> = {};
  for (const u of usage ?? []) {
    aiByKind[u.kind] = (aiByKind[u.kind] ?? 0) + 1;
    aiCost += Number(u.estimated_cost_usd);
    aiTokens += u.input_tokens + u.output_tokens;
    const d = u.created_at.slice(0, 10);
    aiByDay[d] = (aiByDay[d] ?? 0) + 1;
  }

  const { data: journeys } = await db.from('faith_journeys').select('id, title');
  const { data: progress } = await db.from('user_journey_progress').select('journey_id, status');
  const popular = (journeys ?? []).map((j) => ({
    title: j.title,
    started: progress?.filter((p) => p.journey_id === j.id).length ?? 0,
    completed: progress?.filter((p) => p.journey_id === j.id && p.status === 'completed').length ?? 0,
  })).sort((a, b) => b.started - a.started);

  // Retention: of users who signed up 1–30 days ago, how many came back the next day;
  // of users who signed up 30–60 days ago, how many were active in the last 30 days.
  const retention = await computeRetention(db, now);

  return json({
    generated_at: now.toISOString(),
    users: { total: users, new_last_30_days: newUsers30, active_today: dau, active_7_days: wau, active_30_days: mau },
    subscriptions: { premium, monthly, yearly, estimated_mrr_gbp: mrrPence / 100, conversion_rate: users ? premium / users : 0, ever_subscribed: everSubscribed ?? 0 },
    ai: { requests_30_days: usage?.length ?? 0, by_kind: aiByKind, by_day: aiByDay, tokens_30_days: aiTokens, estimated_cost_usd_30_days: Math.round(aiCost * 100) / 100 },
    journeys: popular,
    retention,
  });
});

async function distinctActive(db: ReturnType<typeof adminClient>, since: string): Promise<number> {
  const { data } = await db.from('user_activity_days').select('user_id').gte('day', since).limit(100000);
  return new Set((data ?? []).map((r) => r.user_id)).size;
}

async function computeRetention(db: ReturnType<typeof adminClient>, now: Date) {
  const ago = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const { data: recent } = await db.from('profiles').select('id, created_at').gte('created_at', ago(31)).lt('created_at', ago(1)).limit(20000);
  let d1 = 0;
  for (const p of recent ?? []) {
    const next = new Date(new Date(p.created_at).getTime() + 86400000).toISOString().slice(0, 10);
    const { count } = await db.from('user_activity_days').select('*', { count: 'exact', head: true }).eq('user_id', p.id).eq('day', next);
    if (count) d1++;
  }
  const { data: older } = await db.from('profiles').select('id').gte('created_at', ago(60)).lt('created_at', ago(30)).limit(20000);
  let m1 = 0;
  for (const p of older ?? []) {
    const { count } = await db.from('user_activity_days').select('*', { count: 'exact', head: true }).eq('user_id', p.id).gte('day', ago(30).slice(0, 10));
    if (count) m1++;
  }
  return {
    day_1: { cohort: recent?.length ?? 0, retained: d1, rate: recent?.length ? d1 / recent.length : null },
    month_1: { cohort: older?.length ?? 0, retained: m1, rate: older?.length ? m1 / older.length : null },
  };
}
