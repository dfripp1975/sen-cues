import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Users, BookmarkCheck, Sparkles, ArrowRight, BookMarked, MessageCircle, Clock } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { getPopularBooks, getTrendingBooks, getClassicBooks, books } from '@/data/books';
import { tools, toolCategories } from '@/data/tools';
import { BookCard } from '@/components/BookCard';
import { ToolCard } from '@/components/ToolCard';
import { AdPlaceholder } from '@/components/AdPlaceholder';

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
    if (searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const popularBooks = getPopularBooks();
  const trendingBooks = getTrendingBooks();
  const classicBooks = getClassicBooks();
  const recentlyExplored = books.slice(0, 4);
  const featuredTools = tools.slice(0, 8);

  const bookClubSteps = [
    { num: 1, title: 'Find your book', icon: BookOpen },
    { num: 2, title: 'Tell us what chapter you\'re on', icon: BookmarkCheck },
    { num: 3, title: 'Get spoiler-safe insights', icon: Sparkles },
    { num: 4, title: 'Make predictions', icon: MessageCircle },
    { num: 5, title: 'Track characters and themes', icon: Users },
    { num: 6, title: 'Save your progress', icon: Clock },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sage-50 to-paper dark:from-forest-800 dark:to-dark-bg">
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-10 left-10 w-32 h-48 bg-forest-500 rounded-lg rotate-12" />
          <div className="absolute top-20 right-20 w-28 h-40 bg-terracotta-400 rounded-lg -rotate-6" />
          <div className="absolute bottom-10 left-1/3 w-24 h-36 bg-sage-400 rounded-lg rotate-3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <span className="badge-sage mb-6">Your personal book club for every book you read</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-6 text-balance leading-tight">
            Turn Any Book Into Your Own Personal Book Club
          </h1>
          <p className="text-lg md:text-xl text-warmgrey dark:text-dark-sub mb-10 max-w-2xl mx-auto leading-relaxed">
            Free tools, chapter companions, discussion questions, reading calculators and more, everything you need to get more from the books you read.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-warmgrey dark:text-dark-sub pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What book are you reading? Search by title, author, or ISBN..."
                className="w-full pl-14 pr-40 py-4 rounded-2xl border border-stone dark:border-dark-border bg-ivory dark:bg-forest-800 text-charcoal dark:text-dark-text placeholder-warmgrey dark:placeholder-dark-sub focus:border-forest-400 dark:focus:border-dark-sage focus:ring-2 focus:ring-forest-200 dark:focus:ring-forest-700 transition-all outline-none shadow-card text-lg"
                aria-label="Search for a book"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-accent py-2.5 px-6 text-sm">
                Find My Book
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Book sections */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4 flex items-center gap-2">
              <BookMarked className="w-6 h-6" /> Popular Books
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularBooks.slice(0, 4).map(book => (
                <BookCard key={book.id} book={book} showActions={false} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6" /> Trending Books
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingBooks.concat(classicBooks.slice(0, 2)).slice(0, 4).map(book => (
                <BookCard key={book.id} book={book} showActions={false} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Classic Books
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {classicBooks.slice(0, 6).map(book => (
              <BookCard key={book.id} book={book} showActions={false} />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6" /> Recently Explored
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyExplored.map(book => (
              <BookCard key={book.id} book={book} showActions={false} />
            ))}
          </div>
        </div>
      </section>

      <AdPlaceholder format="leaderboard" />

      {/* Tools section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">
            Free Reading & Book Club Tools
          </h2>
          <p className="text-lg text-warmgrey dark:text-dark-sub max-w-2xl mx-auto">
            Free tools to help you read more, plan your reading, run a book club and get more from every book.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTools.map(tool => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/tools" className="btn-outline">
            View All {tools.length} Tools <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Personal Book Club section */}
      <section className="bg-sage-50 dark:bg-forest-800 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">
              Your Personal Book Club
            </h2>
            <p className="text-lg text-warmgrey dark:text-dark-sub max-w-2xl mx-auto">
              Get more from every book with a personal book club experience that follows your reading progress.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookClubSteps.map(step => (
              <div key={step.num} className="card flex items-start gap-4 hover:shadow-lift transition-all duration-300">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <step.icon className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                    <h3 className="font-serif font-bold text-forest-500 dark:text-dark-sage">{step.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/books" className="btn-accent">
              <BookOpen className="w-5 h-5" /> Start My Book Club
            </a>
          </div>
        </div>
      </section>

      {/* Tool categories preview */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-4">
            Browse Tools by Category
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {toolCategories.map(cat => {
            const catTools = tools.filter(t => t.category === cat.id);
            return (
              <a
                key={cat.id}
                href="/tools"
                className="card hover:shadow-lift transition-all duration-300 group"
              >
                <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage mb-2 group-hover:text-terracotta-400 dark:group-hover:text-dark-terra transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-warmgrey dark:text-dark-sub">{catTools.length} tools available</p>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
