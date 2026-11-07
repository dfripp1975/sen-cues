# The Book Club For One

A personal book club for every book you read: spoiler-safe chapter companions,
discussion questions and 20 free reading tools. React + Vite + Tailwind, with
Supabase for accounts, libraries and subscriptions.

## Run it

```bash
cp .env.example .env   # add your Supabase URL and anon key
npm install
npm run dev
```

`npm run build`, `npm run typecheck` and `npm run lint` are also available.

## Design system

All colours, type sizes, radii and shadows live in `tailwind.config.js`; shared
component classes (`btn-primary`, `card`, `panel`, `input-field`, `eyebrow`,
`tool-result`) live in `src/index.css`. Pages use these names, so retune the
values there rather than adding one-off colours in components.

- Type: Newsreader (headlines) and Hanken Grotesk (body), loaded in `index.html`.
- Colour: ink green `forest-500` for brand and text, terracotta for the one main
  action per screen, warm paper backgrounds. Every token has a dark-mode pair.
- Book covers come from Open Library; `BookCover` renders a typeset cover
  underneath so a missing image never leaves an empty frame.

## Two pages, one site

- `index.html` is the cinematic front page (Ink Drop), served at `/`. Its
  video and images live in `public/cinematic/`.
- `app.html` is the React app, served for every other address (`/books`,
  `/tools/...`, `/library`, ...).
- `npm run dev` and `npm run preview` handle this automatically
  (`vite.config.ts`). In production the host needs the same rule:
  `public/_redirects` does it on Netlify and `vercel.json` on Vercel. On other
  hosts, rewrite every path without a file extension, except `/`, to `/app.html`.
- The front page links to every section of the app in its footer. Add new pages
  there as well as in the app's own footer.

## Notes

- Every page except Home is lazy-loaded. Book chapter/character content lives in
  `src/data/batch*.content.ts` and only loads on book pages.
- Ads only load when `VITE_ADSENSE_CLIENT` is set **and** the visitor accepts
  cookies (`src/lib/consent.ts`).
- Icons used by data files must be listed in `src/lib/icons.ts`.
