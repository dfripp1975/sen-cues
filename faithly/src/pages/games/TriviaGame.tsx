import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { markActivity } from '../../lib/progress';
import { dateSeed, seeded, shuffle } from '../../lib/random';
import { chapterPath, parseReference } from '../../lib/bible';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, PageHeader, ProgressBar, Spinner } from '../../components/ui';

interface Q { id: string; category: string; difficulty: string; question: string; options: string[]; correct_index: number; explanation: string; reference: string }

export default function TriviaGame({ category = 'trivia', daily = false }: { category?: 'trivia' | 'character'; daily?: boolean }) {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState<string | null>(daily ? 'all' : null);
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!difficulty) return;
    let q = supabase.from('quiz_questions').select('*').eq('is_published', true).order('created_at');
    if (!daily) q = q.eq('category', category);
    if (!daily && difficulty !== 'all') q = q.eq('difficulty', difficulty);
    q.then(({ data }) => {
      const all = (data ?? []) as Q[];
      const picked = daily ? shuffle(all, seeded(dateSeed())).slice(0, 5) : shuffle(all).slice(0, 8);
      setQuestions(picked);
    });
  }, [difficulty, category, daily, round]);

  const title = daily ? 'Daily Bible challenge' : category === 'character' ? 'Guess the character' : 'Bible trivia';

  if (!difficulty) {
    return (
      <div>
        <PageHeader title={title} back="/games" />
        <p className="mb-4 text-subtle">Choose a level:</p>
        <div className="grid gap-3">
          {['beginner', 'intermediate', 'advanced', 'all'].map((d) => (
            <button key={d} onClick={() => setDifficulty(d)} className="card p-5 text-left font-semibold capitalize hover:shadow-lift">{d === 'all' ? 'Mixed' : d}</button>
          ))}
        </div>
      </div>
    );
  }
  if (!questions) return <Spinner />;
  if (!questions.length) return <EmptyState title="No questions yet">An administrator can add questions from the admin dashboard.</EmptyState>;

  const q = questions[i];
  const choose = (idx: number) => {
    if (chosen !== null) return;
    setChosen(idx);
    if (idx === q.correct_index) setScore((s) => s + 1);
  };
  const next = async () => {
    if (i < questions.length - 1) {
      setI(i + 1);
      setChosen(null);
      return;
    }
    setFinished(true);
    if (user) {
      await supabase.from('quiz_results').insert({ user_id: user.id, activity: daily ? 'daily_challenge' : category, score, total: questions.length });
      markActivity(user.id, 'challenge');
    }
  };

  if (finished) {
    return (
      <div>
        <PageHeader title={title} back="/games" />
        <div className="card p-8 text-center">
          <p className="font-serif text-5xl font-semibold text-accent">{score}/{questions.length}</p>
          <p className="mt-3 text-subtle">{score === questions.length ? 'Wonderful — every one!' : 'Thank you for learning today. Each question is a chance to discover something new in Scripture.'}</p>
          <div className="mt-6 flex justify-center gap-2">
            {!daily && <button className="btn-primary" onClick={() => { setQuestions(null); setI(0); setScore(0); setChosen(null); setFinished(false); setRound((r) => r + 1); }}>Play again</button>}
            <Link to="/games" className="btn-secondary">More challenges</Link>
          </div>
        </div>
      </div>
    );
  }

  const ref = parseReference(q.reference);
  return (
    <div>
      <PageHeader title={title} back="/games" />
      <ProgressBar value={(i + (chosen !== null ? 1 : 0)) / questions.length} label="Quiz progress" />
      <p className="mt-2 text-sm text-subtle">Question {i + 1} of {questions.length}</p>
      <div className="card mt-4 p-6">
        <p className="font-serif text-xl font-semibold leading-snug">{q.question}</p>
        <div className="mt-5 grid gap-2">
          {q.options.map((o, idx) => {
            const reveal = chosen !== null;
            return (
              <button key={idx} onClick={() => choose(idx)} disabled={reveal}
                className={`rounded-xl border px-4 py-3 text-left transition ${reveal && idx === q.correct_index ? 'border-accent bg-accent/10 font-semibold' : reveal && idx === chosen ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-line hover:bg-muted'}`}>
                {o}
              </button>
            );
          })}
        </div>
        {chosen !== null && (
          <div className="page-enter mt-5 rounded-xl bg-muted/70 p-4 text-sm" aria-live="polite">
            <p className="font-semibold">{chosen === q.correct_index ? 'Correct.' : `The answer is ${q.options[q.correct_index]}.`}</p>
            <p className="mt-1 text-subtle">{q.explanation}</p>
            {ref && <Link to={chapterPath(ref.bookId, ref.chapter, ref.verseStart ?? undefined)} className="mt-2 inline-block text-accent underline">Read {q.reference}</Link>}
          </div>
        )}
        {chosen !== null && <button onClick={next} className="btn-primary mt-5 w-full">{i < questions.length - 1 ? 'Next question' : 'See results'}</button>}
      </div>
    </div>
  );
}
