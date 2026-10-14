// Stripe webhook: the ONLY place subscription status is written.
// Deploy with --no-verify-jwt (Stripe does not send a Supabase JWT); requests are
// authenticated by verifying the Stripe signature instead.
import { adminClient } from '../_shared/supabase.ts';
import { stripeClient, cryptoProvider, type Stripe } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!signature || !secret) return new Response('Webhook not configured', { status: 400 });

  const stripe = stripeClient();
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret, undefined, cryptoProvider);
  } catch (e) {
    console.error('Signature verification failed', e);
    return new Response('Invalid signature', { status: 400 });
  }

  const db = adminClient();
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === 'subscription' && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(s.subscription));
          await syncSubscription(db, sub, s.client_reference_id ?? undefined);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(db, event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Webhook handling failed', e);
    return new Response('Webhook handler error', { status: 500 });
  }
});

async function syncSubscription(db: ReturnType<typeof adminClient>, sub: Stripe.Subscription, userIdHint?: string) {
  let userId = userIdHint ?? (sub.metadata?.user_id as string | undefined);
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  if (!userId) {
    const { data } = await db.from('subscriptions').select('user_id').eq('stripe_customer_id', customerId).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) {
    console.error('Could not match subscription to a user', sub.id);
    return;
  }
  const item = sub.items.data[0];
  const interval = item?.price?.recurring?.interval;
  // current_period_end moved from the subscription to its items in newer API versions.
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const { error } = await db.from('subscriptions').upsert({
    user_id: userId,
    provider: 'stripe',
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan: interval === 'year' ? 'yearly' : 'monthly',
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    amount_pence: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? null,
  }, { onConflict: 'user_id' });
  if (error) throw error;
}
