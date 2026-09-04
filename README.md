# FMB Digital Ecosystem Monorepo

Legacy monorepo for the Francine Marie Bautista public site, With love FMB, Yoni, SENZ, and Cognita applications that still use this repository.

GitHub stores and versions the code. Vercel builds and hosts the applications that remain in this monorepo. Supabase projects, authentication tenants, service-role keys, and private production data remain isolated by application boundary.

## Repository boundary: FMB News

**FMB News is not part of this repository.** Its canonical and self-contained repository is `masinlocandher-max/FMBNews`.

This repository (`masinlocandher-max/FMB-Ecosystem`) is not a source of truth, build target, deployment target, publishing pipeline, API host, fallback copy, or Vercel deployment source for FMB News.

FMB News production ownership is:

- Repository: `masinlocandher-max/FMBNews`
- Runtime: Cloudflare Worker `fmb-news`
- Public routes: `https://www.francinemariebautista.com/news/*` and `/fmbnews*`
- Vercel project `withlovefmb`: non-news FMB properties only

Do not add, restore, deploy, proxy, or maintain FMB News application code, newsroom APIs, article publishing automation, or `/news` frontend code from this repository. All FMB News changes belong in `masinlocandher-max/FMBNews`.

## Applications

| Workspace | Package | Public responsibility | Intended Vercel project |
| --- | --- | --- | --- |
| `apps/withlovefmb` | `@fmb/withlovefmb` | Francine Marie Bautista public website, With love FMB, Yoni, Music, eBooks, Mabayani public pages | `fmb-public-and-yoni` |
| `apps/senz` | `@fmb/senz` | SENZ website, inquiries, and business-facing systems | `senz` |
| `apps/cognita` | `base44-app` | Cognita website, learning application, and learner systems | `cognita` |

Cognita retains its existing internal package name so its committed npm lockfile remains valid. Its public identity and deployment boundary remain Cognita.

The machine-readable ownership and domain rules for applications that remain in this repository live in `packages/ecosystem-contract/ecosystem.json`.

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

The root Vercel configuration remains for legacy non-news properties during migration. Do not use it to deploy FMB News.

## Deployment rule

Vercel deployment configuration in this repository applies only to the applications that remain here:

- `apps/withlovefmb`
- `apps/senz`
- `apps/cognita`

Each project must have its own domains and environment variables. SENZ must use only the SENZ Supabase project. Cognita must use only the Cognita Supabase project. FMB and Yoni must use only the FMB public/member Supabase project.

FMB News is explicitly excluded from this Vercel deployment model and is independently deployed from `masinlocandher-max/FMBNews` through Cloudflare.

See `docs/VERCEL-MONOREPO-MIGRATION.md` for the legacy monorepo migration sequence.