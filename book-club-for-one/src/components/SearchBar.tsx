import { useId, useMemo, useRef, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchBooks } from '@/data/books';
import { tools } from '@/data/tools';

interface SearchBarProps {
  placeholder?: string;
  onResultSelect?: (slug: string) => void;
  className?: string;
  compact?: boolean;
}

interface Result {
  kind: 'book' | 'tool';
  slug: string;
  title: string;
  meta?: string;
}

export function SearchBar({ placeholder = 'Search books, authors, tools', onResultSelect, className = '', compact = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const navigate = useNavigate();
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const bookResults: Result[] = searchBooks(q).slice(0, 5).map(b => ({
      kind: 'book', slug: b.slug, title: b.title, meta: b.author,
    }));
    const toolResults: Result[] = tools
      .filter(t => t.title.toLowerCase().includes(q) || t.shortTitle.toLowerCase().includes(q))
      .slice(0, 3)
      .map(t => ({ kind: 'tool', slug: t.slug, title: t.shortTitle }));
    return [...bookResults, ...toolResults];
  }, [query]);

  const select = (r: Result) => {
    if (onResultSelect) onResultSelect(r.slug);
    else navigate(r.kind === 'book' ? `/book/${r.slug}` : `/tools/${r.slug}`);
    setOpen(false);
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlight >= 0 && results[highlight]) {
      select(results[highlight]);
      return;
    }
    if (query.trim()) {
      navigate(`/books?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => (h + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => (h <= 0 ? results.length - 1 : h - 1)); }
    if (e.key === 'Escape') setOpen(false);
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative" role="search">
        <Search className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-warmgrey dark:text-dark-sub ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <input
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimeout.current = setTimeout(() => setOpen(false), 150); }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-full border border-stone-dark/60 bg-ivory text-charcoal placeholder-warmgrey outline-none transition-[border-color,box-shadow] focus:border-forest-400 focus:ring-4 focus:ring-forest-500/10 dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:placeholder-dark-sub dark:focus:border-dark-sage [&::-webkit-search-cancel-button]:hidden ${compact ? 'py-2 pl-10 pr-9 text-sm' : 'py-3 pl-11 pr-10'}`}
          aria-label="Search books and tools"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-warmgrey hover:text-charcoal dark:hover:text-dark-text"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-stone bg-ivory py-1.5 shadow-lift animate-slide-up dark:border-dark-border dark:bg-dark-card"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-warmgrey dark:text-dark-sub">
              Nothing matches “{query.trim()}”. Press Enter to search all books.
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}-${r.slug}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={e => e.preventDefault()}
                onClick={() => select(r)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === highlight ? 'bg-sage-50 dark:bg-white/[0.05]' : ''}`}
              >
                <span className={`w-10 shrink-0 text-[0.7rem] font-semibold uppercase tracking-wider ${r.kind === 'book' ? 'text-sage-600 dark:text-dark-sage' : 'text-terracotta-500 dark:text-dark-terra'}`}>
                  {r.kind}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-charcoal dark:text-dark-text">{r.title}</span>
                  {r.meta && <span className="block truncate text-xs text-warmgrey dark:text-dark-sub">{r.meta}</span>}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-warmgrey-light" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
