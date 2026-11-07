import { useEffect, useState } from 'react';
import { getConsent, onConsentChange } from '@/lib/consent';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Set VITE_ADSENSE_CLIENT (e.g. ca-pub-1234567890) in .env to turn ads on.
// With no client ID, or before the visitor accepts cookies, nothing renders,
// so the layout never shows empty ad boxes.
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

let scriptRequested = false;
function loadAdSense() {
  if (scriptRequested || !ADSENSE_CLIENT) return;
  scriptRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}

interface AdPlaceholderProps {
  format?: 'leaderboard' | 'rectangle' | 'sidebar' | 'inline';
  label?: string;
  slot?: string;
}

const minHeights = { leaderboard: 90, rectangle: 250, sidebar: 600, inline: 120 };

export function AdPlaceholder({ format = 'inline', label = 'Advertisement', slot }: AdPlaceholderProps) {
  const [allowed, setAllowed] = useState(() => !!ADSENSE_CLIENT && getConsent() === 'accepted');

  useEffect(() => onConsentChange(c => setAllowed(!!ADSENSE_CLIENT && c === 'accepted')), []);

  useEffect(() => {
    if (!allowed) return;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an extension: nothing to show
    }
  }, [allowed]);

  if (!allowed) return null;

  return (
    <aside className="my-12" aria-label={label}>
      <p className="mb-2 text-center text-[0.65rem] font-medium uppercase tracking-[0.18em] text-warmgrey-light dark:text-dark-sub">
        {label}
      </p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: minHeights[format] }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
