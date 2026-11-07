import { useState } from 'react';
import { Copy, RefreshCw, RotateCcw, MessageCircleQuestion } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { getToolBySlug } from '@/data/tools';
import { generateQuestions } from '@/data/generators';
import type { BookClubQuestion } from '@/types';

export function BookClubQuestionGenerator() {
  const tool = getToolBySlug('book-club-question-generator')!;
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [chapter, setChapter] = useState('');
  const [style, setStyle] = useState('general');
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<BookClubQuestion[]>([]);

  const handleGenerate = () => {
    setQuestions(generateQuestions(style, count));
  };

  const handleCopy = () => {
    const text = questions.map(q => q.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const styles = [
    { val: 'general', label: 'General Discussion' },
    { val: 'deep', label: 'Deep Discussion' },
    { val: 'character', label: 'Character Questions' },
    { val: 'theme', label: 'Theme Questions' },
    { val: 'fun', label: 'Fun Questions' },
    { val: 'chapter', label: 'Chapter-Specific Questions' },
  ];

  return (
    <ToolLayout tool={tool} results={questions.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">
            {questions.length} Discussion Questions
          </h2>
          <div className="flex gap-2">
            <button onClick={handleCopy} className="btn-ghost text-sm"><Copy className="w-4 h-4" /> Copy Questions</button>
            <button onClick={handleGenerate} className="btn-ghost text-sm"><RefreshCw className="w-4 h-4" /> Generate More</button>
            <button onClick={() => setQuestions([])} className="btn-ghost text-sm"><RotateCcw className="w-4 h-4" /> Start Again</button>
          </div>
        </div>
        {chapter && (
          <span className="badge-terra">Spoiler Safe , Based only on Chapters 1-{chapter}</span>
        )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Book Title</label>
            <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="input-field" placeholder="e.g. Pride and Prejudice" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Author</label>
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="input-field" placeholder="e.g. Jane Austen" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Chapter (optional)</label>
            <input type="number" value={chapter} onChange={(e) => setChapter(e.target.value)} className="input-field" placeholder="e.g. 15" min="1" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Question Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field">
              {styles.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-1">Number of Questions</label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input-field">
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
              <option value={15}>15 questions</option>
              <option value={20}>20 questions</option>
            </select>
          </div>
        </div>
        <button onClick={handleGenerate} className="btn-accent w-full">
          <MessageCircleQuestion className="w-5 h-5" /> Generate Questions
        </button>
      </div>
    </ToolLayout>
  );
}
