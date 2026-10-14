// Bible book metadata and reference parsing.
// Pure TypeScript with no runtime imports so it can be shared by the web client
// (via Vite), the Deno Edge Functions and the Node seed checker.

export interface BookInfo {
  id: number;
  code: string;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
  aliases: string[];
}

const RAW: Array<[string, string, 'OT' | 'NT', number, string[]]> = [
  ['GEN', 'Genesis', 'OT', 50, ['gen', 'ge', 'gn']],
  ['EXO', 'Exodus', 'OT', 40, ['exod', 'exo', 'ex']],
  ['LEV', 'Leviticus', 'OT', 27, ['lev', 'le', 'lv']],
  ['NUM', 'Numbers', 'OT', 36, ['num', 'nu', 'nm']],
  ['DEU', 'Deuteronomy', 'OT', 34, ['deut', 'deu', 'dt']],
  ['JOS', 'Joshua', 'OT', 24, ['josh', 'jos']],
  ['JDG', 'Judges', 'OT', 21, ['judg', 'jdg', 'jg']],
  ['RUT', 'Ruth', 'OT', 4, ['ru', 'rth']],
  ['1SA', '1 Samuel', 'OT', 31, ['1 sam', '1sam', '1 sa', 'i samuel', 'first samuel']],
  ['2SA', '2 Samuel', 'OT', 24, ['2 sam', '2sam', '2 sa', 'ii samuel', 'second samuel']],
  ['1KI', '1 Kings', 'OT', 22, ['1 kgs', '1kgs', '1 ki', 'i kings', 'first kings']],
  ['2KI', '2 Kings', 'OT', 25, ['2 kgs', '2kgs', '2 ki', 'ii kings', 'second kings']],
  ['1CH', '1 Chronicles', 'OT', 29, ['1 chron', '1 chr', '1chr', 'i chronicles', 'first chronicles']],
  ['2CH', '2 Chronicles', 'OT', 36, ['2 chron', '2 chr', '2chr', 'ii chronicles', 'second chronicles']],
  ['EZR', 'Ezra', 'OT', 10, ['ezr']],
  ['NEH', 'Nehemiah', 'OT', 13, ['neh', 'ne']],
  ['EST', 'Esther', 'OT', 10, ['esth', 'est', 'es']],
  ['JOB', 'Job', 'OT', 42, ['jb']],
  ['PSA', 'Psalms', 'OT', 150, ['psalm', 'ps', 'psa', 'pss', 'psm']],
  ['PRO', 'Proverbs', 'OT', 31, ['prov', 'pro', 'prv', 'pr']],
  ['ECC', 'Ecclesiastes', 'OT', 12, ['eccl', 'ecc', 'eccles', 'qoheleth']],
  ['SNG', 'Song of Solomon', 'OT', 8, ['song of songs', 'song', 'sos', 'canticles', 'song of sol']],
  ['ISA', 'Isaiah', 'OT', 66, ['isa', 'is']],
  ['JER', 'Jeremiah', 'OT', 52, ['jer', 'je', 'jr']],
  ['LAM', 'Lamentations', 'OT', 5, ['lam', 'la']],
  ['EZK', 'Ezekiel', 'OT', 48, ['ezek', 'eze', 'ezk']],
  ['DAN', 'Daniel', 'OT', 12, ['dan', 'da', 'dn']],
  ['HOS', 'Hosea', 'OT', 14, ['hos', 'ho']],
  ['JOL', 'Joel', 'OT', 3, ['jl']],
  ['AMO', 'Amos', 'OT', 9, ['am']],
  ['OBA', 'Obadiah', 'OT', 1, ['obad', 'ob']],
  ['JON', 'Jonah', 'OT', 4, ['jnh', 'jon']],
  ['MIC', 'Micah', 'OT', 7, ['mic', 'mc']],
  ['NAM', 'Nahum', 'OT', 3, ['nah', 'na']],
  ['HAB', 'Habakkuk', 'OT', 3, ['hab', 'hb']],
  ['ZEP', 'Zephaniah', 'OT', 3, ['zeph', 'zep', 'zp']],
  ['HAG', 'Haggai', 'OT', 2, ['hag', 'hg']],
  ['ZEC', 'Zechariah', 'OT', 14, ['zech', 'zec', 'zc']],
  ['MAL', 'Malachi', 'OT', 4, ['mal', 'ml']],
  ['MAT', 'Matthew', 'NT', 28, ['matt', 'mat', 'mt']],
  ['MRK', 'Mark', 'NT', 16, ['mrk', 'mar', 'mk', 'mr']],
  ['LUK', 'Luke', 'NT', 24, ['luk', 'lk']],
  ['JHN', 'John', 'NT', 21, ['jhn', 'joh', 'jn']],
  ['ACT', 'Acts', 'NT', 28, ['act', 'ac', 'acts of the apostles']],
  ['ROM', 'Romans', 'NT', 16, ['rom', 'ro', 'rm']],
  ['1CO', '1 Corinthians', 'NT', 16, ['1 cor', '1cor', '1 co', 'i corinthians', 'first corinthians']],
  ['2CO', '2 Corinthians', 'NT', 13, ['2 cor', '2cor', '2 co', 'ii corinthians', 'second corinthians']],
  ['GAL', 'Galatians', 'NT', 6, ['gal', 'ga']],
  ['EPH', 'Ephesians', 'NT', 6, ['eph', 'ephes']],
  ['PHP', 'Philippians', 'NT', 4, ['phil', 'php', 'pp']],
  ['COL', 'Colossians', 'NT', 4, ['col', 'co']],
  ['1TH', '1 Thessalonians', 'NT', 5, ['1 thess', '1 thes', '1th', 'i thessalonians', 'first thessalonians']],
  ['2TH', '2 Thessalonians', 'NT', 3, ['2 thess', '2 thes', '2th', 'ii thessalonians', 'second thessalonians']],
  ['1TI', '1 Timothy', 'NT', 6, ['1 tim', '1tim', '1 ti', 'i timothy', 'first timothy']],
  ['2TI', '2 Timothy', 'NT', 4, ['2 tim', '2tim', '2 ti', 'ii timothy', 'second timothy']],
  ['TIT', 'Titus', 'NT', 3, ['tit', 'ti']],
  ['PHM', 'Philemon', 'NT', 1, ['philem', 'phm', 'pm']],
  ['HEB', 'Hebrews', 'NT', 13, ['heb']],
  ['JAS', 'James', 'NT', 5, ['jas', 'jm']],
  ['1PE', '1 Peter', 'NT', 5, ['1 pet', '1pet', '1 pe', 'i peter', 'first peter']],
  ['2PE', '2 Peter', 'NT', 3, ['2 pet', '2pet', '2 pe', 'ii peter', 'second peter']],
  ['1JN', '1 John', 'NT', 5, ['1 jn', '1jn', '1 jhn', 'i john', 'first john']],
  ['2JN', '2 John', 'NT', 1, ['2 jn', '2jn', '2 jhn', 'ii john', 'second john']],
  ['3JN', '3 John', 'NT', 1, ['3 jn', '3jn', '3 jhn', 'iii john', 'third john']],
  ['JUD', 'Jude', 'NT', 1, ['jud', 'jd']],
  ['REV', 'Revelation', 'NT', 22, ['rev', 're', 'revelations', 'the revelation', 'apocalypse']],
];

