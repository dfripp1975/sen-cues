# EventFill

**Fill More Seats. Sell More Tickets. Grow Every Event.**

EventFill is a subscription web app for event organisers. It tracks ticket sales against targets, forecasts sales, warns when an event is falling behind (**Event Rescue Mode**), and provides marketing tools: a campaign planner, tracking links with QR codes, an AI Content Studio, audience surveys, a profit calculator, Competitor Watch and printable reports.

EventFill does **not** sell tickets. It works alongside Eventbrite, Ticket Tailor, Humanitix and similar platforms. Today, sales are entered manually or imported from a CSV export; official integrations are a possible future feature.

---

## Contents

1. [What you need](#1-what-you-need)
2. [Run it on your computer](#2-run-it-on-your-computer)
3. [Set up Supabase (database and logins)](#3-set-up-supabase-database-and-logins)
4. [Set up Stripe (payments)](#4-set-up-stripe-payments)
5. [Optional: turn on AI](#5-optional-turn-on-ai)
6. [Deploy to Vercel](#6-deploy-to-vercel)
7. [Running the tests](#7-running-the-tests)
8. [How the code is organised](#8-how-the-code-is-organised)
9. [Changing prices and plan limits](#9-changing-prices-and-plan-limits)
10. [Troubleshooting](#10-troubleshooting)
11. [Before you launch](#11-before-you-launch)

---

## 1. What you need

All of these have free tiers that are enough for development and early testing:

| Service | What it does | Cost to start |
| --- | --- | --- |
| [Node.js](https://nodejs.org) 20 or newer | Runs the app on your computer | Free |
| [Supabase](https://supabase.com) | Database, user accounts, file storage | Free tier |
| [Vercel](https://vercel.com) | Hosts the website | Free (Hobby) tier |
| [Stripe](https://stripe.com) | Subscription payments | Free; fees only on real payments |
| [Anthropic](https://console.anthropic.com) (optional) | AI Content Studio | Pay per use; capped by you |

> **Tip:** The public demo at `/demo` works with **no setup at all**, so you can see the dashboard before creating any accounts.

## 2. Run it on your computer

Open a terminal in the `eventfill` folder and run:

```bash
npm install          # downloads the libraries (one time)
cp .env.example .env.local
npm run dev          # starts the app
```

Open <http://localhost:3000>. The marketing site and `/demo` work immediately. Logging in needs Supabase (next step) — until then, dashboard pages show a "connect your database" screen.

## 3. Set up Supabase (database and logins)

1. Create a free account at [supabase.com](https://supabase.com) and click **New project**. Pick a region close to your customers (e.g. London for UK) and save the database password somewhere safe.
2. In your project, open **SQL Editor → New query**. Open the file `supabase/migrations/0001_init.sql` from this project, copy **all** of it, paste it in, and click **Run**. You should see "Success".
3. Do the same with `supabase/migrations/0002_storage.sql` (this creates storage for event images).
4. Go to **Project Settings → API** and copy these into `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**keep this secret**)
5. Go to **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (change to your real domain when you deploy)
   - **Redirect URLs**: add `http://localhost:3000/**` (and later `https://your-domain/**`)
6. Email verification is on by default in Supabase, so new users must click a link in their email. Supabase's built-in email sender is fine for testing but is heavily rate-limited; before launch, add your own SMTP provider under **Authentication → Emails → SMTP Settings** (many have free tiers).
7. Put your own email in `ADMIN_EMAILS` in `.env.local` to access `/admin`.
8. Restart `npm run dev`. Register an account, confirm the email, and complete onboarding.

**Security model:** every table has row-level security (RLS). People can only read or change rows belonging to organisations they are a member of. The subscription plan can only be changed by the server (via Stripe webhooks), never from the browser. These rules are covered by automated tests (`npm run test:db`).

## 4. Set up Stripe (payments)

Use **test mode** (toggle top-right in Stripe) until you're ready to launch.

1. Create a Stripe account. In **Developers → API keys**, copy the **Secret key** (`sk_test_...`) into `STRIPE_SECRET_KEY`.
2. In **Product catalogue**, create three products — *Starter*, *Growth*, *Pro*. For each, add two recurring prices:
   - Starter: $29 / month and $290 / year
   - Growth: $79 / month and $790 / year
   - Pro: $149 / month and $1,490 / year
3. Copy each price ID (`price_...`) into the matching `STRIPE_PRICE_*` variable.
4. Turn on the **Customer portal** (Settings → Billing → Customer portal). Allow customers to update payment methods, view invoices, cancel, and **switch plans** (add all six prices to the portal's product list). This is how upgrades, downgrades and cancellations work.
5. Webhooks tell EventFill when someone pays or cancels:
   - **Locally:** install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then run
     `stripe listen --forward-to localhost:3000/api/stripe/webhook` and copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
   - **In production:** Developers → Webhooks → Add endpoint → `https://your-domain/api/stripe/webhook`, with events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET` on Vercel.
6. Test with card number `4242 4242 4242 4242`, any future date, any CVC.

The plan shown in the app only changes after Stripe's webhook arrives — there are no fake "payment successful" screens. Plan limits are enforced on the server for every action.

## 5. Optional: turn on AI

1. Create an API key at [console.anthropic.com](https://console.anthropic.com) and set `ANTHROPIC_API_KEY`.
2. Costs are controlled in four ways:
   - Monthly AI credits per plan (Free 0, Starter 50, Growth 200, Pro 500) — 1 credit per generation.
   - Each user is limited to 6 generations per minute.
   - Each generation is capped at a short length.
   - `AI_MONTHLY_BUDGET_USD` stops **all** generation once the estimated monthly spend across every customer reaches your cap.
3. The default model is `claude-opus-5-5`. If you want the lowest possible cost per generation, set `AI_MODEL=claude-haiku-5-5`.

Without a key, the Content Studio stays usable: it offers clearly labelled **example templates** that are not AI-generated. The key never leaves the server.

## 6. Deploy to Vercel

1. Put this folder in its own GitHub repository (see the note at the end of this section).
2. In Vercel, click **Add New → Project**, import the repository. If the repository contains other projects, set **Root Directory** to `eventfill`.
3. Add every variable from your `.env.local` under **Settings → Environment Variables**. Change `NEXT_PUBLIC_SITE_URL` to your real address (e.g. `https://eventfill.yourdomain.com`), and set `CRON_SECRET` to a long random string.
4. Deploy. Then update Supabase's **Site URL** and **Redirect URLs**, and add the production Stripe webhook (section 4).
5. `vercel.json` schedules a daily job that deletes old tracking-link clicks and survey responses according to each organisation's retention setting.

> **Moving EventFill into its own repository:** it was built in an `eventfill/` folder. From the repository root you can run
> `git subtree split --prefix=eventfill -b eventfill-only`, then push that branch to a new, empty GitHub repository.

## 7. Running the tests

```bash
npm test            # unit tests: forecasting, Event Rescue, CSV import, tracking-link security,
                    # profit maths, plan limits, Stripe webhook signature handling, surveys
npm run test:db     # database security tests against a temporary local PostgreSQL
                    # (needs PostgreSQL 14+ installed; skips nothing silently)
npm run build && npm run test:e2e   # browser tests on desktop and mobile (Playwright)
npm run typecheck
```

`test:e2e` covers everything that doesn't need a live Supabase project (public site, demo, route protection, public endpoints). Sign-up and dashboard flows should be checked manually against your Supabase project — see [Before you launch](#11-before-you-launch).

## 8. How the code is organised

```
src/app/(marketing)/      Public website pages
src/app/(auth)/           Login, register, password reset
src/app/onboarding/       First-run questions
src/app/dashboard/        The customer app (events, planner, links, AI, surveys, settings…)
src/app/demo/             Public demo using fictional data and the same components
src/app/admin/            Owner-only SaaS admin
src/app/l/[slug]/         Tracking-link redirects
src/app/s/[slug]/         Public survey forms
src/app/api/              Stripe webhook and the retention job
src/lib/                  Business logic (forecast, rescue, csv, finance, plans, billing, ai…)
src/components/           UI components
supabase/migrations/      Database schema and security rules
tests/                    unit, db and e2e tests
```

The calculations in `src/lib/forecast.ts`, `rescue.ts`, `finance.ts` and `csv.ts` are plain functions with no framework code, so they are easy to read, test and change.

## 9. Changing prices and plan limits

Edit `src/lib/plans.ts`. It controls the prices shown on the website, each plan's limits (events, tasks, AI credits, links, seats) and which features each plan includes. Remember that Stripe charges the price set in Stripe — keep the two in sync.

## 10. Troubleshooting

| Problem | Fix |
| --- | --- |
| Dashboard shows "connect your database" | Supabase variables are missing from `.env.local`; restart `npm run dev` after adding them. |
| "Invalid or expired link" after clicking an email link | Add your site address to Supabase **Redirect URLs** (with `/**`). |
| Verification emails don't arrive | Check spam. Supabase's default sender is rate-limited; configure SMTP. |
| Plan doesn't change after paying | The webhook isn't reaching the app. Check `STRIPE_WEBHOOK_SECRET`, and that `stripe listen` is running locally. Stripe → Developers → Webhooks shows delivery errors. |
| "No Stripe price is configured" | A `STRIPE_PRICE_*` variable is empty or wrong. |
| Event image upload fails | Run `supabase/migrations/0002_storage.sql`. |
| AI says "isn't configured" | Set `ANTHROPIC_API_KEY` and redeploy. |
| `/admin` sends you to the dashboard | Your email isn't in `ADMIN_EMAILS`, or isn't confirmed. |
| CSV import errors | The file needs a date column and a quantity column. See the Help Centre page for accepted formats. |

## 11. Before you launch

- [ ] Run through the whole journey on your Supabase project: register → verify email → onboarding → create event → add tiers → record sales and import a CSV → forecast → rescue plan → campaign + ready-made plan → tracking link (click it, check the count) → survey (submit a response) → profit → report → invite a teammate (Pro) → upgrade/downgrade/cancel in Stripe test mode → export data → delete account.
- [ ] Configure SMTP for authentication emails.
- [ ] Have the Privacy Policy, Terms and Cookie pages reviewed by a legal professional for your jurisdiction and company details. They are sensible starting templates, not legal advice.
- [ ] Switch Stripe to live mode and replace all Stripe keys and price IDs.
- [ ] Set `AI_MONTHLY_BUDGET_USD` to a figure you're comfortable with.
- [ ] Replace the logo in `src/components/logo.tsx` and `public/icon.svg` if you have a designed one.
