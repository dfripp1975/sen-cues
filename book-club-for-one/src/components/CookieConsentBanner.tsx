import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'cookie-consent-v1';

type ConsentChoice = 'accepted' | 'rejected';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (choice: ConsentChoice) => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div className="mx-auto max-w-4xl m-4 p-5 rounded-2xl bg-white dark:bg-forest-800 shadow-2xl border border-stone dark:border-dark-border">
        <div className="flex items-start gap-3">
          <Cookie className="w-6 h-6 text-forest-500 dark:text-dark-sage flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-charcoal dark:text-dark-text leading-relaxed">
              We use cookies to keep you signed in, remember your preferences, and serve ads.
              By clicking <strong>Accept</strong>, you consent to the use of advertising cookies.
              You can change your choice anytime in our{' '}
              <a href="/cookies" className="font-semibold text-forest-500 dark:text-dark-sage hover:underline">
                Cookie Policy
              </a>.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => choose('accepted')}
                className="px-5 py-2 rounded-lg bg-forest-500 dark:bg-forest-400 text-white dark:text-dark-bg text-sm font-semibold hover:bg-forest-600 dark:hover:bg-forest-500 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => choose('rejected')}
                className="px-5 py-2 rounded-lg bg-stone-light dark:bg-forest-700 text-charcoal dark:text-dark-text text-sm font-semibold hover:bg-stone dark:hover:bg-forest-600 transition-colors border border-stone dark:border-dark-border"
              >
                Reject
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 p-1 text-warmgrey dark:text-dark-sub hover:text-charcoal dark:hover:text-dark-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
