/** The brand mark: a closed book with a terracotta ribbon marking your place. */
export function LogoMark({ className = 'w-9 h-9', inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className={inverse ? 'fill-ivory/10' : 'fill-forest-500 dark:fill-dark-sage'} />
      <path d="M20 14h20a6 6 0 0 1 6 6v30H24a4 4 0 0 1-4-4z" className={inverse ? 'fill-ivory' : 'fill-paper dark:fill-dark-bg'} />
      <path d="M20 46a4 4 0 0 1 4-4h22v8H24a4 4 0 0 1-4-4z" className={inverse ? 'fill-ivory/60' : 'fill-stone dark:fill-dark-border'} />
      <path d="M34 14h7v17l-3.5-3-3.5 3z" className="fill-terracotta-400 dark:fill-dark-terra" />
    </svg>
  );
}

export function Logo({ tone = 'default' }: { tone?: 'default' | 'inverse' }) {
  const text = tone === 'inverse' ? 'text-ivory' : 'text-forest-500 dark:text-dark-text';
  return (
    <a href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="The Book Club For One, home">
      <LogoMark inverse={tone === 'inverse'} className="w-9 h-9 transition-transform duration-200 group-hover:-rotate-3" />
      <span className={`font-serif text-[1.15rem] leading-none tracking-[-0.01em] ${text}`}>
        The Book Club <em className="font-serif italic">For One</em>
      </span>
    </a>
  );
}
