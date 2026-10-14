import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { bookById, chapterPath, fetchPassage } from '../lib/bible';
import { formatDate } from '../lib/dates';
import type { VerifiedPassage } from '../lib/types';
import { EmptyState, PageHeader, Spinner } from '../components/ui';
import { PassageCard } from '../components/Scripture';

type Tab = 'verses' | 'highlights' | 'notes' | 'devotionals';

export default function SavedPage() {
  const [tab, setTab] = useState<Tab>('verses');
  return (
    <div>
      <PageHeader title="Saved" back="/you" />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-muted p-1" role="tablist">
        {(['verses', 'highlights', 'notes', 'devotionals'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-surface shadow-soft' : 'text-subtle'}`}>{t}</button>
        ))}
      </div>
      {tab === 'verses' && <Verses />}
      {tab === 'highlights' && <Highlights />}
      {tab === 'notes' && <Notes />}
      {tab === 'devotionals' && <Devotionals />}
    </div>
  );
}

function Verses() {
  const [items, setItems] = useState<{ id: string; passage: VerifiedPassage }[] | null>(null);
  useEffect(() => {
    supabase.from('bible_bookmarks').select('*').order('created_at', { ascending: false }).limit(100).then(async ({ data }) => {
      const rows = await Promise.all((data ?? []).map(async (b) => ({ id: b.id, passage: await fetchPassage(b.book_id, b.chapter, b.verse_start, b.verse_end) })));
      setItems(rows);
    });
  }, []);
  const remove = async (id: string) => {
    await supabase.from('bible_bookmarks').delete().eq('id', id);
    setItems((s) => s?.filter((x) => x.id !== id) ?? null);
  };
  if (!items) return <Spinner />;
  if (!items.length) return <EmptyState icon={<Bookmark className="h-7 w-7" />} title="No saved verses yet">Tap Save on today's verse, or tap any verse in the Bible reader and choose Bookmark.</EmptyState>;
  return (
    <ul className="space-y-3">
      {items.map(({ id, passage }) => (
        <li key={id} className="relative">
          <PassageCard passage={passage} />
          <button onClick={() => remove(id)} className="absolute right-3 top-12 rounded-full p-2 text-subtle hover:bg-muted" aria-label={`Remove ${passage.reference}`}><Trash2 className="h-4 w-4" /></button>
        </li>
      ))}
    </ul>
  );
}

function Highlights() {
  const [rows, setRows] = useState<{ id: string; book_id: number; chapter: number; verse: number; colour: string; text?: string }[] | null>(null);
  useEffect(() => {
    supabase.from('bible_highlights').select('*').order('created_at', { ascending: false }).limit(200).then(async ({ data }) => {
      const out = await Promise.all((data ?? []).map(async (h) => ({ ...h, text: (await fetchPassage(h.book_id, h.chapter, h.verse, h.verse)).verses[0]?.text })));
      setRows(out);
    });
  }, []);
  if (!rows) return <Spinner />;
  if (!rows.length) return <EmptyState title="No highlights yet">Tap a verse in the Bible reader to highlight it.</EmptyState>;
  const swatch: Record<string, string> = { gold: 'border-l-[#C5A568]', sage: 'border-l-[#A9BDA7]', rose: 'border-l-rose-300', sky: 'border-l-sky-300' };
  return (
    <ul className="space-y-3">
      {rows.map((h) => (
        <li key={h.id}>
          <Link to={chapterPath(h.book_id, h.chapter, h.verse)} className={`card block border-l-4 p-4 ${swatch[h.colour]}`}>
            <p className="font-serif text-sm font-semibold text-accent">{bookById(h.book_id)?.name} {h.chapter}:{h.verse}</p>
            <p className="scripture mt-1">{h.text}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Notes() {
  const [rows, setRows] = useState<{ id: string; book_id: number; chapter: number; verse: number; body: string; updated_at: string }[] | null>(null);
  useEffect(() => {
    supabase.from('bible_notes').select('*').order('updated_at', { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);
  if (!rows) return <Spinner />;
  if (!rows.length) return <EmptyState title="No notes yet">Tap a verse in the Bible reader to add a personal note.</EmptyState>;
  return (
    <ul className="space-y-3">
      {rows.map((n) => (
        <li key={n.id}>
          <Link to={chapterPath(n.book_id, n.chapter, n.verse)} className="card block p-4">
            <p className="text-xs text-subtle">{bookById(n.book_id)?.name} {n.chapter}:{n.verse} · {formatDate(n.updated_at)}</p>
            <p className="mt-1">{n.body}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Devotionals() {
  const [rows, setRows] = useState<{ devotional_id: string; note: string; devotional_content: { slug: string; title: string } }[] | null>(null);
  useEffect(() => {
    supabase.from('devotional_completions').select('devotional_id, note, devotional_content(slug, title)').eq('is_saved', true)
      .then(({ data }) => setRows((data ?? []) as never));
  }, []);
  if (!rows) return <Spinner />;
  if (!rows.length) return <EmptyState title="No saved devotionals">Tap Save on any devotional to keep it here.</EmptyState>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.devotional_id}>
          <Link to={`/devotionals/${r.devotional_content.slug}`} className="card block p-4">
            <p className="font-serif text-lg font-semibold">{r.devotional_content.title}</p>
            {r.note && <p className="mt-1 line-clamp-2 text-sm text-subtle">{r.note}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