export const BOOKS: BookInfo[] = RAW.map(([code, name, testament, chapters, aliases], i) => ({
  id: i + 1,
  code,
  name,
  testament,
  chapters,
  aliases,
}));

const norm = (s: string) => s.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();

const LOOKUP = new Map<string, BookInfo>();
for (const b of BOOKS) {
  LOOKUP.set(norm(b.name), b);
  LOOKUP.set(norm(b.code), b);
  for (const a of b.aliases) LOOKUP.set(norm(a), b);
  // "1 Samuel" → also accept "1samuel"
  LOOKUP.set(norm(b.name).replace(/ /g, ''), b);
}

export function findBook(name: string): BookInfo | undefined {
  const n = norm(name);
  return LOOKUP.get(n) ?? LOOKUP.get(n.replace(/ /g, ''));
}

export function bookById(id: number): BookInfo | undefined {
  return BOOKS[id - 1];
}

export interface PassageRef {
  bookId: number;
  chapter: number;
  verseStart: number | null; // null = whole chapter
  verseEnd: number | null;
}

/**
 * Parse a single reference such as "John 3:16", "Ps 23", "1 Cor. 13:4-7", "Romans 8:38–39".
 * Cross-chapter ranges ("John 3:16-4:2") are deliberately not supported; the
 * parser returns null so callers treat them as unverifiable.
 */
export function parseReference(input: string): PassageRef | null {
  const s = input.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const m = s.match(/^((?:[1-3]|i{1,3})?\s?[a-z][a-z .]*?)\s*(\d{1,3})(?::(\d{1,3})(?:\s?-\s?(\d{1,3}))?)?$/i);
  if (!m) return null;
  const book = findBook(m[1]);
  if (!book) return null;
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return null;
  const vs = m[3] ? Number(m[3]) : null;
  const ve = m[4] ? Number(m[4]) : vs;
  if (vs !== null && (vs < 1 || (ve as number) < vs)) return null;
  return { bookId: book.id, chapter, verseStart: vs, verseEnd: ve };
}

export function formatReference(ref: PassageRef): string {
  const b = bookById(ref.bookId);
  const name = b ? b.name : `Book ${ref.bookId}`;
  if (ref.verseStart == null) return `${name} ${ref.chapter}`;
  if (ref.verseEnd == null || ref.verseEnd === ref.verseStart) return `${name} ${ref.chapter}:${ref.verseStart}`;
  return `${name} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`;
}

/** Book name for display, using singular "Psalm" for a single psalm reference. */
export function displayReference(ref: PassageRef): string {
  const s = formatReference(ref);
  return ref.bookId === 19 ? s.replace(/^Psalms /, 'Psalm ') : s;
}
