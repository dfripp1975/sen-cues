import { useState, useMemo } from 'react';
import { Star, Copy } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import type { BookRating } from '@/types';

const dimensions = [
  { key: 'plot', label: 'Plot' },
  { key: 'characters', label: 'Characters' },
  { key: 'writing', label: 'Writing' },
  { key: 'pacing', label: 'Pacing' },
  { key: 'originality', label: 'Originality' },
  { key: 'enjoyment', label: 'Enjoyment' },
] as const;

export function BookRatingCalculator() {
  const tool = getToolBySlug('book-rating-calculator')!;
  const [bookTitle, setBookTitle] = useState('');
  const [ratings, setRatings] = useState<BookRating>({
    plot: 7, characters: 8, writing: 7, pacing: 6, originality: 8, enjoyment: 9,
  });
  const [copied, setCopied] = useState(false);

  const overall = useMemo(() => {
    const values = Object.values(ratings);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      outOf10: Math.round(avg * 10) / 10,
      outOf5: Math.round((avg / 2) * 10) / 10,
    };
  }, [ratings]);

  const handleCopy = () => {
    const text = `${bookTitle || 'This book'}, Overall Rating: ${overall.outOf10}/10 (${overall.outOf5}/5)\nPlot: ${ratings.plot}/10\nCharacters: ${ratings.characters}/10\nWriting: ${ratings.writing}/10\nPacing: ${ratings.pacing}/10\nOriginality: ${ratings.originality}/10\nEnjoyment: ${ratings.enjoyment}/10`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout tool={tool} results={
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your Rating{bookTitle ? `: ${bookTitle}` : ''}</h2>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-8 h-8 ${n <= Math.round(overall.outOf5) ? 'text-terracotta-400 dark:text-dark-terra fill-current' : 'text-stone dark:text-dark-border'}`} />
            ))}
          </div>
          <p className="text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage">{overall.outOf10}/10</p>
          <p className="text-lg text-warmgrey dark:text-dark-sub">{overall.outOf5}/5 stars</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map(d => (
            <div key={d.key} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-charcoal dark:text-dark-text">{d.label}</span>
                <span className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">{ratings[d.key]}/10</span>
              </div>
              <div className="h-3 bg-stone-light dark:bg-forest-700 rounded-full overflow-hidden">
                <div className="h-full bg-terracotta-400 dark:bg-dark-terra rounded-full transition-all" style={{ width: `${ratings[d.key] * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleCopy} className="btn-accent">
          <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy Rating'}
        </button>
      </div>
    }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Title (optional)</label>
          <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="input-field" placeholder="e.g. Pride and Prejudice" />
        </div>
        <div className="space-y-4">
          {dimensions.map(d => (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-forest-500 dark:text-dark-sage">{d.label}</label>
                <span className="text-sm font-bold text-terracotta-400 dark:text-dark-terra">{ratings[d.key]}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={ratings[d.key]}
                onChange={(e) => setRatings({ ...ratings, [d.key]: Number(e.target.value) })}
                className="w-full accent-terracotta-400 dark:accent-dark-terra"
              />
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
