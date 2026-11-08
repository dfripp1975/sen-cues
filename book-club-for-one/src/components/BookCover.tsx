import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Book } from '@/types';
import { coverIds } from '@/data/covers';
import { allBooks } from '@/data/books';

// Many ISBNs in the catalogue are invented or shared between different books,
// so a cover is only trusted from an ISBN that passes its checksum and belongs
// to exactly one book. The matched Open Library cover id always wins.
function isbnValid(raw: string) {
  const d = raw.replace(/[^0-9X]/gi, '');
  if (d.length === 13) return [...d].reduce((a, c, i) => a + +c * (i % 2 ? 3 : 1), 0) % 10 === 0;
  if (d.length === 10) return [...d].reduce((a, c, i) => a + (c.toUpperCase() === 'X' ? 10 : +c) * (10 - i), 0) % 11 === 0;
  return false;
}
let isbnUse: Map<string, number> | null = null;
function isbnIsUnique(isbn: string) {
  if (!isbnUse) {
    isbnUse = new Map();
    const seen = new Set<string>();
    for (const b of allBooks) {
      if (!b.isbn || seen.has(b.slug)) continue;
      seen.add(b.slug);
      const k = b.isbn.replace(/[^0-9X]/gi, '');
      isbnUse.set(k, (isbnUse.get(k) || 0) + 1);
    }
  }
  return isbnUse.get(isbn.replace(/[^0-9X]/gi, '')) === 1;
}
function coverUrlFor(book: Book): string | null {
  if (book.coverImage) return book.coverImage;
  const id = coverIds[book.slug];
  if (id) return `https://covers.openlibrary.org/b/id/${id}-M.jpg`;
  if (book.isbn && isbnValid(book.isbn) && isbnIsUnique(book.isbn)) {
    return `https://covers.openlibrary.org/b/isbn/${book.isbn.replace(/-/g, '')}-M.jpg?default=false`;
  }
  return null;
}

interface BookCoverProps {
  book: Book;
  /** sm/md/lg are fixed sizes; fill takes the width of its container at 2:3. */
  size?: 'sm' | 'md' | 'lg' | 'fill';
  to?: string;
  className?: string;
  eager?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-24',
  md: 'w-28 h-[10.5rem]',
  lg: 'w-44 h-[16.5rem]',
  fill: 'w-full aspect-[2/3]',
};

const titleSize = {
  sm: 'text-[0.6rem]',
  md: 'text-sm',
  lg: 'text-xl',
  fill: 'text-[clamp(0.85rem,2.4vw,1.15rem)]',
};

export function BookCover({ book, size = 'md', to, className = '', eager = false }: BookCoverProps) {
  const coverUrl = coverUrlFor(book);
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const showImage = coverUrl && !imageError;

  const content = (
    <div
      className={`${sizeClasses[size]} relative shrink-0 overflow-hidden rounded-[3px_6px_6px_3px] shadow-book ${to ? 'transition-transform duration-300 ease-out group-hover:-translate-y-1' : ''} ${className}`}
      style={{ backgroundColor: book.coverColor }}
    >
      {/* Typeset fallback, always rendered underneath so there is never an empty frame */}
      <div className="absolute inset-0 flex flex-col p-[9%]" aria-hidden={showImage && loaded ? true : undefined}>
        <div className="absolute inset-[5%] rounded-[2px] border" style={{ borderColor: `${book.coverAccent}66` }} />
        <div className="h-[2px] w-1/3 self-center" style={{ backgroundColor: book.coverAccent }} />
        <div className="flex flex-1 items-center justify-center text-center">
          <span className={`font-serif font-medium leading-[1.1] text-white/95 line-clamp-4 ${titleSize[size]}`}>
            {book.title}
          </span>
        </div>
        {size !== 'sm' && (
          <span className="text-center text-[0.6rem] font-medium uppercase tracking-[0.14em] text-white/70 line-clamp-1">
            {book.author}
          </span>
        )}
      </div>

      {showImage && (
        <img
          src={coverUrl}
          alt={`Cover of ${book.title} by ${book.author}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setImageError(true)}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Spine shading and page-edge light */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/30 via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10" />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="group block" aria-label={`${book.title} by ${book.author}`}>
        {content}
      </Link>
    );
  }
  return content;
}
