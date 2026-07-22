# Vercel Monorepo Migration

The code remains in one GitHub repository. The migration changes only the Vercel deployment boundaries.

Do not move all domains at once. Verify one application project at a time and keep the current combined deployment available for rollback until the final step.

## Automated project setup

The repository includes an idempotent project setup tool:

```bash
npm run vercel:plan
VERCEL_TOKEN=... npm run vercel:verify
VERCEL_TOKEN=... npm run vercel:bootstrap
```

The setup creates or verifies these Vercel projects in the connected `senz` team:

- `fmb-public-and-yoni` with Root Directory `apps/withlovefmb`
- `senz` with Root Directory `apps/senz`
- `cognita` with Root Directory `apps/cognita`

It connects each project to `masinlocandher-max/FMB-Ecosystem`, sets the application build and output directories, and enables affected-project deployments.

The automation intentionally does **not**:

- move or attach production domains
- copy environment variables or Supabase credentials
- delete or modify the legacy `withlovefmb` Vercel project
- silently rewrite an existing project with conflicting settings

A manual GitHub Actions workflow is also available at **Actions > Vercel Project Bootstrap**. Add a repository secret named `VERCEL_TOKEN`, select `apply`, and run it. The Vercel token is used only by GitHub Actions and must never be committed to the repository.

## 1. Merge and verify the monorepo branch

Run:

```bash
npm run check
npm run build:fmb
npm run build:senz
cd apps/cognita && npm ci && npm run build
```

The root `npm run build` remains the legacy combined build during migration.

## 2. Create the FMB and Yoni Vercel project

Connect the existing GitHub repository and configure:

- Project Name: `fmb-public-and-yoni`
- Root Directory: `apps/withlovefmb`
- Build Command: `npm run build`
- Output Directory: `dist`
- Domains:
  - `www.francinemariebautista.com`
  - `francinemariebautista.com`
  - `yoni.francinemariebautista.com`
  - `app.francinemariebautista.com`

Copy only environment variables that belong to the FMB public/member system. Do not copy SENZ or Cognita service keys.

Before moving the domains, verify the Vercel preview URL for:

- Homepage and principal navigation
- News, projects, eBooks, music, Get Help, and FMB&Co.
- Yoni sign-up, sign-in, password reset, legal pages, and app assets
- Canonical URLs, sitemap, robots.txt, and social preview images

## 3. Create the SENZ Vercel project

Connect the same GitHub repository and configure:

- Project Name: `senz`
- Root Directory: `apps/senz`
- Build Command: `npm run build`
- Output Directory: `dist`
- Domains:
  - `www.senzpr.com`
  - `senzpr.com`

Configure only SENZ variables, including the SENZ-specific values for:

- `SITE_ORIGIN`
- `ADMIN_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The service-role key must never be added to frontend JavaScript, GitHub files, or another Vercel project.

Verify:

- Public pages and assets
- `/api/health`
- `/api/agents`
- `/api/agents/recommend`
- Inquiry submission to the SENZ Supabase project
- Authorized inquiry retrieval
- Redirect from `senzpr.com` to `www.senzpr.com`

## 4. Create the Cognita Vercel project

Connect the same GitHub repository and configure:

- Project Name: `cognita`
- Root Directory: `apps/cognita`
- Build Command: `npm run build`
- Output Directory: `dist`
- Domains:
  - `www.thecognitainstitute.com`
  - `thecognitainstitute.com`

Copy only Cognita environment variables. Cognita must not receive SENZ or FMB authentication and database credentials.

Verify direct loading and browser refreshes for every important Cognita route because the app uses client-side routing.

## 5. Move domains one application at a time

For each application:

1. Confirm the new project preview is healthy.
2. Remove the domain from the legacy Vercel project.
3. Add it to the new app-root project.
4. Verify HTTPS, redirects, canonical URLs, forms, login, and assets.
5. Keep the legacy project available until the next application is proven stable.

## 6. Retire the combined deployment

Only after all domains are verified:

- Remove the root `vercel.json` in a separate pull request.
- Change the root `build` script from `build:legacy` to `build:all` or make the root non-deployable.
- Remove obsolete combined-build scripts only after confirming no application still depends on them.
- Keep GitHub as the single code repository.

## Rollback

If an application fails after its domain move, detach that domain from the new project and restore it to the legacy project. Do not change the other application projects during that rollback.
