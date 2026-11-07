import { useState, useRef, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchBooks } from '@/data/books';
import { tools } from '@/data/tools';

interface SearchBarProps {
  placeholder?: string;
  onResultSelect?: (slug: string) => void;
  className?: string;
}

export function SearchBar({ placeholder = 'Search books, authors, tools...', onResultSelect, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReactNode[]>([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const bookResults = searchBooks(value).slice(0, 5);
    const toolResults = tools.filter(t =>
      t.title.toLowerCase().includes(value.toLowerCase()) ||
      t.shortTitle.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 3);

    const items: ReactNode[] = [];
    bookResults.forEach(book => {
      items.push(
        <button
          key={`book-${book.id}`}
          onClick={() => {
            if (onResultSelect) onResultSelect(book.slug);
            else navigate(`/book/${book.slug}`);
            setShowResults(false);
            setQuery('');
          }}
          className="w-full text-left px-4 py-2 hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors flex items-center gap-3"
        >
          <span className="text-xs badge-sage">Book</span>
          <span className="text-sm text-charcoal dark:text-dark-text">{book.title}</span>
          <span className="text-xs text-warmgrey dark:text-dark-sub">by {book.author}</span>
        </button>
      );
    });
    toolResults.forEach(tool => {
      items.push(
        <button
          key={`tool-${tool.slug}`}
          onClick={() => {
            if (onResultSelect) onResultSelect(tool.slug);
            else navigate(`/tools/${tool.slug}`);
            setShowResults(false);
            setQuery('');
          }}
          className="w-full text-left px-4 py-2 hover:bg-sage-50 dark:hover:bg-forest-700 transition-colors flex items-center gap-3"
        >
          <span className="text-xs badge-terra">Tool</span>
          <span className="text-sm text-charcoal dark:text-dark-text">{tool.shortTitle}</span>
        </button>
      );
    });

    setResults(items);
    setShowResults(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/books?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warmgrey dark:text-dark-sub pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => { blurTimeout.current = setTimeout(() => setShowResults(false), 200); }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone dark:border-dark-border bg-white dark:bg-forest-800 text-charcoal dark:text-dark-text placeholder-warmgrey dark:placeholder-dark-sub focus:border-forest-400 dark:focus:border-dark-sage focus:ring-2 focus:ring-forest-200 dark:focus:ring-forest-700 transition-all outline-none text-sm"
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-warmgrey hover:text-charcoal dark:hover:text-dark-text"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-ivory dark:bg-dark-card rounded-xl shadow-lift border border-stone dark:border-dark-border z-50 overflow-hidden animate-fade-in max-h-96 overflow-y-auto">
          {results}
        </div>
      )}
      {showResults && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-ivory dark:bg-dark-card rounded-xl shadow-lift border border-stone dark:border-dark-border z-50 p-4 animate-fade-in">
          <p className="text-sm text-warmgrey dark:text-dark-sub">No results found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}
