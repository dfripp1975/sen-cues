import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';
import { callFunction } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dates';
import { PageHeader } from '../components/ui';
import { AiError } from '../components/AiError';

const FREE = [
  'Daily Bible verse with explanation',
  'The full Bible (World English Bible) with highlights, notes and bookmarks',
  '10 AI requests a day (questions, explanations, prayers and studies)',
  'Beginner and intermediate AI Bible study',
  'Daily devotionals',
  'Private prayer journal with search and export',
  'Two introductory faith journeys',
  'Bible challenges, memory verses and verse wallpapers',
];
const PREMIUM = [
  '100 AI requests a day',
  'Personalised journey reflections shaped around your focus areas',
  'Premium journeys, starting with 14 Days of Finding Peace',
  'Advanced Bible study mode (structure, original languages, scholarly views)',
  'Supports the ongoing writing and review of new content',
];

export default function PremiumPage() {
  const { isPremium, subscription, refresh } = useAuth();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const checkout = params.get('checkout');

  // After returning from Stripe, the webhook may take a moment to record the subscription.
  useEffect(() => {
    if (checkout !== 'success') return;
    let n = 0;
    const t = setInterval(() => { refresh(); if (++n >= 6) clearInterval(t); }, 2500);
    return () => clearInterval(t);
  }, [checkout, refresh]);

  const go = async (fn: string, body: unknown, key: string) => {
    setBusy(key);
    setError(null);
    try {
      const { url } = await callFunction<{ url: string }>(fn, body);
      window.location.href = url;
    } catch (e) {
      setError(e);
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Faithly Premium" subtitle="Go deeper with more AI help, premium journeys and advanced study." back />
      {checkout === 'success' && !isPremium && <p className="mb-4 rounded-xl bg-sage/20 p-4 text-sm" role="status">Thank you! We're confirming your subscription with our payment provider — this usually takes a few seconds.</p>}
      {checkout === 'cancelled' && <p className="mb-4 rounded-xl bg-muted p-4 text-sm">Checkout was cancelled. You have not been charged.</p>}

      {isPremium ? (
        <div className="card p-6">
          <div className="flex items-center gap-3"><Crown className="h-7 w-7 text-gold" /><h2 className="text-xl font-semibold">You're a Premium member</h2></div>
          <p className="mt-3 text-sm text-subtle">
            {subscription?.plan === 'yearly' ? 'Yearly plan' : 'Monthly plan'}
            {subscription?.current_period_end && <> · {subscription.cancel_at_period_end ? 'Ends' : 'Renews'} on {formatDate(subscription.current_period_end)}</>}
          </p>
          {subscription?.provider === 'stripe' ? (
            <button className="btn-primary mt-5" disabled={!!busy} onClick={() => go('customer-portal', {}, 'portal')}>{busy ? 'Opening…' : 'Manage subscription'}</button>
          ) : (
            <p className="mt-4 text-sm text-subtle">Your subscription is managed through your device's app store.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard title="Monthly" price="£5.99" per="per month" onChoose={() => go('create-checkout', { plan: 'monthly' }, 'monthly')} busy={busy === 'monthly'} disabled={!!busy} />
          <PlanCard title="Yearly" price="£39.99" per="per year · about £3.33 a month" badge="Save 44%" onChoose={() => go('create-checkout', { plan: 'yearly' }, 'yearly')} busy={busy === 'yearly'} disabled={!!busy} />
        </div>
      )}
      {error != null && <div className="mt-4"><AiError error={error} /></div>}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <FeatureList title="Free" items={FREE} />
        <FeatureList title="Premium adds" items={PREMIUM} highlight />
      </div>
      <p className="mt-6 text-xs text-subtle">
        AI usage is limited because each request has a real cost; Faithly never describes AI as unlimited. Payments are processed securely by Stripe.
        Cancel any time from Manage subscription; you keep Premium until the end of the period you've paid for. Prices include VAT where applicable.
        Native iPhone and Android apps (when released) will use App Store / Google Play billing.
      </p>
    </div>
  );
}

function PlanCard({ title, price, per, badge, onChoose, busy, disabled }: { title: string; price: string; per: string; badge?: string; onChoose: () => void; busy: boolean; disabled: boolean }) {
  return (
    <div className={`card relative p-6 ${badge ? 'border-gold' : ''}`}>
      {badge && <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-charcoal">{badge}</span>}
      <p className="eyebrow">{title}</p>
      <p className="mt-2 font-serif text-4xl font-semibold">{price}</p>
      <p className="text-sm text-subtle">{per}</p>
      <button className={`${badge ? 'btn-gold' : 'btn-primary'} mt-5 w-full py-3`} onClick={onChoose} disabled={disabled}>{busy ? 'Opening checkout…' : `Choose ${title.toLowerCase()}`}</button>
    </div>
  );
}

function FeatureList({ title, items, highlight }: { title: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? 'bg-gradient-to-br from-gold/10 to-transparent' : ''}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{i}</li>)}
      </ul>
    </div>
  );
}
