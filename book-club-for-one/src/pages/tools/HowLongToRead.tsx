import { useState, useMemo } from 'react';
import { Hourglass, Clock } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

export function HowLongToRead() {
  const tool = getToolBySlug('how-long-to-read')!;
  const [pages, setPages] = useState(350);
  const [mode, setMode] = useState<'speed' | 'test'>('speed');
  const [pagesPerHour, setPagesPerHour] = useState(25);
  const [minutesFor10, setMinutesFor10] = useState(20);
  const [sessionLength, setSessionLength] = useState(45);

  const calc = useMemo(() => {
    const effectiveSpeed = mode === 'speed' ? pagesPerHour : (10 / minutesFor10) * 60;
    const totalHours = effectiveSpeed > 0 ? pages / effectiveSpeed : 0;
    const totalMinutes = totalHours * 60;
    const sessions = sessionLength > 0 ? Math.ceil(totalMinutes / sessionLength) : 0;
    const days = sessions;
    return { totalHours, totalMinutes, sessions, days, effectiveSpeed };
  }, [pages, mode, pagesPerHour, minutesFor10, sessionLength]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <ToolLayout tool={tool} results={
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Reading Time Estimate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center"><Hourglass className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{formatTime(calc.totalMinutes)}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Total Reading Time</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.totalHours.toFixed(1)}h</p><p className="text-xs text-warmgrey dark:text-dark-sub">Total Hours</p></div>
          <div className="card text-center"><Clock className="w-6 h-6 text-sage-400 dark:text-dark-sage mx-auto mb-2" /><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.sessions}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Reading Sessions</p></div>
          <div className="card text-center"><p className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{calc.days}</p><p className="text-xs text-warmgrey dark:text-dark-sub">Days to Finish</p></div>
        </div>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-sm text-charcoal dark:text-dark-text">At {Math.round(calc.effectiveSpeed)} pages per hour, a {pages}-page book will take about <strong className="text-forest-500 dark:text-dark-sage">{formatTime(calc.totalMinutes)}</strong> of total reading time, spread across approximately <strong className="text-forest-500 dark:text-dark-sage">{calc.sessions} sessions</strong> of {sessionLength} minutes each.</p>
        </div>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Number of Pages</label>
          <input type="number" value={pages} onChange={(e) => setPages(Number(e.target.value))} className="input-field" min="1" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">How do you want to estimate your speed?</label>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setMode('speed')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'speed' ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>Average reading speed</button>
            <button onClick={() => setMode('test')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'test' ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>Time for 10 pages</button>
          </div>
        </div>
        {mode === 'speed' ? (
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Average Reading Speed (pages per hour)</label>
            <input type="number" value={pagesPerHour} onChange={(e) => setPagesPerHour(Number(e.target.value))} className="input-field" min="1" />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Minutes to Read 10 Pages</label>
            <input type="number" value={minutesFor10} onChange={(e) => setMinutesFor10(Number(e.target.value))} className="input-field" min="1" />
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Typical Session Length (minutes)</label>
          <input type="number" value={sessionLength} onChange={(e) => setSessionLength(Number(e.target.value))} className="input-field" min="1" />
        </div>
      </div>
    </ToolLayout>
  );
}
