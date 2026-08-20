# With love, FMB

Public website and ecosystem gateway for **Francine Marie Bautista**.

- Production domain: `www.francinemariebautista.com`
- Deployment: Vercel
- Contact: `withlovefmb@gmail.com`
- Founder: Francine Marie Bautista

## Scope

This workspace contains the public FMB website, With Love, FMB, FMB News, Mabayani public pages, support and community routes, member tools that belong to the public FMB system, and links to independently deployed ecosystem destinations.

Yoni is no longer implemented inside this workspace. The public site may link to `https://yoni.francinemariebautista.com/`, but Yoni application source and runtime code are outside this repository boundary.

FMB Music and FMB eBooks are retired from this workspace. Their routes, player and reader code, product assets, API/data files, public navigation, and active backend definitions are not part of the current site.

## Core public routes

- `/`
- `/aboutfmb/`
- `/news/`
- `/projects/`
- `/withlovefmb/`
- `/communityengagements/`
- `/gethelp/`
- `/fmbandco/`
- `/mabayani/`
- `/profile/`
- `/admin.html`
- legal and privacy routes

## Build

```bash
npm run build
```

The build writes deployable output to `dist/`.

## Backend

Member and administrator features that remain use Supabase. Public project configuration belongs in `assets/js/config.js`; private credentials must never be committed.

## Architecture rules

- one canonical route per public responsibility
- no embedded duplicate applications
- no retired product routes or runtime assets
- independently deployed ecosystem products are linked, not mirrored
- no service-role secrets or private production data in the repository

## Quality

Use the repository checks plus browser, accessibility, database, security, and real-device validation before production release.
