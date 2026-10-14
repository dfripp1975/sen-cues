// Permanently deletes the caller's account. All personal rows cascade from auth.users.
// Any active Stripe subscription is cancelled first so the user is not billed again.
import { corsHeaders, errorResponse, json } from '../_shared/cors.ts';
import { adminClient, getUser } from '../_shared/supabase.ts';
import { stripeClient } from '../_shared/stripe.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const user = await getUser(req);
  if (!user) return errorResponse(401, 'unauthorised', 'Please sign in first.');

  let confirm = '';
  try {
    confirm = (await req.json()).confirm;
  } catch { /* handled below */ }
  if (confirm !== 'DELETE') return errorResponse(400, 'confirmation_required', 'Type DELETE to confirm.');

  const db = adminClient();
  const { data: sub } = await db.from('subscriptions').select('stripe_subscription_id, status').eq('user_id', user.id).maybeSingle();
  if (sub?.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(sub.status)) {
    try {
      await stripeClient().subscriptions.cancel(sub.stripe_subscription_id);
    } catch (e) {
      console.error('Stripe cancel failed', e);
      return errorResponse(502, 'cancel_failed', 'We could not cancel your subscription automatically, so your account has not been deleted. Please cancel it in Manage subscription first, then try again.');
    }
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(error);
    return errorResponse(500, 'server_error', 'Could not delete your account. Please try again.');
  }
  return json({ deleted: true });
});
