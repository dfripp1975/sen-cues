import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, NotebookPen, Plus, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/dates';
import { exportJournalMarkdown } from '../lib/export';
import type { JournalEntry } from '../lib/types';
import { EmptyState, ErrorNote, PageHeader, Spinner } from '../components/ui';

const STATUS_LABEL = { praying: 'Still praying', reflected: 'Reflected on', answered: 'Answered' } as const;

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'prayers' | 'answered'>('all');

  useEffect(() => {
    supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data, error }) => (error ? setError(true) : setEntries(data as JournalEntry[])));
  }, []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (entries ?? []).filter((e) =>
      (filter === 'all' || (filter === 'prayers' && e.is_prayer) || (filter === 'answered' && e.prayer_status === 'answered')) &&
      (!term || e.title.toLowerCase().includes(term) || e.body.toLowerCase().includes(term) || e.scripture_refs.some((r) => r.toLowerCase().includes(term))));
  }, [entries, q, filter]);

  return (
    <div>
      <PageHeader title="Prayer journal" subtitle="Private to you. Never shared, never used to train AI." back="/you"
        action={<Link to="/you/journal/new" className="btn-primary !px-4"><Plus className="h-4 w-4" />New</Link>} />
      {error && <ErrorNote>Could not load your journal.</ErrorNote>}
      {!entries && !error && <Spinner />}
      {entries && entries.length === 0 && (
        <EmptyState icon={<NotebookPen className="h-7 w-7" />} title="Your journal is waiting"
          action={<Link to="/you/journal/new" className="btn-primary">Write your first entry</Link>}>
          Record prayers, thoughts and the verses that speak to you. You can come back later and mark prayers as answered.
        </EmptyState>
      )}
      {entries && entries.length > 0 && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
              <label htmlFor="jsearch" className="sr-only">Search journal</label>
              <input id="jsearch" className="input pl-9" placeholder="Search entries" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {(['all', 'prayers', 'answered'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`chip capitalize ${filter === f ? 'chip-on' : 'bg-surface'}`}>{f}</button>
              ))}
            </div>
          </div>
          <ul className="space-y-3">
            {shown.map((e) => (
              <li key={e.id}>
                <Link to={`/you/journal/${e.id}`} className="card block p-4 hover:shadow-lift">
                  <div className="flex items-center justify-between gap-2 text-xs text-subtle">
                    <span>{formatDate(e.entry_date)}</span>
                    <span className="flex gap-2">
                      {e.mood && <span className="capitalize">{e.mood}</span>}
                      {e.prayer_status && <span className="scripture-label !normal-case !tracking-normal">{STATUS_LABEL[e.prayer_status]}</span>}
                    </span>
                  </div>
                  {e.title && <p className="mt-1 font-serif text-lg font-semibold">{e.title}</p>}
                  <p className="mt-1 line-clamp-2 text-sm text-subtle">{e.body}</p>
                  {e.scripture_refs.length > 0 && <p className="mt-2 text-xs text-accent">{e.scripture_refs.join(' · ')}</p>}
                </Link>
              </li>
            ))}
            {shown.length === 0 && <p className="text-sm text-subtle">No entries match.</p>}
          </ul>
          <button onClick={() => exportJournalMarkdown(entries)} className="btn-ghost mt-6"><Download className="h-4 w-4" />Export journal (Markdown)</button>
          <p className="mt-1 text-xs text-subtle">You can also download all of your Faithly data from Settings.</p>
        </>
      )}
    </div>
  );
}
