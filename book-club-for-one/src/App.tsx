import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import { AuthProvider } from '@/lib/auth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

import { HomePage } from '@/pages/HomePage';
import { ToolsDirectoryPage } from '@/pages/ToolsDirectoryPage';
import { BooksDirectoryPage } from '@/pages/BooksDirectoryPage';
import { BookDetailPage } from '@/pages/BookDetailPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { AddBookPage } from '@/pages/AddBookPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ReadingGoalsPage } from '@/pages/ReadingGoalsPage';
import { PricingPage } from '@/pages/PricingPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { CookiesPage } from '@/pages/CookiesPage';
import { TermsPage } from '@/pages/TermsPage';
import { DisclaimerPage } from '@/pages/DisclaimerPage';

import { BookClubQuestionGenerator } from '@/pages/tools/BookClubQuestionGenerator';
import { WhatShouldIReadNext } from '@/pages/tools/WhatShouldIReadNext';
import { CharacterRelationshipTracker } from '@/pages/tools/CharacterRelationshipTracker';
import { ReadingTimeCalculator } from '@/pages/tools/ReadingTimeCalculator';
import { BookVocabularyHelper } from '@/pages/tools/BookVocabularyHelper';
import { BookClubNameGenerator } from '@/pages/tools/BookClubNameGenerator';
import { PagesPerDayCalculator } from '@/pages/tools/PagesPerDayCalculator';
import { HowLongToRead } from '@/pages/tools/HowLongToRead';
import { RandomBookPicker } from '@/pages/tools/RandomBookPicker';
import { ReadingGoalCalculator } from '@/pages/tools/ReadingGoalCalculator';
import { ReadingChallengeGenerator } from '@/pages/tools/ReadingChallengeGenerator';
import { BookClubIcebreakerGenerator } from '@/pages/tools/BookClubIcebreakerGenerator';
import { BookClubMeetingPlanner } from '@/pages/tools/BookClubMeetingPlanner';
import { BookClubScheduleGenerator } from '@/pages/tools/BookClubScheduleGenerator';
import { BookClubInvitationMaker } from '@/pages/tools/BookClubInvitationMaker';
import { ReadingListMaker } from '@/pages/tools/ReadingListMaker';
import { BookGenreFinder } from '@/pages/tools/BookGenreFinder';
import { ReadingStreakTracker } from '@/pages/tools/ReadingStreakTracker';
import { RandomBookClubQuestion } from '@/pages/tools/RandomBookClubQuestion';
import { BookRatingCalculator } from '@/pages/tools/BookRatingCalculator';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-paper dark:bg-dark-bg">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
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
          </main>
          <Footer />
          <CookieConsentBanner />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
