# Faithly — notes for Claude Code

Self-contained React + TypeScript + Tailwind PWA with a Supabase backend, living in `faithly/`.
It is unrelated to the SEN Cues Expo app at the repository root.

## Non-negotiables
- Never put Bible verse text into authored content or AI output. Store references only; text comes from
  `bible_verses` (World English Bible, public domain). Run `npm run check-seed` after editing `scripts/content/*`,
  then `npm run build-seed` to regenerate `supabase/migrations/20261014000002_seed_content.sql` (never hand-edit it).
- In commentary, "double quotes" are reserved for exact WEB quotations (the checker enforces this);
  use ‘single curly quotes’ for anything else.
- AI must never claim divine authority, promise outcomes or give medical advice; keep every rule in
  `supabase/functions/_shared/prompts.ts` (CORE) intact. Crisis messages bypass the model (`_shared/safety.ts`).
- Premium and limits are enforced server-side (RLS `is_premium()`, `faithly-ai` checks). `subscriptions` is written
  only by the Stripe webhook. Never add client-side writes to it.
- Private data (journal, prayers, chats) is owner-only via RLS; admin stats are aggregate only.
- British English throughout. Don't present unbuilt features as working (see README "Not yet built").

## Checks
`npm run typecheck && npm test && npm run check-seed && npm run build`; `scripts/test-db.sh` for RLS;
`scripts/e2e-api.mjs` against a running stack.
