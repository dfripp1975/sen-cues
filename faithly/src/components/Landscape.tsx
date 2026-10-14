// Original watercolour-style landscape, drawn in SVG (no external artwork).
export function Landscape({ className = '', variant = 'dawn' }: { className?: string; variant?: 'dawn' | 'dusk' }) {
  const sky = variant === 'dawn' ? ['#F6EBD6', '#F8F6F0'] : ['#E9D3B0', '#C9D3C4'];
  return (
    <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sky-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <filter id="wc" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <rect width="400" height="160" fill={`url(#sky-${variant})`} />
      <circle cx="300" cy="58" r="22" fill="#C5A568" opacity="0.35" filter="url(#wc)" />
      <g filter="url(#wc)">
        <path d="M0 110 C60 80 110 92 160 86 S270 60 330 78 S390 92 400 88 V160 H0Z" fill="#A9BDA7" opacity="0.55" />
        <path d="M0 126 C70 104 130 118 200 110 S320 96 400 112 V160 H0Z" fill="#7F9B83" opacity="0.6" />
        <path d="M0 140 C90 124 170 138 250 130 S360 122 400 132 V160 H0Z" fill="#234638" opacity="0.75" />
      </g>
      <g stroke="#234638" strokeWidth="1.2" fill="none" opacity="0.55" strokeLinecap="round">
        <path d="M30 150 C32 132 36 122 44 112" />
        <path d="M36 128 C28 124 24 118 24 112 C30 114 34 120 36 128Z" fill="#A9BDA7" />
        <path d="M40 120 C46 114 52 112 58 112 C54 118 48 121 40 120Z" fill="#A9BDA7" />
        <path d="M368 152 C366 136 362 126 356 118" />
        <path d="M364 134 C372 130 376 124 376 118 C370 120 366 126 364 134Z" fill="#A9BDA7" />
      </g>
    </svg>
  );
}

export function Sprig({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round">
        <path d="M10 54 C20 40 30 26 48 8" />
        <path d="M22 38 C14 36 10 30 10 24 C18 26 22 32 22 38Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M30 28 C38 28 44 24 46 18 C38 18 32 22 30 28Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M34 22 C28 18 26 12 28 6 C34 10 36 16 34 22Z" fill="currentColor" fillOpacity="0.18" />
      </g>
    </svg>
  );
}
