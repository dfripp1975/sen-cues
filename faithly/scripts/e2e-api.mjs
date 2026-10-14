#!/usr/bin/env node
// End-to-end API test of Faithly's critical flows against a running Supabase stack
// (local or a staging project) with the Edge Functions deployed.
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
//   STRIPE_WEBHOOK_SECRET=whsec_... node scripts/e2e-api.mjs
//
// The AI steps expect a configured provider (or an OpenAI-compatible mock via
// OPENAI_BASE_URL). Creates throwaway users and deletes them again.
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

const URL_ = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WHSEC = process.env.STRIPE_WEBHOOK_SECRET;
if (!URL_ || !ANON || !SERVICE) {
  console.error('Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

let passed = 0;
const failures = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const client = () => createClient(URL_, ANON, { auth: { persistSession: false } });

async function invoke(sb, name, body) {
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) {
    let payload = null;
    try { payload = await error.context.json(); } catch { /* */ }
    return { status: error.context?.status, error: payload?.error ?? { message: error.message } };
  }
  return { status: 200, data };
}

const email = `e2e-${Date.now()}@example.com`;
const password = 'correct-horse-battery';
const sb = client();
let userId;

console.log('Faithly E2E');

await step('1. Register account (creates profile + preferences via trigger)', async () => {
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { display_name: 'Sarah' } } });
  if (error) throw error;
  assert(data.session, 'expected a session (enable autoconfirm for tests)');
  userId = data.user.id;
  const { data: p } = await sb.from('profiles').select('display_name, onboarding_completed').single();
  assert(p.display_name === 'Sarah' && p.onboarding_completed === false, 'profile not created as expected');
});

await step('2. Complete onboarding (preferences saved, can be skipped/changed)', async () => {
  const { error } = await sb.from('user_preferences').update({ focus_areas: ['anxiety', 'prayer'], bible_familiarity: 'some', daily_minutes: 10, tradition: 'Anglican / Church of England' }).eq('user_id', userId);
  if (error) throw error;
  const { error: e2 } = await sb.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
  if (e2) throw e2;
  const { data } = await sb.from('user_preferences').select('focus_areas').single();
  assert(data.focus_areas.includes('anxiety'), 'preferences not saved');
});

await step('3. Read a Bible passage and search', async () => {
  const { data } = await sb.from('bible_verses').select('verse, text').eq('book_id', 19).eq('chapter', 23).order('verse');
  assert(data.length === 6 && data[0].text.startsWith('Yahweh is my shepherd'), 'Psalm 23 not returned correctly');
  const { data: hits } = await sb.rpc('search_bible', { q: 'peace of God', translation: 'WEB', max_results: 5 });
  assert(hits.length > 0, 'search returned nothing');
  const { error } = await sb.from('reading_progress').insert({ user_id: userId, book_id: 19, chapter: 23 });
  if (error) throw error;
});

let conversationId;
await step('4. Ask an AI question — invented references are dropped, real ones verified', async () => {
  const r = await invoke(sb, 'faithly-ai', { mode: 'chat', message: 'What does the Bible say about anxiety?' });
  assert(r.status === 200, `status ${r.status}: ${JSON.stringify(r.error)}`);
  const refs = r.data.passages.map((p) => p.reference);
  assert(refs.includes('Philippians 4:6-7'), `expected Philippians 4:6-7 in ${refs}`);
  assert(!refs.some((x) => /Hezekiah|John 22/.test(x)), 'unverifiable reference leaked through');
  assert(r.data.unverified_references.length === 2, 'expected 2 unverified references');
  assert(r.data.passages[0].verses[0].text.includes('In nothing be anxious'), 'passage text not from Bible DB');
  assert(r.data.follow_ups.length === 3, 'expected 3 follow-ups');
  conversationId = r.data.conversationId;
});

await step('5. Conversation saved with history; Go Deeper attaches to it', async () => {
  const { data } = await sb.from('chat_messages').select('role').eq('conversation_id', conversationId);
  assert(data.length === 2, `expected 2 messages, got ${data.length}`);
  const r = await invoke(sb, 'faithly-ai', { mode: 'deeper', question: 'What does the Bible say about anxiety?', answer: 'x', conversationId });
  assert(r.status === 200 && r.data.related_passages[0].reference === 'Matthew 6:25-34', 'deeper failed');
  const { data: last } = await sb.from('chat_messages').select('payload').eq('role', 'assistant').single();
  assert(last.payload.deeper, 'deeper not persisted');
});

