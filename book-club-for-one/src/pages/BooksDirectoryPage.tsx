import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BookCard } from '@/components/BookCard';
import { books, searchBooks, getPopularBooks, getClassicBooks } from '@/data/books';
import { AdPlaceholder } from '@/components/AdPlaceholder';

export function BooksDirectoryPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const filter = searchParams.get('filter') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState(books);

  useEffect(() => {
    if (query) {
      setResults(searchBooks(query));
    } else if (filter === 'popular') {
      setResults(getPopularBooks());
    } else if (filter === 'classic') {
      setResults(getClassicBooks());
    } else {
      setResults(books);
    }
  }, [query, filter]);

  useSEO({
    title: query ? `Search: ${query} | The Book Club For One` : 'Explore Books | The Book Club For One',
    description: 'Search for books by title, author, or ISBN. Explore popular, trending, and classic books with personal book club features.',
    canonical: `${window.location.origin}/books`,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/books?q=${encodeURIComponent(searchQuery)}`);
      setResults(searchBooks(searchQuery));
    } else {
      setResults(books);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Books' }]} />

      <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">
        Explore Books
      </h1>
      <p className="text-lg text-warmgrey dark:text-dark-sub mb-8">
        Search for books by title, author, or ISBN. Start your personal book club for any book.
      </p>

      <form onSubmit={handleSearch} className="relative max-w-2xl mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warmgrey dark:text-dark-sub" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, author, or ISBN..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone dark:border-dark-border bg-ivory dark:bg-forest-800 text-charcoal dark:text-dark-text placeholder-warmgrey dark:placeholder-dark-sub focus:border-forest-400 dark:focus:border-dark-sage focus:ring-2 focus:ring-forest-200 dark:focus:ring-forest-700 transition-all outline-none"
          aria-label="Search books"
        />
      </form>

      {results.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-lg text-warmgrey dark:text-dark-sub mb-4">No books found for "{query}".</p>
          <p className="text-sm text-warmgrey dark:text-dark-sub">Try a different search term, or browse all books below.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">{results.length} book{results.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}

      <AdPlaceholder format="leaderboard" />
    </div>
  );
}
