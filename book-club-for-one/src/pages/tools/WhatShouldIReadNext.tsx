import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Shuffle } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { books } from '@/data/books';
import { BookCover } from '@/components/BookCover';
import type { Book } from '@/types';

export function WhatShouldIReadNext() {
  const tool = getToolBySlug('what-should-i-read-next')!;
  const [favBooks, setFavBooks] = useState('');
  const [genre, setGenre] = useState('any');
  const [mood, setMood] = useState('any');
  const [length, setLength] = useState('any');
  const [fiction, setFiction] = useState('any');
  const [difficulty, setDifficulty] = useState('any');
  const [era, setEra] = useState('any');
  const [pace, setPace] = useState('any');
  const [results, setResults] = useState<Book[]>([]);
  const [surprise, setSurprise] = useState<Book | null>(null);

  const handleFind = () => {
    let filtered = [...books];
    if (genre !== 'any') filtered = filtered.filter(b => b.genre.some(g => g.toLowerCase().includes(genre.toLowerCase())));
    if (length === 'short') filtered = filtered.filter(b => b.pages < 250);
    if (length === 'medium') filtered = filtered.filter(b => b.pages >= 250 && b.pages <= 400);
    if (length === 'long') filtered = filtered.filter(b => b.pages > 400);
    if (era === 'classic') filtered = filtered.filter(b => b.year < 1920);
    if (era === 'modern') filtered = filtered.filter(b => b.year >= 1920);
    if (fiction === 'fiction') filtered = filtered.filter(b => !b.genre.includes('Non-Fiction'));
    if (pace === 'fast') filtered = filtered.filter(b => b.pages < 300);
    if (pace === 'slow') filtered = filtered.filter(b => b.pages >= 300);
    if (filtered.length === 0) filtered = [...books];
    setResults(filtered.sort(() => Math.random() - 0.5).slice(0, 6));
  };

  const handleSurprise = () => {
    setSurprise(books[Math.floor(Math.random() * books.length)]);
  };

  const genres = ['any', 'Romance', 'Gothic', 'Science Fiction', 'Fantasy', 'Adventure', 'Classic Literature', 'Horror', 'Mystery', 'Poetry'];
  const moods = ['any', 'Uplifting', 'Thought-provoking', 'Spooky', 'Romantic', 'Adventurous', 'Cozy', 'Challenging'];
  const lengths = ['any', 'short', 'medium', 'long'];
  const fictions = ['any', 'fiction', 'non-fiction'];
  const difficulties = ['any', 'easy', 'medium', 'challenging'];
  const eras = ['any', 'classic', 'modern'];
  const paces = ['any', 'fast-paced', 'slow-paced'];

  const optionRow = (label: string, val: string, set: (v: string) => void, options: string[]) => (
    <div>
      <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">{label}</label>
      <select value={val} onChange={(e) => set(e.target.value)} className="input-field capitalize">
        {options.map(o => <option key={o} value={o} className="capitalize">{o.replace('-', ' ')}</option>)}
      </select>
    </div>
  );

  return (
    <ToolLayout tool={tool} results={results.length > 0 || surprise ? (
      <div className="space-y-6">
        {surprise && (
          <div className="card text-center bg-sage-50 dark:bg-forest-700">
            <span className="badge-terra mb-4">Surprise Pick!</span>
            <div className="flex justify-center mb-4">
              <BookCover book={surprise} size="md" to={`/book/${surprise.slug}`} />
            </div>
            <h3 className="font-serif font-bold text-xl text-forest-500 dark:text-dark-sage">{surprise.title}</h3>
            <p className="text-sm text-warmgrey dark:text-dark-sub">{surprise.author}</p>
          </div>
        )}
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(book => (
            <div key={book.id} className="card">
              <div className="flex gap-4">
                <BookCover book={book} size="sm" to={`/book/${book.slug}`} />
                <div className="flex-1 min-w-0">
                  <Link to={`/book/${book.slug}`}>
                    <h3 className="font-serif font-bold text-forest-500 dark:text-dark-sage hover:text-terracotta-400 dark:hover:text-dark-terra transition-colors line-clamp-2">{book.title}</h3>
                  </Link>
                  <p className="text-sm text-warmgrey dark:text-dark-sub">{book.author}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {book.genre.slice(0, 2).map(g => <span key={g} className="badge-sage">{g}</span>)}
                  </div>
                  <p className="text-xs text-warmgrey dark:text-dark-sub mt-2">{book.pages} pages · {book.year}</p>
                  <p className="text-xs text-charcoal dark:text-dark-text mt-2 line-clamp-2">{book.description}</p>
                  <p className="text-xs text-terracotta-400 dark:text-dark-terra mt-2 font-medium">Why: Matches your {genre !== 'any' ? genre : 'reading'} preferences</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Favourite Books (optional)</label>
          <input type="text" value={favBooks} onChange={(e) => setFavBooks(e.target.value)} className="input-field" placeholder="e.g. Pride and Prejudice, 1984" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {optionRow('Genre', genre, setGenre, genres)}
          {optionRow('Current Mood', mood, setMood, moods)}
          {optionRow('Preferred Length', length, setLength, lengths)}
          {optionRow('Fiction / Non-Fiction', fiction, setFiction, fictions)}
          {optionRow('Difficulty', difficulty, setDifficulty, difficulties)}
          {optionRow('Era', era, setEra, eras)}
          {optionRow('Pace', pace, setPace, paces)}
        </div>
        <div className="flex gap-3">
          <button onClick={handleFind} className="btn-accent flex-1">
            <Compass className="w-5 h-5" /> Find My Next Book
          </button>
          <button onClick={handleSurprise} className="btn-outline">
            <Shuffle className="w-4 h-4" /> Surprise Me
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
