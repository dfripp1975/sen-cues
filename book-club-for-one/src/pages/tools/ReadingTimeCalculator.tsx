import { useState, useMemo } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

export function ReadingTimeCalculator() {
  const tool = getToolBySlug('reading-time-calculator')!;
  const [totalPages, setTotalPages] = useState(400);
  const [currentPage, setCurrentPage] = useState(120);
  const [readingSpeed, setReadingSpeed] = useState(30);
  const [minutesPerDay, setMinutesPerDay] = useState(45);
  const [targetDate, setTargetDate] = useState('');

  const calc = useMemo(() => {
    const pagesRemaining = Math.max(0, totalPages - currentPage);
    const hoursRemaining = readingSpeed > 0 ? pagesRemaining / readingSpeed : 0;
    const pagesPerDay = minutesPerDay > 0 ? (readingSpeed * minutesPerDay) / 60 : 0;
    const daysToFinish = pagesPerDay > 0 ? Math.ceil(pagesRemaining / pagesPerDay) : 0;
    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + daysToFinish);

    let targetCalc = null;
    if (targetDate) {
      const target = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const daysRemaining = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const pagesPerDayRequired = Math.ceil(pagesRemaining / daysRemaining);
      const minutesPerDayRequired = Math.ceil((pagesPerDayRequired / readingSpeed) * 60);
      targetCalc = { daysRemaining, pagesPerDayRequired, minutesPerDayRequired };
    }

    return { pagesRemaining, hoursRemaining, daysToFinish, finishDate, pagesPerDay, targetCalc };
  }, [totalPages, currentPage, readingSpeed, minutesPerDay, targetDate]);

  return (
    <ToolLayout tool={tool} results={
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Reading Estimate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center"><Clock className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.pagesRemaining}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages Remaining</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.hoursRemaining.toFixed(1)}h</p><p className="text-xs text-warmgrey dark:text-dark-sub">Hours of Reading Left</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.daysToFinish}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Days to Finish</p></div>
          <div className="card text-center"><Calendar className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.finishDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Estimated Finish Date</p></div>
        </div>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-sm text-charcoal dark:text-dark-text">Recommended: <strong className="text-forest-500 dark:text-dark-sage">{Math.ceil(calc.pagesPerDay)} pages per day</strong> at your current pace.</p>
        </div>
        {calc.targetCalc && (
          <div className="card border-2 border-terracotta-200 dark:border-terracotta-700">
            <h3 className="font-serif font-bold text-lg text-terracotta-500 dark:text-dark-terra mb-3">Finish By {new Date(targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center"><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.targetCalc.daysRemaining}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Days Remaining</p></div>
              <div className="text-center"><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.targetCalc.pagesPerDayRequired}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Pages/Day Required</p></div>
              <div className="text-center"><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.targetCalc.minutesPerDayRequired}m</p><p className="text-xs text-warmgrey dark:text-dark-sub">Minutes/Day Required</p></div>
            </div>
          </div>
        )}
      </div>
    }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Total Pages</label>
            <input type="number" value={totalPages} onChange={(e) => setTotalPages(Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Current Page</label>
            <input type="number" value={currentPage} onChange={(e) => setCurrentPage(Number(e.target.value))} className="input-field" min="0" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Reading Speed (pages/hour)</label>
            <input type="number" value={readingSpeed} onChange={(e) => setReadingSpeed(Number(e.target.value))} className="input-field" min="1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Minutes Available Per Day</label>
            <input type="number" value={minutesPerDay} onChange={(e) => setMinutesPerDay(Number(e.target.value))} className="input-field" min="1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">I want to finish this book by... (optional)</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input-field" />
        </div>
      </div>
    </ToolLayout>
  );
}
