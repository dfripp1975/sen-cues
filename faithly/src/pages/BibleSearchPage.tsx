import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { bookById, chapterPath, parseReference } from '../lib/bible';
import { EmptyState, ErrorNote, PageHeader, Spinner } from '../components/ui';
import { useNavigate } from 'react-router-dom';

interface Hit { book_id: number; chapter: number; verse: number; text: string }

export default function BibleSearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const nav = useNavigate();

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    if (term.length < 2) return;
    // A reference like "John 3:16" jumps straight to the passage.
    const ref = parseReference(term);
    if (ref) return nav(chapterPath(ref.bookId, ref.chapter, ref.verseStart ?? undefined));
    setParams({ q: term });
    setBusy(true);
    setError(false);
    const { data, error } = await supabase.rpc('search_bible', { q: term, translation: 'WEB', max_results: 60 });
    setBusy(false);
    if (error) return setError(true);
    setHits(data as Hit[]);
  };

  return (
    <div>
      <PageHeader title="Search the Bible" back="/bible" />
      <form onSubmit={run} className="relative mb-6">
        <label htmlFor="bq" className="sr-only">Search words or a reference</label>
        <input id="bq" className="input pr-12" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. peace, shepherd, or Romans 8:28" autoFocus />
        <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-accent" aria-label="Search"><Search className="h-5 w-5" /></button>
      </form>
      {busy && <Spinner label="Searching" />}
      {error && <ErrorNote onRetry={() => run()}>Search failed. Please try again.</ErrorNote>}
      {hits && !busy && (hits.length === 0
        ? <EmptyState title="No verses found">Try a different word, or fewer words.</EmptyState>
        : (
          <ul className="space-y-3">
            <li className="text-sm text-subtle">{hits.length}{hits.length === 60 ? '+' : ''} verses</li>
            {hits.map((h) => (
              <li key={`${h.book_id}-${h.chapter}-${h.verse}`}>
                <Link to={chapterPath(h.book_id, h.chapter, h.verse)} className="card block p-4 hover:shadow-lift">
                  <p className="font-serif text-sm font-semibold text-accent">{bookById(h.book_id)?.name} {h.chapter}:{h.verse}</p>
                  <p className="scripture mt-1">{h.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