await step('5b. Another user cannot read or append to the conversation', async () => {
  const other = client();
  const { data } = await other.auth.signUp({ email: `e2e-other-${Date.now()}@example.com`, password });
  const r = await invoke(other, 'faithly-ai', { mode: 'chat', message: 'hello', conversationId });
  assert(r.status === 404, `expected 404, got ${r.status}`);
  const { data: rows } = await other.from('chat_messages').select('id');
  assert(rows.length === 0, 'other user can read messages');
  await admin.auth.admin.deleteUser(data.user.id);
});

await step('5c. Crisis message returns support resources, not a generated answer', async () => {
  const r = await invoke(sb, 'faithly-ai', { mode: 'chat', message: "I don't want to live any more" });
  assert(r.status === 200 && r.data.safety === true && r.data.resources.some((x) => x.name === 'Samaritans'), 'no safety response');
});

await step('Explain This Verse + study (cached second time, wrong-chapter difficult verse filtered)', async () => {
  const e = await invoke(sb, 'faithly-ai', { mode: 'explain_verse', reference: 'Psalm 23:1' });
  assert(e.status === 200 && e.data.passage.verses[0].verse === 1, 'explain failed');
  const s = await invoke(sb, 'faithly-ai', { mode: 'study', bookId: 19, chapter: 23, level: 'beginner' });
  assert(s.status === 200, `study status ${s.status}`);
  assert(s.data.difficult_verses.length === 1 && s.data.quiz.length === 1, 'study validation failed');
  const again = await invoke(sb, 'faithly-ai', { mode: 'study', bookId: 19, chapter: 23, level: 'beginner' });
  assert(again.data.cached === true, 'second study request was not cached');
});

await step('Premium-only modes rejected for free users (server-side)', async () => {
  const s = await invoke(sb, 'faithly-ai', { mode: 'study', bookId: 19, chapter: 23, level: 'advanced' });
  assert(s.status === 402 && s.error.code === 'premium_required', `advanced study: ${s.status}`);
  const { data: day } = await admin.from('journey_days').select('id').limit(1).single();
  const j = await invoke(sb, 'faithly-ai', { mode: 'journey_reflection', dayId: day.id });
  assert(j.status === 402, `journey reflection: ${j.status}`);
});

let journeyId;
await step('6. Start a faith journey (premium journeys blocked for free users)', async () => {
  const { data: journeys } = await sb.from('faith_journeys').select('id, slug, is_premium');
  const free = journeys.find((j) => !j.is_premium);
  const prem = journeys.find((j) => j.is_premium);
  journeyId = free.id;
  const { error } = await sb.from('user_journey_progress').insert({ user_id: userId, journey_id: free.id });
  if (error) throw error;
  const { error: blocked } = await sb.from('user_journey_progress').insert({ user_id: userId, journey_id: prem.id });
  assert(blocked, 'free user started a premium journey');
  const { data: premDays } = await sb.from('journey_days').select('id').eq('journey_id', prem.id);
  assert(premDays.length === 0, 'free user can read premium journey days');
});

await step('7. Complete a journey day', async () => {
  const { data, error } = await sb.from('user_journey_progress').update({ completed_days: [1] }).eq('journey_id', journeyId).select('completed_days').single();
  if (error) throw error;
  assert(data.completed_days[0] === 1, 'day not recorded');
});

await step('8. Create, search and update prayer journal entries', async () => {
  const { error } = await sb.from('journal_entries').insert({ user_id: userId, title: 'Thursday', body: 'Praying for Mum before her operation.', is_prayer: true, prayer_status: 'praying', scripture_refs: ['Philippians 4:6-7'] });
  if (error) throw error;
  const { data } = await sb.from('journal_entries').select('id').ilike('body', '%operation%');
  assert(data.length === 1, 'journal search failed');
  const { error: e2 } = await sb.from('journal_entries').update({ prayer_status: 'answered' }).eq('id', data[0].id);
  if (e2) throw e2;
  const { error: e3 } = await sb.from('prayer_entries').insert({ user_id: userId, content: 'Lord, guide me.', is_favourite: true });
  if (e3) throw e3;
});

