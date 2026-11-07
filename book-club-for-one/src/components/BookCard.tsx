import { Link } from 'react-router-dom';
import type { Book } from '@/types';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  /** Kept for compatibility with older call sites; the whole card is now the link. */
  showActions?: boolean;
  eager?: boolean;
}

/** Cover-led book tile: the cover carries the card, text sits underneath. */
export function BookCard({ book, eager }: BookCardProps) {
  return (
    <Link to={`/book/${book.slug}`} className="group flex flex-col">
      <div className="relative rounded-xl bg-stone-light/70 px-[14%] pb-[10%] pt-[12%] transition-colors duration-300 group-hover:bg-stone dark:bg-white/[0.03] dark:group-hover:bg-white/[0.06]">
        <BookCover book={book} size="fill" eager={eager} className="group-hover:-translate-y-1 transition-transform duration-300 ease-out" />
      </div>
      <h3 className="mt-3 font-serif text-[1.05rem] font-medium leading-snug text-charcoal line-clamp-2 transition-colors group-hover:text-terracotta-500 dark:text-dark-text dark:group-hover:text-dark-terra">
        {book.title}
      </h3>
      <p className="mt-0.5 text-sm text-warmgrey dark:text-dark-sub line-clamp-1">{book.author}</p>
      <p className="mt-1 text-xs text-warmgrey-light dark:text-dark-sub/80">
        {book.year} · {book.pages} pages{book.genre[0] ? ` · ${book.genre[0]}` : ''}
      </p>
    </Link>
  );
}
