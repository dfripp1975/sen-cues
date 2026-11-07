import { useState } from 'react';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { generateNames } from '@/data/generators';
import type { GeneratedName } from '@/types';

export function BookClubNameGenerator() {
  const tool = getToolBySlug('book-club-name-generator')!;
  const [style, setStyle] = useState('clever');
  const [keywords, setKeywords] = useState('');
  const [names, setNames] = useState<GeneratedName[]>([]);

  const handleGenerate = () => {
    setNames(generateNames(style, keywords));
  };

  const styles = ['funny', 'clever', 'cosy', 'literary', 'modern', 'friends', 'workplace', 'fantasy', 'romance', 'mystery', 'horror'];

  return (
    <ToolLayout tool={tool} results={names.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{names.length} Book Club Names</h2>
          <button onClick={handleGenerate} className="btn-ghost text-sm"><RefreshCw className="w-4 h-4" /> Generate More</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {names.map((n, i) => (
            <div key={i} className="card flex items-center justify-between group animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <div>
                <p className="font-serif font-bold text-forest-500 dark:text-dark-sage">{n.name}</p>
                <p className="text-xs text-warmgrey dark:text-dark-sub capitalize">{n.style}</p>
              </div>
              <button onClick={() => navigator.clipboard.writeText(n.name)} className="btn-ghost text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Choose a Style</label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {styles.map(s => (
              <button key={s} onClick={() => setStyle(s)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${style === s ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text hover:bg-sage-100 dark:hover:bg-forest-700'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Keywords (optional)</label>
          <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="input-field" placeholder="e.g. wine, London, Tuesday" />
        </div>
        <button onClick={handleGenerate} className="btn-accent w-full">
          <Sparkles className="w-5 h-5" /> Generate Names
        </button>
      </div>
    </ToolLayout>
  );
}
