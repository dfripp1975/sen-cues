import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent, onConsentChange, type ConsentChoice } from '@/lib/consent';
import { ADSENSE_CLIENT, USE_SITE_BANNER } from '@/lib/ads';

// The site itself only sets essential storage (sign-in, settings). A banner is
// needed only when ads run with this site's own consent banner; with Google's
// consent message (the default), Google asks instead, so this stays hidden.
const NEEDED = !!ADSENSE_CLIENT && USE_SITE_BANNER;

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!NEEDED || getConsent()) return;
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => onConsentChange(() => setVisible(false)), []);

  const choose = (choice: ConsentChoice) => setConsent(choice);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-w-sm animate-slide-up"
      role="region"
      aria-label="Cookie choices"
    >
      <div className="rounded-2xl border border-stone bg-ivory p-5 shadow-lift dark:border-dark-border dark:bg-dark-card">
        <p className="font-serif text-lg text-forest-500 dark:text-dark-text">A note on cookies</p>
        <p className="mt-1.5 text-sm leading-relaxed text-warmgrey dark:text-dark-sub">
          We use essential cookies to keep you signed in and remember your settings. With your
          permission we also use advertising cookies.{' '}
          <Link to="/cookies" className="link-internal">Cookie policy</Link>
        </p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => choose('accepted')} className="btn-primary flex-1 !py-2 text-sm">
            Accept all
          </button>
          <button onClick={() => choose('rejected')} className="btn-outline flex-1 !py-2 text-sm">
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
