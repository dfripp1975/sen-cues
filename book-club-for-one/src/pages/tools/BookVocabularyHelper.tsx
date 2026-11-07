import { useState } from 'react';
import { BookOpen, Copy, RotateCcw } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';

const vocabularyDB: Record<string, { definition: string; simple: string; synonyms: string[]; example: string }> = {
  'obsequious': { definition: 'Excessively eager to please or obey, especially for personal gain', simple: 'Being overly flattering or submissive to get something', synonyms: ['sycophantic', 'fawning', 'subservient'], example: 'The obsequious waiter hovered around our table, hoping for a large tip.' },
  'countenance': { definition: 'A person\'s face or facial expression', simple: 'The way someone\'s face looks', synonyms: ['face', 'expression', 'visage'], example: 'His countenance betrayed no emotion despite the shocking news.' },
  'condescension': { definition: 'Patronizing behaviour showing a sense of superiority', simple: 'Acting like you are better than someone else', synonyms: ['patronizing', 'superiority', 'disdain'], example: 'She spoke with condescension, as if explaining things to a child.' },
  'amiable': { definition: 'Friendly and pleasant to be around', simple: 'Nice and friendly', synonyms: ['friendly', 'pleasant', 'affable', 'cordial'], example: 'His amiable nature made him popular at every gathering.' },
  'propriety': { definition: 'Conformity to accepted standards of behaviour', simple: 'Following proper social rules', synonyms: ['decorum', 'decency', 'correctness'], example: 'She questioned the propriety of arriving without an invitation.' },
  'ardour': { definition: 'Great enthusiasm or passion', simple: 'Intense excitement or passion', synonyms: ['passion', 'fervour', 'zeal', 'enthusiasm'], example: 'His ardour for exploration drove him to the farthest reaches of the globe.' },
  'benevolent': { definition: 'Kind, generous, and well-meaning', simple: 'Kind and caring', synonyms: ['kind', 'generous', 'charitable', 'compassionate'], example: 'The benevolent stranger paid for our meal without expecting thanks.' },
  'languid': { definition: 'Lacking energy or vitality; slow and relaxed', simple: 'Slow, lazy, or lacking energy', synonyms: ['sluggish', 'listless', 'lethargic'], example: 'On a hot afternoon, she moved with a languid grace.' },
  'galvanism': { definition: 'Electricity produced by chemical action', simple: 'Electricity from chemical reactions', synonyms: ['electricity', 'electrochemistry'], example: 'Victor experimented with galvanism to discover the secret of life.' },
  'delineated': { definition: 'Described or portrayed precisely', simple: 'Clearly described or outlined', synonyms: ['depicted', 'outlined', 'portrayed'], example: 'The creature\'s features were delineated in terrifying detail.' },
  'voluptuous': { definition: 'Curvy and sensual; relating to sensual pleasure', simple: 'Sensual or curvy in an appealing way', synonyms: ['sensual', 'shapely', 'alluring'], example: 'The voluptuous vampires moved toward him with predatory grace.' },
  'languorous': { definition: 'Lacking energy; producing a feeling of pleasant laziness', simple: 'A relaxed, lazy feeling', synonyms: ['lazy', 'indolent', 'dreamy'], example: 'A languorous atmosphere filled the castle at twilight.' },
  'telescreen': { definition: 'A two-way screen for surveillance and propaganda', simple: 'A TV that watches you back', synonyms: ['monitor', 'surveillance screen'], example: 'The telescreen in every room broadcast Party propaganda day and night.' },
  'thoughtcrime': { definition: 'The criminal act of holding unorthodox thoughts', simple: 'Thinking things the government does not allow', synonyms: ['wrongthink', 'dissent'], example: 'Writing in his diary was an act of thoughtcrime.' },
  'doublethink': { definition: 'Accepting two contradictory beliefs simultaneously', simple: 'Believing two opposite things at once', synonyms: ['cognitive dissonance'], example: 'Doublethink allowed citizens to believe war was peace.' },
  'curiouser': { definition: 'A made-up word meaning increasingly strange', simple: 'More and more curious or strange', synonyms: ['stranger', 'more peculiar'], example: '"Curiouser and curiouser!" cried Alice as she shrank.' },
};

export function BookVocabularyHelper() {
  const tool = getToolBySlug('book-vocabulary-helper')!;
  const [word, setWord] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState<{ definition: string; simple: string; synonyms: string[]; example: string; contextualMeaning?: string } | null>(null);


  const handleExplain = () => {
    const key = word.toLowerCase().trim();
    if (vocabularyDB[key]) {
      const entry = vocabularyDB[key];
      setResult({
        ...entry,
        contextualMeaning: context ? `In the context of your sentence, "${word}" likely means: ${entry.simple}.` : undefined,
      });
    } else {
      setResult({
        definition: `"${word}" is not in our local vocabulary database yet. In production, this tool would look up the word from a dictionary API to provide a full definition, simple explanation, contextual meaning, synonyms, and example sentence.`,
        simple: `A definition for "${word}" would appear here.`,
        synonyms: [],
        example: `An example sentence using "${word}" would be generated.`,
        contextualMeaning: context ? `Based on your sentence, "${word}" appears to be used in a ${context.length > 50 ? 'descriptive' : 'specific'} context.` : undefined,
      });
    }
  };

  return (
    <ToolLayout tool={tool} results={result ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">{word}</h2>
          <div className="flex gap-2">
            <button onClick={() => { navigator.clipboard.writeText(`${word}: ${result.definition}`); }} className="btn-ghost text-sm"><Copy className="w-4 h-4" /> Copy</button>
            <button onClick={() => { setWord(''); setResult(null); }} className="btn-ghost text-sm"><RotateCcw className="w-4 h-4" /> New Word</button>
          </div>
        </div>
        <div className="card space-y-4">
          <div><h3 className="text-sm font-semibold text-sage-400 dark:text-dark-sage mb-1">Definition</h3><p className="text-charcoal dark:text-dark-text">{result.definition}</p></div>
          <div><h3 className="text-sm font-semibold text-sage-400 dark:text-dark-sage mb-1">Simple Explanation</h3><p className="text-charcoal dark:text-dark-text">{result.simple}</p></div>
          {result.contextualMeaning && <div><h3 className="text-sm font-semibold text-sage-400 dark:text-dark-sage mb-1">Meaning in Context</h3><p className="text-charcoal dark:text-dark-text">{result.contextualMeaning}</p></div>}
          <div><h3 className="text-sm font-semibold text-sage-400 dark:text-dark-sage mb-1">Example Sentence</h3><p className="text-charcoal dark:text-dark-text italic">{result.example}</p></div>
          {result.synonyms.length > 0 && (
            <div><h3 className="text-sm font-semibold text-sage-400 dark:text-dark-sage mb-1">Synonyms</h3><div className="flex flex-wrap gap-2">{result.synonyms.map(s => <span key={s} className="badge-sage">{s}</span>)}</div></div>
          )}
        </div>
      </div>
    ) : undefined}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Word or Phrase</label>
          <input type="text" value={word} onChange={(e) => setWord(e.target.value)} className="input-field" placeholder="e.g. obsequious" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Title (optional)</label>
          <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="input-field" placeholder="e.g. Pride and Prejudice" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Sentence / Context (optional)</label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} className="input-field min-h-[80px]" placeholder="Paste the sentence where you found the word..." />
        </div>
        <button onClick={handleExplain} disabled={!word.trim()} className="btn-accent w-full">
          <BookOpen className="w-5 h-5" /> Explain Word
        </button>
      </div>
    </ToolLayout>
  );
}
