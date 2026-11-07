import { useState } from 'react';
import { Users, Shield } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { books } from '@/data/books';
import { getFilteredCharacters } from '@/data/bookContent';

export function CharacterRelationshipTracker() {
  const tool = getToolBySlug('character-relationship-tracker')!;
  const [bookSlug, setBookSlug] = useState('pride-and-prejudice');
  const [chapter, setChapter] = useState(1);

  const book = books.find(b => b.slug === bookSlug);
  const characters = getFilteredCharacters(bookSlug, chapter);

  return (
    <ToolLayout tool={tool} results={characters.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Characters in {book?.title}</h2>
          <span className="badge-terra"><Shield className="w-3 h-3" /> Up to Chapter {chapter}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map(char => (
            <div key={char.name} className="card animate-fade-in">
              <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">{char.name}</h3>
              <p className="text-sm text-sage-400 dark:text-dark-sage mb-2">{char.role}</p>
              <p className="text-sm text-charcoal dark:text-dark-text leading-relaxed mb-3">{char.description}</p>
              <div className="space-y-1">
                {char.family && char.family.length > 0 && (
                  <p className="text-xs"><span className="font-semibold text-forest-500 dark:text-dark-sage">Family:</span> <span className="text-warmgrey dark:text-dark-sub">{char.family.join(', ')}</span></p>
                )}
                {char.friends && char.friends.length > 0 && (
                  <p className="text-xs"><span className="font-semibold text-forest-500 dark:text-dark-sage">Friends:</span> <span className="text-warmgrey dark:text-dark-sub">{char.friends.join(', ')}</span></p>
                )}
                {char.enemies && char.enemies.length > 0 && (
                  <p className="text-xs"><span className="font-semibold text-forest-500 dark:text-dark-sage">Enemies:</span> <span className="text-warmgrey dark:text-dark-sub">{char.enemies.join(', ')}</span></p>
                )}
                {char.romantic && char.romantic.length > 0 && (
                  <p className="text-xs"><span className="font-semibold text-forest-500 dark:text-dark-sage">Romantic:</span> <span className="text-warmgrey dark:text-dark-sub">{char.romantic.join(', ')}</span></p>
                )}
                {char.alliances && char.alliances.length > 0 && (
                  <p className="text-xs"><span className="font-semibold text-forest-500 dark:text-dark-sage">Alliances:</span> <span className="text-warmgrey dark:text-dark-sub">{char.alliances.join(', ')}</span></p>
                )}
                {char.connections && char.connections.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-forest-500 dark:text-dark-sage">Important Connections:</p>
                    {char.connections.map((conn, i) => (
                      <p key={i} className="text-xs text-warmgrey dark:text-dark-sub pl-2">• {conn.name}, {conn.type}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Select a Book</label>
          <select value={bookSlug} onChange={(e) => setBookSlug(e.target.value)} className="input-field">
            {books.map(b => <option key={b.id} value={b.slug}>{b.title} by {b.author}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">What chapter are you on?</label>
          <input type="range" min="1" max={book?.chapters || 61} value={chapter} onChange={(e) => setChapter(Number(e.target.value))} className="w-full accent-forest-500 dark:accent-dark-sage" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-warmgrey dark:text-dark-sub">Chapter {chapter}</span>
            <span className="badge-terra"><Shield className="w-3 h-3" /> Spoiler Safe</span>
          </div>
        </div>
        <div className="card bg-sage-50 dark:bg-forest-800">
          <p className="text-sm text-warmgrey dark:text-dark-sub flex items-center gap-2">
            <Users className="w-4 h-4 text-sage-400 dark:text-dark-sage" />
            Showing {characters.length} character{characters.length !== 1 ? 's' : ''} revealed up to Chapter {chapter}
          </p>
        </div>
      </div>
    </ToolLayout>
  );
}
