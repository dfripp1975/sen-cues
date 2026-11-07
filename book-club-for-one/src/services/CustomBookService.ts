import { supabase } from '@/lib/supabase';
import type { Book } from '@/types';

export interface CustomBook {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  author: string;
  year: number | null;
  genre: string[];
  pages: number | null;
  chapters: number;
  description: string | null;
  isbn: string | null;
  cover_color: string;
  cover_accent: string;
  status: string;
  current_chapter: number;
  created_at: string;
  updated_at: string;
}

export interface CustomBookInput {
  title: string;
  author: string;
  year?: number;
  genre?: string[];
  pages?: number;
  chapters?: number;
  description?: string;
  isbn?: string;
  cover_color?: string;
  cover_accent?: string;
}

const COVER_COLORS = [
  { color: '#24483A', accent: '#C96745' },
  { color: '#172B22', accent: '#789B83' },
  { color: '#4D2615', accent: '#C96745' },
  { color: '#1E3A2F', accent: '#DD9269' },
  { color: '#384D3F', accent: '#EAB49C' },
  { color: '#2D3530', accent: '#C2D4C9' },
  { color: '#1A2E1A', accent: '#C96745' },
  { color: '#0D1B3E', accent: '#789B83' },
  { color: '#4A1E1E', accent: '#EAB49C' },
  { color: '#3A5F4D', accent: '#DD9269' },
];

export function randomCoverColors(): { color: string; accent: string } {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'custom-book';
}

export function toBook(custom: CustomBook): Book {
  return {
    id: custom.id,
    slug: `custom-${custom.slug}`,
    title: custom.title,
    author: custom.author,
    authorId: 'custom',
    year: custom.year ?? 0,
    genre: custom.genre.length > 0 ? custom.genre : ['Custom'],
    subgenres: [],
    pages: custom.pages ?? 0,
    chapters: custom.chapters,
    description: custom.description ?? '',
    coverColor: custom.cover_color,
    coverAccent: custom.cover_accent,
    isbn: custom.isbn ?? undefined,
    publicDomain: false,
  };
}

export const CustomBookService = {
  async getAll(): Promise<CustomBook[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('custom_books')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) return [];
    return (data as CustomBook[]) || [];
  },

  async getBySlug(slug: string): Promise<CustomBook | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('custom_books')
      .select('*')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .maybeSingle();

    if (error) return null;
    return data as CustomBook | null;
  },

  async create(input: CustomBookInput): Promise<CustomBook | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const colors = randomCoverColors();
    const slug = slugify(input.title);

    const { data, error } = await supabase
      .from('custom_books')
      .insert({
        user_id: user.id,
        slug,
        title: input.title,
        author: input.author,
        year: input.year ?? null,
        genre: input.genre ?? [],
        pages: input.pages ?? null,
        chapters: input.chapters ?? 1,
        description: input.description ?? null,
        isbn: input.isbn ?? null,
        cover_color: input.cover_color ?? colors.color,
        cover_accent: input.cover_accent ?? colors.accent,
        status: 'currently-reading',
        current_chapter: 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as CustomBook | null;
  },

  async update(slug: string, updates: Partial<CustomBookInput>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('custom_books')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('slug', slug);

    if (error) throw new Error(error.message);
  },

  async updateProgress(slug: string, currentChapter: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('custom_books')
      .update({ current_chapter: currentChapter, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('slug', slug);

    if (error) throw new Error(error.message);
  },

  async updateStatus(slug: string, status: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('custom_books')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('slug', slug);

    if (error) throw new Error(error.message);
  },

  async remove(slug: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('custom_books')
      .delete()
      .eq('user_id', user.id)
      .eq('slug', slug);

    if (error) throw new Error(error.message);
  },
};
