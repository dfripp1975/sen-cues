import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Journey, JourneyProgress } from '../lib/types';
import { ErrorNote, PageHeader, ProgressBar, Spinner } from '../components/ui';
import { Landscape } from '../components/Landscape';

export default function JourneysPage() {
  const { prefs, isPremium } = useAuth();
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [progress, setProgress] = useState<Record<string, JourneyProgress>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('faith_journeys').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('user_journey_progress').select('*'),
    ]).then(([j, p]) => {
      if (j.error) return setError(true);
      setJourneys(j.data as Journey[]);
      setProgress(Object.fromEntries((p.data ?? []).map((r) => [r.journey_id, r as JourneyProgress])));
    });
  }, []);

  const focus = prefs?.focus_areas ?? [];
  const sorted = journeys ? [...journeys].sort((a, b) => score(b) - score(a)) : null;
  function score(j: Journey) {
    const p = progress[j.id];
    return (p?.status === 'active' ? 100 : 0) + j.focus_tags.filter((t) => focus.includes(t)).length;
  }

  return (
    <div>
      <PageHeader title="Faith journeys" subtitle="Guided, day-by-day Scripture programmes. Go at your own pace — pause any time." />
      {error && <ErrorNote>Could not load journeys.</ErrorNote>}
      {!sorted && !error && <Spinner />}
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted?.map((j, i) => {
          const p = progress[j.id];
          const done = p?.completed_days.length ?? 0;
          const recommended = !p && j.focus_tags.some((t) => focus.includes(t));
          return (
            <Link key={j.id} to={`/journeys/${j.slug}`} className="card overflow-hidden transition hover:shadow-lift">
              <Landscape className="h-24 w-full" variant={i % 2 ? 'dusk' : 'dawn'} />
              <div className="p-5">
                <div className="mb-1 flex flex-wrap gap-2">
                  {p?.status === 'active' && <span className="scripture-label">In progress</span>}
                  {p?.status === 'paused' && <span className="chip py-0.5 text-[11px]">Paused</span>}
                  {p?.status === 'completed' && <span className="scripture-label">Completed</span>}
                  {recommended && <span className="ai-label !normal-case !tracking-normal">Suggested for you</span>}
                  {j.is_premium && !isPremium && <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8a6d33] dark:text-gold"><Lock className="h-3 w-3" />Premium</span>}
                </div>
                <h2 className="text-lg font-semibold leading-snug">{j.title}</h2>
                <p className="mt-1 text-sm text-subtle">{j.subtitle}</p>
                {p && <div className="mt-4"><ProgressBar value={done / j.day_count} label={`${j.title} progress`} /><p className="mt-1 text-xs text-subtle">{done} of {j.day_count} days</p></div>}
              </div>
            </Link>
          );
        })}
      </div>
      {sorted && (
        <p className="mt-8 text-center text-sm text-subtle">More journeys — including Forgiveness, Grief and Purpose — are being written and reviewed, and will appear here when ready.</p>
      )}
    </div>
  );
}
