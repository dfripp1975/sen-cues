import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import type { Book } from '@/types';

interface BookCoverProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
}

export function BookCover({ book, size = 'md', to }: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const isbnCoverUrl = book.isbn
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn.replace(/-/g, '')}-M.jpg?default=false`
    : null;
  const titleCoverUrl = `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg?default=false`;
  const [coverUrl, setCoverUrl] = useState(isbnCoverUrl ?? titleCoverUrl);

  const sizeClasses = {
    sm: 'w-16 h-24 text-[10px]',
    md: 'w-28 h-40 text-xs',
    lg: 'w-40 h-60 text-sm',
  };

  const content = (
    <div
      className={`${sizeClasses[size]} rounded-lg shadow-card flex flex-col justify-between p-2 border border-black/10 transition-transform hover:scale-105 hover:shadow-lift cursor-pointer relative overflow-hidden`}
      style={{ backgroundColor: book.coverColor }}
    >
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: book.coverAccent }} />
      {coverUrl && !imageError ? (
        <img
          src={coverUrl}
          alt={`Cover of ${book.title} by ${book.author}`}
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
          onError={() => {
            if (isbnCoverUrl && coverUrl === isbnCoverUrl) {
              setCoverUrl(titleCoverUrl);
            } else {
              setImageError(true);
            }
          }}
          loading="lazy"
        />
      ) : (
        <>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: book.coverAccent }} />
          <div className="flex-1 flex flex-col justify-center items-center text-center px-1 pt-2">
            <span className="font-serif font-bold text-white/95 leading-tight line-clamp-3">{book.title}</span>
          </div>
          <div className="text-center pb-1">
            <span className="text-white/70 font-sans leading-tight line-clamp-1">{book.author}</span>
          </div>
          <div className="absolute bottom-1 right-1">
            <BookOpen className="w-3 h-3 text-white/30" />
          </div>
        </>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
}
