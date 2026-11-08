import { useEffect, useState } from 'react';
import { getConsent, onConsentChange } from '@/lib/consent';
import { ADSENSE_CLIENT, USE_SITE_BANNER } from '@/lib/ads';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Set VITE_ADSENSE_CLIENT (e.g. ca-pub-1234567890123456) in .env to turn ads on.
// Consent: by default Google's own consent message (set up in AdSense under
// "Privacy & messaging") asks visitors in the UK, EEA and Switzerland, so ads
// load straight away and Google applies their choice. Set VITE_ADSENSE_CMP=site
// to use this site's own cookie banner instead.
// Ads never load on reading pages (/read/...): the book texts are republished
// public-domain works, and keeping ads beside original content only helps approval.
// With no client ID nothing renders, so the layout never shows empty ad boxes.
const onReadingPage = () => typeof location !== 'undefined' && location.pathname.startsWith('/read/');

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
  const permitted = (c: string | null) => !!ADSENSE_CLIENT && !onReadingPage() && (!USE_SITE_BANNER || c === 'accepted');
  const [allowed, setAllowed] = useState(() => permitted(getConsent()));

  useEffect(() => onConsentChange(c => setAllowed(permitted(c))), []);

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
