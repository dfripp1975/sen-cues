import { useState } from 'react';
import { HelpCircle, RefreshCw } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { getRandomQuestion } from '@/data/generators';

export function RandomBookClubQuestion() {
  const tool = getToolBySlug('random-book-club-question')!;
  const [category, setCategory] = useState('any');
  const [question, setQuestion] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const categories = [
    { val: 'any', label: 'Any Category' },
    { val: 'characters', label: 'Characters' },
    { val: 'plot', label: 'Plot' },
    { val: 'themes', label: 'Themes' },
    { val: 'writing', label: 'Writing' },
    { val: 'emotional', label: 'Emotional Reaction' },
    { val: 'fun', label: 'Fun' },
    { val: 'deep', label: 'Deep Discussion' },
  ];

  const handleGenerate = () => {
    setIsAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setQuestion(getRandomQuestion(category));
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsAnimating(false);
        setQuestion(getRandomQuestion(category));
      }
    }, 80);
  };

  return (
    <ToolLayout tool={tool} results={question ? (
      <div className="text-center py-8">
        <div className={`card max-w-2xl mx-auto bg-sage-50 dark:bg-forest-800 ${isAnimating ? 'animate-reveal' : ''}`}>
          <HelpCircle className="w-10 h-10 text-sage-400 dark:text-dark-sage mx-auto mb-4" />
          <p className="text-xl md:text-2xl font-serif text-forest-500 dark:text-dark-sage leading-relaxed">{question}</p>
        </div>
        <button onClick={handleGenerate} className="btn-accent mt-6">
          <RefreshCw className="w-5 h-5" /> Another Question
        </button>
      </div>
    ) : undefined}>
      <div className="space-y-4 text-center">
        <p className="text-warmgrey dark:text-dark-sub">Click the button for a random book club discussion question. Perfect for sparking conversation or journaling.</p>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">Category (optional)</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(c => (
              <button key={c.val} onClick={() => setCategory(c.val)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c.val ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text'}`}>{c.label}</button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} className="btn-accent text-lg py-4 px-12">
          <HelpCircle className="w-6 h-6" /> Give Me a Question
        </button>
      </div>
    </ToolLayout>
  );
}
