import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callFunction } from '../lib/api';
import { fetchPassage } from '../lib/bible';
import { markActivity } from '../lib/progress';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Journey, JourneyDay, JourneyProgress, VerifiedPassage } from '../lib/types';
import { ErrorNote, PageHeader, Paragraphs, PremiumNotice, Spinner } from '../components/ui';
import { AiLabel, PassageCard } from '../components/Scripture';
import { AiError } from '../components/AiError';

export default function JourneyDayPage() {
  const { slug, day: dayStr } = useParams();
  const dayNumber = Number(dayStr);
  const { user, isPremium } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [day, setDay] = useState<JourneyDay | null>(null);
  const [passage, setPassage] = useState<VerifiedPassage | null>(null);
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [journal, setJournal] = useState('');
  const [savedJournal, setSavedJournal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [personal, setPersonal] = useState<{ loading: boolean; data?: { reflection: string; question: string }; error?: unknown } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setPersonal(null);
      setSavedJournal(false);
      setJournal('');
      const { data: j } = await supabase.from('faith_journeys').select('*').eq('slug', slug).maybeSingle();
      if (!j) return setLoading(false);
      setJourney(j as Journey);
      const [d, p] = await Promise.all([
        supabase.from('journey_days').select('*').eq('journey_id', j.id).eq('day_number', dayNumber).maybeSingle(),
        supabase.from('user_journey_progress').select('*').eq('journey_id', j.id).maybeSingle(),
      ]);
      setDay(d.data as JourneyDay | null);
      setProgress(p.data as JourneyProgress | null);
      if (d.data) setPassage(await fetchPassage(d.data.book_id, d.data.chapter, d.data.verse_start, d.data.verse_end));
      const { data: entry } = await supabase.from('journal_entries').select('body').eq('journey_id', j.id).eq('journey_day', dayNumber).maybeSingle();
      if (entry) { setJournal(entry.body); setSavedJournal(true); }
      setLoading(false);
    })();
  }, [slug, dayNumber]);

  if (loading) return <Spinner />;
  if (!journey) return <ErrorNote>Journey not found.</ErrorNote>;
  if (!day) {
    return journey.is_premium && !isPremium
      ? <div><PageHeader title={journey.title} back={`/journeys/${journey.slug}`} /><PremiumNotice>This journey is part of Faithly Premium.</PremiumNotice></div>
      : <ErrorNote>That day could not be found.</ErrorNote>;
  }

  const complete = progress?.completed_days.includes(dayNumber) ?? false;

  const saveJournal = async () => {
    if (!user || !journal.trim()) return;
    setBusy(true);
    const { data: existing } = await supabase.from('journal_entries').select('id').eq('journey_id', journey.id).eq('journey_day', dayNumber).maybeSingle();
    const row = {
      user_id: user.id, title: `${journey.title} — Day ${dayNumber}`, body: journal.trim(),
      scripture_refs: passage ? [passage.reference] : [], journey_id: journey.id, journey_day: dayNumber,
    };
    const { error } = existing
      ? await supabase.from('journal_entries').update(row).eq('id', existing.id)
      : await supabase.from('journal_entries').insert(row);
    setBusy(false);
    if (error) return toast('Could not save your journal entry.', 'error');
    setSavedJournal(true);
    markActivity(user.id, 'journal');
    toast('Saved to your journal');
  };

  const markComplete = async () => {
    if (!user) return;
    setBusy(true);
    let p = progress;
    if (!p) {
      const { data, error } = await supabase.from('user_journey_progress').insert({ user_id: user.id, journey_id: journey.id }).select('*').single();
      if (error) { setBusy(false); return toast('Could not save progress.', 'error'); }
      p = data as JourneyProgress;
    }
    const days = Array.from(new Set([...p.completed_days, dayNumber])).sort((a, b) => a - b);
    const finished = days.length >= journey.day_count;
    const { data, error } = await supabase.from('user_journey_progress').update({
      completed_days: days, status: finished ? 'completed' : 'active',
      completed_at: finished ? new Date().toISOString() : null, last_activity_at: new Date().toISOString(),
    }).eq('id', p.id).select('*').single();
    setBusy(false);
    if (error) return toast('Could not save progress.', 'error');
    setProgress(data as JourneyProgress);
    markActivity(user.id, 'reflection');
    if (finished) toast(`You've completed ${journey.title}. Well done.`);
    else if (dayNumber < journey.day_count) nav(`/journeys/${journey.slug}/day/${dayNumber + 1}`);
  };

  const personalise = async () => {
    setPersonal({ loading: true });
    try {
      setPersonal({ loading: false, data: await callFunction('faithly-ai', { mode: 'journey_reflection', dayId: day.id }) });
    } catch (e) {
      setPersonal({ loading: false, error: e });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={day.theme} subtitle={`${journey.title} · Day ${dayNumber} of ${journey.day_count}`} back={`/journeys/${journey.slug}`} />

      {passage && <PassageCard passage={passage} />}

      <section className="card p-5">
        <h2 className="eyebrow mb-2">Understanding the passage</h2>
        <p className="leading-relaxed">{day.explanation}</p>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="eyebrow">A personal reflection</h2>
          {!isPremium && <span className="inline-flex items-center gap-1 text-xs text-subtle"><Lock className="h-3 w-3" />Premium</span>}
        </div>
        {!personal && (
          isPremium
            ? <button onClick={personalise} className="btn-secondary mt-3"><Sparkles className="h-4 w-4" />Personalise today's reflection</button>
            : <p className="mt-2 text-sm text-subtle">Premium members can generate a reflection on today's passage shaped around their chosen focus areas. <Link to="/premium" className="underline">Learn more</Link></p>
        )}
        {personal?.loading && <Spinner label="Writing a reflection for you" />}
        {personal?.error != null && <div className="mt-3"><AiError error={personal.error} onRetry={personalise} /></div>}
        {personal?.data && (
          <div className="mt-3 space-y-3">
            <AiLabel>AI-personalised reflection</AiLabel>
            <Paragraphs text={personal.data.reflection} className="leading-relaxed" />
            {personal.data.question && <p className="font-medium">{personal.data.question}</p>}
          </div>
        )}
      </section>

      <section className="card space-y-4 p-5">
        <div>
          <h2 className="eyebrow mb-1">Reflect</h2>
          <p className="font-serif text-lg">{day.reflection_question}</p>
        </div>
        <div>
          <h2 className="eyebrow mb-1">Today's activity</h2>
          <p>{day.activity}</p>
        </div>
        <div className="rounded-xl bg-muted/70 p-4">
          <h2 className="eyebrow mb-1">Suggested prayer</h2>
          <p className="font-scripture italic">{day.prayer}</p>
        </div>
      </section>

      <section className="card p-5">
        <label htmlFor="jprompt" className="eyebrow mb-1 block">Journal</label>
        <p className="mb-3 font-medium">{day.journal_prompt}</p>
        <textarea id="jprompt" className="input min-h-[140px]" value={journal} onChange={(e) => { setJournal(e.target.value); setSavedJournal(false); }} maxLength={20000} placeholder="Write freely — this is private to you." />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={saveJournal} className="btn-secondary" disabled={busy || !journal.trim()}>Save to journal</button>
          {savedJournal && <span className="text-sm text-accent">Saved</span>}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        {dayNumber > 1 ? <Link className="btn-ghost" to={`/journeys/${journey.slug}/day/${dayNumber - 1}`}><ChevronLeft className="h-4 w-4" />Day {dayNumber - 1}</Link> : <span />}
        {complete ? (
          <span className="inline-flex items-center gap-2 font-semibold text-accent"><CheckCircle2 className="h-5 w-5" />Day complete</span>
        ) : (
          <button onClick={markComplete} disabled={busy} className="btn-primary">Mark day {dayNumber} complete</button>
        )}
        {dayNumber < journey.day_count ? <Link className="btn-ghost" to={`/journeys/${journey.slug}/day/${dayNumber + 1}`}>Day {dayNumber + 1}<ChevronRight className="h-4 w-4" /></Link> : <span />}
      </div>
    </div>
  );
}
