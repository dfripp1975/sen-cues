#!/usr/bin/env node
// Sets up a hosted Supabase project for Faithly using only a personal access token
// (no database password): applies migrations not yet applied, loads the Bible, and
// prints a verification summary. Used by .github/workflows/faithly-setup.yml.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=abcd node scripts/setup-remote.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) {
  console.error('Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN.');
  process.exit(1);
}

async function q(query) {
  const api = process.env.SUPABASE_API_URL ?? 'https://api.supabase.com'; // overridable for local testing
  const r = await fetch(`${api}/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Query failed (${r.status}): ${text.slice(0, 800)}`);
  return JSON.parse(text || '[]');
}

// Track applied migrations in the same table the Supabase CLI uses, so `supabase db push` stays consistent later.
await q(`create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);`);
const applied = new Set((await q('select version from supabase_migrations.schema_migrations')).map((r) => r.version));

const dir = join(here, '../supabase/migrations');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  const [version, ...rest] = file.replace(/\.sql$/, '').split('_');
  if (applied.has(version)) {
    console.log(`skip  ${file} (already applied)`);
    continue;
  }
  const sql = readFileSync(join(dir, file), 'utf8');
  await q(sql);
  await q(`insert into supabase_migrations.schema_migrations (version, name) values ('${version}', '${rest.join('_')}')`);
  console.log(`apply ${file}`);
}

// Load the Bible if it isn't there yet.
const [{ count }] = await q('select count(*)::int as count from public.bible_verses');
if (count >= 31000) {
  console.log(`Bible already loaded (${count} verses)`);
} else {
  const tmp = join(process.env.RUNNER_TEMP ?? '/tmp', 'bible.sql');
  execFileSync('node', [join(here, 'import-bible.mjs'), '--sql', tmp], { stdio: 'inherit' });
  const sql = readFileSync(tmp, 'utf8').replace(/^begin;\n/, '').replace(/\ncommit;\n?$/, '');
  const stmts = sql.split(/;\n(?=insert into )/).map((s) => s.trim().replace(/;$/, '') + ';');
  let batch = '';
  let n = 0;
  for (const s of stmts) {
    if (batch && batch.length + s.length > 600_000) {
      await q(batch);
      console.log(`bible batch ${++n}`);
      batch = '';
    }
    batch += s + '\n';
  }
  if (batch) {
    await q(batch);
    console.log(`bible batch ${++n}`);
  }
}

const [summary] = await q(`select
  (select count(*) from public.bible_verses)::int as verses,
  (select count(*) from public.faith_journeys)::int as journeys,
  (select count(*) from public.journey_days)::int as journey_days,
  (select count(*) from public.devotional_content)::int as devotionals,
  (select count(*) from public.quiz_questions)::int as quiz_questions,
  (select count(*) from public.daily_verses)::int as daily_verses`);
console.log('Summary:', JSON.stringify(summary));
if (summary.verses < 31000 || summary.journey_days !== 28) {
  console.error('Setup incomplete: unexpected counts.');
  process.exit(1);
}
console.log('Database setup complete.');
