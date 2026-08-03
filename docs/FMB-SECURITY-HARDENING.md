# FMB Website Security Hardening

This document records the protections required for `francinemariebautista.com`, `www.francinemariebautista.com`, `yoni.francinemariebautista.com`, `app.francinemariebautista.com`, and `data.francinemariebautista.com`.

## Protections enforced in code

- Content Security Policy with explicit script, style, font, connection, media, and frame sources.
- Clickjacking protection through `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- MIME-sniffing, referrer, browser-capability, opener, legacy plug-in, and DNS-prefetch protections.
- Long-lived HTTPS enforcement.
- Private, no-store, no-index responses for the operations dashboard, authentication, member profile, and Yoni application routes.
- No-cache handling for service-worker files.
- Automated repository secret scanning before builds.
- CodeQL analysis, dependency auditing, dependency update pull requests, and monorepo-boundary checks.
- A public `security.txt` contact and private vulnerability-reporting policy.

## GitHub settings to enable manually

These settings are controlled in GitHub and cannot be guaranteed by repository files alone:

1. Protect `main` with a ruleset.
2. Require a pull request before merging.
3. Require the `Repository security` and `CodeQL` checks.
4. Require review-thread resolution.
5. Block force pushes and branch deletion.
6. Enable secret scanning and push protection.
7. Enable Dependabot alerts and security updates.
8. Enable private vulnerability reporting.
9. Require two-factor authentication and preferably a passkey for every administrator.
10. Keep at least one verified backup administrator and store recovery codes offline.

## Vercel and Cloudflare settings to verify manually

- Keep preview deployments protected and separate from production.
- Keep FMB/Yoni, SENZ, and Cognita environment variables and Supabase projects isolated.
- Enable managed WAF rules, bot protection, and rate limits for authentication and submission routes.
- Review deployment logs and authentication anomalies.
- Do not expose service-role keys, database passwords, private API keys, or production exports in GitHub or client-side JavaScript.

## Release rule

Security changes must be tested through a preview deployment first. The live production domain should only change after the preview passes route, authentication, media, and mobile checks.
