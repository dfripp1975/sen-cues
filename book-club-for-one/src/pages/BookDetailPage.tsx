import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Users, MessageCircle, BookMarked, Sparkles, NotebookPen, ChevronRight, Shield, ArrowRight, Loader2, Send, Crown } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BookCover } from '@/components/BookCover';
import { AdPlaceholder } from '@/components/AdPlaceholder';
import { getBookBySlug, getRelatedBooks } from '@/data/books';
import { getFilteredCharacters, getChaptersUpTo, getThemesForBook } from '@/data/bookContent';
import { guideChapters, describeChapters } from '@/data/guideHelpers';
import { useAuth } from '@/lib/auth';
import { UserLibraryService } from '@/services/UserLibraryService';
import { CustomBookService, toBook, type CustomBook } from '@/services/CustomBookService';
import { AIService } from '@/services/AIService';
import { SubscriptionService, type Subscription } from '@/services/SubscriptionService';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { Book } from '@/types';

export function BookDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const isCustom = slug?.startsWith('custom-');
  const customSlug = isCustom ? slug!.replace('custom-', '') : null;

  const [customBook, setCustomBook] = useState<CustomBook | null>(null);
  const [customLoading, setCustomLoading] = useState(isCustom);

  const staticBook = !isCustom && slug ? getBookBySlug(slug) : undefined;

  const [selectedChapter, setSelectedChapter] = useState(1);
  const [activeTab, setActiveTab] = useState<'about' | 'chapter-guide' | 'characters' | 'themes' | 'questions' | 'vocabulary' | 'related'>('about');
  const [reflection, setReflection] = useState('');
  const [prediction, setPrediction] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const { user } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<Record<string, string>>({});
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (isCustom && customSlug) {
      setCustomLoading(true);
      CustomBookService.getBySlug(customSlug).then(cb => {
        setCustomBook(cb);
        if (cb) setSelectedChapter(Math.max(1, cb.current_chapter));
        setCustomLoading(false);
      });
    }
  }, [isCustom, customSlug]);

  useEffect(() => {
    if (user) {
      SubscriptionService.getSubscription().then(sub => {
        setSubscription(sub);
        setSubLoading(false);
      });
    } else {
      setSubLoading(false);
    }
  }, [user]);

  const book: Book | undefined = isCustom ? (customBook ? toBook(customBook) : undefined) : staticBook;

  useSEO({
    title: book ? `${book.title} by ${book.author} | The Book Club For One` : 'Book Not Found',
    description: book ? `${book.description} Start your personal book club for ${book.title}.` : 'Book not found.',
    canonical: book ? `${window.location.origin}/book/${book.slug}` : undefined,
    structuredData: book ? {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title,
      author: { '@type': 'Person', name: book.author },
      datePublished: `${book.year}`,
      numberOfPages: book.pages,
      genre: book.genre,
      isbn: book.isbn,
      description: book.description,
    } : undefined,
  });

  if (isCustom && customLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mx-auto mb-4" />
        <p className="text-warmgrey dark:text-dark-sub">Loading your book...</p>
      </div>
    );
  }

  if (!book) return <NotFoundPage />;

  const characters = isCustom ? [] : getFilteredCharacters(book.slug, selectedChapter);
  const chapters = isCustom ? [] : getChaptersUpTo(book.slug, selectedChapter);
  const themes = isCustom ? [] : getThemesForBook(book.slug);
  const guided = isCustom ? [] : guideChapters(book.slug);
  const chapterCovered = guided.includes(selectedChapter);
  const upTo = selectedChapter === 1 ? 'chapter 1' : `chapters 1 to ${selectedChapter}`;
  const relatedBooks = isCustom ? [] : getRelatedBooks(book);

  const isPremium = SubscriptionService.isPremium(subscription);

  const requireAuth = (): boolean => {
    if (!user) {
      window.location.href = '/signin';
      return false;
    }
    return true;
  };

  const handleAIAction = async (action: string) => {
    if (!requireAuth()) return;
    setAiError(null);
    setAiLoading(action);
    try {
      if (action === 'questions') {
        const questions = await AIService.generateQuestions(book.title, book.author, selectedChapter, 'thoughtful', 8);
        setAiQuestions(questions);
      } else if (action === 'chapter-guide') {
        const content = await AIService.generateChapterGuide(book.title, book.author, selectedChapter);
        setAiContent(prev => ({ ...prev, 'chapter-guide': content }));
      } else if (action === 'characters') {
        const content = await AIService.generateCharacters(book.title, book.author, selectedChapter);
        setAiContent(prev => ({ ...prev, characters: content }));
      } else if (action === 'themes') {
        const content = await AIService.generateThemes(book.title, book.author, selectedChapter);
        setAiContent(prev => ({ ...prev, themes: content }));
      } else if (action === 'vocabulary') {
        const content = await AIService.generateVocabulary(book.title, book.author, selectedChapter);
        setAiContent(prev => ({ ...prev, vocabulary: content }));
      } else if (action === 'missed-details') {
        const content = await AIService.generateMissedDetails(book.title, book.author, selectedChapter);
        setAiContent(prev => ({ ...prev, 'missed-details': content }));
      } else if (action === 'explain') {
        const content = await AIService.explainChapter(book.title, book.author, selectedChapter);
        setAiContent(prev => ({ ...prev, explain: content }));
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !requireAuth()) return;
    const question = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: question }]);
    setChatInput('');
    setChatLoading(true);
    setAiError(null);
    try {
      const answer = await AIService.answerBookQuestion(book.title, book.author, selectedChapter, question);
      setChatMessages(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddToLibrary = async (status: 'currently-reading' | 'want-to-read' | 'completed') => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }
    if (isCustom && customSlug) {
      try {
        await CustomBookService.updateStatus(customSlug, status);
      } catch {
        // silent fail
      }
      return;
    }
    try {
      await UserLibraryService.addBook(book.slug, status, selectedChapter);
    } catch {
      // silent fail
    }
  };

  const handleSaveReflection = async () => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }
    if (isCustom && customSlug) {
      setSaving(true);
      try {
        await CustomBookService.updateProgress(customSlug, selectedChapter);
      } catch {
        // silent fail
      }
      setSaving(false);
    }
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const isAILoading = (action: string) => aiLoading === action;
  const hasAIContent = (key: string) => !!aiContent[key];

  const tabs = [
    { id: 'about' as const, label: 'About This Book', icon: BookOpen },
    { id: 'chapter-guide' as const, label: 'Chapter Companion', icon: BookMarked },
    { id: 'characters' as const, label: 'Characters', icon: Users },
    { id: 'themes' as const, label: 'Themes', icon: Sparkles },
    { id: 'questions' as const, label: 'Discussion Questions', icon: MessageCircle },
    { id: 'vocabulary' as const, label: 'Vocabulary', icon: NotebookPen },
    { id: 'related' as const, label: 'Related Books', icon: ChevronRight },
  ];

  const quickQuestions = [
    'Explain this chapter simply',
    'Why did this character do that?',
    'What themes should I notice?',
    'What did I miss?',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Home', to: '/' },
        { label: 'Books', to: '/books' },
        { label: book.title },
      ]} />

      {/* Book header */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <BookCover book={book} size="lg" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-forest-500 dark:text-dark-sage mb-2">{book.title}</h1>
          <p className="text-lg text-warmgrey dark:text-dark-sub mb-4">by {book.author}{book.year ? ` · ${book.year}` : ''}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {book.genre.map(g => <span key={g} className="badge-sage">{g}</span>)}
            {book.subgenres.map(g => <span key={g} className="badge-forest">{g}</span>)}
            {isCustom && <span className="badge-terra">Your Book</span>}
          </div>
          {book.description && <p className="text-charcoal dark:text-dark-text leading-relaxed mb-6">{book.description}</p>}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => handleAddToLibrary('currently-reading')} className="btn-accent">
              <BookOpen className="w-5 h-5" /> Start My Book Club
            </button>
            <button onClick={() => handleAddToLibrary('want-to-read')} className="btn-outline">
              Add to Library
            </button>
            <Link to="/tools/book-club-question-generator" className="btn-ghost">
              <MessageCircle className="w-4 h-4" /> Generate Questions
            </Link>
          </div>
        </div>
      </div>

      {/* Chapter selector */}
      <div className="card mb-8">
        <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">
          Where are you in the book?
        </label>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(Number(e.target.value))}
            className="input-field max-w-xs"
          >
            {Array.from({ length: Math.max(1, book.chapters) }, (_, i) => i + 1).map(ch => (
              <option key={ch} value={ch}>Chapter {ch}</option>
            ))}
          </select>
          <span className="badge-terra">
            <Shield className="w-3 h-3" /> Spoiler-safe: based only on {upTo}
          </span>
        </div>
        {!isCustom && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone pt-4 dark:border-dark-border">
            <p className="min-w-[16rem] flex-1 text-sm leading-relaxed text-charcoal dark:text-dark-text">
              {guided.length > 0 ? (
                chapterCovered
                  ? <>Our built-in chapter guide covers chapters {describeChapters(guided)}, including the one you're on.</>
                  : <>Our built-in chapter guide covers chapters {describeChapters(guided)}. For notes on exactly where you are, use the AI guide, written for {upTo} only.</>
              ) : (
                <>There's no built-in chapter guide for this book yet. The AI guide writes one for exactly where you are, using {upTo} only.</>
              )}
            </p>
            {!chapterCovered && (
              <button
                onClick={() => { setActiveTab('chapter-guide'); handleAIAction('chapter-guide'); }}
                disabled={isAILoading('chapter-guide')}
                className="btn-primary text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {user ? 'Write my chapter guide' : 'Sign in for the AI guide'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI error */}
      {aiError && (
        <div className="card mb-6 border-l-4 border-terracotta-400 dark:border-dark-terra">
          <p className="text-sm text-terracotta-600 dark:text-dark-terra">{aiError}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-stone dark:border-dark-border pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg'
                : 'text-charcoal dark:text-dark-text hover:bg-stone-light dark:hover:bg-forest-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'about' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">About This Book</h2>
            <p className="text-charcoal dark:text-dark-text leading-relaxed">{book.description || 'No description added for this book yet.'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="card text-center"><p className="text-sm text-warmgrey dark:text-dark-sub">Pages</p><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{book.pages || '—'}</p></div>
              <div className="card text-center"><p className="text-sm text-warmgrey dark:text-dark-sub">Chapters</p><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{book.chapters}</p></div>
              <div className="card text-center"><p className="text-sm text-warmgrey dark:text-dark-sub">Published</p><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{book.year || '—'}</p></div>
              <div className="card text-center"><p className="text-sm text-warmgrey dark:text-dark-sub">Genre</p><p className="text-xl font-serif font-bold text-forest-500 dark:text-dark-sage">{book.genre[0]}</p></div>
            </div>
            {book.reviewCommentary && (
              <div className="card border-l-4 border-forest-500 dark:border-dark-sage">
                <h3 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage mb-3">Our Review</h3>
                <p className="text-charcoal dark:text-dark-text leading-relaxed">{book.reviewCommentary}</p>
              </div>
            )}
            {book.whyRead && (
              <div className="card bg-sage-50 dark:bg-forest-800">
                <h3 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage mb-3">Why Read This Book?</h3>
                <p className="text-charcoal dark:text-dark-text leading-relaxed">{book.whyRead}</p>
              </div>
            )}
            {isCustom && (
              <div className="card bg-sage-50 dark:bg-forest-800">
                <p className="text-sm text-warmgrey dark:text-dark-sub">
                  This is a book you added yourself. Chapter guides, character info, and vocabulary are available for books in our catalogue, but you can still use all the reading tools below.
                </p>
              </div>
            )}

            {/* AI Explain section */}
            <div className="card bg-sage-50 dark:bg-forest-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                <h3 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage">AI Chapter Recap</h3>
              </div>
              <p className="text-sm text-warmgrey dark:text-dark-sub mb-4">Get a quick, spoiler-safe recap of everything that's happened so far.</p>
              {hasAIContent('explain') ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-charcoal dark:text-dark-text leading-relaxed whitespace-pre-wrap">{aiContent.explain}</p>
                </div>
              ) : (
                <button onClick={() => handleAIAction('explain')} disabled={isAILoading('explain')} className="btn-accent">
                  {isAILoading('explain') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isAILoading('explain') ? 'Generating...' : 'Generate Recap'}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chapter-guide' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Chapter Companion</h2>
              <span className="badge-terra"><Shield className="w-3 h-3" /> {upTo.charAt(0).toUpperCase() + upTo.slice(1)}</span>
            </div>

            {/* AI-generated guide */}
            <div className="card border-l-4 border-sage-400 dark:border-dark-sage">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                  <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">AI-Generated Guide</h3>
                </div>
                {!hasAIContent('chapter-guide') && (
                  <button onClick={() => handleAIAction('chapter-guide')} disabled={isAILoading('chapter-guide')} className="btn-accent text-sm">
                    {isAILoading('chapter-guide') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAILoading('chapter-guide') ? 'Generating...' : 'Generate with AI'}
                  </button>
                )}
              </div>
              {hasAIContent('chapter-guide') ? (
                <p className="text-charcoal dark:text-dark-text leading-relaxed whitespace-pre-wrap">{aiContent['chapter-guide']}</p>
              ) : !isAILoading('chapter-guide') && (
                <p className="text-sm text-warmgrey dark:text-dark-sub">Get an AI-powered summary, key events, and discussion points for {upTo}.</p>
              )}
            </div>

            {/* Static chapter data */}
            {chapters.length > 0 && (
              <>
                <h3 className="text-lg font-serif font-bold text-forest-500 dark:text-dark-sage pt-2">Catalogue Chapter Guides</h3>
                {chapters.map(ch => (
                  <div key={ch.number} className="card">
                    <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage mb-2">
                      Chapter {ch.number}: {ch.title}
                    </h3>
                    <p className="text-charcoal dark:text-dark-text leading-relaxed mb-3">{ch.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {ch.themes.map(t => <span key={t} className="badge-sage">{t}</span>)}
                    </div>
                  </div>
                ))}
              </>
            )}
            {!hasAIContent('chapter-guide') && chapters.length === 0 && !isAILoading('chapter-guide') && (
              <div className="card text-center py-8">
                <p className="text-warmgrey dark:text-dark-sub">No built-in guide for {upTo} yet. Use the AI guide above for notes on exactly where you are.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Characters</h2>
              <span className="badge-terra"><Shield className="w-3 h-3" /> Up to Chapter {selectedChapter}</span>
            </div>

            {/* AI-generated characters */}
            <div className="card border-l-4 border-sage-400 dark:border-dark-sage">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                  <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">AI Character Analysis</h3>
                </div>
                {!hasAIContent('characters') && (
                  <button onClick={() => handleAIAction('characters')} disabled={isAILoading('characters')} className="btn-accent text-sm">
                    {isAILoading('characters') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAILoading('characters') ? 'Analyzing...' : 'Generate with AI'}
                  </button>
                )}
              </div>
              {hasAIContent('characters') ? (
                <p className="text-charcoal dark:text-dark-text leading-relaxed whitespace-pre-wrap">{aiContent.characters}</p>
              ) : (
                <p className="text-sm text-warmgrey dark:text-dark-sub">Get AI-powered character descriptions based only on what's happened through chapter {selectedChapter}.</p>
              )}
            </div>

            {/* Static character data */}
            {characters.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters.map(char => (
                  <div key={char.name} className="card">
                    <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">{char.name}</h3>
                    <p className="text-sm text-sage-400 dark:text-dark-sage mb-2">{char.role}</p>
                    <p className="text-sm text-charcoal dark:text-dark-text leading-relaxed mb-3">{char.description}</p>
                    {char.family && char.family.length > 0 && (
                      <p className="text-xs text-warmgrey dark:text-dark-sub"><strong>Family:</strong> {char.family.join(', ')}</p>
                    )}
                    {char.friends && char.friends.length > 0 && (
                      <p className="text-xs text-warmgrey dark:text-dark-sub"><strong>Friends:</strong> {char.friends.join(', ')}</p>
                    )}
                    {char.enemies && char.enemies.length > 0 && (
                      <p className="text-xs text-warmgrey dark:text-dark-sub"><strong>Enemies:</strong> {char.enemies.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Themes</h2>

            <div className="card border-l-4 border-sage-400 dark:border-dark-sage">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                  <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">AI Theme Analysis</h3>
                </div>
                {!hasAIContent('themes') && (
                  <button onClick={() => handleAIAction('themes')} disabled={isAILoading('themes')} className="btn-accent text-sm">
                    {isAILoading('themes') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAILoading('themes') ? 'Analyzing...' : 'Generate with AI'}
                  </button>
                )}
              </div>
              {hasAIContent('themes') ? (
                <p className="text-charcoal dark:text-dark-text leading-relaxed whitespace-pre-wrap">{aiContent.themes}</p>
              ) : (
                <p className="text-sm text-warmgrey dark:text-dark-sub">Let AI identify and explain the key themes developing through chapter {selectedChapter}.</p>
              )}
            </div>

            {themes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themes.map(theme => (
                  <div key={theme} className="card">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                      <h3 className="font-serif font-bold text-forest-500 dark:text-dark-sage">{theme}</h3>
                    </div>
                    <p className="text-sm text-charcoal dark:text-dark-text leading-relaxed">
                      This theme is explored throughout the book up to your current chapter.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Discussion Questions</h2>
              <span className="badge-terra"><Shield className="w-3 h-3" /> Up to Chapter {selectedChapter}</span>
            </div>

            <div className="card border-l-4 border-sage-400 dark:border-dark-sage">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">AI-Generated Questions</h3>
              </div>
              {aiQuestions.length > 0 ? (
                <div className="space-y-3">
                  {aiQuestions.map((q, i) => (
                    <div key={i} className="p-3 rounded-lg bg-sage-50 dark:bg-forest-700">
                      <p className="text-charcoal dark:text-dark-text">{q}</p>
                    </div>
                  ))}
                  <button onClick={() => handleAIAction('questions')} disabled={isAILoading('questions')} className="btn-ghost text-sm">
                    {isAILoading('questions') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate New Set
                  </button>
                </div>
              ) : (
                <button onClick={() => handleAIAction('questions')} disabled={isAILoading('questions')} className="btn-accent">
                  {isAILoading('questions') ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                  {isAILoading('questions') ? 'Generating Questions...' : 'Generate AI Questions'}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vocabulary' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Vocabulary</h2>

            <div className="card border-l-4 border-sage-400 dark:border-dark-sage">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
                  <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">AI Vocabulary Highlights</h3>
                </div>
                {!hasAIContent('vocabulary') && (
                  <button onClick={() => handleAIAction('vocabulary')} disabled={isAILoading('vocabulary')} className="btn-accent text-sm">
                    {isAILoading('vocabulary') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isAILoading('vocabulary') ? 'Finding words...' : 'Generate with AI'}
                  </button>
                )}
              </div>
              {hasAIContent('vocabulary') ? (
                <p className="text-charcoal dark:text-dark-text leading-relaxed whitespace-pre-wrap">{aiContent.vocabulary}</p>
              ) : (
                <p className="text-sm text-warmgrey dark:text-dark-sub">Let AI highlight notable words and phrases from chapters 1-{selectedChapter}.</p>
              )}
            </div>

            {chapters.flatMap(ch => ch.vocabulary).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.flatMap(ch => ch.vocabulary).map((v, i) => (
                  <div key={i} className="card">
                    <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">{v.word}</h3>
                    <p className="text-sm text-charcoal dark:text-dark-text mt-1">{v.definition}</p>
                    <p className="text-xs text-warmgrey dark:text-dark-sub mt-2 italic">Context: {v.context}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'related' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Related Books</h2>
            {relatedBooks.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedBooks.map(b => (
                    <BookCover key={b.id} book={b} size="md" to={`/book/${b.slug}`} />
                  ))}
                </div>
                <div className="card bg-sage-50 dark:bg-forest-800">
                  <p className="text-sm text-warmgrey dark:text-dark-sub">
                    Not sure what to read next? <Link to="/tools/what-should-i-read-next" className="link-internal">Find Your Next Book →</Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="card text-center py-8">
                <p className="text-warmgrey dark:text-dark-sub">Related books are available for books in our catalogue.</p>
                <p className="text-sm mt-2">
                  <Link to="/books" className="link-internal">Explore our book catalogue →</Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chapter complete section */}
      <div className="card mt-8 bg-sage-50 dark:bg-forest-800">
        <div className="text-center mb-6">
          <span className="badge-forest mb-4"><BookMarked className="w-3 h-3" /> Chapter {selectedChapter}</span>
          <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Chapter Complete</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">What did you think?</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your thoughts about this chapter..."
              className="input-field min-h-[100px]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-forest-500 dark:text-dark-sage mb-2">What do you think happens next?</label>
            <textarea
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="Make a prediction about what happens next..."
              className="input-field min-h-[100px]"
            />
          </div>
          {savedMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-sage-50 dark:bg-forest-700 text-sage-600 dark:text-dark-sage text-sm">
              <Shield className="w-4 h-4" /> Saved! Your progress has been recorded.
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleSaveReflection} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
            <button
              onClick={() => setSelectedChapter(Math.min(selectedChapter + 1, Math.max(1, book.chapters)))}
              className="btn-accent"
            >
              Yes, Continue <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn-ghost">Not Yet</button>
          </div>
        </div>
      </div>

      <AdPlaceholder format="leaderboard" />

      {/* AI Book Club Chat */}
      <div className="card mt-8 border-l-4 border-forest-500 dark:border-dark-sage">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-forest-500 dark:text-dark-sage" />
            <h2 className="text-2xl font-serif font-bold text-forest-500 dark:text-dark-sage">Talk To Your Book Club</h2>
          </div>
          {isPremium && <span className="badge-forest"><Crown className="w-3 h-3" /> Premium</span>}
        </div>
        <p className="text-warmgrey dark:text-dark-sub mb-4">Ask questions about "{book.title}" and get spoiler-safe AI answers based on your current chapter ({selectedChapter}).</p>

        {/* Quick question buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => { setChatInput(q); }}
              className="btn-ghost text-sm"
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Chat messages */}
        {chatMessages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-forest-500 dark:bg-forest-400 text-ivory dark:text-dark-bg'
                    : 'bg-sage-50 dark:bg-forest-700 text-charcoal dark:text-dark-text'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-sage-50 dark:bg-forest-700 p-3 rounded-xl">
                  <Loader2 className="w-5 h-5 text-sage-400 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
            placeholder="Ask a question about the book..."
            className="input-field flex-1"
          />
          <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="btn-accent">
            {chatLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        {/* Things you may have missed */}
        <div className="mt-6 pt-6 border-t border-stone dark:border-dark-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-sage-400 dark:text-dark-sage" />
            <h3 className="font-serif font-bold text-lg text-forest-500 dark:text-dark-sage">Things You May Have Missed</h3>
          </div>
          {hasAIContent('missed-details') ? (
            <p className="text-charcoal dark:text-dark-text leading-relaxed whitespace-pre-wrap">{aiContent['missed-details']}</p>
          ) : (
            <button onClick={() => handleAIAction('missed-details')} disabled={isAILoading('missed-details')} className="btn-outline text-sm">
              {isAILoading('missed-details') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isAILoading('missed-details') ? 'Finding details...' : 'Reveal Hidden Details'}
            </button>
          )}
        </div>

        {!user && (
          <p className="text-sm text-warmgrey dark:text-dark-sub mt-4">
            <Link to="/signin" className="link-internal">Sign in</Link> to chat with your AI book club.
          </p>
        )}
        {!isPremium && user && !subLoading && (
          <p className="text-sm text-warmgrey dark:text-dark-sub mt-4">
            Free plan includes 3 AI requests per day. <Link to="/pricing" className="link-internal">Upgrade to Premium</Link> for unlimited access.
          </p>
        )}
      </div>
    </div>
  );
}
