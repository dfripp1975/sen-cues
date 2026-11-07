import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

// Every page is split into its own chunk, so a visitor
// landing on one tool does not download the whole book and tool database.
function lazyPage<K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  name: K,
) {
  return lazy(() => load().then(m => ({ default: m[name] })));
}

const ToolsDirectoryPage = lazyPage(() => import('@/pages/ToolsDirectoryPage'), 'ToolsDirectoryPage');
const BooksDirectoryPage = lazyPage(() => import('@/pages/BooksDirectoryPage'), 'BooksDirectoryPage');
const BookDetailPage = lazyPage(() => import('@/pages/BookDetailPage'), 'BookDetailPage');
const LibraryPage = lazyPage(() => import('@/pages/LibraryPage'), 'LibraryPage');
const AddBookPage = lazyPage(() => import('@/pages/AddBookPage'), 'AddBookPage');
const DashboardPage = lazyPage(() => import('@/pages/DashboardPage'), 'DashboardPage');
const ReadingGoalsPage = lazyPage(() => import('@/pages/ReadingGoalsPage'), 'ReadingGoalsPage');
const PricingPage = lazyPage(() => import('@/pages/PricingPage'), 'PricingPage');
const SignInPage = lazyPage(() => import('@/pages/SignInPage'), 'SignInPage');
const SignUpPage = lazyPage(() => import('@/pages/SignUpPage'), 'SignUpPage');
const NotFoundPage = lazyPage(() => import('@/pages/NotFoundPage'), 'NotFoundPage');
const AboutPage = lazyPage(() => import('@/pages/AboutPage'), 'AboutPage');
const ContactPage = lazyPage(() => import('@/pages/ContactPage'), 'ContactPage');
const PrivacyPage = lazyPage(() => import('@/pages/PrivacyPage'), 'PrivacyPage');
const CookiesPage = lazyPage(() => import('@/pages/CookiesPage'), 'CookiesPage');
const TermsPage = lazyPage(() => import('@/pages/TermsPage'), 'TermsPage');
const DisclaimerPage = lazyPage(() => import('@/pages/DisclaimerPage'), 'DisclaimerPage');
const BookClubQuestionGenerator = lazyPage(() => import('@/pages/tools/BookClubQuestionGenerator'), 'BookClubQuestionGenerator');
const WhatShouldIReadNext = lazyPage(() => import('@/pages/tools/WhatShouldIReadNext'), 'WhatShouldIReadNext');
const CharacterRelationshipTracker = lazyPage(() => import('@/pages/tools/CharacterRelationshipTracker'), 'CharacterRelationshipTracker');
const ReadingTimeCalculator = lazyPage(() => import('@/pages/tools/ReadingTimeCalculator'), 'ReadingTimeCalculator');
const BookVocabularyHelper = lazyPage(() => import('@/pages/tools/BookVocabularyHelper'), 'BookVocabularyHelper');
const BookClubNameGenerator = lazyPage(() => import('@/pages/tools/BookClubNameGenerator'), 'BookClubNameGenerator');
const PagesPerDayCalculator = lazyPage(() => import('@/pages/tools/PagesPerDayCalculator'), 'PagesPerDayCalculator');
const HowLongToRead = lazyPage(() => import('@/pages/tools/HowLongToRead'), 'HowLongToRead');
const RandomBookPicker = lazyPage(() => import('@/pages/tools/RandomBookPicker'), 'RandomBookPicker');
const ReadingGoalCalculator = lazyPage(() => import('@/pages/tools/ReadingGoalCalculator'), 'ReadingGoalCalculator');
const ReadingChallengeGenerator = lazyPage(() => import('@/pages/tools/ReadingChallengeGenerator'), 'ReadingChallengeGenerator');
const BookClubIcebreakerGenerator = lazyPage(() => import('@/pages/tools/BookClubIcebreakerGenerator'), 'BookClubIcebreakerGenerator');
const BookClubMeetingPlanner = lazyPage(() => import('@/pages/tools/BookClubMeetingPlanner'), 'BookClubMeetingPlanner');
const BookClubScheduleGenerator = lazyPage(() => import('@/pages/tools/BookClubScheduleGenerator'), 'BookClubScheduleGenerator');
const BookClubInvitationMaker = lazyPage(() => import('@/pages/tools/BookClubInvitationMaker'), 'BookClubInvitationMaker');
const ReadingListMaker = lazyPage(() => import('@/pages/tools/ReadingListMaker'), 'ReadingListMaker');
const BookGenreFinder = lazyPage(() => import('@/pages/tools/BookGenreFinder'), 'BookGenreFinder');
const ReadingStreakTracker = lazyPage(() => import('@/pages/tools/ReadingStreakTracker'), 'ReadingStreakTracker');
const RandomBookClubQuestion = lazyPage(() => import('@/pages/tools/RandomBookClubQuestion'), 'RandomBookClubQuestion');
const BookRatingCalculator = lazyPage(() => import('@/pages/tools/BookRatingCalculator'), 'BookRatingCalculator');

