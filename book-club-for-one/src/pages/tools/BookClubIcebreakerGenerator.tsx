import { useState } from 'react';
import { Coffee, RefreshCw, Copy } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { generateIcebreakers } from '@/data/generators';
import type { IcebreakerQuestion } from '@/types';

export function BookClubIcebreakerGenerator() {
  const tool = getToolBySlug('book-club-icebreaker-generator')!;
  const [style, setStyle] = useState('funny');
  const [questions, setQuestions] = useState<IcebreakerQuestion[]>([]);

  const styles = ['funny', 'thought-provoking', 'quick', 'getting-to-know', 'book-related', 'new-book-club'];

  const handleGenerate = () => {
    setQuestions(generateIcebreakers(style));
  };

  return (
    <ToolLayout tool={tool} results={questions.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Icebreaker Questions</h2>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(questions.map(q => q.text).join('\n'))} className="btn-ghost text-sm"><Copy className="w-4 h-4" /> Copy All</button>
            <button onClick={handleGenerate} className="btn-ghost text-sm"><RefreshCw className="w-4 h-4" /> Generate More</button>
          </div>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="card animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <p className="text-charcoal dark:text-dark-text">{q.text}</p>
            </div>
          ))}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">Choose a Style</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {styles.map(s => (
              <button key={s} onClick={() => setStyle(s)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${style === s ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text hover:bg-sage-100 dark:hover:bg-forest-700'}`}>
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} className="btn-accent w-full">
          <Coffee className="w-5 h-5" /> Generate Icebreakers
        </button>
      </div>
    </ToolLayout>
  );
}
