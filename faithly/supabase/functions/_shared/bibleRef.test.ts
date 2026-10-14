import { describe, expect, it } from 'vitest';
import { parseReference, formatReference, displayReference, BOOKS } from './bibleRef';

describe('parseReference', () => {
  it('parses common forms', () => {
    expect(parseReference('John 3:16')).toEqual({ bookId: 43, chapter: 3, verseStart: 16, verseEnd: 16 });
    expect(parseReference('Ps 23')).toEqual({ bookId: 19, chapter: 23, verseStart: null, verseEnd: null });
    expect(parseReference('1 Cor. 13:4-7')).toEqual({ bookId: 46, chapter: 13, verseStart: 4, verseEnd: 7 });
    expect(parseReference('Romans 8:38–39')).toEqual({ bookId: 45, chapter: 8, verseStart: 38, verseEnd: 39 });
    expect(parseReference('Song of Solomon 2:4')?.bookId).toBe(22);
    expect(parseReference('Isaiah 40:31')?.bookId).toBe(23);
    expect(parseReference('III John 1:2')?.bookId).toBe(64);
    expect(parseReference('Philippians 4:6-7')?.bookId).toBe(50);
  });
  it('rejects invalid references', () => {
    expect(parseReference('Hezekiah 3:1')).toBeNull();
    expect(parseReference('John 22:1')).toBeNull();
    expect(parseReference('John 3:16-4:2')).toBeNull();
    expect(parseReference('John 3:10-5')).toBeNull();
    expect(parseReference('')).toBeNull();
  });
  it('formats', () => {
    expect(formatReference({ bookId: 19, chapter: 23, verseStart: 1, verseEnd: 6 })).toBe('Psalms 23:1-6');
    expect(displayReference({ bookId: 19, chapter: 23, verseStart: 1, verseEnd: 6 })).toBe('Psalm 23:1-6');
  });
  it('has 66 books', () => expect(BOOKS).toHaveLength(66));
});
