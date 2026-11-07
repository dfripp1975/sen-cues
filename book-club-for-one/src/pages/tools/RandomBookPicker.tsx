import { useState } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

export function RandomBookPicker() {
  const tool = getToolBySlug('random-book-picker')!;
  const [input, setInput] = useState('Pride and Prejudice\n1984\nDracula\nThe Great Gatsby\nFrankenstein');
  const [picked, setPicked] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePick = () => {
    const books = input.split(/[\n,]/).map(b => b.trim()).filter(Boolean);
    if (books.length < 2) return;
    setIsAnimating(true);
    let count = 0;
    const interval = setInterval(() => {
      setPicked(books[Math.floor(Math.random() * books.length)]);
      count++;
      if (count >= 15) {
        clearInterval(interval);
        setIsAnimating(false);
        setPicked(books[Math.floor(Math.random() * books.length)]);
      }
    }, 80);
  };

  return (
    <ToolLayout tool={tool} results={picked ? (
      <div className="text-center py-8">
        <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">Your next book is...</p>
        <div className={`inline-block ${isAnimating ? 'animate-reveal' : ''}`}>
          <div className="card bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg py-12 px-16 rounded-2xl shadow-lift">
            <p className="text-3xl font-serif font-bold">{picked}</p>
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-center">
          <button onClick={handlePick} className="btn-accent"><Shuffle className="w-5 h-5" /> Pick Again</button>
          <button onClick={() => { setPicked(null); }} className="btn-ghost"><RotateCcw className="w-4 h-4" /> Start Over</button>
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Enter your book options (one per line or separated by commas)</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="input-field min-h-[150px]" placeholder="Enter books..." />
        </div>
        <button onClick={handlePick} disabled={input.split(/[\n,]/).filter(b => b.trim()).length < 2} className="btn-accent w-full">
          <Shuffle className="w-5 h-5" /> Pick My Next Book
        </button>
      </div>
    </ToolLayout>
  );
}
