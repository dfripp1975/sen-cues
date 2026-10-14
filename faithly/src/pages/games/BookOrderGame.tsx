import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { BOOKS } from '../../lib/bible';
import { supabase } from '../../lib/supabase';
import { markActivity } from '../../lib/progress';
import { shuffle } from '../../lib/random';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui';

export default function BookOrderGame() {
  const { user } = useAuth();
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
  const [items, setItems] = useState<typeof BOOKS>([]);
  const [checked, setChecked] = useState(false);

  const start = useCallback(() => {
    const pool = BOOKS.filter((b) => b.testament === testament);
    const startIdx = Math.floor(Math.random() * (pool.length - 6));
    let set = shuffle(pool.slice(startIdx, startIdx + 6));
    // Make sure the shuffled order isn't already correct.
    while (set.every((b, i) => i === 0 || set[i - 1].id < b.id)) set = shuffle(set);
    setItems(set);
    setChecked(false);
  }, [testament]);
  useEffect(() => { start(); }, [start]);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length || checked) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };

  const check = async () => {
    setChecked(true);
    const correct = items.filter((b, i) => [...items].sort((a, c) => a.id - c.id)[i].id === b.id).length;
    if (user) {
      await supabase.from('quiz_results').insert({ user_id: user.id, activity: 'book_order', score: correct, total: items.length });
      markActivity(user.id, 'challenge');
    }
  };

  const sorted = [...items].sort((a, b) => a.id - b.id);
  const allRight = checked && items.every((b, i) => sorted[i].id === b.id);

  return (
    <div>
      <PageHeader title="Order the books" subtitle="Use the arrows to put these books in their Bible order." back="/games" />
      <div className="mb-4 inline-flex rounded-full bg-muted p-1">
        {(['OT', 'NT'] as const).map((t) => (
          <button key={t} onClick={() => setTestament(t)} aria-pressed={testament === t} className={`rounded-full px-5 py-2 text-sm font-semibold ${testament === t ? 'bg-surface shadow-soft' : 'text-subtle'}`}>{t === 'OT' ? 'Old Testament' : 'New Testament'}</button>
        ))}
      </div>
      <ol className="space-y-2" aria-live="polite">
        {items.map((b, i) => {
          const right = checked && sorted[i].id === b.id;
          return (
            <li key={b.id} className={`card flex items-center gap-3 p-3 ${checked ? (right ? 'border-accent' : 'border-red-300') : ''}`}>
              <span className="w-6 text-center text-sm text-subtle">{i + 1}</span>
              <span className="flex-1 font-medium">{b.name}</span>
              {checked && !right && <span className="text-xs text-subtle">should be {sorted[i].name}</span>}
              <button onClick={() => move(i, -1)} disabled={i === 0 || checked} className="rounded-full p-2 hover:bg-muted disabled:opacity-30" aria-label={`Move ${b.name} up`}><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1 || checked} className="rounded-full p-2 hover:bg-muted disabled:opacity-30" aria-label={`Move ${b.name} down`}><ArrowDown className="h-4 w-4" /></button>
            </li>
          );
        })}
      </ol>
      {checked && <p className="mt-4 font-semibold text-accent">{allRight ? 'Perfect order!' : 'Nearly there — have a look at the corrections above.'}</p>}
      <div className="mt-5 flex gap-2">
        {!checked ? <button onClick={check} className="btn-primary flex-1">Check my order</button> : <button onClick={start} className="btn-primary flex-1">New set</button>}
      </div>
    </div>
  );
}
