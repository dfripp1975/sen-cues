import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, BookOpen, FileText, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useAuth } from '@/lib/auth';
import { ReadingStatsService } from '@/services/ReadingStatsService';
import { UserLibraryService } from '@/services/UserLibraryService';

export function ReadingGoalsPage() {
  useSEO({
    title: 'Reading Goals | The Book Club For One',
    description: 'Set and track your annual reading goals — choose a book count or page count target.',
    canonical: `${window.location.origin}/reading-goals`,
  });

  const { user } = useAuth();
  const [goalType, setGoalType] = useState<'books' | 'pages'>('books');
  const [goalBooks, setGoalBooks] = useState(24);
  const [targetPages, setTargetPages] = useState(10000);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completedBooks, setCompletedBooks] = useState(0);
  const [totalPagesRead, setTotalPagesRead] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      ReadingStatsService.getReadingGoal(),
      ReadingStatsService.getDashboardStats(),
      UserLibraryService.getBooks(),
    ]).then(([goal, dashStats, ub]) => {
      if (goal) {
        setGoalType(goal.goal_type === 'pages' ? 'pages' : 'books');
        setGoalBooks(goal.goal_books || 24);
        setTargetPages(goal.target_pages || 10000);
      }
      setCompletedBooks(dashStats.booksCompleted);
      setTotalPagesRead(dashStats.pagesRead);
      const ubTyped = ub as unknown as { status: string; finish_date: string | null }[];
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const completedThisYear = ubTyped.filter(b =>
        b.status === 'completed' && b.finish_date && b.finish_date >= yearStart
      ).length;
      setCompletedBooks(completedThisYear);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage(false);
    try {
      await ReadingStatsService.setReadingGoal(goalBooks, goalType, targetPages);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      // handled silently
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Reading Goals' }]} />
        <div className="card text-center py-16">
          <Target className="w-12 h-12 text-sage-300 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">Reading Goals</h1>
          <p className="text-warmgrey dark:text-dark-sub mb-6">Sign in to set reading goals and track your progress.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/signin" className="btn-primary">Sign In</Link>
            <Link to="/signup" className="btn-outline">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Reading Goals' }]} />
        <div className="card text-center py-16">
          <p className="text-warmgrey dark:text-dark-sub">Loading your reading goals...</p>
        </div>
      </div>
    );
  }

  const progressValue = goalType === 'books' ? completedBooks : totalPagesRead;
  const targetValue = goalType === 'books' ? goalBooks : targetPages;
  const pct = targetValue > 0 ? Math.min(100, Math.round((progressValue / targetValue) * 100)) : 0;
  const remaining = Math.max(0, targetValue - progressValue);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Reading Goals' }]} />

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">Reading Goals</h1>
        <p className="text-warmgrey dark:text-dark-sub">Set your annual reading target and track your progress throughout the year.</p>
      </div>

      {/* Current progress */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
          <h2 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">{new Date().getFullYear()} Progress</h2>
        </div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">
            {progressValue.toLocaleString()}
            <span className="text-lg text-warmgrey dark:text-dark-sub"> / {targetValue.toLocaleString()}</span>
          </span>
          <span className="text-sm font-semibold text-terracotta-400 dark:text-dark-terra">{pct}%</span>
        </div>
        <div className="h-3 bg-stone-light dark:bg-forest-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-forest-400 to-sage-400 dark:from-dark-sage dark:to-forest-300 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-warmgrey dark:text-dark-sub mt-3">
          {remaining > 0
            ? `${remaining.toLocaleString()} ${goalType === 'books' ? 'books' : 'pages'} to go — keep reading!`
            : 'Goal achieved! Fantastic work!'}
        </p>
      </div>

      {/* Set goal */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
          <h2 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">Set Your Goal</h2>
        </div>

        {/* Goal type toggle */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">Goal Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGoalType('books')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                goalType === 'books'
                  ? 'border-forest-500 dark:border-dark-sage bg-forest-50 dark:bg-forest-700'
                  : 'border-stone dark:border-dark-border hover:border-sage-300'
              }`}
            >
              <BookOpen className={`w-6 h-6 ${goalType === 'books' ? 'text-forest-500 dark:text-dark-sage' : 'text-warmgrey'}`} />
              <div className="text-left">
                <p className="font-semibold text-sm text-charcoal dark:text-dark-text">Books</p>
                <p className="text-xs text-warmgrey dark:text-dark-sub">Read a number of books</p>
              </div>
            </button>
            <button
              onClick={() => setGoalType('pages')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                goalType === 'pages'
                  ? 'border-forest-500 dark:border-dark-sage bg-forest-50 dark:bg-forest-700'
                  : 'border-stone dark:border-dark-border hover:border-sage-300'
              }`}
            >
              <FileText className={`w-6 h-6 ${goalType === 'pages' ? 'text-forest-500 dark:text-dark-sage' : 'text-warmgrey'}`} />
              <div className="text-left">
                <p className="font-semibold text-sm text-charcoal dark:text-dark-text">Pages</p>
                <p className="text-xs text-warmgrey dark:text-dark-sub">Read a number of pages</p>
              </div>
            </button>
          </div>
        </div>

        {/* Goal value */}
        {goalType === 'books' ? (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">How many books?</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[12, 24, 36, 50, 75, 100].map(n => (
                <button
                  key={n}
                  onClick={() => setGoalBooks(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    goalBooks === n
                      ? 'bg-forest-500 text-ivory dark:bg-forest-400 dark:text-dark-bg'
                      : 'bg-stone-light text-charcoal hover:bg-sage-100 dark:bg-forest-700 dark:text-dark-text'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={goalBooks}
              onChange={e => setGoalBooks(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              min="1"
              max="999"
            />
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">How many pages?</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[5000, 10000, 20000, 30000, 50000].map(n => (
                <button
                  key={n}
                  onClick={() => setTargetPages(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    targetPages === n
                      ? 'bg-forest-500 text-ivory dark:bg-forest-400 dark:text-dark-bg'
                      : 'bg-stone-light text-charcoal hover:bg-sage-100 dark:bg-forest-700 dark:text-dark-text'
                  }`}
                >
                  {n.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={targetPages}
              onChange={e => setTargetPages(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              min="1"
            />
          </div>
        )}

        {savedMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-sage-50 dark:bg-forest-700 text-sage-600 dark:text-dark-sage text-sm mb-4 animate-fade-in">
            <CheckCircle className="w-4 h-4" />
            Goal saved successfully!
          </div>
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Target className="w-4 h-4" /> Save Reading Goal</>
          )}
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link to="/dashboard" className="link-internal text-sm">Back to Dashboard</Link>
      </div>
    </div>
  );
}
