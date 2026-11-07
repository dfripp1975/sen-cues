import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookPlus, AlertCircle, CheckCircle, Loader2, Search } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuth } from '@/lib/auth';
import { CustomBookService } from '@/services/CustomBookService';

export function AddBookPage() {
  useSEO({
    title: 'Add a Book | The Book Club For One',
    description: 'Add any book you are reading to your personal library and use all the reading tools with it.',
    canonical: `${window.location.origin}/library/add`,
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [pages, setPages] = useState('');
  const [chapters, setChapters] = useState('');
  const [genre, setGenre] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleIsbnLookup = async () => {
    if (!isbn.trim()) return;
    setLookingUp(true);
    setError(null);
    try {
      const cleanIsbn = isbn.replace(/[-\s]/g, '');
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      if (!res.ok) throw new Error('Lookup failed');
      const data = await res.json();
      const entry = data[`ISBN:${cleanIsbn}`];
      if (entry) {
        if (entry.title) setTitle(entry.title);
        if (entry.authors?.[0]?.name) setAuthor(entry.authors[0].name);
        if (entry.number_of_pages) setPages(String(entry.number_of_pages));
        if (entry.publish_date) {
          const yearMatch = entry.publish_date.match(/\d{4}/);
          if (yearMatch) setYear(yearMatch[0]);
        }
        if (entry.subjects?.length) {
          setGenre(entry.subjects.slice(0, 3).map((s: { name: string }) => s.name).join(', '));
        }
        if (entry.notes) setDescription(entry.notes);
      } else {
        setError('No book found for that ISBN. You can still fill in the details manually.');
      }
    } catch {
      setError('Could not look up that ISBN. You can still fill in the details manually.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !author.trim()) {
      setError('Title and author are required.');
      return;
    }

    setLoading(true);
    try {
      const genreArray = genre
        .split(',')
        .map(g => g.trim())
        .filter(Boolean);

      const created = await CustomBookService.create({
        title: title.trim(),
        author: author.trim(),
        year: year ? parseInt(year, 10) : undefined,
        pages: pages ? parseInt(pages, 10) : undefined,
        chapters: chapters ? parseInt(chapters, 10) : undefined,
        genre: genreArray,
        isbn: isbn.trim() || undefined,
        description: description.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(created ? `/book/custom-${created.slug}` : '/library');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Library', to: '/library' }, { label: 'Add a Book' }]} />
        <div className="card text-center py-16">
          <BookPlus className="w-12 h-12 text-sage-300 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">Add a Book</h1>
          <p className="text-warmgrey dark:text-dark-sub mb-6">Sign in to add books to your personal library and start using all the reading tools with them.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/signin" className="btn-primary">Sign In</Link>
            <Link to="/signup" className="btn-outline">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Library', to: '/library' }, { label: 'Add a Book' }]} />

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">Add a Book</h1>
        <p className="text-warmgrey dark:text-dark-sub">Reading something that isn't in our catalogue? Add it here and use all the site's tools with it.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-terracotta-50 dark:bg-terracotta-900 text-terracotta-600 dark:text-dark-terra text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-sage-50 dark:bg-forest-700 text-sage-600 dark:text-dark-sage text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Book added! Taking you to your book page...
          </div>
        )}

        {/* ISBN lookup */}
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">ISBN (optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="input-field flex-1"
              placeholder="e.g. 978-0-14-143951-8"
            />
            <button
              type="button"
              onClick={handleIsbnLookup}
              disabled={lookingUp || !isbn.trim()}
              className="btn-outline whitespace-nowrap"
            >
              {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {lookingUp ? 'Looking up...' : 'Auto-fill'}
            </button>
          </div>
          <p className="text-xs text-warmgrey dark:text-dark-sub mt-1">Enter an ISBN and we'll try to fill in the details for you.</p>
        </div>

        <div className="border-t border-stone dark:border-dark-border pt-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" placeholder="The title of the book" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Author *</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required className="input-field" placeholder="The author's name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Year</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="input-field" placeholder="e.g. 2023" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Pages</label>
              <input type="number" value={pages} onChange={(e) => setPages(e.target.value)} className="input-field" placeholder="e.g. 320" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Chapters</label>
              <input type="number" value={chapters} onChange={(e) => setChapters(e.target.value)} className="input-field" placeholder="e.g. 24" min="1" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Genre</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field" placeholder="Comma-separated, e.g. Fiction, Mystery" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[80px]" placeholder="A short description of the book" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || success} className="btn-primary flex-1">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><BookPlus className="w-4 h-4" /> Add to My Library</>
            )}
          </button>
          <Link to="/library" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
