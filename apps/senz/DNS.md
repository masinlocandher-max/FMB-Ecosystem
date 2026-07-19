# SENZ Domain DNS Setup

This repository is configured for the canonical host:

```text
senzpr.com
```

## Required DNS records

Create or verify these records at the DNS provider for `senzpr.com`:

| Host | Type | Value | Purpose |
| --- | --- | --- | --- |
| `@` | `A`, `ALIAS`, or `ANAME` | the active hosting target for this site | Serves `https://senzpr.com` as the primary website |
| `www` | `CNAME` | the active hosting target or `masinlocandher-max.github.io` when using GitHub Pages | Allows `https://www.senzpr.com` to redirect to the primary domain |

For GitHub Pages, keep the repository `CNAME` set to `senzpr.com`, use GitHub Pages' documented apex `A` records for `@`, and point `www` to `masinlocandher-max.github.io` with a CNAME record.

For Render, add both `senzpr.com` and `www.senzpr.com` as custom domains and copy Render's exact DNS targets into the DNS provider.

## Canonical URL behavior

The primary public address is `https://senzpr.com`. The `www` version should redirect to the apex domain after its DNS record is correctly connected.
