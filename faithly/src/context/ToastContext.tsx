import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface Toast { id: number; message: string; tone: 'info' | 'error' }
const Ctx = createContext<(message: string, tone?: 'info' | 'error') => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, tone: 'info' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div key={t.id} className={`page-enter pointer-events-auto rounded-full px-5 py-2.5 text-sm font-medium shadow-lift ${t.tone === 'error' ? 'bg-red-700 text-white' : 'bg-charcoal text-ivory dark:bg-ivory dark:text-charcoal'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
