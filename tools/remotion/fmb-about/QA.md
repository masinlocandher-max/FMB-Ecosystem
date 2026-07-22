# About FMB QA

Validated before GitHub handoff using Playwright with Chromium.

## Responsive viewports

- 1440 × 1000 desktop
- 768 × 1024 tablet
- 390 × 844 mobile
- 320 × 700 small mobile

At every viewport, `document.documentElement.scrollWidth` matched `document.documentElement.clientWidth`, with no document-level horizontal overflow.

## Interaction checks

- Mobile navigation opens and updates `aria-expanded`.
- The Areas of Work selector updates its active title, description, and `aria-selected` state.
- No browser console errors were observed during the responsive interaction checks.
- JavaScript syntax validation passed.
- Remotion TypeScript source passed syntax transpilation checks.

## Deployment boundary

This branch contains source changes only. No Vercel action was invoked and no Vercel configuration file was changed.
