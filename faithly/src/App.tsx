import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabase';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import SetupPage from './pages/SetupPage';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import TodayPage from './pages/TodayPage';
import BiblePage from './pages/BiblePage';
import ChapterPage from './pages/ChapterPage';
import BibleSearchPage from './pages/BibleSearchPage';
import AskPage from './pages/AskPage';
import ChatPage from './pages/ChatPage';
import JourneysPage from './pages/JourneysPage';
import JourneyDetailPage from './pages/JourneyDetailPage';
import JourneyDayPage from './pages/JourneyDayPage';
import YouPage from './pages/YouPage';
import JournalPage from './pages/JournalPage';
import JournalEditorPage from './pages/JournalEditorPage';
import PrayersPage from './pages/PrayersPage';
import SavedPage from './pages/SavedPage';
import SettingsPage from './pages/SettingsPage';
import DevotionalsPage from './pages/DevotionalsPage';
import DevotionalPage from './pages/DevotionalPage';
import PremiumPage from './pages/PremiumPage';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import NotFoundPage from './pages/NotFoundPage';

// Less-frequently used areas are split into separate chunks.
const StudyPage = lazy(() => import('./pages/StudyPage'));
const AudioPage = lazy(() => import('./pages/AudioPage'));
const PlayerPage = lazy(() => import('./pages/PlayerPage'));
const GamesPage = lazy(() => import('./pages/games/GamesPage'));
const TriviaGame = lazy(() => import('./pages/games/TriviaGame'));
const CompleteScriptureGame = lazy(() => import('./pages/games/CompleteScriptureGame'));
const BookOrderGame = lazy(() => import('./pages/games/BookOrderGame'));
const FlashcardsPage = lazy(() => import('./pages/games/FlashcardsPage'));
const WallpaperPage = lazy(() => import('./pages/WallpaperPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

export default function App() {
  const { loading, session, profile } = useAuth();
  const location = useLocation();

  if (!isConfigured) return <SetupPage />;
  if (loading) return <div className="grid min-h-dvh place-items-center"><Spinner label="Opening Faithly" /></div>;

  // Public routes
  if (!session) {
    return (
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/auth/:mode" element={<AuthPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<Navigate to="/welcome" replace state={{ from: location.pathname }} />} />
      </Routes>
    );
  }

  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding' && location.pathname !== '/auth/update-password') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
        <Route path="/welcome" element={<Navigate to="/" replace />} />
        <Route path="/auth/*" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route index element={<TodayPage />} />
          <Route path="bible" element={<BiblePage />} />
          <Route path="bible/search" element={<BibleSearchPage />} />
          <Route path="bible/:book/:chapter" element={<ChapterPage />} />
          <Route path="study/:book/:chapter" element={<StudyPage />} />
          <Route path="ask" element={<AskPage />} />
          <Route path="ask/:id" element={<ChatPage />} />
          <Route path="journeys" element={<JourneysPage />} />
          <Route path="journeys/:slug" element={<JourneyDetailPage />} />
          <Route path="journeys/:slug/day/:day" element={<JourneyDayPage />} />
          <Route path="devotionals" element={<DevotionalsPage />} />
          <Route path="devotionals/:slug" element={<DevotionalPage />} />
          <Route path="audio" element={<AudioPage />} />
          <Route path="audio/player" element={<PlayerPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/trivia" element={<TriviaGame />} />
          <Route path="games/character" element={<TriviaGame category="character" />} />
          <Route path="games/daily" element={<TriviaGame daily />} />
          <Route path="games/complete" element={<CompleteScriptureGame />} />
          <Route path="games/books" element={<BookOrderGame />} />
          <Route path="games/flashcards" element={<FlashcardsPage />} />
          <Route path="wallpaper" element={<WallpaperPage />} />
          <Route path="you" element={<YouPage />} />
          <Route path="you/journal" element={<JournalPage />} />
          <Route path="you/journal/new" element={<JournalEditorPage />} />
          <Route path="you/journal/:id" element={<JournalEditorPage />} />
          <Route path="you/prayers" element={<PrayersPage />} />
          <Route path="you/saved" element={<SavedPage />} />
          <Route path="you/settings" element={<SettingsPage />} />
          <Route path="premium" element={<PremiumPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
