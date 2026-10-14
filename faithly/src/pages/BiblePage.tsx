import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BOOKS, bookById } from '../lib/bible';
import { PageHeader } from '../components/ui';

export default function BiblePage() {
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const [open, setOpen] = useState<number | null>(null);
  const [recent, setRecent] = useState<{ book_id: number; chapter: number } | null>(null);
  const [readCounts, setReadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    supabase.from('reading_progress').select('book_id, chapter, read_at').order('read_at', { ascending: false }).then(({ data }) => {
      if (!data?.length) return;
      setRecent(data[0]);
      const counts: Record<number, number> = {};
      data.forEach((r) => (counts[r.book_id] = (counts[r.book_id] ?? 0) + 1));
      setReadCounts(counts);
    });
  }, []);

  const totalRead = Object.values(readCounts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader title="Bible" subtitle="World English Bible · public domain"
        action={<Link to="/bible/search" className="rounded-full p-2.5 hover:bg-muted" aria-label="Search the Bible"><Search className="h-5 w-5" /></Link>} />

      {recent && (
        <Link to={`/bible/${bookById(recent.book_id)?.code.toLowerCase()}/${recent.chapter}`} className="card mb-6 flex items-center gap-3 p-4 hover:shadow-lift">
          <History className="h-5 w-5 text-accent" aria-hidden />
          <div className="flex-1">
            <p className="text-xs text-subtle">Continue reading</p>
            <p className="font-serif font-semibold">{bookById(recent.book_id)?.name} {recent.chapter}</p>
          </div>
          <p className="text-xs text-subtle">{totalRead} of 1,189 chapters read</p>
        </Link>
      )}

      <div className="mb-4 inline-flex rounded-full bg-muted p-1" role="tablist">
        {(['OT', 'NT'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={testament === t} onClick={() => { setTestament(t); setOpen(null); }}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${testament === t ? 'bg-surface shadow-soft' : 'text-subtle'}`}>
            {t === 'OT' ? 'Old Testament' : 'New Testament'}
          </button>
        ))}
      </div>

      <ul className="card divide-y divide-line">
        {BOOKS.filter((b) => b.testament === testament).map((b) => (
          <li key={b.id}>
            <button className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-muted/50" aria-expanded={open === b.id} onClick={() => setOpen(open === b.id ? null : b.id)}>
              <span className="font-medium">{b.name}</span>
              <span className="text-xs text-subtle">{readCounts[b.id] ? `${readCounts[b.id]}/${b.chapters} read` : `${b.chapters} ${b.chapters === 1 ? 'chapter' : 'chapters'}`}</span>
            </button>
            {open === b.id && (
              <div className="grid grid-cols-6 gap-2 px-5 pb-4 sm:grid-cols-10">
                {Array.from({ length: b.chapters }, (_, i) => (
                  <Link key={i} to={`/bible/${b.code.toLowerCase()}/${i + 1}`} className="grid aspect-square place-items-center rounded-lg bg-muted text-sm font-medium hover:bg-accent hover:text-accent-ink">
                    {i + 1}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
