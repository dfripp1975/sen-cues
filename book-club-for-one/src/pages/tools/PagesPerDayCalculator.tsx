import { useState, useMemo } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

export function PagesPerDayCalculator() {
  const tool = getToolBySlug('pages-per-day-calculator')!;
  const [totalPages, setTotalPages] = useState(400);
  const [currentPage, setCurrentPage] = useState(100);
  const [targetDate, setTargetDate] = useState('');

  const calc = useMemo(() => {
    const pagesRemaining = Math.max(0, totalPages - currentPage);
    let daysRemaining = 0;
    if (targetDate) {
      const target = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      daysRemaining = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const pagesPerDay = daysRemaining > 0 ? Math.ceil(pagesRemaining / daysRemaining) : pagesRemaining;
    const dailyMinutes = Math.ceil((pagesPerDay / 30) * 60);
    return { pagesRemaining, daysRemaining, pagesPerDay, dailyMinutes };
  }, [totalPages, currentPage, targetDate]);

  return (
    <ToolLayout tool={tool} results={targetDate ? (
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Reading Plan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.pagesRemaining}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages Remaining</p></div>
          <div className="card text-center"><CalendarDays className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.daysRemaining}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Days Remaining</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.pagesPerDay}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages Per Day</p></div>
          <div className="card text-center"><Clock className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.dailyMinutes}m</p><p className="text-xs text-warmgrey dark:text-dark-sub">Daily Reading Time</p></div>
        </div>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-sm text-charcoal dark:text-dark-text">To finish by <strong className="text-forest-500 dark:text-dark-sage">{new Date(targetDate).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>, read <strong className="text-terracotta-400 dark:text-dark-terra">{calc.pagesPerDay} pages per day</strong> (about {calc.dailyMinutes} minutes of reading).</p>
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Total Book Pages</label>
            <input type="number" value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Current Page</label>
            <input type="number" value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} className="input-field" min="0" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Target Completion Date</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input-field" />
        </div>
      </div>
    </ToolLayout>
  );
}
