# Vercel Monorepo Migration

The repository remains the GitHub source home for the active FMB, SENZ, and Cognita workspaces. Deployment boundaries should remain independent even when a legacy Vercel project name is still in use.

## Active workspaces

- `apps/withlovefmb` → FMB public website and ecosystem gateway
- `apps/senz` → SENZ
- `apps/cognita` → Cognita

The current FMB Vercel project may still be named `fmb-public-and-yoni`; treat that as a legacy infrastructure identifier, not a statement that Yoni source remains in this workspace.

Yoni is independently deployed at `https://yoni.francinemariebautista.com/`. The compatibility host `app.francinemariebautista.com` may redirect there, but the FMB workspace must not rewrite Yoni traffic into a local `/app/` implementation.

FMB Music and FMB eBooks are retired and must not appear in deployment verification, routing, manifests, service-worker caches, or public navigation.

## Verification commands

```bash
npm run check
npm run build:fmb
npm run build:senz
cd apps/cognita && npm ci && npm run build
```

The root `npm run build` remains the legacy combined build until the active application-root Vercel projects are verified and the combined deployment can be retired safely.

## FMB project

Configure:

- Root Directory: `apps/withlovefmb`
- Build Command: `npm run build`
- Output Directory: `dist`
- Primary domains: `www.francinemariebautista.com`, `francinemariebautista.com`
- Compatibility redirect host: `app.francinemariebautista.com` → `https://yoni.francinemariebautista.com/`

Before a production domain change, verify:

- homepage and primary navigation
- About FMB, News, Projects, With Love FMB, Get Help, FMB&CO., Mabayani, profile/admin routes where applicable
- external Yoni links and the app-subdomain redirect
- canonical URLs, sitemap, robots.txt, manifest, service worker, and social preview assets
- no retired eBook or Music routes or runtime requests

## SENZ project

Configure `apps/senz` as its own Vercel project and keep SENZ environment variables and Supabase credentials isolated from FMB and Cognita.

Verify public pages, health/API routes, inquiry submission, authorized inquiry retrieval, and domain redirects before moving production domains.

## Cognita project

Configure `apps/cognita` as its own Vercel project and keep Cognita environment variables isolated. Verify important client-side routes through direct loading and browser refreshes.

## Domain moves

Move one application boundary at a time:

1. Confirm the new preview is healthy.
2. Move only that application’s domains.
3. Verify HTTPS, redirects, canonical URLs, forms, authentication, and assets.
4. Keep rollback available until the new boundary is proven stable.

## Retiring the combined deployment

Only after all active application boundaries are verified:

- remove the root `vercel.json` in a separate controlled change
- change the root build away from `build:legacy`
- remove obsolete combined-build scripts only after confirming no active deployment depends on them
- keep GitHub as the source-control home
