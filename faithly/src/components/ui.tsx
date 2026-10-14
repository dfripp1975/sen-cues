import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2, Lock, Settings2, X } from 'lucide-react';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-subtle" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function PageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: boolean | string; action?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="mb-6 flex items-start gap-3">
      {back && (
        <button
          onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
          className="mt-1 rounded-full p-2 text-subtle hover:bg-muted"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[1.75rem] font-semibold leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-subtle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      {icon && <div className="mb-3 rounded-full bg-muted p-4 text-accent">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-sm text-sm text-subtle">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
      {onRetry && <button className="font-semibold underline" onClick={onRetry}>Try again</button>}
    </div>
  );
}

/** Shown when a server feature exists but has not been configured (e.g. missing API key). */
export function SetupNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm" role="note">
      <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6d33] dark:text-gold" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-subtle">{children}</div>
      </div>
    </div>
  );
}

export function PremiumNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/50 bg-gradient-to-br from-gold/15 to-transparent p-4 text-sm">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6d33] dark:text-gold" aria-hidden />
      <div className="flex-1">
        <div>{children}</div>
        <Link to="/premium" className="mt-2 inline-block font-semibold text-accent underline">See Premium</Link>
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  // Portal to <body> so the sheet isn't trapped under the page's animated (transformed) container.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="page-enter relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 pb-safe shadow-lift outline-none md:max-w-lg md:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
        <div className="h-4" />
      </div>
    </div>,
    document.body,
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-gradient-to-r from-sage to-forest transition-all duration-500 dark:from-forest dark:to-sage" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Paragraphs({ text, className = '' }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {text.split(/\n{2,}/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
    </div>
  );
}
