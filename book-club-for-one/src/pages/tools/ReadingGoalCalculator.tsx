import { useState, useMemo } from 'react';
import { Target } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

export function ReadingGoalCalculator() {
  const tool = getToolBySlug('reading-goal-calculator')!;
  const [numBooks, setNumBooks] = useState(24);
  const [targetDate, setTargetDate] = useState('');
  const [avgPages, setAvgPages] = useState(300);

  const calc = useMemo(() => {
    let days = 365;
    if (targetDate) {
      const target = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      days = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const booksPerMonth = (numBooks / (days / 30.44));
    const booksPerWeek = (numBooks / (days / 7));
    const totalPages = numBooks * avgPages;
    const pagesPerMonth = totalPages / (days / 30.44);
    const pagesPerWeek = totalPages / (days / 7);
    const pagesPerDay = totalPages / days;
    return { booksPerMonth, booksPerWeek, pagesPerMonth, pagesPerWeek, pagesPerDay, totalPages, days };
  }, [numBooks, targetDate, avgPages]);

  return (
    <ToolLayout tool={tool} results={
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Reading Plan</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center"><Target className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.booksPerMonth.toFixed(1)}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Books/Month</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.booksPerWeek.toFixed(1)}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Books/Week</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{Math.round(calc.pagesPerMonth).toLocaleString()}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages/Month</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{Math.round(calc.pagesPerWeek).toLocaleString()}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages/Week</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{Math.round(calc.pagesPerDay)}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages/Day</p></div>
        </div>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-charcoal dark:text-dark-text leading-relaxed">
            To read <strong className="text-forest-500 dark:text-dark-sage">{numBooks} books</strong> ({calc.totalPages.toLocaleString()} total pages) in <strong className="text-forest-500 dark:text-dark-sage">{calc.days} days</strong>, you need to read about <strong className="text-terracotta-400 dark:text-dark-terra">{Math.round(calc.pagesPerDay)} pages per day</strong>. That is roughly {calc.booksPerMonth.toFixed(1)} books per month.
          </p>
        </div>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">How many books do you want to read?</label>
          <input type="number" value={numBooks} onChange={(e) => setNumBooks(Number(e.target.value))} className="input-field" min="1" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">By what date?</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input-field" />
          {!targetDate && <p className="text-xs text-warmgrey dark:text-dark-sub mt-1">Leave blank for a 1-year goal</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Average book length (pages)</label>
          <input type="number" value={avgPages} onChange={(e) => setAvgPages(Number(e.target.value))} className="input-field" min="1" />
        </div>
      </div>
    </ToolLayout>
  );
}
