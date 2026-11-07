# The Book Club For One: cinematic front page

Built with the 10K Websites skill (Ink Drop concept). The hero film was made in
Google Gemini (Veo) instead of Higgsfield, at the owner's choice.

- `index.html` plus `assets/`. Plain HTML, CSS and JavaScript, no build step.
- `assets/hero-scrub.mp4` (H.264) and `hero-scrub.webm` (VP9 fallback) are
  re-encoded with a keyframe every 8 frames so scrolling stays smooth.
- Phones, portrait tablets and reduced-motion visitors get a still hero built
  from `hero-ending.jpg` and never download the video.
- Links (`/books`, `/tools`, `/signin`) and the search form point at the main
  app on the same domain. If this page is hosted elsewhere, set `APP` near the
  top of the script to the app's address.
- Before going live, fill in the `og:url` and `og:image` tags at the
  `DEPLOY STEP` comment.

Preview locally: `npx http-server` in this folder, then open the localhost link.
Double-clicking `index.html` shows the still hero only, because browsers block
the video fetch on file:// pages.
