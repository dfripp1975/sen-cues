import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, FileText, Flame, Target, Clock, TrendingUp, Calendar, Star, ArrowRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuth } from '@/lib/auth';
import { ReadingStatsService, type DashboardStats } from '@/services/ReadingStatsService';
import { books } from '@/data/books';

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function DashboardPage() {
  useSEO({
    title: 'Reading Dashboard | The Book Club For One',
    description: 'Your personal reading dashboard — track your progress, goals, streaks, and reading activity.',
    canonical: `${window.location.origin}/dashboard`,
  });

  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    ReadingStatsService.getDashboardStats().then(s => {
      setStats(s);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />
        <div className="card text-center py-16">
          <TrendingUp className="w-12 h-12 text-sage-300 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">Reading Dashboard</h1>
          <p className="text-warmgrey dark:text-dark-sub mb-6">Sign in to view your reading statistics, goals, and progress.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/signin" className="btn-primary">Sign In</Link>
            <Link to="/signup" className="btn-outline">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />
        <div className="card text-center py-16">
          <p className="text-warmgrey dark:text-dark-sub">Loading your reading dashboard...</p>
        </div>
      </div>
    );
  }

  const goalPercentage = stats.goalProgress && stats.goalProgress.target > 0
    ? Math.min(100, Math.round((stats.goalProgress.completed / stats.goalProgress.target) * 100))
    : 0;

  const statCards = [
    { label: 'Currently Reading', value: String(stats.currentlyReading), icon: BookOpen, color: 'text-forest-500 dark:text-dark-sage' },
    { label: 'Books Finished This Year', value: String(stats.booksCompleted), icon: CheckCircle, color: 'text-sage-500 dark:text-dark-sage' },
    { label: 'Pages Read', value: stats.pagesRead.toLocaleString(), icon: FileText, color: 'text-terracotta-400 dark:text-dark-terra' },
    { label: 'Reading Time', value: formatMinutes(stats.totalReadingMinutes), icon: Clock, color: 'text-forest-500 dark:text-dark-sage' },
    { label: 'Current Streak', value: `${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`, icon: Flame, color: 'text-terracotta-400 dark:text-dark-terra' },
    { label: 'Longest Streak', value: `${stats.longestStreak} day${stats.longestStreak !== 1 ? 's' : ''}`, icon: TrendingUp, color: 'text-sage-500 dark:text-dark-sage' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-1">Reading Dashboard</h1>
          <p className="text-sm text-warmgrey dark:text-dark-sub">Your reading activity for {new Date().getFullYear()}</p>
        </div>
        <Link to="/reading-goals" className="btn-outline text-sm">
          <Target className="w-4 h-4" /> Set Reading Goals
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(stat => (
          <div key={stat.label} className="card text-center hover:shadow-card transition-shadow duration-200">
            <stat.icon className={`w-7 h-7 ${stat.color} mx-auto mb-2`} />
            <p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{stat.value}</p>
            <p className="text-xs text-warmgrey dark:text-dark-sub mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Goal progress */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
            <h2 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">Annual Reading Goal</h2>
          </div>
          {stats.goalProgress ? (
            <div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">
                  {stats.goalProgress.completed}
                  <span className="text-lg text-warmgrey dark:text-dark-sub"> / {stats.goalProgress.target}</span>
                </span>
                <span className="text-sm font-semibold text-terracotta-400 dark:text-dark-terra">{goalPercentage}%</span>
              </div>
              <div className="h-3 bg-stone-light dark:bg-forest-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-forest-400 to-sage-400 dark:from-dark-sage dark:to-forest-300 rounded-full transition-all duration-700"
                  style={{ width: `${goalPercentage}%` }}
                />
              </div>
              <p className="text-sm text-warmgrey dark:text-dark-sub mt-3">
                {stats.goalProgress.target - stats.goalProgress.completed > 0
                  ? `${stats.goalProgress.target - stats.goalProgress.completed} book${stats.goalProgress.target - stats.goalProgress.completed !== 1 ? 's' : ''} to go!`
                  : 'Goal achieved! Well done!'}
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">You haven't set a reading goal for this year yet.</p>
              <Link to="/reading-goals" className="btn-accent text-sm">Set a Goal</Link>
            </div>
          )}
        </div>

        {/* Favourite genres */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
            <h2 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">Favourite Genres</h2>
          </div>
          {stats.favouriteGenres.length > 0 ? (
            <div className="space-y-3">
              {stats.favouriteGenres.map(({ genre, count }) => {
                const maxCount = stats.favouriteGenres[0].count;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={genre}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-charcoal dark:text-dark-text font-medium">{genre}</span>
                      <span className="text-warmgrey dark:text-dark-sub">{count} book{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 bg-stone-light dark:bg-forest-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-terracotta-300 dark:bg-dark-terra rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-warmgrey dark:text-dark-sub text-center py-6">Add books to your library to see your favourite genres.</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
          <h2 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">Recent Reading Activity</h2>
        </div>
        {stats.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {stats.recentSessions.map(session => {
              const book = books.find(b => b.slug === session.book_slug);
              return (
                <div key={session.id} className="flex items-center gap-4 py-3 border-b border-stone dark:border-dark-border last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-sage-50 dark:bg-forest-700 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-sage-500 dark:text-dark-sage" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal dark:text-dark-text truncate">
                      {book?.title || session.book_slug}
                    </p>
                    <p className="text-xs text-warmgrey dark:text-dark-sub">
                      {new Date(session.session_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {session.pages_read > 0 && ` · ${session.pages_read} pages`}
                      {session.minutes_read > 0 && ` · ${formatMinutes(session.minutes_read)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">No reading sessions logged yet.</p>
            <Link to="/library" className="btn-ghost text-sm">
              Go to My Library <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
