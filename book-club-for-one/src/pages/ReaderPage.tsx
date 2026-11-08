import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, List, X, Minus, Plus, Lock, BookOpen } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { useAuth } from '@/lib/auth';
import { getBookBySlug } from '@/data/books';
import { SubscriptionService, type Subscription } from '@/services/SubscriptionService';
import { ReadingProgressService } from '@/services/ReadingProgressService';
import { NotFoundPage } from './NotFoundPage';

interface Chapter { title: string; html: string }
interface BookText { slug: string; title: string; author: string; translators: string[]; source: string; chapters: Chapter[] }

// Texts are stored gzipped. Some hosts decompress on the way out and some
// don't, so check the gzip magic bytes and only decompress when needed.
async function loadText(readSlug: string): Promise<BookText> {
  const res = await fetch(`/texts/${readSlug}.json.gz`);
  if (!res.ok) throw new Error(`Could not load this book (${res.status}).`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let json: string;
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    json = await new Response(stream).text();
  } else {
    json = new TextDecoder().decode(buf);
  }
  return JSON.parse(json);
}

const SIZES = [17, 18, 19, 20, 22, 24];
const storeKey = (slug: string) => `reading:${slug}`;
function readSaved(slug: string): { chapter: number; scroll: number } | null {
  try { const v = JSON.parse(localStorage.getItem(storeKey(slug)) || 'null'); return v && typeof v.chapter === 'number' ? v : null; } catch { return null; }
}
function writeSaved(slug: string, chapter: number, scroll: number) {
  try { localStorage.setItem(storeKey(slug), JSON.stringify({ chapter, scroll, at: Date.now() })); } catch { /* storage blocked */ }
}