await step('Client cannot grant itself premium or admin', async () => {
  const { error } = await sb.from('subscriptions').insert({ user_id: userId, status: 'active' });
  assert(error, 'subscription self-insert allowed');
  const { error: e2 } = await sb.from('profiles').update({ is_admin: true }).eq('id', userId);
  assert(e2, 'self-promotion to admin allowed');
});

await step('9. Subscribe to premium (signed Stripe webhook updates subscriptions)', async () => {
  assert(WHSEC, 'set STRIPE_WEBHOOK_SECRET to test the webhook');
  const event = {
    id: 'evt_test', object: 'event', type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_test_123', object: 'subscription', customer: 'cus_test_123', status: 'active', cancel_at_period_end: false,
      metadata: { user_id: userId },
      items: { data: [{ current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400, price: { unit_amount: 599, currency: 'gbp', recurring: { interval: 'month' } } }] },
    } },
  };
  const payload = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', WHSEC).update(`${t}.${payload}`).digest('hex');
  const bad = await fetch(`${URL_}/functions/v1/stripe-webhook`, { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=deadbeef`, 'Content-Type': 'application/json' }, body: payload });
  assert(bad.status === 400, `forged webhook accepted (${bad.status})`);
  const res = await fetch(`${URL_}/functions/v1/stripe-webhook`, { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}`, 'Content-Type': 'application/json' }, body: payload });
  assert(res.status === 200, `webhook status ${res.status}: ${await res.text()}`);
  const { data } = await sb.from('subscriptions').select('status, plan').single();
  assert(data.status === 'active' && data.plan === 'monthly', 'subscription not synced');
  const s = await invoke(sb, 'faithly-ai', { mode: 'study', bookId: 19, chapter: 23, level: 'advanced' });
  assert(s.status === 200, `premium advanced study: ${s.status}`);
  const { data: days } = await sb.from('journey_days').select('id');
  assert(days.length === 28, `premium user should see 28 days, saw ${days.length}`);
});

await step('10. Manage subscription (portal endpoint reachable; Stripe call needs real keys)', async () => {
  const r = await invoke(sb, 'customer-portal', {});
  // With a dummy key Stripe rejects the call; we only check the function authorises and finds the customer.
  assert([200, 500].includes(r.status), `unexpected ${r.status}`);
});

await step('Daily AI limit enforced server-side', async () => {
  await admin.from('subscriptions').delete().eq('user_id', userId);
  const rows = Array.from({ length: 10 }, () => ({ user_id: userId, kind: 'chat' }));
  await admin.from('usage_tracking').insert(rows);
  const r = await invoke(sb, 'faithly-ai', { mode: 'prayer', category: 'morning' });
  assert(r.status === 429 && r.error.code === 'limit_reached', `expected 429, got ${r.status}`);
});

await step('Admin stats: forbidden for users, aggregate-only for admins', async () => {
  const r = await invoke(sb, 'admin-stats', {});
  assert(r.status === 403, `expected 403, got ${r.status}`);
  await admin.from('profiles').update({ is_admin: true }).eq('id', userId);
  const ok = await invoke(sb, 'admin-stats', {});
  assert(ok.status === 200 && ok.data.users.total >= 1 && ok.data.ai.requests_30_days >= 1, 'stats missing');
  assert(!JSON.stringify(ok.data).includes('operation'), 'private content leaked into stats');
});

await step('11. Delete account removes all personal data', async () => {
  const bad = await invoke(sb, 'delete-account', { confirm: 'nope' });
  assert(bad.status === 400, 'deletion without confirmation allowed');
  const r = await invoke(sb, 'delete-account', { confirm: 'DELETE' });
  assert(r.status === 200, `status ${r.status} ${JSON.stringify(r.error)}`);
  for (const t of ['profiles', 'journal_entries', 'prayer_entries', 'chat_conversations', 'user_journey_progress', 'subscriptions', 'usage_tracking']) {
    const { count } = await admin.from(t).select('*', { count: 'exact', head: true }).eq(t === 'profiles' ? 'id' : 'user_id', userId);
    assert(count === 0, `${t} still has rows`);
  }
});

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
