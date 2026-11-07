import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BookCard } from '@/components/BookCard';
import { books, searchBooks, getPopularBooks, getClassicBooks, getTrendingBooks } from '@/data/books';
import { AdPlaceholder } from '@/components/AdPlaceholder';

const filters = [
  { id: '', label: 'All books' },
  { id: 'popular', label: 'Popular' },
  { id: 'trending', label: 'Trending' },
  { id: 'classic', label: 'Classics' },
];

export function BooksDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const filter = searchParams.get('filter') || '';
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => setSearchQuery(query), [query]);

  const results = useMemo(() => {
    if (query) return searchBooks(query);
    if (filter === 'popular') return getPopularBooks();
    if (filter === 'trending') return getTrendingBooks();
    if (filter === 'classic') return getClassicBooks();
    return books;
  }, [query, filter]);

  useSEO({
    title: query ? `Search: ${query} | The Book Club For One` : 'Explore Books | The Book Club For One',
    description: 'Search for books by title, author, or ISBN. Explore popular, trending, and classic books with personal book club features.',
    canonical: `${window.location.origin}/books`,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchParams(q ? { q } : {});
  };

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Books' }]} />

      <header className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">The shelf</p>
          <h1 className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">Explore books</h1>
          <p className="mt-5 text-lg leading-relaxed text-warmgrey dark:text-dark-sub">
            Pick a book to open its companion: chapter guides, characters, themes and discussion questions.
          </p>
        </div>
        <form onSubmit={handleSearch} className="relative w-full lg:w-96" role="search">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warmgrey dark:text-dark-sub" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Title, author, genre or ISBN"
            className="input-field rounded-full !pl-12"
            aria-label="Search books"
          />
        </form>
      </header>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-stone pb-4 dark:border-dark-border">
        <ul className="flex flex-wrap gap-2" aria-label="Filter books">
          {filters.map(f => {
            const active = !query && filter === f.id;
            return (
              <li key={f.id}>
                <Link
                  to={f.id ? `/books?filter=${f.id}` : '/books'}
                  aria-current={active ? 'true' : undefined}
                  className={`block rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? 'border-forest-500 bg-forest-500 text-ivory dark:border-dark-sage dark:bg-dark-sage dark:text-dark-bg' : 'border-stone-dark/60 text-charcoal hover:border-forest-500 dark:border-dark-border dark:text-dark-text dark:hover:border-dark-sage'}`}
                >
                  {f.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-warmgrey dark:text-dark-sub" aria-live="polite">
          {query ? <>{results.length} result{results.length !== 1 ? 's' : ''} for “{query}”</> : <>{results.length} book{results.length !== 1 ? 's' : ''}</>}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="font-serif text-2xl text-forest-500 dark:text-dark-text">Nothing on the shelf matches “{query}”.</p>
          <p className="mt-3 text-warmgrey dark:text-dark-sub">Try a different spelling or an author’s surname, or add the book to your own library.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/books" className="btn-outline">Browse all books</Link>
            <Link to="/library/add" className="btn-primary">Add a book</Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((book, i) => <BookCard key={book.id} book={book} eager={i < 6} />)}
        </div>
      )}

      <AdPlaceholder format="leaderboard" />
    </div>
  );
}
