# FMB Digital Ecosystem Monorepo

This GitHub repository is the single source-code home for the independently branded websites and applications in the FMB ecosystem.

GitHub stores and versions the code. Vercel builds and hosts each application. Supabase projects, authentication tenants, service-role keys, and private production data remain isolated by application boundary.

## Applications

| Workspace | Package | Public responsibility | Intended Vercel project |
| --- | --- | --- | --- |
| `apps/withlovefmb` | `@fmb/withlovefmb` | Francine Marie Bautista public website, With love FMB, Yoni, News, Music, eBooks, Mabayani public pages | `fmb-public-and-yoni` |
| `apps/senz` | `@fmb/senz` | SENZ website, inquiries, and business-facing systems | `senz` |
| `apps/cognita` | `base44-app` | Cognita website, learning application, and learner systems | `cognita` |

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

`npm run build` currently calls `build:legacy` so the existing combined Vercel deployment continues to work during migration. Do not remove the legacy build or the root `vercel.json` until all three app-root Vercel projects have been verified and the domains have been moved safely.

## Deployment rule

Connect three Vercel projects to this same GitHub repository and set their Root Directories to:

- `apps/withlovefmb`
- `apps/senz`
- `apps/cognita`

Each project must have its own domains and environment variables. SENZ must use only the SENZ Supabase project. Cognita must use only the Cognita Supabase project. FMB and Yoni must use only the FMB public/member Supabase project.

See `docs/VERCEL-MONOREPO-MIGRATION.md` for the migration sequence.
