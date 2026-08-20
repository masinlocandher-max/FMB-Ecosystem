# FMB Digital Ecosystem Monorepo

This repository is the source-code home for the independently branded websites and applications that remain inside the FMB ecosystem boundary.

GitHub stores and versions the code. Vercel builds and hosts each application. Supabase projects, authentication tenants, service-role keys, and private production data remain isolated by application boundary.

## Applications

| Workspace | Package | Public responsibility | Intended Vercel project |
| --- | --- | --- | --- |
| `apps/withlovefmb` | `@fmb/withlovefmb` | Francine Marie Bautista public website, With love FMB, FMB News, Mabayani public pages, and ecosystem gateway | `fmb-public-and-yoni` (current legacy project identifier) |
| `apps/senz` | `@fmb/senz` | SENZ website, inquiries, and business-facing systems | `senz` |
| `apps/cognita` | `base44-app` | Cognita website, learning application, and learner systems | `cognita` |

Yoni is independently deployed and is no longer implemented inside `apps/withlovefmb`. The FMB website may link to `https://yoni.francinemariebautista.com/`, and `app.francinemariebautista.com` may remain as a compatibility redirect, but Yoni application source and runtime assets are outside this repository boundary.

FMB Music and FMB eBooks are retired product areas and are not part of the current repository surface. The former public FMB membership, registration, member-profile, journal, check-in, and saved-content surfaces are also retired. Supabase Auth remains only where required for the private FMB&CO. Orchestrator and administrative authorization.

Cognita retains its existing internal package name so its committed npm lockfile remains valid. Its public identity and deployment boundary remain Cognita.

The machine-readable ownership and domain rules live in `packages/ecosystem-contract/ecosystem.json`.

## Shared packages

Only code that is genuinely safe to share belongs in `packages/`. Brand identities, authentication clients, service-role keys, user tables, and production environment variables are not shared packages.

## Commands

```bash
npm run check
npm run build:fmb
npm run build:senz
npm run build:cognita
npm run build:all
```

`npm run build` currently calls `build:legacy` so the existing combined Vercel deployment continues to work during migration. Do not remove the legacy build or the root `vercel.json` until the active application-root projects and domains have been verified safely.

## Deployment rule

Connect the active application workspaces to independently configured Vercel projects and keep environment variables isolated by application. SENZ must use only the SENZ Supabase project. Cognita must use only the Cognita Supabase project. FMB must use only the FMB public/admin Supabase project; public account registration is not part of the FMB site.

See `docs/VERCEL-MONOREPO-MIGRATION.md` for the current migration notes.
