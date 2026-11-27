import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowRight, Loader2, Search, Check } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BookCover } from '@/components/BookCover';
import { books, getBookBySlug } from '@/data/books';
import { ClubService, inviteCodeFrom, type ClubLimits, type ClubSummary } from '@/services/ClubService';
import type { Book } from '@/types';

function BookPicker({ value, onChange }: { value: Book | null; onChange: (b: Book | null) => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return books
      .filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s))
      .sort((a, b) => Number(!!b.readSlug) - Number(!!a.readSlug))
      .slice(0, 6);
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-stone bg-white p-3 dark:border-dark-border dark:bg-dark-bg">
        <BookCover book={value} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg text-charcoal dark:text-dark-text">{value.title}</p>
          <p className="text-sm text-warmgrey dark:text-dark-sub">{value.author}</p>
          {value.readSlug && <span className={`${value.freeToRead ? 'badge-sage' : 'badge-terra'} mt-1`}>{value.freeToRead ? 'Free to read' : 'Read with Premium'}</span>}
        </div>
        <button type="button" onClick={() => onChange(null)} className="btn-ghost text-sm">Change</button>
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-warmgrey" />
        <input id="club-book" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title or author" className="input-field !pl-11" autoComplete="off" />
      </div>
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-stone overflow-hidden rounded-xl border border-stone bg-white dark:divide-dark-border dark:border-dark-border dark:bg-dark-bg">
          {results.map(b => (
            <li key={b.slug}>
              <button type="button" onClick={() => onChange(b)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-sage-50 dark:hover:bg-white/[0.04]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-charcoal dark:text-dark-text">{b.title}</span>
                  <span className="block truncate text-xs text-warmgrey dark:text-dark-sub">{b.author}</span>
                </span>
                {b.readSlug && <span className={b.freeToRead ? 'badge-sage' : 'badge-terra'}>{b.freeToRead ? 'Free to read' : 'Premium read'}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && results.length === 0 && <p className="mt-2 text-sm text-warmgrey">No books match “{q.trim()}”.</p>}
    </div>
  );
}

export function ClubsPage() {
  useSEO({
    title: 'Book clubs | The Book Club For One',
    description: 'Read a book with friends: invite-only clubs with spoiler-safe discussion by chapter.',
    canonical: `${window.location.origin}/clubs`,
  });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<ClubSummary[] | null>(null);
  const [limits, setLimits] = useState<ClubLimits | null>(null);
  const [name, setName] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    ClubService.myClubs().then(setClubs).catch(e => setError(e.message));
    ClubService.limits().then(setLimits).catch(() => {});
  }, [user]);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) { setError('Choose a book for the club.'); return; }
    setBusy(true); setError(null);
    try {
      const made = await ClubService.create(name, book.slug, displayName);
      navigate(`/clubs/${made.id}?new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the club');
      setBusy(false);
    }
  };

  const canStart = limits ? limits.owned < limits.max_clubs : true;

  return (
    <div className="container-page max-w-5xl py-10 md:py-14">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Book clubs' }]} />
      <header className="max-w-2xl">
        <p className="eyebrow">Read with friends</p>
        <h1 className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">Book clubs</h1>
        <p className="mt-5 text-lg leading-relaxed text-warmgrey dark:text-dark-sub">
          Start for one, invite a friend. Everyone reads at their own pace, and comments stay hidden until you reach the chapter they’re about.
        </p>
      </header>

      {!loading && !user && (
        <div className="card mt-10 max-w-xl">
          <p className="text-charcoal dark:text-dark-text">Sign in to start a club or join one. It’s free.</p>
          <div className="mt-4 flex gap-3">
            <Link to="/signin?redirect=/clubs" className="btn-primary">Sign in</Link>
            <Link to="/signup?redirect=/clubs" className="btn-outline">Create an account</Link>
          </div>
        </div>
      )}

      {user && (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="my-clubs">
            <h2 id="my-clubs" className="font-serif text-display-md text-forest-500 dark:text-dark-text">Your clubs</h2>
            {clubs === null && <p className="mt-4 text-warmgrey"><Loader2 className="inline h-4 w-4 animate-spin" /> Loading…</p>}
            {clubs?.length === 0 && <p className="mt-4 text-warmgrey dark:text-dark-sub">You’re not in a club yet. Start one, or join with an invite link from a friend.</p>}
            <ul className="mt-5 space-y-4">
              {clubs?.map(c => {
                const b = getBookBySlug(c.book_slug);
                return (
                  <li key={c.id}>
                    <Link to={`/clubs/${c.id}`} className="card card-link flex items-center gap-4 !p-4">
                      {b && <BookCover book={b} size="sm" />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-xl text-charcoal dark:text-dark-text">{c.name}</span>
                        <span className="block truncate text-sm text-warmgrey dark:text-dark-sub">{b ? `${b.title} · ${b.author}` : c.book_slug}</span>
                        <span className="mt-1 block text-xs text-warmgrey dark:text-dark-sub">
                          {c.members} {c.members === 1 ? 'person' : 'people'} · you’re on chapter {c.myChapter}{c.myRole === 'owner' ? ' · you host' : ''}
                        </span>
                      </span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-warmgrey" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <form onSubmit={e => { e.preventDefault(); const code = inviteCodeFrom(invite); if (code) navigate(`/clubs/join/${code}`); }} className="card mt-8 !p-5">
              <label htmlFor="invite" className="block text-sm font-semibold text-forest-500 dark:text-dark-sage">Got an invite?</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input id="invite" value={invite} onChange={e => setInvite(e.target.value)} placeholder="Paste the invite link or code" className="input-field min-w-0 flex-1" />
                <button className="btn-outline" type="submit" disabled={!invite.trim()}>Join</button>
              </div>
            </form>
          </section>

          <section aria-labelledby="start-club" className="panel self-start p-6 md:p-7">
            <h2 id="start-club" className="flex items-center gap-2 font-serif text-2xl text-forest-500 dark:text-dark-text"><Plus className="h-5 w-5" /> Start a club</h2>
            {limits && (
              <p className="mt-2 text-sm text-warmgrey dark:text-dark-sub">
                {limits.premium
                  ? `Premium: up to ${limits.max_clubs} clubs of ${limits.max_members} people. You host ${limits.owned}.`
                  : <>Free: 1 club of up to 3 people. <Link to="/pricing" className="link-internal">Premium</Link> hosts up to 5 clubs of 12.</>}
              </p>
            )}
            {canStart ? (
              <form onSubmit={start} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="club-name" className="block text-sm font-semibold text-forest-500 dark:text-dark-sage">Club name</label>
                  <input id="club-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} required placeholder="e.g. Sunday Austen" className="input-field mt-1" />
                </div>
                <div>
                  <label htmlFor="club-book" className="block text-sm font-semibold text-forest-500 dark:text-dark-sage">Book</label>
                  <div className="mt-1"><BookPicker value={book} onChange={setBook} /></div>
                  {book?.readSlug && !book.freeToRead && (
                    <p className="mt-2 text-xs text-warmgrey dark:text-dark-sub">Members without Premium can read chapter 1 of this book on the site.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="club-me" className="block text-sm font-semibold text-forest-500 dark:text-dark-sage">Your name in the club</label>
                  <input id="club-me" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={40} required placeholder="Your first name" className="input-field mt-1" />
                </div>
                {error && <p className="text-sm text-terracotta-600 dark:text-dark-terra" role="alert">{error}</p>}
                <button type="submit" disabled={busy} className="btn-accent w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Start the club
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-xl bg-sage-50 p-4 text-sm text-charcoal dark:bg-white/[0.04] dark:text-dark-text">
                <p className="flex items-center gap-2 font-medium"><Check className="h-4 w-4" /> You’re hosting {limits?.owned} {limits?.owned === 1 ? 'club' : 'clubs'}, your plan’s limit.</p>
                {!limits?.premium && <p className="mt-2">Premium hosts run up to 5 clubs of 12 people. <Link to="/pricing" className="link-internal">See Premium</Link></p>}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
