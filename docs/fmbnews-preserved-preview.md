# FMB News preserved renovation preview

This preview introduces the approved Apple-inspired FMB News shell without replacing the live newsroom.

## Protected route

`/fmbnews-preview/`

The page is intentionally `noindex` and loads its content from a generated manifest. Existing `/news/<article>/` routes, article HTML, images, credits, metadata, and the live `/news/` and `/fmbnews/` landing pages remain unchanged.

## Navigation

Primary menu:

- Home
- Alam Mo Ba?
- Lotto
- Horoscope
- About
- FMB Message
- Submit Your Story

Archive categories live only inside **News Archives**. There is no bottom navigation.

## Daily home behavior

Home filters the preserved article manifest using `Asia/Manila`. Only articles published from 12:00 a.m. through 11:59 p.m. of the current Philippine calendar day appear on Home. At midnight, the Home feed resets automatically in the browser; older articles remain available in their archives.

## Build preservation

`scripts/post-build-fmbnews-preview.mjs` reads generated article pages under `dist/news/` and writes:

`dist/assets/data/fmbnews-manifest.json`

It never rewrites article pages. `scripts/check-fmbnews-preview.mjs` verifies that the manifest contains exactly the same number of published article routes as the generated source.

Manual category or segment corrections can be made in:

`apps/withlovefmb/fmbnews-preview/content-overrides.json`

Use the permanent article route as the key, for example:

```json
{
  "categories": {
    "/news/example-story/": "education"
  },
  "segments": {
    "/news/example-fact/": "alam-mo-ba"
  }
}
```

## Production cutover

Do not replace `/news/` or `/fmbnews/` until the preview passes desktop, mobile, keyboard, route-count, image, and archive QA.
