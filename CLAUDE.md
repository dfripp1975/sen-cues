# SEN Cues — project context for Claude Code

## What this is

A native (Expo/React Native) app for parents and carers of children with
additional needs. Gives practical, in-the-moment support: what may be
happening, what to say, what to do, what to avoid, why it may help, and what
to try next, for specific everyday situations.

This project was scaffolded from a working React web prototype (an
interactive mockup built in a chat conversation, referred to below as
"the prototype"). The content database, design tokens, and screen structure
were ported across. Several screens are simplified placeholders with a
`TODO for Claude Code` comment explaining exactly what's missing, that
comment is the source of truth for each file, this document is the overview.

## Non-negotiables — read before touching content or copy

- Never let the app state a cause of a child's behaviour as fact. Always
  "may", "might", "for some children", "one possibility is".
- Never diagnose, never claim to treat autism, ADHD, or any condition, never
  suggest medication or medication changes.
- Language targets the situation, not the child, humour has no place here at
  all (unlike some of Darren's other projects, this one is entirely warm and
  literal in tone).
- British English and British institutions throughout: CAMHS, EHCP, SENCO,
  NHS, health visitor, GP, half term.
- The AI Cue Generator's system prompt (in
  `supabase/functions/generate-cue/index.ts`) encodes these same rules for
  anything the model generates. If you change the prompt, keep every rule
  above intact.

## Priority order for remaining work

1. **Toolkit tools** — DONE. All five tools live in `src/screens/tools/`
   (VisualChoiceMaker, FirstThen, CountdownTool, BreakItDown, AICueGenerator),
   built with React Native primitives; `ToolDetailScreen.js` dispatches to
   them. AICueGenerator calls the `generate-cue` Supabase Edge Function via
   `supabase.functions.invoke` (which sends the session access token in the
   Authorization header), never api.anthropic.com directly, and personalises
   using the active child profile (accounts.active_profile_id, falling back
   to the most recently updated profile).

2. **Profile form** — DONE. `ProfileFormScreen.js` has every child_profiles
   field: diagnosis chip picker (defaults to "Not diagnosed / Prefer not to
   say", never required), communication/sensory preferences, triggers, helps,
   calming activities and notes (each with tappable suggestion chips that
   merge into free text), delete with confirmation, and a "personalise
   suggestions for this child" checkbox that sets
   accounts.active_profile_id. ProfileScreen shows which profile is
   personalising and lets you switch.

3. **Onboarding** — DONE. All 5 screens (welcome, who, age, hardest
   situations multi-select from CATEGORIES, what-would-help multi-select).
   Answers persist to `accounts.onboarding_answers` (skipping stores
   `{skipped: true}` so the flow isn't shown again). Home personalises
   "Today's cues" from the chosen hardest categories, picking only the free
   first-two situations per category and rotating daily.

4. **Paywall + subscriptions**, `src/screens/PaywallScreen.js` is a shell
   with no real plan picker or purchase flow. Needs:
   - `npx expo install react-native-purchases` (RevenueCat)
   - Products configured in App Store Connect and Google Play Console first
     (monthly £4.99, yearly £39.99, referenced in the prototype)
   - Purchase and restore wired to RevenueCat, with `accounts.is_premium` kept
     in sync via a RevenueCat webhook (a Supabase Edge Function), not set
     client-side, client-side writes to that column can be bypassed
   - `usePremium` hook already reads `accounts.is_premium`, no change needed
     there once the webhook is in place

5. **Learn section content** — DONE (local, not CMS). All 8 articles in
   `LEARN_ARTICLES` have full section-based bodies in the app's cautious
   tone, rendered by `LearnArticleScreen` (Learn tab is now a stack). Like
   the situations, have a SENCO/SEN professional review before shipping.
   Moving Learn to a Supabase table remains a sensible later step for
   updating content without app releases.

6. **Expand the content database**. `SITUATIONS` currently has 45 entries.
   The original brief called for 200+, with the architecture built to scale
   to 1,000+. Follow the exact existing shape (id, category, title, age,
   tags, whatMayBeHappening, say[], avoid[{instead, tryThis}], doThis[],
   why, nextStep[], quickCue) for consistency, then have a SENCO or SEN
   professional review new entries before shipping, this is more important
   than volume.

7. **Onboarding gating on app open** — DONE. App.js checks
   `accounts.onboarding_answers` while the splash screen is still up and
   passes the initial route to RootNavigator, so returning users land
   straight in Tabs with no onboarding flash.

8. **App icon and splash image** — DONE (first pass). `assets/` now has
   icon.png, adaptive-icon.png and splash.png: the tilted stacked-card mark
   in sage on cream with white cue-line bars and the peach quick-cue dot.
   Generated programmatically — replace with professionally designed
   versions whenever ready, same filenames.

9. **Rate limiting on the Edge Function** — DONE. `cue_generation_log`
   table (service-role only, RLS with no policies) added to
   `supabase/schema.sql`; the function counts a user's calls in the last 24
   hours and returns 429 with a friendly message past 20/day. Re-run the
   schema in the Supabase SQL editor and redeploy the function to apply.

## Design tokens

Colours, fonts, radii and shadows all live in `src/theme/index.js`, reuse
them rather than introducing new values. Fraunces is the display/serif font
for headlines and titles, Plus Jakarta Sans is body/UI text. The signature
visual element is the tilted stacked-card look (`src/components/CueTile.js`),
reuse that component rather than inventing new card styles for lists of cues.

## What NOT to change without asking

- The cautious, non-diagnostic language patterns throughout the content and
  system prompts
- The free/premium split (2 free situations per category, AI Cue Generator
  is premium-only)
- The disclaimer text in `ProfileScreen.js`
