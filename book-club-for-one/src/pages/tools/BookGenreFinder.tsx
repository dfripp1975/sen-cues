import { useState } from 'react';
import { Tag, Search } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { books, searchBooks } from '@/data/books';
import { Link } from 'react-router-dom';
import { BookCover } from '@/components/BookCover';

export function BookGenreFinder() {
  const tool = getToolBySlug('book-genre-finder')!;
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [result, setResult] = useState<{ primaryGenre: string; subgenres: string[]; relatedGenres: string[]; similarBooks: typeof books } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const handleSearch = () => {
    const found = searchBooks(searchTitle || searchAuthor);
    if (found.length > 0) {
      const book = found[0];
      setResult({
        primaryGenre: book.genre[0],
        subgenres: book.subgenres,
        relatedGenres: book.genre,
        similarBooks: books.filter(b => b.id !== book.id && b.genre.some(g => book.genre.includes(g))).slice(0, 4),
      });
    } else {
      setResult({
        primaryGenre: 'Unknown',
        subgenres: ['Unable to determine, try a different title or author.'],
        relatedGenres: [],
        similarBooks: [],
      });
    }
  };

  const quizQuestions = [
    { key: 'setting', q: 'Where do you like stories to be set?', options: ['Real world', 'Fantasy world', 'Historical', 'Space or future'] },
    { key: 'emotion', q: 'How do you want to feel while reading?', options: ['Thrilled', 'Moved', 'Amused', 'Thoughtful'] },
    { key: 'length', q: 'How long should the book be?', options: ['Short and quick', 'Medium', 'Long and immersive'] },
    { key: 'pacing', q: 'What pace do you prefer?', options: ['Fast and action-packed', 'Slow and atmospheric', 'Mixed'] },
  ];

  const handleQuiz = () => {
    const genres: Record<string, string[]> = {
      'Real world': ['Classic Literature', 'Romance'],
      'Fantasy world': ['Fantasy', 'Adventure'],
      'Historical': ['Classic Literature', 'Gothic'],
      'Space or future': ['Science Fiction', 'Dystopian'],
      'Thrilled': ['Gothic', 'Horror'],
      'Moved': ['Romance', 'Classic Literature'],
      'Amused': ['Children\'s Literature', 'Classic Literature'],
      'Thoughtful': ['Science Fiction', 'Poetry'],
      'Short and quick': ['Poetry', 'Children\'s Literature'],
      'Medium': ['Classic Literature', 'Romance'],
      'Long and immersive': ['Adventure', 'Classic Literature'],
      'Fast and action-packed': ['Adventure', 'Horror'],
      'Slow and atmospheric': ['Gothic', 'Poetry'],
      'Mixed': ['Classic Literature', 'Science Fiction'],
    };
    const allGenres = Object.values(quizAnswers).flatMap(a => genres[a] || []);
    const topGenre = allGenres.sort((a, b) =>
      allGenres.filter(g => g === a).length - allGenres.filter(g => g === b).length
    )[0] || 'Classic Literature';
    setQuizResult(topGenre);
  };

  return (
    <ToolLayout tool={tool} results={result || quizResult ? (
      <div className="space-y-6">
        {result && (
          <>
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Genre Results</h2>
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">Primary Genre: {result.primaryGenre}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {result.subgenres.map(s => <span key={s} className="badge-sage">{s}</span>)}
              </div>
              {result.relatedGenres.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Related Genres:</p>
                  <div className="flex flex-wrap gap-2">{result.relatedGenres.map(g => <span key={g} className="badge-forest">{g}</span>)}</div>
                </div>
              )}
            </div>
            {result.similarBooks.length > 0 && (
              <div>
                <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage mb-3">Similar Books</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.similarBooks.map(b => <BookCover key={b.id} book={b} size="sm" to={`/book/${b.slug}`} />)}
                </div>
              </div>
            )}
          </>
        )}
        {quizResult && !result && (
          <div className="card text-center py-8">
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">You Should Read: {quizResult}</h2>
            <p className="text-warmgrey dark:text-dark-sub">Based on your answers, {quizResult} is the genre for you.</p>
            <Link to="/books" className="btn-accent mt-4">Explore {quizResult} Books</Link>
          </div>
        )}
      </div>
    ) : undefined}>
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">Find a Book's Genre</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Title</label>
              <input type="text" value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} className="input-field" placeholder="e.g. Dracula" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Author (optional)</label>
              <input type="text" value={searchAuthor} onChange={(e) => setSearchAuthor(e.target.value)} className="input-field" placeholder="e.g. Bram Stoker" />
            </div>
          </div>
          <button onClick={handleSearch} disabled={!searchTitle.trim() && !searchAuthor.trim()} className="btn-accent w-full">
            <Search className="w-5 h-5" /> Find Genre
          </button>
        </div>

        <div className="border-t border-stone dark:border-dark-border pt-6">
          <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage mb-4">What Book Genre Should I Read? Quiz</h3>
          <div className="space-y-4">
            {quizQuestions.map(q => (
              <div key={q.key}>
                <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">{q.q}</label>
                <div className="flex flex-wrap gap-2">
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => setQuizAnswers({ ...quizAnswers, [q.key]: opt })} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${quizAnswers[q.key] === opt ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={handleQuiz} disabled={Object.keys(quizAnswers).length < quizQuestions.length} className="btn-outline w-full">
              Find My Genre
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
