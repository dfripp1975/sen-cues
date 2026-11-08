// Imports public-domain books from Standard Ebooks (standardebooks.org) so they
// can be read in full on the site.
//
// Rights rule, applied to every book (a site open to readers worldwide):
//   1. Standard Ebooks only publishes works that are public domain in the USA.
//   2. Every author AND translator must have died in 1955 or earlier, so the
//      work is also out of copyright under "life + 70 years" (UK, EU and most
//      other countries). A person whose death year cannot be confirmed on Open
//      Library is treated as a fail and the book is left out.
// Standard Ebooks releases its own work (cleaned texts, descriptions, cover
// designs) under CC0, so it can be reused freely; we still credit them.
//
// Stages (each caches its downloads in CACHE_DIR, so it can be re-run safely):
//   npx tsx scripts/import-standard-ebooks.mts list     catalogue in popularity order
//   npx tsx scripts/import-standard-ebooks.mts check    rights check, until TARGET books pass
//   npx tsx scripts/import-standard-ebooks.mts fetch    texts + covers for books that passed
//   npx tsx scripts/import-standard-ebooks.mts emit     write public/texts, public/covers, src/data/library.ts
// Behind an HTTPS proxy, run with NODE_USE_ENV_PROXY=1.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse, type HTMLElement } from 'node-html-parser';

const SE = 'https://standardebooks.org';
const OL = 'https://openlibrary.org';
const UA = 'BookClubForOne-importer/1.0';
const CACHE = process.env.CACHE_DIR || join(process.cwd(), '.se-cache');
const TARGET = Number(process.env.TARGET || 520);
const DEATH_CUTOFF = 1955;
const ROOT = new URL('..', import.meta.url).pathname;
mkdirSync(join(CACHE, 'pages'), { recursive: true });
mkdirSync(join(CACHE, 'texts'), { recursive: true });
mkdirSync(join(CACHE, 'covers'), { recursive: true });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const readJson = <T>(f: string, d: T): T => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d);
const writeJson = (f: string, v: unknown) => writeFileSync(f, JSON.stringify(v, null, 1));
const keyOf = (p: string) => p.replace(/^\/ebooks\//, '').replace(/\//g, '__');

let lastSE = 0, lastOL = 0;
async function fetchText(url: string, host: 'se' | 'ol', tries = 4): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    const gap = host === 'se' ? 1100 : 700;
    const last = host === 'se' ? lastSE : lastOL;
    const wait = last + gap - Date.now();
    if (wait > 0) await sleep(wait);
    if (host === 'se') lastSE = Date.now(); else lastOL = Date.now();
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 404) return null;
      if (r.ok) return await r.text();
    } catch { /* retry */ }
    await sleep(2000 * (i + 1));
  }
  return null;
}
async function fetchBinary(url: string): Promise<Buffer | null> {
  const wait = lastSE + 1100 - Date.now();
  if (wait > 0) await sleep(wait);
  lastSE = Date.now();
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch { return null; }
}
async function cached(file: string, url: string, host: 'se' | 'ol') {
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const t = await fetchText(url, host);
  if (t !== null) writeFileSync(file, t);
  return t;
}

/* ---------------- list ---------------- */
interface Entry { path: string; title: string; rank: number; cover: string | null }
async function list() {
  const out: Entry[] = [];
  for (let page = 1; page < 80; page++) {
    const html = await cached(join(CACHE, `catalogue-${page}.html`), `${SE}/ebooks?sort=popularity&per-page=48&page=${page}`, 'se');
    if (!html) break;
    const root = parse(html);
    const items = root.querySelectorAll('li[typeof="schema:Book"]');
    if (!items.length) break;
    for (const li of items) {
      const path = li.getAttribute('about') || '';
      const title = li.querySelector('[property="schema:name"]')?.text.trim() || '';
      const img = li.querySelector('img')?.getAttribute('src') || null;
      if (path) out.push({ path, title, rank: out.length + 1, cover: img });
    }
    console.log(`page ${page}: ${out.length} books`);
  }
  writeJson(join(CACHE, 'catalogue.json'), out);
}

