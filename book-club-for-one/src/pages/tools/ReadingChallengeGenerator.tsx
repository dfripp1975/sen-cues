import { useState } from 'react';
import { Trophy, RefreshCw, Copy } from 'lucide-react';
import { getIcon } from '@/lib/icons';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { generateChallenge } from '@/data/generators';
import type { ReadingChallengeTask } from '@/types';

export function ReadingChallengeGenerator() {
  const tool = getToolBySlug('reading-challenge-generator')!;
  const [duration, setDuration] = useState('30 days');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<ReadingChallengeTask[]>([]);

  const durations = ['7 days', '30 days', '3 months', '6 months', '12 months'];
  const allPrefs = ['Fiction', 'Non-Fiction', 'Classics', 'Mystery', 'Romance', 'Fantasy', 'Science Fiction', 'Short Stories', 'Poetry', 'Biography'];

  const handleGenerate = () => {
    setChallenge(generateChallenge(duration));
  };

  const togglePref = (p: string) => {
    setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <ToolLayout tool={tool} results={challenge.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Your {duration} Reading Challenge</h2>
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(challenge.map((t, i) => `${i + 1}. ${t.description}`).join('\n'))} className="btn-ghost text-sm"><Copy className="w-4 h-4" /> Copy</button>
            <button onClick={handleGenerate} className="btn-ghost text-sm"><RefreshCw className="w-4 h-4" /> Generate Another</button>
          </div>
        </div>
        <div className="space-y-3">
          {challenge.map((task, i) => {
            const Icon = getIcon(task.icon);
            return (
              <div key={i} className="card flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sage-100 dark:bg-forest-700 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-forest-500 dark:text-dark-sage" />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-warmgrey dark:text-dark-sub">Challenge {i + 1}</span>
                  <p className="text-charcoal dark:text-dark-text font-medium">{task.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">Challenge Length</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {durations.map(d => (
              <button key={d} onClick={() => setDuration(d)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${duration === d ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg' : 'bg-stone-light dark:bg-forest-800 text-charcoal dark:text-dark-text hover:bg-sage-100 dark:hover:bg-forest-700'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">Reading Preferences (optional)</label>
          <div className="flex flex-wrap gap-2">
            {allPrefs.map(p => (
              <button key={p} onClick={() => togglePref(p)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${preferences.includes(p) ? 'bg-sage-200 dark:bg-forest-600 text-forest-600 dark:text-dark-sage' : 'bg-stone-light dark:bg-forest-800 text-warmgrey dark:text-dark-sub hover:bg-sage-100 dark:hover:bg-forest-700'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleGenerate} className="btn-accent w-full">
          <Trophy className="w-5 h-5" /> Generate My Challenge
        </button>
      </div>
    </ToolLayout>
  );
}
