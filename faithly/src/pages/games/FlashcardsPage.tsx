import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { displayReference, fetchPassage, passageText, parseReference } from '../../lib/bible';
import { review } from '../../lib/sm2';
import { markActivity } from '../../lib/progress';
import { todayLocal } from '../../lib/dates';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { VerifiedPassage } from '../../lib/types';
import { EmptyState, PageHeader, Spinner } from '../../components/ui';

interface Card { id: string; book_id: number; chapter: number; verse_start: number; verse_end: number; ease: number; interval_days: number; repetitions: number; due_on: string }

const STARTERS = ['Psalms 23:1', 'John 3:16', 'Philippians 4:6', 'Proverbs 3:5', 'Isaiah 41:10', 'Romans 8:28'];

export default function FlashcardsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [passage, setPassage] = useState<VerifiedPassage | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [newRef, setNewRef] = useState('');

  const load = () => supabase.from('memory_cards').select('*').order('due_on').then(({ data }) => {
    const all = (data ?? []) as Card[];
    setCards(all);
    setQueue(all.filter((c) => c.due_on <= todayLocal()));
  });
  useEffect(() => { load(); }, []);

  const current = queue[0];
  useEffect(() => {
    setRevealed(false);
    setPassage(null);
    if (current) fetchPassage(current.book_id, current.chapter, current.verse_start, current.verse_end).then(setPassage);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (ref: string) => {
    if (!user) return;
    const r = parseReference(ref);
    if (!r || !r.verseStart) return toast('Please enter a verse reference, e.g. Psalm 46:10', 'error');
    const { error } = await supabase.from('memory_cards').upsert({ user_id: user.id, book_id: r.bookId, chapter: r.chapter, verse_start: r.verseStart, verse_end: r.verseEnd ?? r.verseStart },
      { onConflict: 'user_id,book_id,chapter,verse_start,verse_end', ignoreDuplicates: true });
    if (error) return toast('Could not add that verse.', 'error');
    setNewRef('');
    toast('Memory verse added');
    load();
  };

  const grade = async (g: 0 | 3 | 4 | 5) => {
    if (!current) return;
    const next = review(current, g);
    const due = new Date();
    due.setDate(due.getDate() + next.due_in_days);
    await supabase.from('memory_cards').update({ ease: next.ease, interval_days: next.interval_days, repetitions: next.repetitions, due_on: todayLocal(due) }).eq('id', current.id);
    setQueue((q) => (g === 0 ? [...q.slice(1), { ...current, ...next }] : q.slice(1)));
    setReviewed((n) => n + 1);
    if (user && reviewed === 0) markActivity(user.id, 'challenge');
  };

  const remove = async (id: string) => {
    await supabase.from('memory_cards').delete().eq('id', id);
    load();
  };

  if (!cards) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Memory verses" subtitle="Review verses just before you'd forget them." back="/games" />

      {current ? (
        <div className="card p-6">
          <p className="eyebrow">{queue.length} to review today</p>
          {!passage ? <Spinner /> : (
            <>
              <p className="mt-2 font-serif text-2xl font-semibold text-accent">{passage.reference}</p>
              <p className="mt-1 text-sm text-subtle">Try to recall the verse, then reveal it.</p>
              {revealed ? (
                <>
                  <p className="scripture mt-4 rounded-xl bg-muted/70 p-4">{passageText(passage)}</p>
                  <p className="mt-4 text-sm font-medium">How well did you remember it?</p>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <button onClick={() => grade(0)} className="btn-secondary !px-2">Again</button>
                    <button onClick={() => grade(3)} className="btn-secondary !px-2">Hard</button>
                    <button onClick={() => grade(4)} className="btn-secondary !px-2">Good</button>
                    <button onClick={() => grade(5)} className="btn-primary !px-2">Easy</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setRevealed(true)} className="btn-primary mt-5 w-full">Reveal verse</button>
              )}
            </>
          )}
        </div>
      ) : cards.length ? (
        <EmptyState icon={<Layers className="h-7 w-7" />} title={reviewed ? 'All done for today' : 'Nothing due today'}>
          {reviewed ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. ` : ''}Your next verses will be ready when they're due.
        </EmptyState>
      ) : (
        <EmptyState icon={<Layers className="h-7 w-7" />} title="Start memorising Scripture">
          Add a verse below, or tap any verse in the <Link to="/bible" className="underline">Bible reader</Link> and choose Memorise.
        </EmptyState>
      )}

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Add a verse</h2>
        <div className="mt-3 flex gap-2">
          <label htmlFor="mref" className="sr-only">Verse reference</label>
          <input id="mref" className="input" value={newRef} onChange={(e) => setNewRef(e.target.value)} placeholder="e.g. Psalm 46:10" onKeyDown={(e) => e.key === 'Enter' && add(newRef)} />
          <button onClick={() => add(newRef)} className="btn-primary" disabled={!newRef.trim()}><Plus className="h-4 w-4" />Add</button>
        </div>
        {cards.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => <button key={s} onClick={() => add(s)} className="chip hover:bg-muted">{s.replace('Psalms', 'Psalm')}</button>)}
          </div>
        )}
      </section>

      {cards.length > 0 && (
        <section>
          <h2 className="eyebrow mb-2">Your memory verses</h2>
          <ul className="card divide-y divide-line">
            {cards.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span>{displayReference({ bookId: c.book_id, chapter: c.chapter, verseStart: c.verse_start, verseEnd: c.verse_end })}</span>
                <span className="flex items-center gap-3 text-subtle">due {c.due_on <= todayLocal() ? 'today' : c.due_on}
                  <button onClick={() => remove(c.id)} className="rounded-full p-1.5 hover:bg-muted" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
