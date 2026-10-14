import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AArrowDown, AArrowUp, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Copy, GraduationCap, Layers,
  NotebookPen, Pause, Sparkles, Trash2, Volume2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { BOOKS, fetchChapter, getTranslationNotice } from '../lib/bible';
import { callFunction } from '../lib/api';
import { narrator } from '../lib/speech';
import { useNarrator } from '../lib/useNarrator';
import { shareText } from '../lib/share';
import type { Verse, VerifiedPassage } from '../lib/types';
import { ErrorNote, Paragraphs, Sheet, Spinner } from '../components/ui';
import { AiLabel, PassageCard, ScriptureLabel } from '../components/Scripture';
import { AiError } from '../components/AiError';

const COLOURS = {
  gold: 'bg-[#C5A568]/30',
  sage: 'bg-[#A9BDA7]/45',
  rose: 'bg-rose-200/60 dark:bg-rose-400/25',
  sky: 'bg-sky-200/60 dark:bg-sky-400/25',
} as const;
type Colour = keyof typeof COLOURS;

interface ExplainResult {
  summary: string; context: string; meaning: string; key_words: { term: string; note: string }[];
  interpretations: string; application: string; related_passages: VerifiedPassage[]; unverified_references: string[];
}

export default function ChapterPage() {
  const { book: bookCode = '', chapter: chStr = '1' } = useParams();
  const book = BOOKS.find((b) => b.code.toLowerCase() === bookCode.toLowerCase());
  const chapter = Number(chStr);
  const { user, prefs, updatePrefs } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { hash } = useLocation();
  const n = useNarrator();

  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const [highlights, setHighlights] = useState<Record<number, Colour>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [explain, setExplain] = useState<{ loading: boolean; data?: ExplainResult; error?: unknown } | null>(null);
  const [notice, setNotice] = useState('');
  const scale = Number(prefs?.font_scale ?? 1);

  const load = useCallback(async () => {
    if (!book) return;
    setVerses(null);
    setError(false);
    try {
      setVerses(await fetchChapter(book.id, chapter));
    } catch {
      setError(true);
    }
    const [h, nt, bm] = await Promise.all([
      supabase.from('bible_highlights').select('verse, colour').eq('book_id', book.id).eq('chapter', chapter),
      supabase.from('bible_notes').select('verse, body').eq('book_id', book.id).eq('chapter', chapter),
      supabase.from('bible_bookmarks').select('verse_start').eq('book_id', book.id).eq('chapter', chapter),
    ]);
    setHighlights(Object.fromEntries((h.data ?? []).map((r) => [r.verse, r.colour as Colour])));
    setNotes(Object.fromEntries((nt.data ?? []).map((r) => [r.verse, r.body])));
    setBookmarks(new Set((bm.data ?? []).map((r) => r.verse_start)));
    if (user) {
      supabase.from('reading_progress').upsert({ user_id: user.id, book_id: book.id, chapter, read_at: new Date().toISOString() }, { onConflict: 'user_id,book_id,chapter' });
    }
  }, [book, chapter, user]);

  useEffect(() => {
    load();
    getTranslationNotice().then(setNotice);
  }, [load]);

  useEffect(() => {
    if (verses && hash.startsWith('#v')) {
      const el = document.getElementById(hash.slice(1));
      el?.scrollIntoView({ block: 'center' });
    }
  }, [verses, hash]);

  const title = book ? `${book.id === 19 ? 'Psalm' : book.name} ${chapter}` : '';
  const prev = useMemo(() => {
    if (!book) return null;
    if (chapter > 1) return { code: book.code, ch: chapter - 1 };
    const pb = BOOKS[book.id - 2];
    return pb ? { code: pb.code, ch: pb.chapters } : null;
  }, [book, chapter]);
  const next = useMemo(() => {
    if (!book) return null;
    if (chapter < book.chapters) return { code: book.code, ch: chapter + 1 };
    const nb = BOOKS[book.id];
    return nb ? { code: nb.code, ch: 1 } : null;
  }, [book, chapter]);

  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return <Navigate to="/bible" replace />;

  const isPlayingThis = n.title === title && n.segments.length > 0;
  const listen = () => {
    if (!verses) return;
    if (isPlayingThis) return n.playing ? n.pause() : n.play();
    narrator.load(title, [`${title}.`, ...verses.map((v) => v.text)], false);
    narrator.play(0);
  };

  const sel = selected != null ? verses?.find((v) => v.verse === selected) : null;
  const selRef = selected != null ? `${book.name} ${chapter}:${selected}` : '';

  const setHighlight = async (colour: Colour | null) => {
    if (!user || selected == null) return;
    if (colour === null || highlights[selected] === colour) {
      await supabase.from('bible_highlights').delete().eq('book_id', book.id).eq('chapter', chapter).eq('verse', selected);
      setHighlights(({ [selected]: _, ...rest }) => rest);
    } else {
      const { error } = await supabase.from('bible_highlights').upsert(
        { user_id: user.id, translation_code: 'WEB', book_id: book.id, chapter, verse: selected, colour },
        { onConflict: 'user_id,translation_code,book_id,chapter,verse' });
      if (error) return toast('Could not save highlight.', 'error');
      setHighlights((h) => ({ ...h, [selected]: colour }));
    }
  };

  const toggleBookmark = async () => {
    if (!user || selected == null) return;
    if (bookmarks.has(selected)) {
      await supabase.from('bible_bookmarks').delete().eq('book_id', book.id).eq('chapter', chapter).eq('verse_start', selected).eq('verse_end', selected);
      setBookmarks((s) => { const c = new Set(s); c.delete(selected); return c; });
      toast('Bookmark removed');
    } else {
      const { error } = await supabase.from('bible_bookmarks').insert({ user_id: user.id, book_id: book.id, chapter, verse_start: selected, verse_end: selected });
      if (error) return toast('Could not save bookmark.', 'error');
      setBookmarks((s) => new Set(s).add(selected));
      toast('Bookmarked');
    }
  };

  const saveNote = async () => {
    if (!user || selected == null) return;
    const body = noteDraft.trim();
    if (!body) {
      await supabase.from('bible_notes').delete().eq('book_id', book.id).eq('chapter', chapter).eq('verse', selected);
      setNotes(({ [selected]: _, ...rest }) => rest);
      return toast('Note removed');
    }
    const { error } = await supabase.from('bible_notes').upsert(
      { user_id: user.id, translation_code: 'WEB', book_id: book.id, chapter, verse: selected, body },
      { onConflict: 'user_id,translation_code,book_id,chapter,verse' });
    if (error) return toast('Could not save note.', 'error');
    setNotes((s) => ({ ...s, [selected]: body }));
    toast('Note saved');
  };

  const memorise = async () => {
    if (!user || selected == null) return;
    const { error } = await supabase.from('memory_cards').upsert(
      { user_id: user.id, book_id: book.id, chapter, verse_start: selected, verse_end: selected },
      { onConflict: 'user_id,book_id,chapter,verse_start,verse_end', ignoreDuplicates: true });
    toast(error ? 'Could not add flashcard.' : 'Added to your memory verses', error ? 'error' : 'info');
  };

  const runExplain = async () => {
    if (!selRef || explain?.loading) return;
    setExplain({ loading: true });
    try {
      const data = await callFunction<ExplainResult>('faithly-ai', { mode: 'explain_verse', reference: selRef });
      setExplain({ loading: false, data });
    } catch (e) {
      setExplain({ loading: false, error: e });
    }
  };

  const openVerse = (v: number) => {
    setSelected(v);
    setNoteDraft(notes[v] ?? '');
    setExplain(null);
  };

  const fontStep = async (d: number) => {
    const s = Math.round(Math.max(0.8, Math.min(1.6, scale + d)) * 100) / 100;
    document.documentElement.style.setProperty('--font-scale', String(s));
    await updatePrefs({ font_scale: s }).catch(() => {});
  };

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-1 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
        <Link to="/bible" className="rounded-full p-2 hover:bg-muted" aria-label="All books"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="flex-1 truncate font-serif text-xl font-semibold">{title}</h1>
        <button onClick={() => fontStep(-0.1)} className="rounded-full p-2 hover:bg-muted" aria-label="Smaller text"><AArrowDown className="h-5 w-5" /></button>
        <button onClick={() => fontStep(0.1)} className="rounded-full p-2 hover:bg-muted" aria-label="Larger text"><AArrowUp className="h-5 w-5" /></button>
        <button onClick={listen} className="rounded-full p-2 hover:bg-muted" aria-label={isPlayingThis && n.playing ? 'Pause reading' : 'Listen to chapter'}>
          {isPlayingThis && n.playing ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <Link to={`/study/${book.code.toLowerCase()}/${chapter}`} className="rounded-full p-2 hover:bg-muted" aria-label="Study this chapter"><GraduationCap className="h-5 w-5" /></Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <ScriptureLabel />
        <p className="text-xs text-subtle">Tap a verse to highlight, note or explain it</p>
      </div>

      {error && <ErrorNote onRetry={load}>Could not load this chapter.</ErrorNote>}
      {!verses && !error && <Spinner label={`Loading ${title}`} />}
      {verses && verses.length === 0 && <ErrorNote>This chapter isn't in the database yet. Run the Bible import (see README).</ErrorNote>}
      {verses && (
        <article className="scripture space-y-1 text-ink" lang="en">
          {verses.map((v) => {
            const playing = isPlayingThis && n.playing && verses[n.index - 1]?.verse === v.verse; // segment 0 is the title
            return (
              <span key={v.verse} id={`v${v.verse}`}
                role="button" tabIndex={0}
                onClick={() => openVerse(v.verse)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openVerse(v.verse))}
                className={`cursor-pointer rounded px-0.5 transition ${highlights[v.verse] ? COLOURS[highlights[v.verse]] : ''} ${playing ? 'underline decoration-gold decoration-2 underline-offset-4' : ''} ${hash === `#v${v.verse}` ? 'ring-2 ring-gold/50' : ''} hover:bg-muted`}
                aria-label={`Verse ${v.verse}${notes[v.verse] ? ', has a note' : ''}`}>
                <sup className="mr-1 font-sans text-[0.6em] font-semibold text-subtle">{v.verse}</sup>
                {v.text}
                {bookmarks.has(v.verse) && <Bookmark className="ml-1 inline h-3 w-3 text-gold" aria-hidden />}
                {notes[v.verse] && <NotebookPen className="ml-1 inline h-3 w-3 text-accent" aria-hidden />}{' '}
              </span>
            );
          })}
        </article>
      )}

      <nav className="mt-10 flex justify-between" aria-label="Chapter navigation">
        {prev ? <button className="btn-secondary" onClick={() => nav(`/bible/${prev.code.toLowerCase()}/${prev.ch}`)}><ChevronLeft className="h-4 w-4" />Previous</button> : <span />}
        {next ? <button className="btn-secondary" onClick={() => nav(`/bible/${next.code.toLowerCase()}/${next.ch}`)}>Next<ChevronRight className="h-4 w-4" /></button> : <span />}
      </nav>
      <p className="mt-8 text-center text-xs text-subtle">{notice}</p>

      <Sheet open={selected != null} onClose={() => setSelected(null)} title={selRef}>
        {sel && (
          <div className="space-y-5">
            <p className="scripture rounded-xl bg-muted/60 p-4">{sel.text}</p>
            <div>
              <p className="label">Highlight</p>
              <div className="flex gap-3">
                {(Object.keys(COLOURS) as Colour[]).map((c) => (
                  <button key={c} onClick={() => setHighlight(c)} aria-label={`Highlight ${c}`} aria-pressed={highlights[selected!] === c}
                    className={`h-9 w-9 rounded-full ${COLOURS[c]} ${highlights[selected!] === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`} />
                ))}
                {highlights[selected!] && <button onClick={() => setHighlight(null)} className="chip text-xs"><Trash2 className="h-3.5 w-3.5" />Clear</button>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={toggleBookmark} className="chip hover:bg-muted">
                {bookmarks.has(selected!) ? <BookmarkCheck className="h-4 w-4 text-accent" /> : <Bookmark className="h-4 w-4" />}
                {bookmarks.has(selected!) ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button onClick={async () => { const r = await shareText(selRef, `“${sel.text}” — ${selRef} (WEB)`); if (r === 'copied') toast('Copied'); }} className="chip hover:bg-muted"><Copy className="h-4 w-4" />Copy / share</button>
              <button onClick={memorise} className="chip hover:bg-muted"><Layers className="h-4 w-4" />Memorise</button>
              <Link to={`/wallpaper?ref=${encodeURIComponent(selRef)}`} className="chip hover:bg-muted">Make a wallpaper</Link>
            </div>
            <div>
              <label htmlFor="vnote" className="label">Personal note</label>
              <textarea id="vnote" className="input min-h-[90px]" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} maxLength={5000} placeholder="What stands out to you?" />
              <button onClick={saveNote} className="btn-secondary mt-2">Save note</button>
            </div>
            <div className="border-t border-line pt-4">
              {!explain && <button onClick={runExplain} className="btn-primary w-full"><Sparkles className="h-4 w-4" />Explain this verse</button>}
              {explain?.loading && <Spinner label="Faithly is preparing an explanation" />}
              {explain?.error != null && <AiError error={explain.error} onRetry={runExplain} />}
              {explain?.data && <ExplainView data={explain.data} />}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function ExplainView({ data }: { data: ExplainResult }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed">
      <AiLabel>AI explanation — not Scripture</AiLabel>
      <p className="font-medium">{data.summary}</p>
      {data.context && <section><h3 className="font-sans text-sm font-semibold">Context</h3><Paragraphs text={data.context} className="text-subtle" /></section>}
      {data.meaning && <section><h3 className="font-sans text-sm font-semibold">Meaning</h3><Paragraphs text={data.meaning} className="text-subtle" /></section>}
      {data.key_words?.length > 0 && (
        <section><h3 className="font-sans text-sm font-semibold">Key words</h3>
          <ul className="mt-1 space-y-1 text-subtle">{data.key_words.map((k) => <li key={k.term}><span className="font-medium text-ink">{k.term}:</span> {k.note}</li>)}</ul>
        </section>
      )}
      {data.interpretations && <section><h3 className="font-sans text-sm font-semibold">Different readings</h3><Paragraphs text={data.interpretations} className="text-subtle" /></section>}
      {data.application && <section><h3 className="font-sans text-sm font-semibold">For today</h3><Paragraphs text={data.application} className="text-subtle" /></section>}
      {data.related_passages?.length > 0 && (
        <section className="space-y-3"><h3 className="font-sans text-sm font-semibold">Related passages</h3>
          {data.related_passages.map((p) => <PassageCard key={p.reference} passage={p} compact />)}
        </section>
      )}
    </div>
  );
}