/* ---------------- check ---------------- */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim();
interface Person { name: string; death: number | null; olName?: string }
async function deathYear(name: string): Promise<Person> {
  const cacheFile = join(CACHE, 'people.json');
  const people = readJson<Record<string, Person>>(cacheFile, {});
  if (people[name]) return people[name];
  const json = await fetchText(`${OL}/search/authors.json?q=${encodeURIComponent(name)}&limit=8`, 'ol');
  let result: Person = { name, death: null };
  if (json) {
    const docs: any[] = JSON.parse(json).docs || [];
    const want = norm(name);
    const parts = want.split(' ');
    const surname = parts[parts.length - 1];
    const same = docs.filter(d => {
      const names = [d.name, ...(d.alternate_names || [])].filter(Boolean).map(norm);
      return names.some(n => n === want || (n.endsWith(' ' + surname) && n.split(' ')[0][0] === parts[0][0]));
    }).filter(d => d.death_date);
    same.sort((a, b) => (b.work_count || 0) - (a.work_count || 0));
    const years = same.map(d => Number((String(d.death_date).match(/\b(1[0-9]{3}|20[0-9]{2})\b/) || [])[1])).filter(Boolean);
    // Records for one person can disagree; take the LATEST year so we never under-count the copyright term
    if (years.length) result = { name, death: Math.max(...years.slice(0, 3)), olName: same[0].name };
  }
  people[name] = result;
  writeJson(cacheFile, people);
  return result;
}
async function firstPublished(title: string, author: string): Promise<number | null> {
  const cacheFile = join(CACHE, 'years.json');
  const years = readJson<Record<string, number | null>>(cacheFile, {});
  const k = `${title}|${author}`;
  if (k in years) return years[k];
  const json = await fetchText(`${OL}/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=5&fields=title,first_publish_year,edition_count`, 'ol');
  let y: number | null = null;
  if (json) {
    const docs: any[] = (JSON.parse(json).docs || []).filter((d: any) => d.first_publish_year);
    docs.sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0));
    y = docs[0]?.first_publish_year ?? null;
  }
  years[k] = y;
  writeJson(cacheFile, years);
  return y;
}
const namesIn = (root: HTMLElement, prop: string) => [...new Set(root.querySelectorAll(`[property="schema:${prop}"]`)
  .map(el => (el.querySelector('[property="schema:name"]')?.text || el.text).replace(/\s+/g, ' ').trim())
  .filter(Boolean))];

interface Checked {
  path: string; rank: number; cover: string | null; title: string; authors: Person[]; translators: Person[];
  pass: boolean; reason?: string; description: string[]; words: number; subjects: string[]; year: number | null;
}
async function check() {
  const catalogue = readJson<Entry[]>(join(CACHE, 'catalogue.json'), []);
  const resultsFile = join(CACHE, 'checked.json');
  const results = readJson<Record<string, Checked>>(resultsFile, {});
  let passing = Object.values(results).filter(r => r.pass).length;
  for (const e of catalogue) {
    if (passing >= TARGET) break;
    if (results[e.path]) continue;
    const html = await cached(join(CACHE, 'pages', keyOf(e.path) + '.html'), SE + e.path, 'se');
    if (!html) continue;
    const root = parse(html);
    const title = root.querySelector('h1')?.text.trim() || e.title;
    const authorNames = namesIn(root, 'author');
    const translatorNames = namesIn(root, 'translator');
    const description = (root.querySelector('#description')?.querySelectorAll('p') || []).map(p => p.text.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 3);
    const words = Number(root.querySelector('[property="schema:wordCount"]')?.getAttribute('content') || 0);
    const subjects = root.querySelectorAll('a[href^="/subjects/"]').map(a => a.text.trim()).filter(Boolean);
    const authors: Person[] = [];
    for (const n of authorNames) authors.push(n.toLowerCase() === 'anonymous' ? { name: n, death: 0 } : await deathYear(n));
    const translators: Person[] = [];
    for (const n of translatorNames) translators.push(await deathYear(n));
    const everyone = [...authors, ...translators];
    let pass = everyone.length > 0 && everyone.every(p => p.death !== null && p.death <= DEATH_CUTOFF);
    let reason: string | undefined;
    if (!authors.length) { pass = false; reason = 'no author found'; }
    else if (!pass) {
      const bad = everyone.find(p => p.death === null || p.death > DEATH_CUTOFF)!;
      reason = bad.death === null ? `death year unknown: ${bad.name}` : `${bad.name} died ${bad.death}`;
    }
    const year = pass ? await firstPublished(title, authorNames[0]) : null;
    results[e.path] = { path: e.path, rank: e.rank, cover: e.cover, title, authors, translators, pass, reason, description, words, subjects, year };
    writeJson(resultsFile, results);
    if (pass) passing++;
    console.log(`${pass ? 'PASS' : 'skip'} #${e.rank} ${title} (${authorNames.join(', ')})${reason ? ' - ' + reason : ''}  [${passing}/${TARGET}]`);
  }
  console.log(`passing: ${passing}`);
}

