import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { BookCover } from '@/components/BookCover';
import { getBookBySlug } from '@/data/books';
import { ClubService, type InvitePreview } from '@/services/ClubService';

export function ClubJoinPage() {
  const { code = '' } = useParams();
  useSEO({ title: 'Join a book club | The Book Club For One', description: 'You have been invited to read a book together.', canonical: `${window.location.origin}/clubs` });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ClubService.preview(code).then(setPreview).catch(() => setPreview(null));
  }, [code]);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const id = await ClubService.join(code, displayName);
      navigate(`/clubs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join');
      setBusy(false);
    }
  };

  if (preview === undefined) return <div className="container-page max-w-xl py-24 text-warmgrey"><Loader2 className="inline h-5 w-5 animate-spin" /> Opening your invite…</div>;

  if (preview === null) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <h1 className="font-serif text-display-md text-forest-500 dark:text-dark-text">This invite doesn’t work</h1>
        <p className="mt-4 text-warmgrey dark:text-dark-sub">The link may be mistyped, or the club may have closed. Check it with whoever sent it.</p>
        <Link to="/clubs" className="btn-primary mt-8">Go to book clubs</Link>
      </div>
    );
  }

  const book = getBookBySlug(preview.book_slug);
  const full = preview.members >= preview.cap;
  const back = encodeURIComponent(`/clubs/join/${code}`);

  return (
    <div className="container-page max-w-xl py-14 md:py-20">
      <p className="eyebrow">You’re invited</p>
      <h1 className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">{preview.name}</h1>
      <p className="mt-3 text-lg text-warmgrey dark:text-dark-sub">{preview.host} would like you to read along.</p>

      {book && (
        <div className="card mt-8 flex items-center gap-4 !p-4">
          <BookCover book={book} size="md" />
          <div>
            <p className="font-serif text-xl text-charcoal dark:text-dark-text">{book.title}</p>
            <p className="text-sm text-warmgrey dark:text-dark-sub">{book.author}</p>
            {book.readSlug && (
              <p className="mt-2 text-sm text-charcoal dark:text-dark-text">
                {book.freeToRead ? 'Free to read here in full.' : 'Chapter 1 is free to read here; the rest is part of Premium.'}
              </p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-warmgrey dark:text-dark-sub"><Users className="h-4 w-4" /> {preview.members} of {preview.cap} places taken</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        {full ? (
          <p className="text-charcoal dark:text-dark-text">This club is full. Ask {preview.host} about room, or <Link to="/clubs" className="link-internal">start your own club</Link>.</p>
        ) : !loading && !user ? (
          <div className="flex flex-wrap gap-3">
            <Link to={`/signup?redirect=${back}`} className="btn-accent">Create a free account to join</Link>
            <Link to={`/signin?redirect=${back}`} className="btn-outline">I have an account</Link>
          </div>
        ) : (
          <form onSubmit={join} className="space-y-3">
            <label htmlFor="join-name" className="block text-sm font-semibold text-forest-500 dark:text-dark-sage">Your name in the club</label>
            <input id="join-name" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={40} required placeholder="Your first name" className="input-field" />
            {error && <p className="text-sm text-terracotta-600 dark:text-dark-terra" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn-accent">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Join the club</button>
            <p className="text-xs text-warmgrey dark:text-dark-sub">Joining is free. Comments stay hidden until you reach the chapter they’re about.</p>
          </form>
        )}
      </div>
    </div>
  );
}
