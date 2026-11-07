import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { getPopularBooks, getTrendingBooks, getClassicBooks, getBookBySlug, books } from '@/data/books';
import { tools, toolCategories } from '@/data/tools';
import { BookCard } from '@/components/BookCard';
import { BookCover } from '@/components/BookCover';
import { AdPlaceholder } from '@/components/AdPlaceholder';
import type { Book } from '@/types';

const suggestions = ['Pride and Prejudice', '1984', 'Frankenstein', 'Jane Eyre'];

const steps = [
  {
    title: 'Pick the book you are reading',
    body: 'Search any title on the shelf, or add your own. Classics, contemporary fiction, whatever is on your bedside table.',
  },
  {
    title: 'Tell us how far you have got',
    body: 'Set your chapter and everything you see stops there. No twists given away, no endings spoiled.',
  },
  {
    title: 'Talk it through, with yourself',
    body: 'Discussion questions, character maps, themes and predictions for exactly where you are. The conversation a good book club would have.',
  },
];

function dedupe(list: Book[]) {
  const seen = new Set<string>();
  return list.filter(b => (seen.has(b.id) ? false : (seen.add(b.id), true)));
}

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useSEO({
    title: 'The Book Club For One: Your Personal Book Club for Every Book You Read',
    description: 'Free book club tools, reading calculators, discussion question generators, chapter companions and more. Turn any book into your own personal book club.',
    canonical: `${window.location.origin}/`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'The Book Club For One',
      url: `${window.location.origin}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/books?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/books?q=${encodeURIComponent(q)}` : '/books');
  };

  const onShelf = dedupe([...getPopularBooks(), ...getTrendingBooks()]).slice(0, 6);
  const classics = dedupe(getClassicBooks()).filter(b => !onShelf.includes(b)).slice(0, 6);

  const featured = getBookBySlug('pride-and-prejudice') ?? onShelf[0];
  const heroStack = dedupe([featured, ...onShelf]).slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone/70 dark:border-dark-border">
        <div className="container-page grid items-center gap-14 py-14 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-24">
          <div className="max-w-2xl animate-reveal">
            <p className="eyebrow">Free reading companion &amp; book club tools</p>
            <h1 className="mt-5 font-serif text-display-xl text-forest-500 dark:text-dark-text">
              Your own book club, <em className="font-serif italic text-terracotta-400 dark:text-dark-terra">for every book you read.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-warmgrey md:text-xl dark:text-dark-sub">
              Spoiler-safe chapter companions, discussion questions and {tools.length} free reading tools.
              No group to organise and no schedule to keep. Just you and the book.
            </p>

            <form onSubmit={handleSearch} className="mt-9 max-w-xl" role="search">
              <label htmlFor="hero-search" className="sr-only">What book are you reading?</label>
              <div className="flex items-center gap-2 rounded-full border border-stone-dark/70 bg-ivory p-1.5 pl-5 shadow-card transition-[border-color,box-shadow] focus-within:border-forest-400 focus-within:ring-4 focus-within:ring-forest-500/10 dark:border-dark-border dark:bg-dark-card">
                <Search className="h-5 w-5 shrink-0 text-warmgrey dark:text-dark-sub" />
                <input
                  id="hero-search"
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="What are you reading?"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-charcoal placeholder-warmgrey outline-none sm:text-lg dark:text-dark-text dark:placeholder-dark-sub [&::-webkit-search-cancel-button]:hidden"
                />
                <button type="submit" className="btn-accent shrink-0">
                  Find my book
                </button>
              </div>
            </form>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5 text-sm text-warmgrey dark:text-dark-sub">
              <span>Try</span>
              {suggestions.map(s => (
                <Link key={s} to={`/books?q=${encodeURIComponent(s)}`} className="link-internal font-normal">
                  {s}
                </Link>
              ))}
            </p>
          </div>

          <HeroVisual books={heroStack} />
        </div>
      </section>

      {/* Shelf */}
      <section className="container-page py-20 md:py-24" aria-labelledby="shelf-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">On the shelf</p>
            <h2 id="shelf-heading" className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">
              What readers are opening now
            </h2>
          </div>
          <Link to="/books" className="btn-outline">
            Browse all {books.length} books <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {onShelf.map(book => <BookCard key={book.id} book={book} />)}
        </div>

        {classics.length > 0 && (
          <>
            <div className="mt-20 flex flex-wrap items-end justify-between gap-4 border-t border-stone pt-10 dark:border-dark-border">
              <h3 className="font-serif text-display-md text-forest-500 dark:text-dark-text">Classics worth the time</h3>
              <Link to="/books?filter=classic" className="link-internal text-sm">See every classic</Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
              {classics.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          </>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-stone/70 bg-stone-light/60 py-20 md:py-24 dark:border-dark-border dark:bg-white/[0.02]" aria-labelledby="how-heading">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 id="how-heading" className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">
                A reading group that waits for you
              </h2>
              <Link to="/books" className="btn-primary mt-8">
                Start my book club
              </Link>
            </div>
            <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
              {steps.map((step, i) => (
                <li key={step.title} className="border-t-2 border-forest-500 pt-5 dark:border-dark-sage">
                  <span className="font-serif text-5xl leading-none text-terracotta-400 dark:text-dark-terra">{i + 1}</span>
                  <h3 className="mt-5 font-serif text-xl leading-snug text-forest-500 dark:text-dark-text">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-warmgrey dark:text-dark-sub">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Tools as a contents page */}
      <section className="container-page py-20 md:py-24" aria-labelledby="tools-heading">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Free tools</p>
            <h2 id="tools-heading" className="mt-3 font-serif text-display-lg text-forest-500 dark:text-dark-text">
              Contents
            </h2>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-warmgrey dark:text-dark-sub">
              {tools.length} tools for planning, discussing and finishing books. All free, none need an account.
            </p>
            <Link to="/tools" className="btn-outline mt-8">
              See every tool <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-12">
            {toolCategories.map(cat => {
              const catTools = tools.filter(t => t.category === cat.id);
              if (catTools.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-warmgrey dark:text-dark-sub">
                    {cat.name}
                  </h3>
                  <ul className="mt-3">
                    {catTools.map(tool => (
                      <li key={tool.slug}>
                        <Link
                          to={`/tools/${tool.slug}`}
                          className="group flex items-baseline gap-3 border-b border-stone/70 py-3.5 dark:border-dark-border"
                        >
                          <span className="font-serif text-xl text-charcoal transition-colors group-hover:text-terracotta-500 md:text-[1.4rem] dark:text-dark-text dark:group-hover:text-dark-terra">
                            {tool.shortTitle}
                          </span>
                          <span className="leader h-4 flex-1 text-stone-dark dark:text-dark-border" aria-hidden="true" />
                          <ArrowRight className="h-4 w-4 shrink-0 self-center text-warmgrey-light transition-transform duration-200 group-hover:translate-x-1 group-hover:text-terracotta-500 dark:group-hover:text-dark-terra" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container-page">
        <AdPlaceholder format="leaderboard" />
      </div>

      {/* Premium */}
      <section className="container-page" aria-labelledby="premium-heading">
        <div className="relative overflow-hidden rounded-3xl bg-forest-500 px-6 py-14 text-ivory sm:px-12 md:py-16 dark:bg-forest-700">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta-200">Premium</p>
              <h2 id="premium-heading" className="mt-3 font-serif text-display-lg text-ivory">
                Ask the book anything, <em className="italic">without spoilers.</em>
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ivory/80">
                AI chapter guides and a reading companion that only knows what you have read so far.
              </p>
              <Link to="/pricing" className="btn mt-8 bg-ivory text-forest-500 hover:bg-white">
                See Premium plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid gap-3 text-[0.95rem]">
              {['Unlimited AI chapter guides', 'Spoiler-safe Q&A with any book', 'Character and theme analysis', 'Things you may have missed'].map(f => (
                <li key={f} className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-ivory/[0.06] px-4 py-3">
                  <Check className="h-4 w-4 shrink-0 text-terracotta-200" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Three covers fanned out with a slice of the chapter companion on top. */
function HeroVisual({ books: stack }: { books: Book[] }) {
  const [front, ...rest] = stack;
  if (!front) return null;
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      <div className="relative mx-auto aspect-[5/4] w-full max-w-[30rem]">
        {rest[1] && (
          <div className="absolute left-[4%] top-[12%] w-[34%] -rotate-[9deg]">
            <BookCover book={rest[1]} size="fill" eager />
          </div>
        )}
        {rest[0] && (
          <div className="absolute right-[6%] top-[4%] w-[34%] rotate-[7deg]">
            <BookCover book={rest[0]} size="fill" eager />
          </div>
        )}
        <div className="absolute left-1/2 top-0 w-[40%] -translate-x-1/2">
          <BookCover book={front} size="fill" eager />
        </div>

        {/* Companion card */}
        <div className="absolute inset-x-[2%] bottom-0 rounded-2xl border border-stone bg-ivory/95 p-5 shadow-lift backdrop-blur-sm sm:inset-x-[8%] dark:border-dark-border dark:bg-dark-card/95">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-serif text-lg text-forest-500 dark:text-dark-text">{front.title}</p>
            <span className="badge-sage shrink-0"><ShieldCheck className="h-3.5 w-3.5" /> Spoiler-safe</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-warmgrey dark:text-dark-sub">
            <span className="shrink-0">Chapter 15 of {front.chapters || 61}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone dark:bg-dark-border">
              <span className="block h-full w-1/4 rounded-full bg-terracotta-400 dark:bg-dark-terra" />
            </span>
          </div>
          <p className="mt-4 border-t border-stone pt-4 text-[0.95rem] leading-relaxed text-charcoal dark:border-dark-border dark:text-dark-text">
            <span className="eyebrow mr-2 !text-[0.65rem]">Discuss</span>
            What does your first impression of each character say about who is telling the story?
          </p>
        </div>
      </div>
    </div>
  );
}
