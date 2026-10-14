import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';
import { parseReference, formatReference, displayReference, type PassageRef } from './bibleRef.ts';

export interface VerifiedPassage {
  reference: string;       // canonical display form, e.g. "Psalm 23:1-3"
  bookId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  translation: string;
  verses: { verse: number; text: string }[];
  note?: string;           // AI's reason for citing it (commentary, not Scripture)
}

const MAX_VERSES_PER_PASSAGE = 12;

/** Load the text of a parsed reference from bible_verses. Returns null if it does not exist. */
export async function loadPassage(db: SupabaseClient, ref: PassageRef, translation = 'WEB'): Promise<VerifiedPassage | null> {
  const start = ref.verseStart ?? 1;
  let end = ref.verseEnd ?? start + MAX_VERSES_PER_PASSAGE - 1;
  if (end - start + 1 > MAX_VERSES_PER_PASSAGE) end = start + MAX_VERSES_PER_PASSAGE - 1;
  const { data, error } = await db
    .from('bible_verses')
    .select('verse, text')
    .eq('translation_code', translation)
    .eq('book_id', ref.bookId)
    .eq('chapter', ref.chapter)
    .gte('verse', start)
    .lte('verse', end)
    .order('verse');
  if (error || !data || data.length === 0) return null;
  // Every requested verse must exist (except verses the translation omits in the middle of a range).
  if (data[0].verse !== start) return null;
  if (ref.verseEnd != null && data[data.length - 1].verse < Math.min(end, ref.verseEnd)) return null;
  const last = data[data.length - 1].verse;
  const norm = { bookId: ref.bookId, chapter: ref.chapter, verseStart: start, verseEnd: last };
  return {
    reference: displayReference(norm),
    bookId: ref.bookId,
    chapter: ref.chapter,
    verseStart: start,
    verseEnd: last,
    translation,
    verses: data,
  };
}

/**
 * Turn AI-suggested references into verified passages. Anything that does not parse
 * or does not exist in the Bible database is dropped and reported separately, so an
 * invented reference is never shown to the user as Scripture.
 */
export async function verifyReferences(
  db: SupabaseClient,
  items: { reference: string; note?: string }[],
  translation = 'WEB',
  limit = 5,
): Promise<{ passages: VerifiedPassage[]; unverified: string[] }> {
  const passages: VerifiedPassage[] = [];
  const unverified: string[] = [];
  const seen = new Set<string>();
  for (const item of (items ?? []).slice(0, limit + 3)) {
    if (!item || typeof item.reference !== 'string') continue;
    const ref = parseReference(item.reference);
    if (!ref) {
      unverified.push(item.reference);
      continue;
    }
    const key = formatReference(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    const p = await loadPassage(db, ref, translation);
    if (!p) {
      unverified.push(item.reference);
      continue;
    }
    if (item.note) p.note = String(item.note).slice(0, 400);
    passages.push(p);
    if (passages.length >= limit) break;
  }
  return { passages, unverified };
}

export function passageToPlainText(p: VerifiedPassage): string {
  return `${p.reference} (${p.translation}): ` + p.verses.map((v) => `[${v.verse}] ${v.text}`).join(' ');
}
