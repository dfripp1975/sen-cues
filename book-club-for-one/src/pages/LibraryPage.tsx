import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BookmarkCheck, CheckCircle, ArrowRight, BookPlus, Trash2, Pause, XCircle, Star, Clock } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BookCover } from '@/components/BookCover';
import { useAuth } from '@/lib/auth';
import { UserLibraryService, type UserBook, type ReadingStatus } from '@/services/UserLibraryService';
import { CustomBookService, toBook, type CustomBook } from '@/services/CustomBookService';
import { books } from '@/data/books';
import type { Book } from '@/types';

interface LibraryEntry {
  book: Book;
  status: ReadingStatus;
  currentChapter: number;
  totalChapters: number;
  currentPage: number;
  startDate: string | null;
  finishDate: string | null;
  rating: number | null;
  isCustom: boolean;
  customSlug?: string;
}

const STATUS_LABELS: Record<ReadingStatus, string> = {
  'currently-reading': 'Currently Reading',
  'want-to-read': 'Want To Read',
  'completed': 'Completed',
  'paused': 'Paused',
  'did-not-finish': 'Did Not Finish',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function LibraryPage() {
  useSEO({
    title: 'My Library | The Book Club For One',
    description: 'View your reading library — currently reading, want to read, completed, and paused books.',
    canonical: `${window.location.origin}/library`,
  });

  const { user } = useAuth();
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [customBooks, setCustomBooks] = useState<CustomBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      UserLibraryService.getBooks(),
      CustomBookService.getAll(),
    ]).then(([ub, cb]) => {
      setUserBooks(ub);
      setCustomBooks(cb);
      setLoading(false);
    });
  }, [user]);

  const getCatalogBook = (slug: string): Book | undefined => books.find(b => b.slug === slug);

  const allEntries: LibraryEntry[] = [
    ...userBooks.map(ub => {
      const book = getCatalogBook(ub.book_slug);
      if (!book) return null;
      return {
        book,
        status: ub.status,
        currentChapter: ub.current_chapter,
        totalChapters: ub.total_chapters,
        currentPage: ub.current_page,
        startDate: ub.start_date,
        finishDate: ub.finish_date,
        rating: ub.rating,
        isCustom: false,
      } as LibraryEntry;
    }).filter((e): e is LibraryEntry => e !== null),
    ...customBooks.map(cb => ({
      book: toBook(cb),
      status: cb.status as ReadingStatus,
      currentChapter: cb.current_chapter,
      totalChapters: cb.chapters,
      currentPage: 0,
      startDate: null,
      finishDate: null,
      rating: null,
      isCustom: true,
      customSlug: cb.slug,
    } as LibraryEntry)),
  ];

  const sections: { key: ReadingStatus; label: string; icon: typeof BookOpen }[] = [
    { key: 'currently-reading', label: 'Currently Reading', icon: BookOpen },
    { key: 'want-to-read', label: 'Want To Read', icon: BookmarkCheck },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
    { key: 'paused', label: 'Paused', icon: Pause },
    { key: 'did-not-finish', label: 'Did Not Finish', icon: XCircle },
  ];

  const handleRemoveCustom = async (slug: string | undefined) => {
    if (!slug) return;
    await CustomBookService.remove(slug);
    setCustomBooks(prev => prev.filter(cb => cb.slug !== slug));
  };

  const handleStatusChange = async (bookSlug: string, newStatus: ReadingStatus) => {
    try {
      await UserLibraryService.updateStatus(bookSlug, newStatus);
      setUserBooks(prev => prev.map(ub =>
        ub.book_slug === bookSlug ? { ...ub, status: newStatus } : ub
      ));
    } catch {
      // silently handle
    }
  };

  const handleRating = async (bookSlug: string, rating: number) => {
    try {
      await UserLibraryService.updateRating(bookSlug, rating);
      setUserBooks(prev => prev.map(ub =>
        ub.book_slug === bookSlug ? { ...ub, rating } : ub
      ));
    } catch {
      // silently handle
    }
  };

  const renderBookSection = (
    label: string,
    items: LibraryEntry[],
    Icon: React.ComponentType<{ className?: string }>
  ) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6 flex items-center gap-2">
          <Icon className="w-6 h-6 text-sage-400 dark:text-dark-sage" /> {label}
          <span className="text-sm font-sans font-normal text-warmgrey dark:text-dark-sub">({items.length})</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(entry => {
            const percentage = entry.totalChapters > 0 ? Math.round((entry.currentChapter / entry.totalChapters) * 100) : 0;
            return (
              <div key={entry.book.id} className="card relative group">
                {entry.isCustom && (
                  <button
                    onClick={() => handleRemoveCustom(entry.customSlug)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-warmgrey hover:text-terracotta-400 hover:bg-stone-light dark:hover:bg-forest-800 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    aria-label="Remove from library"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="flex gap-4">
                  <BookCover book={entry.book} size="sm" to={`/book/${entry.book.slug}`} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/book/${entry.book.slug}`}>
                      <h3 className="font-serif font-bold text-forest-500 dark:text-dark-sage hover:text-terracotta-400 dark:hover:text-dark-terra transition-colors line-clamp-2">{entry.book.title}</h3>
                    </Link>
                    <p className="text-sm text-warmgrey dark:text-dark-sub">{entry.book.author}</p>
                    {entry.isCustom && <span className="badge-sage text-[10px] mt-1">Your Book</span>}

                    {/* Progress */}
                    {entry.status === 'currently-reading' && entry.totalChapters > 0 && (
                      <div className="mt-2">
                        <div className="h-2 bg-stone-light dark:bg-forest-700 rounded-full overflow-hidden">
                          <div className="h-full bg-terracotta-400 dark:bg-dark-terra rounded-full transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                        <p className="text-xs text-warmgrey dark:text-dark-sub mt-1">
                          Chapter {entry.currentChapter} of {entry.totalChapters} · {percentage}%
                        </p>
                      </div>
                    )}

                    {/* Dates */}
                    {(entry.startDate || entry.finishDate) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-warmgrey dark:text-dark-sub">
                        {entry.startDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Started {formatDate(entry.startDate)}
                          </span>
                        )}
                        {entry.finishDate && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Finished {formatDate(entry.finishDate)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Rating stars */}
                    {entry.status === 'completed' && (
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleRating(entry.book.slug, star)}
                            className="transition-transform hover:scale-110"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                entry.rating && entry.rating >= star
                                  ? 'fill-terracotta-400 text-terracotta-400'
                                  : 'text-stone dark:text-dark-border'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Status changer for catalog books */}
                    {!entry.isCustom && (
                      <select
                        value={entry.status}
                        onChange={e => handleStatusChange(entry.book.slug, e.target.value as ReadingStatus)}
                        className="mt-3 text-xs px-2 py-1.5 rounded-lg border border-stone dark:border-dark-border bg-white dark:bg-forest-800 text-charcoal dark:text-dark-text outline-none focus:border-forest-400 dark:focus:border-dark-sage cursor-pointer"
                      >
                        {Object.entries(STATUS_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    )}

                    <Link to={`/book/${entry.book.slug}`} className="btn-accent text-sm mt-3 px-4 py-2 inline-flex">
                      {entry.status === 'completed' ? 'View Book' : 'Continue Reading'} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Library' }]} />

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage">My Library</h1>
        <Link to="/library/add" className="btn-accent">
          <BookPlus className="w-5 h-5" /> Add a Book
        </Link>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-warmgrey dark:text-dark-sub">Loading your library...</p>
        </div>
      ) : allEntries.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-sage-300 mx-auto mb-4" />
          <p className="text-lg text-warmgrey dark:text-dark-sub mb-2">Your library is empty.</p>
          <p className="text-sm text-warmgrey dark:text-dark-sub mb-6">Explore books from our catalogue, or add any book you're currently reading.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/library/add" className="btn-accent">
              <BookPlus className="w-4 h-4" /> Add a Book
            </Link>
            <Link to="/books" className="btn-outline">Explore Books</Link>
          </div>
        </div>
      ) : (
        <>
          {sections.map(({ key, label, icon }) => {
            const items = allEntries.filter(e => e.status === key);
            return renderBookSection(label, items, icon);
          })}
        </>
      )}
    </div>
  );
}
