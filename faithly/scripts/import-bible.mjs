#!/usr/bin/env node
// Loads the public-domain World English Bible (supabase/seed/web-bible.json.gz)
// into bible_translations / bible_books / bible_chapters / bible_verses.
//
// Two modes:
//   node scripts/import-bible.mjs --sql supabase/seed/bible.sql
//       Writes a SQL file you can run with psql or paste in chunks.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-bible.mjs
//       Upserts directly through the Supabase API using the service role key.
//       (The service role key is only ever used locally by you; never ship it.)

import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(gunzipSync(readFileSync(join(here, '../supabase/seed/web-bible.json.gz'))).toString('utf8'));
const t = data.translation;

const books = data.books.map((b) => ({
  id: b.order,
  code: b.code,
  name: b.name,
  testament: b.testament,
  chapter_count: b.chapters.length,
}));
const chapters = [];
const verses = [];
for (const b of data.books) {
  b.chapters.forEach((vs, ci) => {
    chapters.push({ translation_code: t.code, book_id: b.order, chapter: ci + 1, verse_count: vs.length });
    vs.forEach((text, vi) => {
      // The WEB omits a handful of verses (e.g. Matthew 17:21) that later manuscripts add; skip empties.
      if (text) verses.push({ translation_code: t.code, book_id: b.order, chapter: ci + 1, verse: vi + 1, text });
    });
  });
}

const sqlIdx = process.argv.indexOf('--sql');
if (sqlIdx !== -1) {
  const out = process.argv[sqlIdx + 1] ?? 'bible.sql';
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const lines = ['begin;'];
  lines.push(
    `insert into public.bible_translations (code, name, language, license, copyright_notice) values (${q(t.code)}, ${q(t.name)}, ${q(t.language)}, ${q(t.license)}, ${q(t.notice)}) on conflict (code) do update set name = excluded.name, license = excluded.license, copyright_notice = excluded.copyright_notice;`,
  );
  lines.push('insert into public.bible_books (id, code, name, testament, chapter_count) values');
  lines.push(books.map((b) => `(${b.id}, ${q(b.code)}, ${q(b.name)}, ${q(b.testament)}, ${b.chapter_count})`).join(',\n') + ' on conflict (id) do nothing;');
  lines.push('insert into public.bible_chapters (translation_code, book_id, chapter, verse_count) values');
  lines.push(chapters.map((c) => `(${q(c.translation_code)}, ${c.book_id}, ${c.chapter}, ${c.verse_count})`).join(',\n') + ' on conflict do nothing;');
  for (let i = 0; i < verses.length; i += 1000) {
    const chunk = verses.slice(i, i + 1000);
    lines.push('insert into public.bible_verses (translation_code, book_id, chapter, verse, text) values');
    lines.push(chunk.map((v) => `(${q(v.translation_code)}, ${v.book_id}, ${v.chapter}, ${v.verse}, ${q(v.text)})`).join(',\n') + ' on conflict do nothing;');
  }
  lines.push('commit;');
  writeFileSync(out, lines.join('\n') + '\n');
  console.log(`Wrote ${verses.length} verses to ${out}`);
  process.exit(0);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use --sql <file>.');
  process.exit(1);
}
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += 1000) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 1000), { onConflict, ignoreDuplicates: true });
    if (error) throw new Error(`${table}: ${error.message}`);
    process.stdout.write(`\r${table}: ${Math.min(i + 1000, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

await upsert('bible_translations', [{ code: t.code, name: t.name, language: t.language, license: t.license, copyright_notice: t.notice }], 'code');
await upsert('bible_books', books, 'id');
await upsert('bible_chapters', chapters, 'translation_code,book_id,chapter');
await upsert('bible_verses', verses, 'translation_code,book_id,chapter,verse');
console.log('Bible import complete.');