/* ---------------- fetch ---------------- */
async function fetchAll() {
  const results = Object.values(readJson<Record<string, Checked>>(join(CACHE, 'checked.json'), {})).filter(r => r.pass).sort((a, b) => a.rank - b.rank);
  let n = 0;
  for (const r of results) {
    const k = keyOf(r.path);
    const textFile = join(CACHE, 'texts', k + '.html');
    if (!existsSync(textFile)) {
      const t = await fetchText(`${SE}${r.path}/text/single-page`, 'se');
      if (t) writeFileSync(textFile, t);
    }
    const coverFile = join(CACHE, 'covers', k + '.jpg');
    if (!existsSync(coverFile) && r.cover) {
      const src = r.cover.replace(/cover@2x\.jpg$/, 'cover.jpg');
      const buf = await fetchBinary(SE + src);
      if (buf) writeFileSync(coverFile, buf);
    }
    if (++n % 10 === 0) console.log(`fetched ${n}/${results.length}`);
  }
  console.log(`fetched ${n}`);
}

/* ---------------- emit ---------------- */
// Only a small, safe subset of markup reaches the site.
const KEEP = new Set(['p', 'em', 'i', 'b', 'strong', 'br', 'blockquote', 'h3', 'h4', 'h5', 'h6', 'sup', 'sub', 'small', 'span', 'abbr', 'cite', 'q', 'hr', 'ol', 'ul', 'li', 'table', 'tbody', 'tr', 'td', 'th', 'header', 'footer', 'footer']);
const KEEP_CLASS = new Set(['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'z3998:poem', 'z3998:verse', 'z3998:song', 'z3998:letter', 'z3998:signature', 'z3998:salutation']);
function clean(el: HTMLElement): string {
  let out = '';
  for (const node of el.childNodes) {
    if (node.nodeType === 3) { out += (node as any).rawText; continue; }
    if (node.nodeType !== 1) continue;
    const e = node as HTMLElement;
    const tag = e.tagName.toLowerCase();
    if (['script', 'style', 'img', 'svg', 'a'].includes(tag)) { if (tag === 'a') out += clean(e); continue; }
    if (tag === 'section' || tag === 'div' || tag === 'article') { out += clean(e); continue; }
    if (/^h[12]$/.test(tag)) continue;               // chapter headings become the chapter title instead
    if (!KEEP.has(tag)) { out += clean(e); continue; }
    const type = (e.getAttribute('epub:type') || '').split(/\s+/).filter(t => KEEP_CLASS.has(t));
    const cls = (e.getAttribute('class') || '').split(/\s+/).filter(c => KEEP_CLASS.has(c));
    const classes = [...type, ...cls].map(c => c.replace('z3998:', ''));
    const attr = classes.length ? ` class="${classes.join(' ')}"` : '';
    out += tag === 'br' || tag === 'hr' ? `<${tag}>` : `<${tag}${attr}>${clean(e)}</${tag}>`;
  }
  return out;
}
const headingText = (sec: HTMLElement) => {
  const hg = sec.querySelector('hgroup') || sec.querySelector('header');
  const h = hg || sec.querySelector('h2, h3, h4, h5, h6');
  return h ? h.querySelectorAll('h2, h3, h4, h5, h6, p').map(x => x.text.replace(/\s+/g, ' ').trim()).filter(Boolean).join(': ') || h.text.replace(/\s+/g, ' ').trim() : '';
};
function chaptersOf(html: string) {
  const root = parse(html);
  const body = root.querySelectorAll('section').filter(s => /bodymatter/.test(s.getAttribute('epub:type') || ''));
  // Leaf sections are the readable units (chapters); a part that holds chapters is used as a prefix
  const leaves = body.filter(s => !s.querySelectorAll('section').some(c => /bodymatter/.test(c.getAttribute('epub:type') || '') || c.parentNode === s));
  const chapters: { title: string; html: string }[] = [];
  for (const sec of leaves) {
    const parentSec = sec.parentNode as HTMLElement | null;
    const parentTitle = parentSec && parentSec.tagName?.toLowerCase() === 'section' ? headingText(parentSec) : '';
    let title = headingText(sec) || `Chapter ${chapters.length + 1}`;
    if (parentTitle && !title.includes(parentTitle)) title = `${parentTitle} · ${title}`;
    const content = clean(sec).replace(/\n\s*\n+/g, '\n').trim();
    if (content.replace(/<[^>]+>/g, '').trim().length < 20) continue;
    chapters.push({ title, html: content });
  }
  return chapters;
}
const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function emit() {
  const results = Object.values(readJson<Record<string, Checked>>(join(CACHE, 'checked.json'), {})).filter(r => r.pass).sort((a, b) => a.rank - b.rank);
  mkdirSync(join(ROOT, 'public/texts'), { recursive: true });
  mkdirSync(join(ROOT, 'public/covers'), { recursive: true });
  const library: any[] = [];
  const used = new Set<string>();
  for (const r of results) {
    const k = keyOf(r.path);
    const textFile = join(CACHE, 'texts', k + '.html');
    if (!existsSync(textFile)) continue;
    const chapters = chaptersOf(readFileSync(textFile, 'utf8'));
    if (!chapters.length) { console.log('no chapters:', r.title); continue; }
    let slug = slugify(r.title);
    if (used.has(slug)) slug = `${slug}-${slugify(r.authors[0].name.split(' ').pop() || '')}`;
    used.add(slug);
    const author = r.authors.map(a => a.name).join(' and ');
    const doc = { v: 1, slug, title: r.title, author, translators: r.translators.map(t => t.name), source: SE + r.path, chapters };
    writeFileSync(join(ROOT, 'public/texts', slug + '.json.gz'), gzipSync(JSON.stringify(doc), { level: 9 }));
    const coverFile = join(CACHE, 'covers', k + '.jpg');
    const hasCover = existsSync(coverFile);
    if (hasCover) writeFileSync(join(ROOT, 'public/covers', slug + '.jpg'), readFileSync(coverFile));
    library.push({
      slug, title: r.title, author, translators: r.translators.map(t => t.name),
      authorDied: Math.max(...r.authors.map(a => a.death || 0)), year: r.year, words: r.words,
      chapters: chapters.length, subjects: [...new Set(r.subjects)].slice(0, 4),
      description: r.description[0] || '', cover: hasCover ? `/covers/${slug}.jpg` : null,
      source: SE + r.path, popularity: r.rank,
    });
  }
  writeFileSync(join(ROOT, 'src/data/library.ts'),
    '// Generated by scripts/import-standard-ebooks.mts. Public-domain books readers can read in full.\n' +
    '// Texts and cover designs come from Standard Ebooks (CC0). Every author and translator died in or before 1955.\n' +
    'export interface ReadableBook { slug: string; title: string; author: string; translators: string[]; authorDied: number; year: number | null; words: number; chapters: number; subjects: string[]; description: string; cover: string | null; source: string; popularity: number }\n' +
    'export const library: ReadableBook[] = ' + JSON.stringify(library) + ';\n');
  console.log(`emitted ${library.length} books`);
}

const stage = process.argv[2];
if (stage === 'list') await list();
else if (stage === 'check') await check();
else if (stage === 'fetch') await fetchAll();
else if (stage === 'emit') emit();
else console.log('usage: list | check | fetch | emit');
