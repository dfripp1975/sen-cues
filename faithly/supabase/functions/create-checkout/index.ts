// Creates a Stripe Checkout session for the monthly or yearly plan.
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { adminClient, getUser, isPremium } from '../_shared/supabase.ts';
import { stripeClient, StripeNotConfiguredError } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorised', 'Please sign in first.');

  let plan: string;
  try {
    plan = (await req.json()).plan;
  } catch {
    return errorResponse(400, 'bad_request', 'Invalid request body.');
  }
  const price = plan === 'yearly' ? Deno.env.get('STRIPE_PRICE_YEARLY') : plan === 'monthly' ? Deno.env.get('STRIPE_PRICE_MONTHLY') : null;
  if (plan !== 'monthly' && plan !== 'yearly') return errorResponse(400, 'bad_request', 'Choose a monthly or yearly plan.');

  try {
    const stripe = stripeClient();
    if (!price) throw new StripeNotConfiguredError('price missing');
    const db = adminClient();
    if (await isPremium(db, user.id)) return errorResponse(409, 'already_premium', 'You already have Faithly Premium.');

    const { data: sub } = await db.from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    let customerId = sub?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      await db.from('subscriptions').upsert({ user_id: user.id, stripe_customer_id: customerId, provider: 'stripe' }, { onConflict: 'user_id' });
    }

    const appUrl = Deno.env.get('APP_URL') ?? new URL(req.headers.get('origin') ?? 'http://localhost:5173').origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/premium?checkout=success`,
      cancel_url: `${appUrl}/premium?checkout=cancelled`,
    });
    return json({ url: session.url });
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      return errorResponse(503, 'payments_not_configured', 'Payments are not set up yet. An administrator needs to add STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY.');
    }
    console.error(e);
    return errorResponse(500, 'server_error', 'Could not start checkout. Please try again.');
  }
});
