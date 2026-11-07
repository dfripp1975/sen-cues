import { supabase } from '@/lib/supabase';
import { books } from '@/data/books';
import type { Book } from '@/types';

export type ReadingStatus = 'want-to-read' | 'currently-reading' | 'completed' | 'paused' | 'did-not-finish';

export interface UserBook {
  book_slug: string;
  status: ReadingStatus;
  current_chapter: number;
  total_chapters: number;
  current_page: number;
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  personal_notes: string | null;
}

export const UserLibraryService = {
  async addBook(bookSlug: string, status: ReadingStatus = 'want-to-read', currentChapter: number = 0) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const book = books.find(b => b.slug === bookSlug);
    if (!book) throw new Error('Book not found');

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('user_books')
      .upsert({
        user_id: user.id,
        book_slug: bookSlug,
        status,
        current_chapter: currentChapter,
        total_chapters: book.chapters,
        start_date: status === 'currently-reading' ? today : null,
        finish_date: status === 'completed' ? today : null,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async removeBook(bookSlug: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug);

    if (error) throw error;
  },

  async getBooks(): Promise<UserBook[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_books')
      .select('book_slug, status, current_chapter, total_chapters, current_page, start_date, finish_date, rating, personal_notes')
      .eq('user_id', user.id);

    if (error) return [];
    return (data || []) as UserBook[];
  },

  async updateProgress(bookSlug: string, currentChapter: number, currentPage?: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, unknown> = {
      current_chapter: currentChapter,
      updated_at: new Date().toISOString(),
    };
    if (currentPage !== undefined) {
      updates.current_page = currentPage;
    }

    const { error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug);

    if (error) throw error;
  },

  async updateStatus(bookSlug: string, status: ReadingStatus) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    const today = new Date().toISOString().split('T')[0];
    if (status === 'currently-reading') {
      updates.start_date = today;
    }
    if (status === 'completed') {
      updates.finish_date = today;
    }

    const { error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug);

    if (error) throw error;
  },

  async updateRating(bookSlug: string, rating: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_books')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug);

    if (error) throw error;
  },

  async updateNotes(bookSlug: string, notes: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_books')
      .update({ personal_notes: notes, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug);

    if (error) throw error;
  },

  async updateDates(bookSlug: string, startDate?: string | null, finishDate?: string | null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (startDate !== undefined) updates.start_date = startDate;
    if (finishDate !== undefined) updates.finish_date = finishDate;

    const { error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug);

    if (error) throw error;
  },

  getBookFromCatalog(slug: string): Book | undefined {
    return books.find(b => b.slug === slug);
  },
};
