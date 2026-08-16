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

1. **Toolkit tools** (biggest gap). `src/screens/ToolDetailScreen.js` is a
   placeholder for all five tools. The prototype has full working versions of
   each (VisualChoiceMaker, FirstThen, Countdown, BreakItDown,
   AICueGenerator) built with React DOM elements, they need the same logic
   rebuilt with React Native primitives (View/Text/TextInput/Pressable
   instead of div/button/input). Countdown's `setInterval` logic ports
   directly. AICueGenerator must call the `generate-cue` Supabase Edge
   Function with the user's session access token in the Authorization
   header, not call api.anthropic.com directly from the app, that would ship
   the API key inside the app bundle.

2. **Profile form**, `src/screens/ProfileFormScreen.js` only has name and
   age. Add: diagnosis picker (with "Not diagnosed / Prefer not to say" as
   default, never required), communication preferences, sensory preferences,
   common triggers, things that help, calming activities, notes. All map
   directly to columns already in `child_profiles` (see `supabase/schema.sql`).
   Add delete, and a way to pick which profile is "active" for personalising
   AI Cue Generator suggestions (accounts.active_profile_id).

3. **Onboarding**, `src/screens/OnboardingScreen.js` only has 2 of 5 screens.
   Add the age screen, the "what situations are hardest" multi-select, and
   the "what would help most" multi-select. Persist answers to
   `accounts.onboarding_answers` (jsonb, already in the schema) and use them
   to personalise the "Today's cues" picks on Home instead of the current
   hardcoded three.

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

5. **Learn section content**. `LEARN_ARTICLES` in `src/data/content.js` has
   titles and read times only. Either write the full article bodies and add
   a detail screen, or move this whole section to a Supabase table so
   content can be updated without an app release.

6. **Expand the content database**. `SITUATIONS` currently has 45 entries.
   The original brief called for 200+, with the architecture built to scale
   to 1,000+. Follow the exact existing shape (id, category, title, age,
   tags, whatMayBeHappening, say[], avoid[{instead, tryThis}], doThis[],
   why, nextStep[], quickCue) for consistency, then have a SENCO or SEN
   professional review new entries before shipping, this is more important
   than volume.

7. **Onboarding gating on app open**. `RootNavigator.js` currently always
   shows Onboarding first. Once `accounts.onboarding_answers` exists, check
   whether a row exists for the current user on launch and skip straight to
   `Tabs` if so.

8. **App icon and splash image**. `app.json` references
   `./assets/icon.png`, `./assets/splash.png`, `./assets/adaptive-icon.png`,
   none of these exist yet. Design direction: sage/teal/cream palette, the
   quick-cue peach accent works well as a small icon detail.

9. **Rate limiting on the Edge Function**. Marked with a TODO in
   `supabase/functions/generate-cue/index.ts`, add a simple per-user daily
   count check before calling Anthropic, so one account can't run up costs.

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
