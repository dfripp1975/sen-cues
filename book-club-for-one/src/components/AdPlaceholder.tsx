import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const PUBLISHER_ID = 'ca-pub-0000000000000000';

interface AdPlaceholderProps {
  format?: 'leaderboard' | 'rectangle' | 'sidebar' | 'inline';
  label?: string;
  slot?: string;
}

export function AdPlaceholder({ format = 'inline', label = 'Advertisement', slot = '0000000000' }: AdPlaceholderProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // AdSense not loaded yet or blocked — placeholder still renders
    }
  }, []);

  const adStyles: Record<string, React.CSSProperties> = {
    leaderboard: { display: 'block', minHeight: '90px' },
    rectangle: { display: 'block', minHeight: '250px' },
    sidebar: { display: 'block', minHeight: '600px' },
    inline: { display: 'block', minHeight: '120px' },
  };

  const adFormats: Record<string, string> = {
    leaderboard: 'auto',
    rectangle: 'auto',
    sidebar: 'auto',
    inline: 'auto',
  };

  const isResponsive = true;

  return (
    <div className="my-6" aria-label="Advertisement" role="complementary">
      <div className="text-[10px] text-warmgrey dark:text-dark-sub uppercase tracking-widest font-medium opacity-60 mb-1 text-center">
        {label}
      </div>
      <div className="w-full bg-stone-light/40 dark:bg-forest-800/40 rounded-xl border border-dashed border-stone dark:border-dark-border overflow-hidden">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={adStyles[format]}
          data-ad-client={PUBLISHER_ID}
          data-ad-slot={slot}
          data-ad-format={adFormats[format]}
          data-full-width-responsive={isResponsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
}
