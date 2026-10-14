import Stripe from 'npm:stripe@17.4.0';

export class StripeNotConfiguredError extends Error {}

export function stripeClient(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new StripeNotConfiguredError('STRIPE_SECRET_KEY is not set');
  return new Stripe(key, { apiVersion: '2024-11-20.acacia', httpClient: Stripe.createFetchHttpClient() });
}

export const cryptoProvider = Stripe.createSubtleCryptoProvider();
export type { Stripe };
