import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { AIService, ALLOWANCE_EVENT, type QuestionAllowance as Allowance } from '@/services/AIService';
import { SubscriptionService } from '@/services/SubscriptionService';
import { PACKS, PACK_PRICES, detectCurrency, formatPrice, type PackId } from '@/lib/pricing';
import { useAuth } from '@/lib/auth';

interface Props {
  /** Show the top-up offer even before the next question is attempted (e.g. after a 402). */
  outOfQuestions?: boolean;
}

/**
 * "7 of 10 questions left today · 25 bought" for Premium readers, and the
 * top-up offer once today's questions and any bought ones are used up.
 */
export function QuestionAllowance({ outOfQuestions = false }: Props) {
  const { user } = useAuth();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [premium, setPremium] = useState<boolean | null>(null);
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [buying, setBuying] = useState<PackId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(params.get('questions') === 'added');
  const currency = detectCurrency();

  useEffect(() => {
    if (!user) { setPremium(false); return; }
    AIService.getAllowance().then(r => { setPremium(r.premium); setAllowance(r.allowance); }).catch(() => setPremium(false));
  }, [user, justAdded]);

  useEffect(() => {
    const onUpdate = (e: Event) => setAllowance((e as CustomEvent<Allowance>).detail);
    window.addEventListener(ALLOWANCE_EVENT, onUpdate);
    return () => window.removeEventListener(ALLOWANCE_EVENT, onUpdate);
  }, []);

  // Back from a successful Stripe payment: say so once, then tidy the address
  useEffect(() => {
    if (params.get('questions') !== 'added') return;
    setJustAdded(true);
    const next = new URLSearchParams(params);
    next.delete('questions');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const buy = async (pack: PackId) => {
    setBuying(pack); setError(null);
    try {
      window.location.href = await SubscriptionService.createQuestionPackCheckout(pack, currency, location.pathname);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
      setBuying(null);
    }
  };

  if (!user || premium === null) return null;

  if (!premium) {
    return (
      <p className="mt-4 text-sm text-warmgrey dark:text-dark-sub">
        Asking questions about the book is part of Premium. <Link to="/pricing" className="link-internal">See Premium</Link>
      </p>
    );
  }

  if (!allowance) return null;
  const empty = outOfQuestions || (allowance.daily_left === 0 && allowance.credits === 0);

  return (
    <div className="mt-4 space-y-3">
      {justAdded && (
        <p className="flex items-center gap-2 text-sm font-medium text-forest-500 dark:text-dark-sage" role="status">
          <CheckCircle2 className="h-4 w-4" /> Questions added. Ask away.
        </p>
      )}
      <p className="text-sm text-warmgrey dark:text-dark-sub" aria-live="polite">
        {allowance.daily_left} of {allowance.daily_limit} questions left today
        {allowance.credits > 0 && <> · {allowance.credits} bought question{allowance.credits === 1 ? '' : 's'}</>}
      </p>
      {empty && (
        <div className="rounded-2xl border border-stone bg-ivory p-4 dark:border-dark-border dark:bg-dark-card">
          <p className="font-medium text-charcoal dark:text-dark-text">You’ve used today’s {allowance.daily_limit} questions.</p>
          <p className="mt-1 text-sm text-warmgrey dark:text-dark-sub">
            More arrive tomorrow, or top up now. Bought questions never expire.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(PACKS) as PackId[]).map(pack => (
              <button key={pack} onClick={() => buy(pack)} disabled={buying !== null} className={pack === 'questions50' ? 'btn-accent text-sm' : 'btn-outline text-sm'}>
                {buying === pack ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {PACKS[pack]} questions · {formatPrice(PACK_PRICES[currency][pack], currency)}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-sm text-terracotta-600 dark:text-dark-terra">{error}</p>}
        </div>
      )}
    </div>
  );
}
