import { supabase } from '@/lib/supabase';
import { books } from '@/data/books';

export interface DashboardStats {
  currentlyReading: number;
  booksCompleted: number;
  pagesRead: number;
  totalReadingMinutes: number;
  currentStreak: number;
  longestStreak: number;
  goalProgress: { completed: number; target: number } | null;
  favouriteGenres: { genre: string; count: number }[];
  recentSessions: {
    id: string;
    book_slug: string;
    pages_read: number;
    minutes_read: number;
    session_date: string;
    notes: string | null;
  }[];
}

export interface ReadingSessionInput {
  bookSlug: string;
  pagesRead: number;
  minutesRead: number;
  sessionDate?: string;
  notes?: string;
}

export const ReadingStatsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        currentlyReading: 0,
        booksCompleted: 0,
        pagesRead: 0,
        totalReadingMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        goalProgress: null,
        favouriteGenres: [],
        recentSessions: [],
      };
    }

    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;

    const [userBooks, sessions, goal] = await Promise.all([
      supabase
        .from('user_books')
        .select('status, book_slug, rating, start_date, finish_date')
        .eq('user_id', user.id),
      supabase
        .from('reading_sessions')
        .select('id, book_slug, pages_read, minutes_read, session_date, notes')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(10),
      supabase
        .from('reading_goals')
        .select('goal_books, target_pages, goal_type, year')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .maybeSingle(),
    ]);

    const ub = userBooks.data || [];
    const allSessions = sessions.data || [];

    const currentlyReading = ub.filter(b => b.status === 'currently-reading').length;
    const completedThisYear = ub.filter(b =>
      b.status === 'completed' && b.finish_date && b.finish_date >= yearStart
    ).length;

    const totalPages = allSessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
    const totalMinutes = allSessions.reduce((sum, s) => sum + (s.minutes_read || 0), 0);

    const { currentStreak, longestStreak } = this.calculateStreak(allSessions);

    const goalProgress = goal?.data
      ? { completed: completedThisYear, target: goal.data.goal_books || 0 }
      : null;

    const genreMap = new Map<string, number>();
    for (const ubRow of ub) {
      const book = books.find(b => b.slug === ubRow.book_slug);
      if (book) {
        for (const g of book.genre) {
          genreMap.set(g, (genreMap.get(g) || 0) + 1);
        }
      }
    }
    const favouriteGenres = Array.from(genreMap.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      currentlyReading,
      booksCompleted: completedThisYear,
      pagesRead: totalPages,
      totalReadingMinutes: totalMinutes,
      currentStreak,
      longestStreak,
      goalProgress,
      favouriteGenres,
      recentSessions: allSessions.slice(0, 5),
    };
  },

  calculateStreak(sessions: { session_date: string }[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const dates = Array.from(
      new Set(sessions.map(s => s.session_date))
    ).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(dates[dates.length - 1]);
    lastDate.setHours(0, 0, 0, 0);
    const diffToToday = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffToToday <= 1) {
      let streak = 1;
      for (let i = dates.length - 1; i > 0; i--) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
      currentStreak = streak;
    }

    return { currentStreak, longestStreak };
  },

  async logSession(input: ReadingSessionInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reading_sessions')
      .insert({
        user_id: user.id,
        book_slug: input.bookSlug,
        pages_read: input.pagesRead,
        minutes_read: input.minutesRead,
        session_date: input.sessionDate || new Date().toISOString().split('T')[0],
        notes: input.notes || null,
      });

    if (error) throw error;
  },

  async getSessions(bookSlug?: string): Promise<ReadingSessionInput[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('session_date', { ascending: false });

    if (bookSlug) {
      query = query.eq('book_slug', bookSlug);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data || []) as unknown as ReadingSessionInput[];
  },

  async deleteSession(sessionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reading_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async getReadingGoal(year?: number): Promise<{
    goal_books: number;
    target_pages: number;
    goal_type: string;
    year: number;
  } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const targetYear = year || new Date().getFullYear();

    const { data, error } = await supabase
      .from('reading_goals')
      .select('goal_books, target_pages, goal_type, year')
      .eq('user_id', user.id)
      .eq('year', targetYear)
      .maybeSingle();

    if (error) return null;
    return data as { goal_books: number; target_pages: number; goal_type: string; year: number } | null;
  },

  async setReadingGoal(goalBooks: number, goalType: string, targetPages: number, year?: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetYear = year || new Date().getFullYear();

    const { error } = await supabase
      .from('reading_goals')
      .upsert({
        user_id: user.id,
        goal_books: goalBooks,
        goal_type: goalType,
        target_pages: targetPages,
        year: targetYear,
      }, {
        onConflict: 'user_id,year',
      });

    if (error) throw error;
  },
};