export function ReaderPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const book = getBookBySlug(slug);
  const { user } = useAuth();
  const [text, setText] = useState<BookText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subChecked, setSubChecked] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [size, setSize] = useState(() => { try { return Number(localStorage.getItem('reader:size')) || 19; } catch { return 19; } });
  const articleRef = useRef<HTMLElement>(null);
  const restoredRef = useRef(false);

  const fromUrl = Number(params.get('ch'));
  const saved = useMemo(() => (book ? readSaved(book.slug) : null), [book]);
  const chapter = Math.max(1, fromUrl || saved?.chapter || 1);

  useSEO({
    title: book ? `Read ${book.title} by ${book.author} | The Book Club For One` : 'Read | The Book Club For One',
    description: book ? `Read ${book.title} by ${book.author} online, chapter by chapter, with a spoiler-safe book club alongside.` : '',
    canonical: book ? `${window.location.origin}/read/${book.slug}` : undefined,
  });

  useEffect(() => {
    if (!book?.readSlug) return;
    let alive = true;
    setText(null); setError(null);
    loadText(book.readSlug).then(t => { if (alive) setText(t); }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [book?.readSlug]);

  useEffect(() => {
    if (!user) { setSubscription(null); setSubChecked(true); return; }
    SubscriptionService.getSubscription().then(s => { setSubscription(s); setSubChecked(true); }).catch(() => setSubChecked(true));
  }, [user]);

  const total = text?.chapters.length || 0;
  const current = Math.min(chapter, Math.max(1, total));
  const premium = SubscriptionService.isPremium(subscription);
  // Free books are open to everyone; every other book gives chapter 1 as a taste.
  const locked = !!book && !book.freeToRead && !premium && current > 1;

  const goTo = useCallback((n: number) => {
    setParams(p => { const q = new URLSearchParams(p); q.set('ch', String(n)); return q; });
    setTocOpen(false);
    window.scrollTo({ top: 0 });
  }, [setParams]);

  // Restore the reader's scroll position once, when they come back to where they were
  useEffect(() => {
    if (!text || restoredRef.current || !book) return;
    restoredRef.current = true;
    if (!fromUrl && saved && saved.chapter === current && saved.scroll > 0) {
      requestAnimationFrame(() => {
        const el = articleRef.current;
        if (el) window.scrollTo({ top: el.offsetTop + saved.scroll * el.offsetHeight });
      });
    }
  }, [text, book, fromUrl, saved, current]);

  // Remember the chapter and scroll position; sync the chapter to the account when signed in
  useEffect(() => {
    if (!book || !text || locked) return;
    writeSaved(book.slug, current, 0);
    if (user) ReadingProgressService.saveProgress(book.slug, current, total).catch(() => {});
    let t: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (t) return;
      t = setTimeout(() => {
        t = null;
        const el = articleRef.current;
        if (!el) return;
        const frac = Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / Math.max(1, el.offsetHeight)));
        writeSaved(book.slug, current, frac);
      }, 400);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); if (t) clearTimeout(t); };
  }, [book, text, current, total, user, locked]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' && current < total) goTo(current + 1);
      if (e.key === 'ArrowLeft' && current > 1) goTo(current - 1);
      if (e.key === 'Escape') setTocOpen(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [current, total, goTo]);

  const changeSize = (dir: 1 | -1) => {
    const i = Math.max(0, Math.min(SIZES.length - 1, SIZES.indexOf(size) + dir));
    setSize(SIZES[i]);
    try { localStorage.setItem('reader:size', String(SIZES[i])); } catch { /* storage blocked */ }
  };

  if (!book) return <NotFoundPage />;
  if (!book.readSlug) {
    return (
      <div className="container-page max-w-2xl py-24 text-center">
        <h1 className="font-serif text-display-md text-forest-500 dark:text-dark-text">{book.title} can’t be read here</h1>
        <p className="mt-4 text-warmgrey dark:text-dark-sub">This book is still in copyright in some countries, so we can only offer its guides and book club tools.</p>
        <Link to={`/book/${book.slug}`} className="btn-primary mt-8">Back to the book</Link>
      </div>
    );
  }

  const ch = text?.chapters[current - 1];
  const progress = total ? Math.round((current / total) * 100) : 0;

  return (
    <div className="relative">
      {/* Reading bar */}
      <div className="sticky top-16 z-30 border-b border-stone/80 bg-paper/90 backdrop-blur-md dark:border-dark-border dark:bg-dark-bg/90">
        <div className="container-page flex h-12 items-center gap-3">
          <button onClick={() => setTocOpen(true)} className="btn-ghost !px-3 !py-1.5 text-sm" aria-label="Chapters">
            <List className="h-4 w-4" /> <span className="hidden sm:inline">Chapters</span>
          </button>
          <Link to={`/book/${book.slug}`} className="min-w-0 flex-1 truncate font-serif text-[1.05rem] text-forest-500 hover:underline dark:text-dark-text">
            {book.title}
          </Link>
          <span className="hidden text-xs text-warmgrey sm:inline dark:text-dark-sub">
            {total ? `Chapter ${current} of ${total}` : ''}
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Text size">
            <button onClick={() => changeSize(-1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-charcoal/[0.06] dark:hover:bg-white/[0.06]" aria-label="Smaller text"><Minus className="h-4 w-4" /></button>
            <button onClick={() => changeSize(1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-charcoal/[0.06] dark:hover:bg-white/[0.06]" aria-label="Larger text"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="h-0.5 bg-stone/60 dark:bg-dark-border" aria-hidden="true">
          <div className="h-full bg-terracotta-400 transition-[width] duration-300 dark:bg-dark-terra" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Contents drawer */}
      {tocOpen && text && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Chapters">
          <button className="absolute inset-0 bg-charcoal/30 animate-fade-in" onClick={() => setTocOpen(false)} aria-label="Close chapters" />
          <nav className="absolute inset-y-0 left-0 flex w-[min(24rem,88vw)] flex-col bg-ivory shadow-lift animate-slide-up dark:bg-dark-card">
            <div className="flex items-center justify-between border-b border-stone px-5 py-4 dark:border-dark-border">
              <p className="font-serif text-lg text-forest-500 dark:text-dark-text">Contents</p>
              <button onClick={() => setTocOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-charcoal/[0.06]" aria-label="Close chapters"><X className="h-5 w-5" /></button>
            </div>
            <ol className="flex-1 overflow-y-auto py-2">
              {text.chapters.map((c, i) => {
                const n = i + 1;
                const lockedRow = !book.freeToRead && !premium && n > 1;
                return (
                  <li key={n}>
                    <button
                      onClick={() => goTo(n)}
                      aria-current={n === current ? 'page' : undefined}
                      className={`flex w-full items-baseline gap-3 px-5 py-2.5 text-left text-sm transition-colors hover:bg-sage-50 dark:hover:bg-white/[0.05] ${n === current ? 'bg-sage-50 font-semibold text-forest-500 dark:bg-white/[0.05] dark:text-dark-sage' : 'text-charcoal dark:text-dark-text'}`}
                    >
                      <span className="w-7 shrink-0 text-xs tabular-nums text-warmgrey">{n}</span>
                      <span className="flex-1">{c.title}</span>
                      {lockedRow && <Lock className="h-3.5 w-3.5 shrink-0 text-warmgrey" aria-label="Premium" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      )}

      <div className="container-page max-w-3xl py-12 md:py-16">
        {error && (
          <div className="card text-center">
            <p className="text-charcoal dark:text-dark-text">{error}</p>
            <button onClick={() => location.reload()} className="btn-primary mt-4">Try again</button>
          </div>
        )}

        {!text && !error && (
          <div aria-busy="true" className="space-y-4">
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded-lg bg-stone/70 dark:bg-dark-border" />
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-4 animate-pulse rounded bg-stone/50 dark:bg-dark-border" style={{ width: `${88 - (i % 3) * 9}%` }} />)}
          </div>
        )}

        {text && ch && (
          locked ? (
            <div className="mx-auto max-w-xl py-10 text-center">
              <Lock className="mx-auto h-8 w-8 text-terracotta-500 dark:text-dark-terra" />
              <h1 className="mt-5 font-serif text-display-md text-forest-500 dark:text-dark-text">Keep reading with Premium</h1>
              <p className="mt-4 leading-relaxed text-warmgrey dark:text-dark-sub">
                Chapter 1 of <em>{book.title}</em> is free for everyone. Premium opens the rest of this book and every other book on the shelf.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {subChecked && !user && <Link to="/signin" className="btn-outline">Sign in</Link>}
                <Link to="/pricing" className="btn-accent">See Premium</Link>
              </div>
              <button onClick={() => goTo(1)} className="link-internal mt-6 text-sm">Back to chapter 1</button>
            </div>
          ) : (
            <>
              <header className="mb-10 text-center">
                <p className="eyebrow">{book.author}{text.translators?.length ? ` · translated by ${text.translators.join(' and ')}` : ''}</p>
                <h1 className="mt-4 font-serif text-display-md text-forest-500 dark:text-dark-text">{ch.title}</h1>
              </header>
              <article
                ref={articleRef}
                className="reader-text"
                style={{ fontSize: `${size}px` }}
                // Markup is reduced to a short list of safe text tags when the books are imported
                dangerouslySetInnerHTML={{ __html: ch.html }}
              />
              <nav className="mt-16 flex items-center justify-between gap-4 border-t border-stone pt-8 dark:border-dark-border" aria-label="Chapter">
                {current > 1 ? (
                  <button onClick={() => goTo(current - 1)} className="btn-outline"><ArrowLeft className="h-4 w-4" /> Previous</button>
                ) : <span />}
                {current < total ? (
                  <button onClick={() => goTo(current + 1)} className="btn-primary">Next chapter <ArrowRight className="h-4 w-4" /></button>
                ) : (
                  <Link to={`/book/${book.slug}`} className="btn-accent"><BookOpen className="h-4 w-4" /> Finished. Talk it through</Link>
                )}
              </nav>
              <p className="mt-10 text-center text-xs text-warmgrey dark:text-dark-sub">
                Public domain text from <a href={text.source} target="_blank" rel="noreferrer" className="link-internal font-normal">Standard Ebooks</a>.
              </p>
            </>
          )
        )}
      </div>
    </div>
  );
}
