import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, CalendarCheck, Layers, ListOrdered, UserSearch, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PageHeader } from '../../components/ui';

const GAMES = [
  { to: '/games/daily', title: 'Daily Bible challenge', sub: 'Five questions, new each day', icon: CalendarCheck },
  { to: '/games/trivia', title: 'Bible trivia', sub: 'Multiple-choice questions at three levels', icon: HelpCircle },
  { to: '/games/character', title: 'Guess the character', sub: 'Who am I?', icon: UserSearch },
  { to: '/games/complete', title: 'Complete the Scripture', sub: 'Fill in the missing word', icon: BookOpenCheck },
  { to: '/games/books', title: 'Order the books', sub: 'Put Bible books in order', icon: ListOrdered },
  { to: '/games/flashcards', title: 'Memory verses', sub: 'Flashcards with spaced repetition', icon: Layers },
];

export default function GamesPage() {
  const [stats, setStats] = useState<{ sessions: number; answered: number; due: number } | null>(null);
  useEffect(() => {
    Promise.all([
      supabase.from('quiz_results').select('score, total'),
      supabase.from('memory_cards').select('id', { count: 'exact', head: true }).lte('due_on', new Date().toISOString().slice(0, 10)),
    ]).then(([r, m]) => setStats({ sessions: r.data?.length ?? 0, answered: (r.data ?? []).reduce((a, x) => a + x.total, 0), due: m.count ?? 0 }));
  }, []);
  return (
    <div>
      <PageHeader title="Bible challenges" subtitle="Learn and remember Scripture through play. There are no leaderboards — this is just for you." back />
      {stats && stats.sessions > 0 && (
        <p className="mb-5 rounded-xl bg-sage/15 p-4 text-sm">You've completed {stats.sessions} sessions and explored {stats.answered} questions. Every bit of learning counts.</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {GAMES.map(({ to, title, sub, icon: Icon }) => (
          <Link key={to} to={to} className="card flex items-center gap-4 p-5 hover:shadow-lift">
            <span className="rounded-2xl bg-accent/10 p-3 text-accent"><Icon className="h-6 w-6" aria-hidden /></span>
            <span className="flex-1"><span className="block font-semibold">{title}</span><span className="text-sm text-subtle">{sub}{to.endsWith('flashcards') && stats?.due ? ` · ${stats.due} due` : ''}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
