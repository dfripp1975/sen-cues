import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Volume2 } from 'lucide-react';
import type { VerifiedPassage } from '../lib/types';
import { chapterPath, passageText } from '../lib/bible';
import { narrator } from '../lib/speech';

export function ScriptureLabel({ translation = 'WEB' }: { translation?: string }) {
  return <span className="scripture-label"><BookOpen className="h-3 w-3" aria-hidden />Scripture · {translation}</span>;
}

export function AiLabel({ children = 'AI commentary' }: { children?: string }) {
  return <span className="ai-label"><Sparkles className="h-3 w-3" aria-hidden />{children}</span>;
}

/** Verified Scripture block. Text always comes from the bible_verses table. */
export function PassageCard({ passage, compact = false, showNote = true }: { passage: VerifiedPassage; compact?: boolean; showNote?: boolean }) {
  return (
    <figure className="rounded-2xl border border-sage/40 bg-sage/10 p-4 dark:bg-sage/5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="font-serif text-base font-semibold text-accent">{passage.reference}</figcaption>
        <ScriptureLabel translation={passage.translation} />
      </div>
      <blockquote className={`scripture text-ink ${compact ? 'line-clamp-4' : ''}`}>
        {passage.verses.map((v) => (
          <span key={v.verse}>
            {passage.verses.length > 1 && <sup className="mr-0.5 text-[0.65em] font-sans text-subtle">{v.verse}</sup>}
            {v.text}{' '}
          </span>
        ))}
      </blockquote>
      {showNote && passage.note && (
        <p className="mt-2 text-sm text-subtle"><span className="font-medium">Why this passage: </span>{passage.note}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={chapterPath(passage.bookId, passage.chapter, passage.verseStart)} className="chip text-xs hover:bg-muted">
          <BookOpen className="h-3.5 w-3.5" aria-hidden /> Read full chapter
        </Link>
        <button className="chip text-xs hover:bg-muted" onClick={() => { narrator.load(passage.reference, `${passage.reference}. ${passageText(passage)}`); narrator.play(0); }}>
          <Volume2 className="h-3.5 w-3.5" aria-hidden /> Listen
        </button>
      </div>
    </figure>
  );
}
