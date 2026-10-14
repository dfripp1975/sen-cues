import { supabase } from './supabase';
import type { Verse, VerifiedPassage } from './types';
import { BOOKS, bookById, displayReference, parseReference } from '../../supabase/functions/_shared/bibleRef';

export { BOOKS, bookById, displayReference, parseReference };
export const TRANSLATION = 'WEB';

const chapterCache = new Map<string, Verse[]>();

export async function fetchChapter(bookId: number, chapter: number, translation = TRANSLATION): Promise<Verse[]> {
  const key = `${translation}:${bookId}:${chapter}`;
  const hit = chapterCache.get(key);
  if (hit) return hit;
  const { data, error } = await supabase
    .from('bible_verses')
    .select('verse, text')
    .eq('translation_code', translation)
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .order('verse');
  if (error) throw error;
  chapterCache.set(key, data ?? []);
  return data ?? [];
}

export async function fetchPassage(bookId: number, chapter: number, verseStart: number, verseEnd: number, translation = TRANSLATION): Promise<VerifiedPassage> {
  const all = await fetchChapter(bookId, chapter, translation);
  const verses = all.filter((v) => v.verse >= verseStart && v.verse <= verseEnd);
  return {
    reference: displayReference({ bookId, chapter, verseStart, verseEnd }),
    bookId, chapter, verseStart, verseEnd, translation, verses,
  };
}

export async function fetchPassageByRef(ref: string): Promise<VerifiedPassage | null> {
  const r = parseReference(ref);
  if (!r) return null;
  const all = await fetchChapter(r.bookId, r.chapter);
  const vs = r.verseStart ?? 1;
  const ve = r.verseEnd ?? all.length;
  const p = await fetchPassage(r.bookId, r.chapter, vs, ve);
  return p.verses.length ? p : null;
}

export function passageText(p: Pick<VerifiedPassage, 'verses'>): string {
  return p.verses.map((v) => v.text).join(' ');
}

export function chapterPath(bookId: number, chapter: number, verse?: number) {
  const b = bookById(bookId);
  return `/bible/${b?.code.toLowerCase()}/${chapter}${verse ? `#v${verse}` : ''}`;
}

let translationNotice: string | null = null;
export async function getTranslationNotice(): Promise<string> {
  if (translationNotice) return translationNotice;
  const { data } = await supabase.from('bible_translations').select('name, copyright_notice').eq('code', TRANSLATION).maybeSingle();
  translationNotice = data ? `${data.name}. ${data.copyright_notice}` : 'World English Bible (public domain).';
  return translationNotice;
}