// "/" belongs to the cinematic front page (index.html). If the app is ever
// routed there client-side, hand over with a real page load.
function FrontDoor() {
  useEffect(() => { window.location.replace('/'); }, []);
  return <PageFallback />;
}

function PageFallback() {
  return (
    <div className="container-page py-24" aria-busy="true" aria-live="polite">
      <div className="h-3 w-24 rounded-full bg-stone/70 dark:bg-dark-border animate-pulse" />
      <div className="mt-5 h-10 w-2/3 max-w-xl rounded-xl bg-stone/70 dark:bg-dark-border animate-pulse" />
      <div className="mt-4 h-4 w-1/2 max-w-md rounded-full bg-stone/50 dark:bg-dark-border animate-pulse" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ScrollToTop />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] btn-primary">
          Skip to content
        </a>
        <div className="min-h-screen flex flex-col bg-paper dark:bg-dark-bg">
          <Header />
          <main id="main" className="flex-1">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<FrontDoor />} />
                <Route path="/tools" element={<ToolsDirectoryPage />} />
                <Route path="/tools/book-club-question-generator" element={<BookClubQuestionGenerator />} />
                <Route path="/tools/what-should-i-read-next" element={<WhatShouldIReadNext />} />
                <Route path="/tools/character-relationship-tracker" element={<CharacterRelationshipTracker />} />
                <Route path="/tools/reading-time-calculator" element={<ReadingTimeCalculator />} />
                <Route path="/tools/book-vocabulary-helper" element={<BookVocabularyHelper />} />
                <Route path="/tools/book-club-name-generator" element={<BookClubNameGenerator />} />
                <Route path="/tools/pages-per-day-calculator" element={<PagesPerDayCalculator />} />
                <Route path="/tools/how-long-to-read" element={<HowLongToRead />} />
                <Route path="/tools/random-book-picker" element={<RandomBookPicker />} />
                <Route path="/tools/reading-goal-calculator" element={<ReadingGoalCalculator />} />
                <Route path="/tools/reading-challenge-generator" element={<ReadingChallengeGenerator />} />
                <Route path="/tools/book-club-icebreaker-generator" element={<BookClubIcebreakerGenerator />} />
                <Route path="/tools/book-club-meeting-planner" element={<BookClubMeetingPlanner />} />
                <Route path="/tools/book-club-schedule-generator" element={<BookClubScheduleGenerator />} />
                <Route path="/tools/book-club-invitation-maker" element={<BookClubInvitationMaker />} />
                <Route path="/tools/reading-list-maker" element={<ReadingListMaker />} />
                <Route path="/tools/book-genre-finder" element={<BookGenreFinder />} />
                <Route path="/tools/reading-streak-tracker" element={<ReadingStreakTracker />} />
                <Route path="/tools/random-book-club-question" element={<RandomBookClubQuestion />} />
                <Route path="/tools/book-rating-calculator" element={<BookRatingCalculator />} />
                <Route path="/books" element={<BooksDirectoryPage />} />
                <Route path="/book/:slug" element={<BookDetailPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/library/add" element={<AddBookPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/reading-goals" element={<ReadingGoalsPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/cookies" element={<CookiesPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/disclaimer" element={<DisclaimerPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <CookieConsentBanner />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
