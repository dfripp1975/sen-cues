import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPassageByRef, chapterPath, passageText } from '../../lib/bible';
import { supabase } from '../../lib/supabase';
import { markActivity } from '../../lib/progress';
import { shuffle } from '../../lib/random';
import { useAuth } from '../../context/AuthContext';
import type { VerifiedPassage } from '../../lib/types';
import { PageHeader, ProgressBar, Spinner } from '../../components/ui';

// Well-known verses; the text comes from the verified Bible database.
const VERSES = [
  'John 3:16', 'Psalms 23:1', 'Philippians 4:13', 'Proverbs 3:5', 'Romans 8:28', 'Isaiah 40:31', 'Joshua 1:9', 'Matthew 11:28',
  'Psalms 46:1', 'John 14:6', 'Jeremiah 29:11', '1 John 4:19', 'Hebrews 11:1', 'Psalms 119:105', 'Matthew 5:9', 'John 8:12',
  'Romans 12:12', 'Galatians 5:22', 'Psalms 34:18', 'Micah 6:8', '2 Corinthians 5:17', 'John 11:35', 'Psalms 136:1', '1 Peter 5:7',
];
const STOP = new Set('the and of to a in that is was he for it with as his on be at by i you are this but not have they from or one had which your all were we when there can an their if will my me him who so what them would out up do no into has more her than then its our also these us about may'.split(' '));
const ROUNDS = 5;

interface Round { passage: VerifiedPassage; before: string; answer: string; after: string; options: string[] }

function makeRound(p: VerifiedPassage): Round | null {
  const text = passageText(p);
  const words = text.split(/\s+/);
  const candidates = words.map((w, i) => ({ w: w.replace(/[^A-Za-z’']/g, ''), i })).filter(({ w }) => w.length >= 4 && !STOP.has(w.toLowerCase()));
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const distractors = shuffle(candidates.filter((c) => c.w.toLowerCase() !== pick.w.toLowerCase()).map((c) => c.w)).slice(0, 3);
  const pool = ['grace', 'mercy', 'light', 'strength', 'peace', 'heart', 'faith', 'hope', 'glory', 'truth', 'rejoice', 'kingdom'];
  while (distractors.length < 3) {
    const extra = pool[Math.floor(Math.random() * pool.length)];
    if (extra !== pick.w.toLowerCase() && !distractors.includes(extra)) distractors.push(extra);
  }
  const raw = words[pick.i];
  const lead = raw.slice(0, raw.indexOf(pick.w));
  const trail = raw.slice(raw.indexOf(pick.w) + pick.w.length);
  return {
    passage: p,
    before: [...words.slice(0, pick.i), lead].join(' '),
    answer: pick.w,
    after: [trail, ...words.slice(pick.i + 1)].join(' '),
    options: shuffle([pick.w, ...distractors]),
  };
}

export default function CompleteScriptureGame() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const start = useCallback(async () => {
    setRounds(null); setI(0); setChosen(null); setScore(0); setDone(false);
    const refs = shuffle(VERSES).slice(0, ROUNDS);
    const ps = await Promise.all(refs.map(fetchPassageByRef));
    setRounds(ps.filter(Boolean).map((p) => makeRound(p!)).filter(Boolean) as Round[]);
  }, []);
  useEffect(() => { start(); }, [start]);

  if (!rounds) return <Spinner />;
  const r = rounds[i];

  const choose = (o: string) => {
    if (chosen) return;
    setChosen(o);
    if (o === r.answer) setScore((s) => s + 1);
  };
  const next = async () => {
    if (i < rounds.length - 1) { setI(i + 1); setChosen(null); return; }
    setDone(true);
    if (user) {
      await supabase.from('quiz_results').insert({ user_id: user.id, activity: 'complete_scripture', score, total: rounds.length });
      markActivity(user.id, 'challenge');
    }
  };

  if (done) {
    return (
      <div>
        <PageHeader title="Complete the Scripture" back="/games" />
        <div className="card p-8 text-center">
          <p className="font-serif text-5xl font-semibold text-accent">{score}/{rounds.length}</p>
          <p className="mt-3 text-subtle">Hiding God's Word in your heart takes time. Keep going!</p>
          <button onClick={start} className="btn-primary mt-6">Play again</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Complete the Scripture" back="/games" />
      <ProgressBar value={(i + (chosen ? 1 : 0)) / rounds.length} label="Progress" />
      <div className="card mt-4 p-6">
        <p className="eyebrow">{r.passage.reference} · WEB</p>
        <p className="scripture mt-3 text-xl">
          {r.before} <span className={`inline-block min-w-[5rem] border-b-2 px-1 text-center font-semibold ${chosen ? (chosen === r.answer ? 'border-accent text-accent' : 'border-red-400 text-red-700 dark:text-red-300') : 'border-gold'}`}>{chosen ? r.answer : ' '}</span> {r.after}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          {r.options.map((o) => (
            <button key={o} onClick={() => choose(o)} disabled={!!chosen}
              className={`rounded-xl border px-4 py-3 font-medium transition ${chosen && o === r.answer ? 'border-accent bg-accent/10' : chosen === o ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-line hover:bg-muted'}`}>{o}</button>
          ))}
        </div>
        {chosen && (
          <div className="mt-5 flex items-center justify-between">
            <Link to={chapterPath(r.passage.bookId, r.passage.chapter, r.passage.verseStart)} className="text-sm text-accent underline">Read in context</Link>
            <button onClick={next} className="btn-primary">{i < rounds.length - 1 ? 'Next' : 'Finish'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
