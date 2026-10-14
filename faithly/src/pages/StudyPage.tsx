import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookOpen, GraduationCap, Lock } from 'lucide-react';
import { BOOKS, chapterPath } from '../lib/bible';
import { callFunction } from '../lib/api';
import { supabase } from '../lib/supabase';
import { markActivity } from '../lib/progress';
import { useAuth } from '../context/AuthContext';
import type { VerifiedPassage } from '../lib/types';
import { PageHeader, Paragraphs, Spinner } from '../components/ui';
import { AiLabel, PassageCard } from '../components/Scripture';
import { AiError } from '../components/AiError';

interface Study {
  book: string; bookId: number; chapter: number; level: string; summary: string; themes: string[]; historical_background: string;
  people: { name: string; description: string }[]; cultural_context: string; key_lessons: string[];
  difficult_verses: { reference: string; verse: number; explanation: string }[]; reflection_questions: string[];
  quiz: { question: string; options: string[]; answer_index: number; explanation: string }[];
  related_passages: VerifiedPassage[];
}

const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export default function StudyPage() {
  const { book: code = '', chapter: chStr = '1' } = useParams();
  const book = BOOKS.find((b) => b.code.toLowerCase() === code.toLowerCase());
  const chapter = Number(chStr);
  const { isPremium, prefs } = useAuth();
  const [level, setLevel] = useState<string>(prefs?.bible_familiarity === 'very_familiar' ? 'intermediate' : 'beginner');
  const [newMode, setNewMode] = useState(!!prefs?.new_to_christianity);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [study, setStudy] = useState<Study | null>(null);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return <Navigate to="/bible" replace />;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setStudy(null);
    try {
      setStudy(await callFunction<Study>('faithly-ai', { mode: 'study', bookId: book.id, chapter, level, newToChristianity: newMode }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`Study ${book.name} ${chapter}`} subtitle="An AI study guide grounded in the chapter's text." back={chapterPath(book.id, chapter)} />

      <div className="card space-y-4 p-5">
        <fieldset>
          <legend className="label">Study level</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => {
              const locked = l.id === 'advanced' && !isPremium;
              return (
                <button key={l.id} onClick={() => !locked && setLevel(l.id)} aria-pressed={level === l.id} aria-disabled={locked}
                  className={`chip ${level === l.id ? 'chip-on' : 'bg-surface'} ${locked ? 'opacity-60' : ''}`}>
                  {locked && <Lock className="h-3.5 w-3.5" aria-hidden />}{l.label}
                </button>
              );
            })}
          </div>
          {!isPremium && <p className="mt-2 text-xs text-subtle">Advanced mode is part of <Link to="/premium" className="underline">Premium</Link>.</p>}
        </fieldset>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-forest" checked={newMode} onChange={(e) => setNewMode(e.target.checked)} />
          Explain like I'm new to Christianity
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={run} disabled={busy} className="btn-primary"><GraduationCap className="h-4 w-4" />{busy ? 'Preparing study…' : study ? 'Regenerate' : 'Create study guide'}</button>
          <Link to={chapterPath(book.id, chapter)} className="btn-ghost"><BookOpen className="h-4 w-4" />Read the chapter</Link>
        </div>
      </div>

      {busy && <Spinner label="Studying the chapter — this can take up to 30 seconds" />}
      {error != null && <AiError error={error} onRetry={run} />}
      {study && <StudyView study={study} />}
    </div>
  );
}

function StudyView({ study }: { study: Study }) {
  return (
    <div className="space-y-5">
      <AiLabel>AI study guide — check against the text</AiLabel>
      <Block title="Summary"><Paragraphs text={study.summary} /></Block>
      {study.themes.length > 0 && <Block title="Main themes"><ul className="flex flex-wrap gap-2">{study.themes.map((t) => <li key={t} className="chip bg-sage/15">{t}</li>)}</ul></Block>}
      {study.historical_background && <Block title="Historical background"><Paragraphs text={study.historical_background} /></Block>}
      {study.people.length > 0 && (
        <Block title="Important people">
          <dl className="space-y-2">{study.people.map((p) => <div key={p.name}><dt className="font-semibold">{p.name}</dt><dd className="text-subtle">{p.description}</dd></div>)}</dl>
        </Block>
      )}
      {study.cultural_context && <Block title="Cultural context"><Paragraphs text={study.cultural_context} /></Block>}
      {study.key_lessons.length > 0 && <Block title="Key lessons"><ul className="space-y-1.5">{study.key_lessons.map((l) => <li key={l} className="ml-5 list-disc">{l}</li>)}</ul></Block>}
      {study.difficult_verses.length > 0 && (
        <Block title="Difficult verses explained">
          <div className="space-y-3">{study.difficult_verses.map((d) => (
            <div key={d.reference}>
              <Link to={chapterPath(study.bookId, study.chapter, d.verse)} className="font-serif font-semibold text-accent underline-offset-2 hover:underline">{d.reference}</Link>
              <p className="text-subtle">{d.explanation}</p>
            </div>
          ))}</div>
        </Block>
      )}
      {study.reflection_questions.length > 0 && <Block title="Reflection questions"><ol className="space-y-1.5">{study.reflection_questions.map((q) => <li key={q} className="ml-5 list-decimal">{q}</li>)}</ol></Block>}
      {study.quiz.length > 0 && <Quiz quiz={study.quiz} />}
      {study.related_passages.length > 0 && (
        <Block title="Related passages"><div className="space-y-3">{study.related_passages.map((p) => <PassageCard key={p.reference} passage={p} compact />)}</div></Block>
      )}
    </div>
  );
}

function Quiz({ quiz }: { quiz: Study['quiz'] }) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [recorded, setRecorded] = useState(false);
  const done = Object.keys(answers).length === quiz.length;
  const score = quiz.filter((q, i) => answers[i] === q.answer_index).length;

  const choose = async (qi: number, oi: number) => {
    if (answers[qi] !== undefined) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    if (Object.keys(next).length === quiz.length && user && !recorded) {
      setRecorded(true);
      const s = quiz.filter((q, i) => next[i] === q.answer_index).length;
      await supabase.from('quiz_results').insert({ user_id: user.id, activity: 'study_quiz', score: s, total: quiz.length });
      markActivity(user.id, 'challenge');
    }
  };

  return (
    <Block title="Check your understanding">
      <div className="space-y-5">
        {quiz.map((q, qi) => (
          <div key={qi}>
            <p className="font-medium">{qi + 1}. {q.question}</p>
            <div className="mt-2 grid gap-2">
              {q.options.map((o, oi) => {
                const chosen = answers[qi] === oi;
                const reveal = answers[qi] !== undefined;
                const correct = oi === q.answer_index;
                return (
                  <button key={oi} onClick={() => choose(qi, oi)} disabled={reveal}
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${reveal && correct ? 'border-accent bg-accent/10' : chosen ? 'border-red-400 bg-red-50 dark:bg-red-950/30' : 'border-line hover:bg-muted'}`}>
                    {o}
                  </button>
                );
              })}
            </div>
            {answers[qi] !== undefined && <p className="mt-2 text-sm text-subtle">{q.explanation}</p>}
          </div>
        ))}
        {done && <p className="font-semibold text-accent">You answered {score} of {quiz.length} correctly. Learning is a journey — well done for exploring.</p>}
      </div>
    </Block>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}
