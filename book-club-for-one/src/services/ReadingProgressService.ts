import { supabase } from '@/lib/supabase';

export const ReadingProgressService = {
  async saveProgress(bookSlug: string, currentChapter: number, totalChapters: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('chapter_progress')
      .upsert({
        user_id: user.id,
        book_slug: bookSlug,
        current_chapter: currentChapter,
        total_chapters: totalChapters,
        percentage: Math.round((currentChapter / totalChapters) * 100),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async getProgress(bookSlug: string): Promise<{ current_chapter: number; total_chapters: number; percentage: number } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('chapter_progress')
      .select('current_chapter, total_chapters, percentage')
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug)
      .maybeSingle();

    return data;
  },

  async saveNote(bookSlug: string, chapter: number, note: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        book_slug: bookSlug,
        chapter,
        note_text: note,
      });

    if (error) throw error;
  },

  async getNotes(bookSlug: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_slug', bookSlug)
      .order('created_at', { ascending: false });

    return data || [];
  },

  async savePrediction(bookSlug: string, chapter: number, prediction: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('predictions')
      .insert({
        user_id: user.id,
        book_slug: bookSlug,
        chapter,
        prediction_text: prediction,
      });

    if (error) throw error;
  },

  async saveReflection(bookSlug: string, chapter: number, reflection: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        book_slug: bookSlug,
        chapter,
        reflection_text: reflection,
      });

    if (error) throw error;
  },
};
