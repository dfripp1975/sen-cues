import { supabase } from '@/lib/supabase';

export interface Subscription {
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string | null;
}

const CHECKOUT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;

export const SubscriptionService = {
  async getSubscription(): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .maybeSingle();

    if (error) return null;
    return data as Subscription | null;
  },

  async createCheckoutSession(plan: 'monthly' | 'yearly', currency = 'USD'): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('You must be signed in to subscribe');

    const response = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan, currency }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Checkout failed' }));
      throw new Error(err.error || `Checkout failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.url) throw new Error('No checkout URL returned');
    return data.url;
  },

  isPremium(sub: Subscription | null): boolean {
    return sub?.plan === 'monthly' || sub?.plan === 'yearly';
  },
};
