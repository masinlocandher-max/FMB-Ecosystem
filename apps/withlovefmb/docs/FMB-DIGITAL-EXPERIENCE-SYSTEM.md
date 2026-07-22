# FMB Digital Experience System 2026

This document defines the visual, interaction and asset rules for the public FMB website. It covers the first six redesign phases: foundations, homepage, logos, founder photography, motion and FMB News.

## 1. Experience direction

The website must feel corporate, powerful, artistic and neat. The interface uses Apple-inspired clarity and restraint without copying Apple layouts or branding.

The experience must be:

- mobile-first and safe-area aware
- readable before decorative
- spacious without feeling empty
- responsive from 320px through large desktop screens
- refined through subtle depth, glass, typography and motion
- consistent across pages while allowing each page to retain its own theme

The website must never rely on a broad global stylesheet that overwrites unrelated pages. Page-specific work must be scoped to the page or component it belongs to.

## 2. Core design tokens

The source of truth is `assets/css/fmb-luxury-tokens.css`.

Primary identity:

- Royal purple 950: `#12031B`
- Royal purple 900: `#250936`
- Royal purple 800: `#3B1152`
- Royal purple 700: `#5A1E78`
- Metallic gold 500: `#D8AE4A`
- Soft gold 300: `#F4DEA0`
- Ivory: `#FBF8FF`
- Ink: `#1F1822`
- Muted text: `#766D79`
- Structural line: `#E7DFEA`

FMB News:

- Paper: `#F5F1E9`
- News ink: `#171218`
- News wine: `#7D243B`
- News gold: `#C5A45D`

Typography:

- Display and editorial headings: Cormorant Garamond with Iowan/Palatino/Georgia fallbacks
- Interface, labels and body copy: the Apple system font stack with Inter and Helvetica fallbacks

Spacing follows a restrained 4/8-point scale. Major page sections use generous vertical spacing rather than stacking small cards tightly.

## 3. Logo rules

Only approved logo files may be used. A logo must never be reconstructed from typed text when an approved artwork file exists.

Required rules:

- preserve the original aspect ratio
- never stretch horizontally or vertically
- never place an arbitrary background behind a logo that is meant to be transparent
- never remove part of the supplied artwork
- never invent an alternate emblem
- give every mark visible clear space
- use `object-fit: contain`
- avoid filters that change official colors
- keep the same artwork in the masthead, page identity and footer

### FMB News

The locked News identity is:

`assets/images/news/fmb-news-official.svg`

The SVG contains the exact artwork supplied by Francine Marie Bautista. It must be used consistently in the News header, channel identity, metadata and footer. The old FMB&Co. wordmark plus separately typed “News” construction is retired from the News landing page.

### Other ecosystem logos

SENZ, Cognita and Yoni must remain distinct. Their approved marks may appear inside the shared ecosystem grid, but they must not be recolored to look like FMB. FMB provides the structure; each brand retains its identity.

## 4. Founder photography rules

The approved image order is locked:

1. Standing white-shirt portrait: homepage landing hero
2. Seated white-shirt portrait: next founder overview section

Rules:

- use the full HD repository assets
- keep the face, eyes, chin and hair silhouette unobstructed
- use the natural negative space in the image for copy
- do not place text over the face
- desktop hero uses full-bleed composition with copy on the available negative-space side
- mobile hero separates the photograph and copy when an overlay would reduce readability
- use `object-fit: cover` only where the intended crop is controlled
- use `object-fit: contain` on narrow screens when preserving the complete composition is more important than filling the frame
- never upscale a low-resolution fallback as the final asset

Repository sources:

- `/assets/images/home/francine-home-hero-hd.webp`
- `/assets/images/home/francine-home-founder-hd.webp`

## 5. Homepage structure

The homepage is the official FMB ecosystem bulletin. It is not a generic portfolio and it is not a collection of unrelated landing pages.

Required order:

1. Official bulletin wire
2. Glass navigation
3. Founder hero
4. Ecosystem overview
5. Latest release, currently Yoni
6. Offers arranged by the responsible brand
7. Newsroom feature
8. Complete public-channel directory
9. Founder overview
10. Public-support strip
11. Structured footer
12. Mobile liquid navigation dock

The homepage implementation is scoped to:

- `assets/css/fmb-home-final.css`
- `assets/js/fmb-home-static.js`

## 6. Motion system

Motion must clarify hierarchy. It must not compete with content.

Allowed patterns:

- opacity and short vertical reveal
- image clip or scale transitions below 4 percent
- subtle desktop parallax on approved hero imagery
- sticky header compression
- scroll progress
- slight pointer tilt on large desktop cards
- navigation underline transitions
- mobile dock reveal after the first screen

Not allowed:

- bouncing elements
- constant spinning
- decorative motion with no functional purpose
- large zooms on founder photography
- motion that blocks reading or interaction
- motion without `prefers-reduced-motion` handling

Primary easing:

`cubic-bezier(.22,1,.36,1)`

## 7. FMB News structure

FMB News is a newsroom, not a blog template.

Required order:

1. Network status line
2. Exact FMB News masthead
3. Editorial promise
4. News wire
5. Sticky topic rail
6. Lead investigation
7. Latest-report rundown
8. Context feature
9. Complete story index
10. Editorial standards
11. Founder and editor note
12. Structured newsroom footer
13. iPhone newsroom dock

Every editorial visual must include a visible source or credit. Abusive or racist source material must not be reproduced merely to make the report visually dramatic.

The News landing page must not use JavaScript to replace authored headlines, lead stories or credits after load. JavaScript is limited to navigation, time, scroll state, accessible motion and resilient media handling.

## 8. Responsive requirements

The system must be reviewed at minimum at:

- 320px
- 360px
- 375px
- 390px
- 430px
- 768px
- 820px
- 1024px
- 1280px
- 1440px

Mobile requirements:

- no horizontal overflow
- no text smaller than a readable interface label
- touch targets at least 42px high where practical
- safe-area spacing for fixed bottom navigation
- menus must close through Escape, link selection and outside click
- images must retain meaningful crops
- desktop multi-column layouts must collapse intentionally, not merely shrink

## 9. Release process

No redesign work is merged directly to production.

Required workflow:

1. Figma system and page composition
2. isolated GitHub branch
3. Vercel preview
4. desktop visual QA
5. iPhone visual QA
6. interaction QA
7. asset and credit QA
8. user approval
9. single controlled merge

The active implementation branch for this phase is:

`agent/fmb-luxury-experience-v1`

Production remains unchanged until the preview is approved.
