# Premiya — “Prize for Good Deeds” landing redesign

A redesign proposal for the landing page of **“Премия за добрые дела”** (Prize for Good Deeds) — a volunteer-run award by the *Kapli Dobra* community, supported by the jewellery brand *Diamond Angel*. People nominate themselves or others for quiet acts of kindness; the community then votes for the winners.

**Live demo:** https://premiya-redesign.vercel.app

> This is an unofficial redesign proposal, not the production site.

| Desktop · 1440 | Mobile · 390 |
| --- | --- |
| ![Desktop hero](docs/screenshot-desktop.jpg) | ![Mobile hero](docs/screenshot-mobile.jpg) |

## Highlights

- **Design system first.** The current site was audited and rebuilt in Figma as a token-based system: colours (Light/Dark), a 4 pt spacing scale, typography, stroke widths and a responsive layout grid. The code follows those tokens.
- **New hero.** Brand lock-up, a typographic headline with an emphasised accent word, the primary CTA and deadline moved from a sticky top bar into the first screen, and a light animated illustration — a drop over still water, echoing the *Kapli Dobra* (“Drops of Kindness”) name.
- **Animated counter** for the “good deeds” figure, triggered when it scrolls into view.
- **Sticky section navigation** that appears after the first screen, highlights the current section (scroll-spy) and scrolls smoothly with an offset for the fixed header. It becomes a horizontally scrollable strip on phones and keeps the grid margins.
- **Back-to-top button** with safe-area insets for notched devices.
- **Mobile-first fixes:** added the missing `<meta name="viewport">` and `<!doctype html>` (the page was rendering in quirks mode at 980 px on phones), unified breakpoints, removed horizontal overflow and made the form controls full-width with 44 px touch targets.
- **iOS Safari performance:** the decorative canvas background renders at 1× and a lower frame rate on touch devices and pauses while scrolling. Reveal animations are staggered only among elements that enter the viewport together.

## Tech stack

- Static **HTML, CSS and vanilla JavaScript**, with no framework and no build step.
- Fonts: **Prata**, **Cormorant Garamond** and **Golos Text** (Google Fonts).
- Hosting: **Vercel**, with security headers set in [`site/vercel.json`](site/vercel.json).
- Design: **Figma**, with variables, text styles, components and a layout grid (the file is private).

## Responsive system

Breakpoints mirror the Figma variable modes:

| Mode | Viewport | Columns | Margin | Gutter |
| --- | --- | --- | --- | --- |
| Mobile | < 768 px | 4 | 24 | 16 |
| Tablet | 768–1023 px | 8 | 24 | 20 |
| Desktop S | 1024–1279 px | 12 | 24 | 20 |
| Desktop L | ≥ 1280 px | 12 | 136 (1008 px container) | 20 |

## Accessibility

- Honours `prefers-reduced-motion`: reveal animations, the illustration, the counter and smooth scrolling are all disabled when the user asks for reduced motion.
- Visible `:focus-visible` states, `aria-current` on the active navigation item and `aria-label` on icon-only controls. Decorative SVGs are `aria-hidden`.
- Touch targets are at least 44 × 44 px on mobile.
- Known issues inherited from the original palette: tertiary grey text (3.3:1) and gold captions (3.46:1) are below WCAG AA for small text.

## Project structure

```
.
├── site/                 # deployable static site (Vercel Root Directory)
│   ├── index.html        # landing page: markup, styles and scripts
│   ├── politika.html     # privacy policy
│   ├── zayavka.js        # application form: photo upload and submission
│   └── vercel.json       # security and caching headers
├── docs/                 # README screenshots
└── package.json          # dev and deploy scripts
```

## Getting started

Requires Node.js 18 or newer.

```bash
npm run dev       # serves ./site at http://localhost:3000
```

You can also open `site/index.html` directly in a browser.

## Deployment

The Vercel project uses `site/` as its **Root Directory**. With the GitHub integration connected, every push to `main` deploys to production and every other branch or pull request gets a preview URL.

Manual deploys from the repository root:

```bash
npm run preview   # preview deployment
npm run deploy    # production deployment
```

## Known limitations

- The application form posts to `/api/photo` and `/api/zayavka`. These endpoints belong to the production backend and are **not** part of this repository, so submissions fail on the demo.
- `index.html` keeps the original single-file architecture: several stacked style layers plus inline scripts and base64 images. The redesign overrides were added as clearly labelled layers so the changes stay reviewable against the original.
- The brand logo is a raster image, so it needs a CSS filter in dark mode.

## Roadmap

- Extract CSS and JS into separate files, and collapse the stacked style layers into a single token-driven stylesheet generated from the Figma variables.
- Replace the inline base64 logos with an optimised SVG.
- Add Lighthouse CI and an automated accessibility check (axe).

## Credits

Content, brand name and logo belong to *Diamond Angel* and the *Kapli Dobra* community. This repository is shared for review of the redesign proposal. All rights reserved.
