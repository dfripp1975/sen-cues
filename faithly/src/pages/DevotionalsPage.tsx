import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { bookById } from '../lib/bible';
import { pickTodaysDevotional } from '../lib/devotionals';
import { useAuth } from '../context/AuthContext';
import type { Devotional } from '../lib/types';
import { PageHeader, Spinner } from '../components/ui';

export default function DevotionalsPage() {
  const { prefs } = useAuth();
  const [items, setItems] = useState<Devotional[] | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.from('devotional_content').select('*').eq('is_published', true).order('sort_order').then(({ data }) => setItems((data ?? []) as Devotional[]));
    supabase.from('devotional_completions').select('devotional_id').not('completed_at', 'is', null)
      .then(({ data }) => setCompleted(new Set((data ?? []).map((r) => r.devotional_id))));
  }, []);

  const focus = prefs?.focus_areas ?? [];
  const today = items ? pickTodaysDevotional(items, focus) : null;

  return (
    <div>
      <PageHeader title="Devotionals" subtitle="Short reflections on Scripture for each day." />
      {!items && <Spinner />}
      {today && (
        <Link to={`/devotionals/${today.slug}`} className="card mb-6 block bg-gradient-to-br from-sage/25 to-transparent p-6">
          <p className="eyebrow">Today</p>
          <h2 className="mt-1 text-2xl font-semibold">{today.title}</h2>
          <p className="mt-1 text-sm text-subtle">{bookById(today.book_id)?.name} {today.chapter}:{today.verse_start}-{today.verse_end}</p>
        </Link>
      )}
      <ul className="space-y-3">
        {items?.map((d) => (
          <li key={d.id}>
            <Link to={`/devotionals/${d.slug}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
              <div className="flex-1">
                <p className="font-serif text-lg font-semibold">{d.title}</p>
                <p className="text-sm text-subtle">{bookById(d.book_id)?.name} {d.chapter}:{d.verse_start}-{d.verse_end}
                  {d.focus_tags.some((t) => focus.includes(t)) && <span className="ml-2 text-accent">· matches your focus</span>}</p>
              </div>
              {completed.has(d.id) && <CheckCircle2 className="h-5 w-5 text-accent" aria-label="Completed" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
