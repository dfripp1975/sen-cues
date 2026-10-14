# Faithly

**Grow in Faith. Find Your Peace. Walk With God.**

Faithly is a Christian faith-companion Progressive Web App (PWA). It includes a full Bible reader, an AI companion grounded in verified Scripture, guided faith journeys, a private prayer journal, devotionals, audio, Bible challenges, verse wallpapers, Premium subscriptions through Stripe, and an admin dashboard.

It's built with React, TypeScript, Tailwind CSS and Supabase (Postgres, Auth, Row Level Security, Edge Functions). The AI layer works with either Google Gemini or OpenAI.

> This app lives in `faithly/` inside the `sen-cues` repository and is completely separate from the SEN Cues Expo app at the repository root.

---

## Contents

1. [What's built](#whats-built)
2. [How Scripture accuracy is guaranteed](#how-scripture-accuracy-is-guaranteed)
3. [Project structure](#project-structure)
4. [Setup](#setup)
5. [Deployment](#deployment)
6. [Testing](#testing)
7. [Testing checklist (manual)](#testing-checklist-manual)
8. [Not yet built / known limitations](#not-yet-built--known-limitations)

---

## What's built

| Area | Status |
| --- | --- |
| Branding, light/dark mode, mobile bottom navigation + desktop sidebar | ✅ |
| Email sign-up/sign-in, password reset, optional Google sign-in, account deletion | ✅ |
| Onboarding: all 7 optional questions, skippable, editable later in Settings | ✅ |
| Today: greeting, daily verse (save/share/listen/read chapter), 5-step daily journey with progress, emotional check-in, quick-access cards | ✅ |
| Bible reader: OT/NT navigation, full-text search, highlights (4 colours), bookmarks, notes, reading progress, font size, text-to-speech, Explain This Verse | ✅ |
| Ask Faithly: typed or spoken questions, structured answers, verified passages, Go Deeper, follow-ups, history, delete, optional transparent memory | ✅ |
| AI Bible Study tutor: beginner/intermediate/advanced (advanced is Premium), "new to Christianity" mode, quiz | ✅ |
| Faith journeys: 3 guided journeys (7 Days to Strengthen Your Faith, 7 Days of Gratitude, 14 Days of Finding Peace [Premium]); pause, resume, restart, journal, completion tracking, AI personalised reflection (Premium) | ✅ |
| Prayer companion: 10 prayer types, AI-suggested prayers (labelled), save, edit, favourite, listen, status, reflections | ✅ |
| Private journal: entries, prayers, Scripture references, moods, dates, search, filters, your own prayer status, Markdown export, delete | ✅ |
| Devotionals: 7 seeded (300–500 words each); save, share, listen, notes, mark complete | ✅ |
| Audio: 7 categories narrated live by the device's voice; play/pause, seek, speed, sleep timer, voice choice | ✅ |
| Bible challenges: trivia, guess the character, daily challenge, complete the Scripture, book ordering, spaced-repetition memory verses. No leaderboards. | ✅ |
| Verse wallpapers: 5 original canvas-drawn templates, light/dark, phone/square; save and share | ✅ |
| Reminders: web push (VAPID) with per-reminder times and time zone, sent by a cron-invoked function | ✅ (needs VAPID keys + cron) |
| Premium: Stripe Checkout, Customer Portal, signed webhook, enforced on the server | ✅ (needs Stripe keys) |
| Usage limits: 10 AI requests a day free, 100 Premium, enforced on the server; caching of non-personal AI output | ✅ |
| Admin: users, activity, subscriptions, estimated MRR, conversion, AI usage and estimated cost, journey popularity, D1/M1 retention, content management for devotionals, journeys and quizzes | ✅ |
| Privacy policy, terms, AI disclosure, full data export (JSON), crisis-safety responses, accessibility basics | ✅ |
| Faith Circles (community) | ❌ Not built (Phase 4) |
| Native iOS/Android packaging and in-app purchases | ❌ Not built (Phase 4) |

## How Scripture accuracy is guaranteed

The brief says the app must *never invent Bible verses or references*. Here's how that's enforced:

* **Bible text** comes from the public-domain **World English Bible**, bundled as `supabase/seed/web-bible.json.gz` (31,098 verses) and loaded into `bible_verses`. Translations that need a licence (NIV, ESV and so on) are deliberately not included. The KJV is under Crown copyright in the UK, so it's left out too.
* **Authored content** (daily verses, devotionals, journeys, quizzes, mood suggestions, audio) stores **references only**. The text is always read from `bible_verses`.
* **`scripts/build-seed.mjs` validates all authored content** before it can be seeded:
  * every reference must exist in the WEB text;
  * every `"double-quoted"` phrase in commentary must appear word for word in the WEB;
  * every devotional reflection must be 300–500 words.

  This check caught two misquotations while the content was being written.
* **AI never supplies verse text.** The model returns references only. The `faithly-ai` Edge Function parses each one, loads it from `bible_verses`, and drops anything it can't verify; the response reports how many were dropped. Scripture is labelled *Scripture · WEB* and AI output is labelled *AI commentary* in the UI.
* The system prompt (`supabase/functions/_shared/prompts.ts`) forbids claiming divine authority, quoting verse text, promising outcomes or giving medical advice.
* Messages that may indicate self-harm, suicide or abuse get a fixed, human-written response with UK helplines (999, Samaritans 116 123, Shout 85258, NHS 111, the National Domestic Abuse Helpline). No generated answer is given for these messages.

## Project structure

```
faithly/
├── index.html, vite.config.ts, tailwind.config.js
├── public/                 PWA manifest, service worker (sw.js), icons
├── src/
│   ├── App.tsx             routes and auth/onboarding gating
│   ├── context/            AuthContext (session, profile, prefs, premium), toasts
│   ├── components/         Layout, Scripture blocks, Composer (voice input), UI kit, illustrations
│   ├── content/            option lists, mood check-in content, audio library definitions
│   ├── lib/                Supabase client, API wrapper, Bible helpers, TTS narrator, push, SM-2, export
│   └── pages/              every screen (games/ and admin/ are lazy-loaded)
├── supabase/
│   ├── migrations/         schema + RLS, generated seed content, AI cache
│   ├── seed/               WEB Bible (gzipped JSON)
│   ├── functions/          faithly-ai, create-checkout, customer-portal, stripe-webhook,
│   │                       delete-account, admin-stats, send-reminders, _shared/
│   └── tests/              RLS tests for a plain local Postgres
└── scripts/
    ├── content/            authored daily verses, devotionals, journeys, quiz
    ├── build-seed.mjs      validates content against the Bible and generates the seed migration
    ├── import-bible.mjs    loads the WEB into Supabase (API or SQL file)
    ├── test-db.sh          migrations + RLS tests on a local Postgres
    └── e2e-api.mjs         end-to-end API test of the critical flows
```

## Setup

### 1. Prerequisites

* Node 20+ and npm
* A Supabase project (free tier is fine) and the [Supabase CLI](https://supabase.com/docs/guides/cli)
* Optional: a Gemini or OpenAI API key, a Stripe account, and VAPID keys for push notifications

### 2. Install

```bash
cd faithly
npm install
cp .env.example .env      # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

If those two values are missing, the app shows a "Faithly needs to be connected" screen rather than pretending to work.

### 3. Database

```bash
supabase link --project-ref <your-ref>
supabase db push                       # applies supabase/migrations/*
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service-role-key> npm run import-bible
```

You can also run `node scripts/import-bible.mjs --sql bible.sql` and execute the file with `psql`. The service-role key is only used locally by that script. Never put it in `.env` with a `VITE_` prefix.

**To make yourself an admin**, run this in the SQL editor (users can't set it themselves; a trigger blocks it):

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
```

### 4. Auth settings (Supabase dashboard → Authentication)

* **Site URL:** your app URL. Add `https://your-app/**` to the redirect URLs, which password reset needs.
* **Google sign-in (optional):** enable the Google provider, then set `VITE_ENABLE_GOOGLE_AUTH=true`.

### 5. AI setup

```bash
supabase secrets set AI_PROVIDER=gemini GEMINI_API_KEY=...        # or AI_PROVIDER=openai OPENAI_API_KEY=...
# optional: GEMINI_MODEL, OPENAI_MODEL, OPENAI_BASE_URL, AI_DAILY_LIMIT_FREE, AI_DAILY_LIMIT_PREMIUM,
#           GEMINI_INPUT_PRICE_PER_M / GEMINI_OUTPUT_PRICE_PER_M (for admin cost estimates)
```

> **Privacy:** use a **paid** API tier. Google's free Gemini tier may use submitted content to improve its products, which would break the promise in the privacy policy that journal-adjacent content is never used for training.

Without a key, AI features show a clearly labelled "Faithly AI is not set up yet" notice and never return a simulated answer.

### 6. Payments (Stripe)

1. In Stripe, create a product "Faithly Premium" with two recurring prices: **£5.99/month** and **£39.99/year**.
2. Enable the **Customer Portal** (Settings → Billing → Customer portal) so customers can cancel and update their card.
3. Set the secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_PRICE_MONTHLY=price_... STRIPE_PRICE_YEARLY=price_... APP_URL=https://your-app
   ```
4. Add a webhook endpoint at `https://<ref>.supabase.co/functions/v1/stripe-webhook` for these events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` and `customer.subscription.deleted`. Then set the signing secret: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`.

Subscription status is written **only** by the webhook, using the service role. Premium is enforced in the database and the functions:

* the `is_premium()` RLS policies on premium journey days and journey starts;
* the `faithly-ai` checks for advanced study and personalised reflections;
* the daily AI limits.

Native app stores will need their own in-app purchase integration (see the limitations section); Stripe web checkout is not a substitute for it.

### 7. Reminders (web push, optional)

```bash
npx web-push generate-vapid-keys
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com REMINDER_CRON_SECRET=<random>
# and set VITE_VAPID_PUBLIC_KEY=<public key> in .env
```

Then schedule the sender every 15 minutes with `pg_cron` and `pg_net` (enable both extensions in the dashboard):

```sql
select cron.schedule('faithly-reminders', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('x-cron-secret', '<REMINDER_CRON_SECRET>')
  );
$$);
```

Platform notes:

* On iPhone and iPad, web push works only after the user adds Faithly to their Home Screen (iOS 16.4 or later); the Settings screen explains this.
* Notifications are only sent after the user turns them on in Settings and grants browser permission.

### 8. Deploy the functions

```bash
supabase functions deploy faithly-ai create-checkout customer-portal delete-account admin-stats
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy send-reminders --no-verify-jwt
```

`supabase/config.toml` already marks the webhook and the reminder sender as `verify_jwt = false`. Those two are authenticated by the Stripe signature and the cron secret respectively.

### 9. Run locally

```bash
npm run dev       # http://localhost:5173
```

## Deployment

The front end is a static build (`npm run build` produces `dist/`). Any static host works:

* **Vercel:** import the repository, set the root directory to `faithly`, and add the `VITE_*` environment variables. `vercel.json` handles SPA rewrites.
* **Netlify:** base directory `faithly`, build command `npm run build`, publish directory `faithly/dist`. `public/_redirects` handles SPA rewrites.

After deploying, update the Supabase Auth Site URL, the `APP_URL` secret and the Stripe webhook URL to point at production. Fill in `VITE_OPERATOR_NAME` and `VITE_CONTACT_EMAIL` for the legal pages, and **have the Privacy Policy and Terms reviewed by a qualified adviser before launch**.

## Testing

```bash
npm run typecheck        # strict TypeScript
npm test                 # unit tests (reference parser, crisis detection, spaced repetition)
npm run check-seed       # validates all authored content against the Bible text
npm run build            # production build
PGHOST=... PGUSER=postgres ./scripts/test-db.sh   # migrations + RLS tests on a local Postgres
# Full API flow against a running stack (local or staging) with functions deployed:
SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... STRIPE_WEBHOOK_SECRET=... node scripts/e2e-api.mjs
```

`scripts/e2e-api.mjs` covers the following flows: register; onboarding; reading and searching the Bible; asking an AI question (and checking that invented references are dropped); saving the conversation and Go Deeper; isolation between users; the crisis response; Explain This Verse and caching; premium gating; starting and completing a journey; journal and prayers; blocking self-granted premium or admin; subscribing through a signed Stripe webhook (and rejecting forged ones); managing the subscription; daily limits; admin stats; and account deletion with cascading data removal.

During development the whole suite was run against a local stack (Postgres 16, Supabase Auth/GoTrue, PostgREST, the Edge Functions under Deno, and an OpenAI-compatible mock). The UI flows were also driven in Chromium at phone and desktop sizes.

## Testing checklist (manual)

Before each release, check these on an iPhone and an Android phone:

- [ ] Register with email → confirmation email (if enabled) → sign in
- [ ] Reset password via the email link → set a new password
- [ ] Complete onboarding; also try "Skip all"; change answers in Settings
- [ ] Today: daily verse loads; Save, Share, Listen and Read full chapter all work; progress ticks update
- [ ] Emotional check-in shows passages, an exercise, a prayer and the support note
- [ ] Bible: open a chapter, highlight, note, bookmark, memorise, Explain This Verse, change font size, listen
- [ ] Bible search by keyword and by reference (e.g. "John 3:16")
- [ ] Ask Faithly by typing and by voice (Chrome/Safari); Go Deeper; follow-ups; delete a conversation
- [ ] AI with no key configured shows the setup notice (no fake answer)
- [ ] Start a journey, write a journal response, complete a day, pause and resume
- [ ] Prayer: suggest, save, edit, favourite, listen, mark as answered
- [ ] Journal: create, search, filter, export to Markdown, delete
- [ ] Subscribe (Stripe test card 4242 4242 4242 4242) → Premium unlocks the Finding Peace journey and advanced study
- [ ] Manage subscription → cancel in the portal → status updates
- [ ] Reminders: enable notifications, set a time, receive a push
- [ ] Download all data (JSON); delete the account → you're signed out and all data is gone
- [ ] Dark mode, 200% browser zoom, keyboard-only navigation, VoiceOver/TalkBack labels
- [ ] Install to the Home Screen (PWA) and open from the icon

## Not yet built / known limitations

These are not presented as working anywhere in the app:

* **Faith Circles** (private groups, shared challenges, moderation). This is Phase 4 and hasn't been started; the app doesn't mention it.
* **Native apps and in-app purchases.** The PWA can be packaged with Capacitor later, but App Store and Google Play billing (for example via RevenueCat) will need a separate integration plus a webhook that writes to `subscriptions` with `provider = 'apple'` or `'google'`. The schema already allows this.
* **Translations:** only the WEB is included. Add other translations by loading them into `bible_translations` and `bible_verses` once they're licensed.
* **Cross-references** aren't included as a dataset. Related passages come from the AI and are verified against the Bible text.
* **Audio** is generated live by the device's speech engine. It isn't downloadable, doesn't work offline, and may stop when the screen locks on some phones; the app says so.
* **Offline:** the service worker caches the app shell only. Bible text and personal data need a connection.
* **Content volume:** there are 3 journeys and 7 devotionals. The other journeys in the brief (Forgiveness, Grief, Purpose and others) need writing and pastoral review. Add them in `scripts/content/` and run `npm run build-seed`.
* **Content review:** have a pastor or theologian review all authored content before launch, just as you would for anything published in a church's name.
