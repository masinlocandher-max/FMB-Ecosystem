# Repository boundary

FMB News is not part of this repository.

Canonical FMB News repository: `masinlocandher-max/FMBNews`
Production runtime: Cloudflare Worker `fmb-news`

## Hard rules for agents

Do not:

- implement, restore, copy, mirror, deploy, proxy, or maintain FMB News from this repository;
- create FMB News APIs, article publishing automation, newsroom assets, or `/news` application code here;
- treat any deployment sourced from this repository as an FMB News deployment source;
- move FMB News back into `apps/withlovefmb`;
- use this repository as a fallback or source of truth for FMB News;
- bind, claim, alias, redirect, proxy, or configure any custom production domain for this repository or a hosting project sourced from it.

All FMB News application, publishing, routing, design, SEO, CMS integration, and deployment changes belong in `masinlocandher-max/FMBNews`.

This repository is deployment-isolated. Hosting projects sourced from it must use provider-generated preview/development URLs only unless a future explicit repository-specific exception is approved outside this repository.
