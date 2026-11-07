import { useState, useEffect } from 'react';
import { Check, Crown, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { SubscriptionService, type Subscription } from '@/services/SubscriptionService';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export function PricingPage() {
  useSEO({
    title: 'Pricing | The Book Club For One',
    description: 'Upgrade to Premium for AI-powered chapter guides, spoiler-safe Q&A, and unlimited book club tools.',
    canonical: `${window.location.origin}/pricing`,
  });

  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      SubscriptionService.getSubscription().then(sub => {
        setSubscription(sub);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  const isPremium = SubscriptionService.isPremium(subscription);

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      window.location.href = '/signin?redirect=/pricing';
      return;
    }
    setCheckoutLoading(plan);
    setError(null);
    try {
      const url = await SubscriptionService.createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const freeFeatures = [
    '20 free reading & book club tools',
    '485-book catalogue with reviews and reading notes',
    'Personal library with reading tracking',
    'Reading goals and streaks',
    '3 AI requests per day',
  ];

  const premiumFeatures = [
    'Everything in Free, plus:',
    'Unlimited AI chapter guides',
    'Spoiler-safe Q&A with any book',
    'AI-generated discussion questions',
    'AI character and theme analysis',
    'AI vocabulary highlights',
    'Things you may have missed',
    'Priority AI responses',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Pricing' },
      ]} />

      <div className="text-center mb-12">
        <span className="badge-sage mb-6">
          <Crown className="w-3 h-3" /> Premium
        </span>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">
          Unlock Your AI Book Club
        </h1>
        <p className="text-lg text-warmgrey dark:text-dark-sub max-w-2xl mx-auto leading-relaxed">
          Get unlimited AI-powered insights, spoiler-safe discussions, and deeper engagement with every book you read.
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-terracotta-50 dark:bg-terracotta-900/30 border border-terracotta-300 dark:border-terracotta-700 text-terracotta-600 dark:text-dark-terra text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Free plan */}
        <div className="card flex flex-col">
          <h3 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-1">Free</h3>
          <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">For casual readers</p>
          <div className="mb-6">
            <span className="text-4xl font-serif font-bold text-charcoal dark:text-dark-text">$0</span>
            <span className="text-sm text-warmgrey dark:text-dark-sub">/month</span>
          </div>
          <ul className="space-y-3 mb-6 flex-1">
            {freeFeatures.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-charcoal dark:text-dark-text">
                <Check className="w-4 h-4 text-sage-400 dark:text-dark-sage flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="text-center text-sm text-warmgrey dark:text-dark-sub py-3">
              You're on Premium
            </div>
          ) : (
            <div className="text-center text-sm text-warmgrey dark:text-dark-sub py-3">
              Your current plan
            </div>
          )}
        </div>

        {/* Monthly */}
        <div className={`card flex flex-col relative ${!isPremium ? 'border-2 border-forest-500 dark:border-dark-sage shadow-lift' : ''}`}>
          {!isPremium && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="badge-forest">
                <Sparkles className="w-3 h-3" /> Most Popular
              </span>
            </div>
          )}
          <h3 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-1">Premium Monthly</h3>
          <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">For active readers</p>
          <div className="mb-6">
            <span className="text-4xl font-serif font-bold text-charcoal dark:text-dark-text">$5</span>
            <span className="text-sm text-warmgrey dark:text-dark-sub">/month</span>
          </div>
          <ul className="space-y-3 mb-6 flex-1">
            {premiumFeatures.map(f => (
              <li key={f} className={`flex items-start gap-2 text-sm ${f.endsWith(':') ? 'font-semibold text-forest-500 dark:text-dark-sage' : 'text-charcoal dark:text-dark-text'}`}>
                <Check className="w-4 h-4 text-sage-400 dark:text-dark-sage flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="text-center text-sm text-sage-400 dark:text-dark-sage py-3 font-medium">
              Active
            </div>
          ) : (
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={checkoutLoading !== null || loading}
              className="btn-accent w-full justify-center"
            >
              {checkoutLoading === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Subscribe Monthly
            </button>
          )}
        </div>

        {/* Yearly */}
        <div className="card flex flex-col">
          <h3 className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-1">Premium Yearly</h3>
          <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">Best value — save 20%</p>
          <div className="mb-6">
            <span className="text-4xl font-serif font-bold text-charcoal dark:text-dark-text">$48</span>
            <span className="text-sm text-warmgrey dark:text-dark-sub">/year</span>
          </div>
          <ul className="space-y-3 mb-6 flex-1">
            {premiumFeatures.map(f => (
              <li key={f} className={`flex items-start gap-2 text-sm ${f.endsWith(':') ? 'font-semibold text-forest-500 dark:text-dark-sage' : 'text-charcoal dark:text-dark-text'}`}>
                <Check className="w-4 h-4 text-sage-400 dark:text-dark-sage flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="text-center text-sm text-sage-400 dark:text-dark-sage py-3 font-medium">
              Active
            </div>
          ) : (
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={checkoutLoading !== null || loading}
              className="btn-outline w-full justify-center"
            >
              {checkoutLoading === 'yearly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              Subscribe Yearly
            </button>
          )}
        </div>
      </div>

      <div className="text-center mt-10">
        <p className="text-sm text-warmgrey dark:text-dark-sub">
          Cancel anytime. Payments processed securely by Stripe.
        </p>
      </div>
    </div>
  );
}
