import { Link } from 'react-router-dom';
import type { Book } from '@/types';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  showActions?: boolean;
}

export function BookCard({ book, showActions = true }: BookCardProps) {
  return (
    <div className="card flex flex-col gap-4 hover:shadow-lift transition-all duration-300 group">
      <div className="flex gap-4">
        <BookCover book={book} size="sm" to={`/book/${book.slug}`} />
        <div className="flex-1 min-w-0">
          <Link to={`/book/${book.slug}`}>
            <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage hover:text-terracotta-400 dark:hover:text-dark-terra transition-colors line-clamp-2">
              {book.title}
            </h3>
          </Link>
          <p className="text-sm text-warmgrey dark:text-dark-sub mt-1">{book.author}</p>
          <p className="text-xs text-warmgrey dark:text-dark-sub mt-0.5">{book.year} · {book.pages} pages</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {book.genre.slice(0, 2).map(g => (
              <span key={g} className="badge-sage">{g}</span>
            ))}
          </div>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2 mt-auto">
          <Link to={`/book/${book.slug}`} className="btn-primary text-sm flex-1">
            Explore Book
          </Link>
        </div>
      )}
    </div>
  );
}
