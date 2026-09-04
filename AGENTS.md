# Repository boundary

FMB News is not part of this repository.

Canonical FMB News repository: `masinlocandher-max/FMBNews`
Production runtime: Cloudflare Worker `fmb-news`
Canonical public newsroom route: `https://www.francinemariebautista.com/news/`

## Hard rules for agents

Do not:

- implement, restore, copy, mirror, deploy, proxy, or maintain FMB News from this repository;
- create FMB News APIs, article publishing automation, newsroom assets, or `/news` application code here;
- treat the Vercel `withlovefmb` project as an FMB News deployment source;
- move FMB News back into `apps/withlovefmb`;
- use this repository as a fallback or source of truth for FMB News.

All FMB News application, publishing, routing, design, SEO, CMS integration, and deployment changes belong in `masinlocandher-max/FMBNews`.

The Vercel deployments sourced from this repository are for non-news properties only.