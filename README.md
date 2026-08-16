# SEN Cues — native app

This is the real Expo (React Native) build of SEN Cues, picking up from the
interactive prototype. It's a working head start, not a finished app — see
`CLAUDE.md` for exactly what's left to build.

## What's already here

- Full navigation (bottom tabs + stacks), matching the prototype's structure
- Home, Situation Detail, Now Mode, Category List, My Cues screens, fully built
- The complete 45-situation content database, ported as-is
- Supabase schema (`supabase/schema.sql`) for child profiles, favourites, and
  account/subscription state, with row-level security so each parent only
  ever sees their own data
- A secured Edge Function (`supabase/functions/generate-cue`) so the AI Cue
  Generator's API key never ships inside the app
- Onboarding, Toolkit, Profile and Paywall screens exist but are simplified —
  each has a `TODO for Claude Code` comment at the top explaining what's missing

## First-time setup (do this once, on your own machine)

1. **Install Node.js** (18 or later) from nodejs.org if you don't have it.
2. **Install Claude Code**: follow the instructions at
   [claude.com/claude-code](https://claude.com/claude-code) — it installs as a
   command you run in this project folder.
3. **Create a free Supabase project** at supabase.com, then:
   - In the SQL editor, paste and run `supabase/schema.sql`
   - Copy your Project URL and anon public key into a new `.env` file
     (copy `.env.example` to `.env` first)
4. **Install the Supabase CLI** (`npm install -g supabase`) to deploy the
   Edge Function later: `supabase functions deploy generate-cue`, then
   `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` using a key from your
   Anthropic Console.
5. In this folder, run `npm install`.
6. Run `npx expo start`, scan the QR code with the Expo Go app on your phone
   to see it running live.

## Using Claude Code to finish the build

Open a terminal in this folder and run `claude`. Claude Code will read
`CLAUDE.md` automatically for context on what's built and what's left. A
sensible first prompt:

> Read CLAUDE.md and the existing screens, then finish porting the Toolkit
> tools from the prototype (App.jsx isn't in this folder, but I can paste it
> in or describe each tool) to React Native.

Work through the task list in `CLAUDE.md` a few items at a time rather than
all at once, review each on your phone via Expo Go before moving on.

## Getting it into the App Store and Google Play

This part happens once the app is feature-complete and tested.

1. **Create accounts**: Apple Developer Program ($99/year, developer.apple.com)
   and a Google Play Console account ($25 one-off, play.google.com/console).
2. **Install EAS CLI**: `npm install -g eas-cli`, then `eas login`.
3. **Configure the build**: `eas build:configure` sets up `eas.json` for you.
4. **Build**: `eas build --platform ios` and `eas build --platform android`.
   EAS builds in the cloud, so you don't need a Mac even for the iOS build.
5. **Submit**: `eas submit --platform ios` and `eas submit --platform android`
   upload the finished builds to App Store Connect and Google Play Console.
6. **Fill in store listings**: screenshots, description, support URL, and
   Apple's privacy "nutrition label" — be accurate here, especially about
   what data is collected and why, this app touches child-related data so
   reviewers may look closely.
7. **TestFlight / closed testing first**: invite a handful of real parents
   before hitting "submit for review" publicly. Both stores support this
   natively from the same build.

## Before any of this goes live

- Get the content and safety framing reviewed by a SENCO or SEN professional
- Have a proper privacy policy in place, and don't defer ICO registration the
  way it was deferred for ReviewFixed, this app is closer to sensitive data
- Wire up real subscriptions via RevenueCat before removing the placeholder
  Paywall screen
