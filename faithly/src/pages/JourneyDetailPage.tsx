import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Lock, Pause, Play, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { bookById } from '../lib/bible';
import type { Journey, JourneyDay, JourneyProgress } from '../lib/types';
import { ErrorNote, PageHeader, PremiumNotice, ProgressBar, Spinner } from '../components/ui';

export default function JourneyDetailPage() {
  const { slug } = useParams();
  const { user, isPremium } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [days, setDays] = useState<JourneyDay[]>([]);
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: j } = await supabase.from('faith_journeys').select('*').eq('slug', slug).maybeSingle();
    if (!j) return setLoading(false);
    setJourney(j as Journey);
    const [d, p] = await Promise.all([
      supabase.from('journey_days').select('*').eq('journey_id', j.id).order('day_number'),
      supabase.from('user_journey_progress').select('*').eq('journey_id', j.id).maybeSingle(),
    ]);
    setDays((d.data ?? []) as JourneyDay[]);
    setProgress(p.data as JourneyProgress | null);
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!journey) return <ErrorNote>Journey not found.</ErrorNote>;

  const locked = journey.is_premium && !isPremium;
  const nextDay = Array.from({ length: journey.day_count }, (_, i) => i + 1).find((n) => !progress?.completed_days.includes(n)) ?? 1;

  const setStatus = async (status: 'active' | 'paused') => {
    if (!progress) return;
    setBusy(true);
    const { data, error } = await supabase.from('user_journey_progress').update({ status, last_activity_at: new Date().toISOString() }).eq('id', progress.id).select('*').single();
    setBusy(false);
    if (error) return toast('Could not update journey.', 'error');
    setProgress(data as JourneyProgress);
    toast(status === 'paused' ? 'Journey paused — pick it up whenever you like.' : 'Welcome back.');
  };

  const start = async () => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase.from('user_journey_progress').insert({ user_id: user.id, journey_id: journey.id }).select('*').single();
    setBusy(false);
    if (error) return toast('Could not start this journey.', 'error');
    setProgress(data as JourneyProgress);
    nav(`/journeys/${journey.slug}/day/1`);
  };

  const restart = async () => {
    if (!progress || !confirm('Restart this journey? Your completed days will be cleared (journal entries are kept).')) return;
    const { data, error } = await supabase.from('user_journey_progress')
      .update({ status: 'active', completed_days: [], completed_at: null, started_at: new Date().toISOString() }).eq('id', progress.id).select('*').single();
    if (error) return toast('Could not restart.', 'error');
    setProgress(data as JourneyProgress);
  };

  return (
    <div>
      <PageHeader title={journey.title} subtitle={journey.subtitle} back="/journeys" />
      <p className="mb-6 leading-relaxed text-subtle">{journey.description}</p>

      {locked ? (
        <PremiumNotice>This journey is part of Faithly Premium. Its daily readings unlock as soon as you subscribe.</PremiumNotice>
      ) : (
        <div className="card mb-6 p-5">
          {progress ? (
            <>
              <ProgressBar value={progress.completed_days.length / journey.day_count} label="Journey progress" />
              <p className="mt-2 text-sm text-subtle">{progress.completed_days.length} of {journey.day_count} days complete{progress.status === 'paused' && ' · paused'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {progress.status === 'completed' ? (
                  <button className="btn-secondary" onClick={restart}><RotateCcw className="h-4 w-4" />Start again</button>
                ) : progress.status === 'paused' ? (
                  <button className="btn-primary" onClick={() => setStatus('active')} disabled={busy}><Play className="h-4 w-4" />Resume</button>
                ) : (
                  <>
                    <Link className="btn-primary" to={`/journeys/${journey.slug}/day/${nextDay}`}>Continue with day {nextDay}</Link>
                    <button className="btn-ghost" onClick={() => setStatus('paused')} disabled={busy}><Pause className="h-4 w-4" />Pause</button>
                  </>
                )}
              </div>
            </>
          ) : (
            <button className="btn-primary w-full py-3" onClick={start} disabled={busy}>Begin this journey</button>
          )}
        </div>
      )}

      <ol className="card divide-y divide-line">
        {(days.length ? days : Array.from({ length: journey.day_count }, (_, i) => ({ day_number: i + 1 }) as JourneyDay)).map((d) => {
          const complete = progress?.completed_days.includes(d.day_number);
          const content = (
            <>
              {locked ? <Lock className="h-5 w-5 text-subtle" aria-hidden /> : complete ? <CheckCircle2 className="h-5 w-5 text-accent" aria-label="Completed" /> : <Circle className="h-5 w-5 text-line" aria-hidden />}
              <div className="flex-1">
                <p className="text-xs text-subtle">Day {d.day_number}</p>
                {d.theme && <p className="font-medium">{d.theme}</p>}
              </div>
              {d.book_id && <span className="text-xs text-subtle">{bookById(d.book_id)?.name} {d.chapter}</span>}
            </>
          );
          return (
            <li key={d.day_number}>
              {locked || !progress
                ? <div className="flex items-center gap-3 px-5 py-3.5 opacity-80">{content}</div>
                : <Link to={`/journeys/${journey.slug}/day/${d.day_number}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50">{content}</Link>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
