import { useState, useEffect } from 'react';
import { Flame, CheckCircle, Calendar } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import type { StreakData } from '@/types';

const STORAGE_KEY = 'reading-streak-data';

export function ReadingStreakTracker() {
  const tool = getToolBySlug('reading-streak-tracker')!;
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    daysReadThisMonth: 0,
    totalReadingDays: 0,
    lastReadDate: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StreakData;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (parsed.lastReadDate !== today && parsed.lastReadDate !== yesterday) {
        parsed.currentStreak = 0;
      }
      const currentMonth = new Date().getMonth();
      const lastReadMonth = parsed.lastReadDate ? new Date(parsed.lastReadDate).getMonth() : -1;
      if (currentMonth !== lastReadMonth) {
        parsed.daysReadThisMonth = 0;
      }
      setData(parsed);
    }
  }, []);

  const save = (newData: StreakData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const markToday = () => {
    const today = new Date().toISOString().split('T')[0];
    if (data.lastReadDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = data.lastReadDate === yesterday ? data.currentStreak + 1 : 1;
    const newData: StreakData = {
      currentStreak: newStreak,
      longestStreak: Math.max(data.longestStreak, newStreak),
      daysReadThisMonth: data.daysReadThisMonth + 1,
      totalReadingDays: data.totalReadingDays + 1,
      lastReadDate: today,
    };
    save(newData);
  };

  const today = new Date().toISOString().split('T')[0];
  const hasReadToday = data.lastReadDate === today;

  return (
    <ToolLayout tool={tool} results={
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Reading Streak</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <Flame className={`w-8 h-8 mx-auto mb-2 ${data.currentStreak > 0 ? 'text-terracotta-400 dark:text-dark-terra' : 'text-stone dark:text-dark-border'}`} />
            <p className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">{data.currentStreak}</p>
            <p className="text-xs text-warmgrey dark:text-dark-sub">Current Streak (days)</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">{data.longestStreak}</p>
            <p className="text-xs text-warmgrey dark:text-dark-sub">Longest Streak</p>
          </div>
          <div className="card text-center">
            <Calendar className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" />
            <p className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">{data.daysReadThisMonth}</p>
            <p className="text-xs text-warmgrey dark:text-dark-sub">Days This Month</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage">{data.totalReadingDays}</p>
            <p className="text-xs text-warmgrey dark:text-dark-sub">Total Reading Days</p>
          </div>
        </div>
        <div className="card text-center bg-sage-50 dark:bg-forest-800">
          {hasReadToday ? (
            <div className="flex items-center justify-center gap-2 text-sage-500 dark:text-dark-sage">
              <CheckCircle className="w-6 h-6" />
              <p className="font-medium">Great job! You've read today.</p>
            </div>
          ) : (
            <button onClick={markToday} className="btn-accent">
              <Flame className="w-5 h-5" /> Read Today
            </button>
          )}
        </div>
      </div>
    }>
      <div className="space-y-4">
        <p className="text-warmgrey dark:text-dark-sub">Click "Read Today" each day you read, even for a few minutes. Build a daily reading habit and watch your streak grow!</p>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-sm text-charcoal dark:text-dark-text">Your streak data is saved in your browser. <a href="/signup" className="link-internal">Create a free account</a> to save it permanently across devices.</p>
        </div>
      </div>
    </ToolLayout>
  );
}
