// Opens the Stripe Customer Portal so subscribers can change plan, update card or cancel.
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { adminClient, getUser } from '../_shared/supabase.ts';
import { stripeClient, StripeNotConfiguredError } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorised', 'Please sign in first.');
  try {
    const stripe = stripeClient();
    const { data: sub } = await adminClient().from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (!sub?.stripe_customer_id) return errorResponse(404, 'no_subscription', 'No Stripe subscription was found for your account.');
    const appUrl = Deno.env.get('APP_URL') ?? new URL(req.headers.get('origin') ?? 'http://localhost:5173').origin;
    const session = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${appUrl}/premium` });
    return json({ url: session.url });
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) return errorResponse(503, 'payments_not_configured', 'Payments are not set up yet.');
    console.error(e);
    return errorResponse(500, 'server_error', 'Could not open subscription management. Please try again.');
  }
});
