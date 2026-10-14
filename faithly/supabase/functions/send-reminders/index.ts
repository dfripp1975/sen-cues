// Sends web push reminders to users who opted in. Invoke every 15 minutes from
// pg_cron (see README) with header  x-cron-secret: <REMINDER_CRON_SECRET>.
// Deploy with --no-verify-jwt; the shared secret authenticates the caller.
import webpush from 'npm:web-push@3.6.7';
import { adminClient } from '../_shared/supabase.ts';

type Kind = 'morning_scripture' | 'evening_prayer' | 'daily_devotional' | 'journey_reminder' | 'journal_reminder';

const MESSAGES: Record<Kind, { title: string; body: string; url: string }> = {
  morning_scripture: { title: "Today's verse is ready", body: 'Take a quiet moment with God’s Word this morning.', url: '/' },
  evening_prayer: { title: 'Evening prayer', body: 'A few minutes to rest and pray before the day ends.', url: '/you/prayers' },
  daily_devotional: { title: "Today's devotional", body: 'A short reflection is waiting for you whenever you are ready.', url: '/devotionals' },
  journey_reminder: { title: 'Your faith journey', body: 'Your next day is ready whenever you are.', url: '/journeys' },
  journal_reminder: { title: 'Prayer journal', body: 'Would you like to write a few lines tonight?', url: '/you/journal' },
};

const WINDOW_MIN = 15;

function localParts(tz: string, d: Date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { minutes: Number(p.hour) * 60 + Number(p.minute), date: `${p.year}-${p.month}-${p.day}` };
}
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const due = (now: number, at: string) => now >= toMin(at) && now < toMin(at) + WINDOW_MIN;

Deno.serve(async (req) => {
  const secret = Deno.env.get('REMINDER_CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return new Response('Forbidden', { status: 403 });
  const pub = Deno.env.get('VAPID_PUBLIC_KEY'), priv = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!pub || !priv) return new Response('VAPID keys not configured', { status: 503 });
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com', pub, priv);

  const db = adminClient();
  const { data: prefs } = await db.from('notification_preferences').select('*')
    .or('morning_scripture.eq.true,evening_prayer.eq.true,daily_devotional.eq.true,journey_reminder.eq.true,journal_reminder.eq.true');
  const now = new Date();
  let sent = 0;

  for (const p of prefs ?? []) {
    let local;
    try { local = localParts(p.timezone, now); } catch { local = localParts('Europe/London', now); }
    const kinds: Kind[] = [];
    if (p.morning_scripture && due(local.minutes, p.morning_time)) kinds.push('morning_scripture');
    if (p.daily_devotional && due(local.minutes, p.devotional_time)) kinds.push('daily_devotional');
    if (p.evening_prayer && due(local.minutes, p.evening_time)) kinds.push('evening_prayer');
    if (p.journal_reminder && due(local.minutes, p.evening_time)) kinds.push('journal_reminder');
    if (p.journey_reminder && due(local.minutes, p.morning_time)) {
      const { count } = await db.from('user_journey_progress').select('*', { count: 'exact', head: true }).eq('user_id', p.user_id).eq('status', 'active');
      if (count) kinds.push('journey_reminder');
    }
    if (!kinds.length) continue;

    const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', p.user_id);
    if (!subs?.length) continue;
    for (const kind of kinds) {
      // reminder_log's primary key makes each reminder at most once per local day.
      const { error: dup } = await db.from('reminder_log').insert({ user_id: p.user_id, kind, day: local.date });
      if (dup) continue;
      for (const s of subs) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(MESSAGES[kind]));
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
          else console.error('push failed', code);
        }
      }
    }
  }
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
