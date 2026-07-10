# Custom domain setup for With love, FMB

Primary planned address: **www.francinemariebautista.com**

The domain is currently awaiting activation. Complete these steps after the registrar marks it active.

## 1. Enable GitHub Pages

1. Open **Settings > Pages** in `masinlocandher-max/Withlovefmb`.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Under **Custom domain**, enter `www.francinemariebautista.com` and click **Save**.

This repository uses a custom GitHub Actions workflow, so a repository `CNAME` file is not required for the deployment artifact.

## 2. Configure the www address

Add this DNS record at the domain registrar:

| Type | Name | Value |
|---|---|---|
| CNAME | www | masinlocandher-max.github.io |

Do not include `https://` or `/Withlovefmb` in the CNAME value.

## 3. Configure the root domain

To allow `francinemariebautista.com` to redirect to the `www` address, add these apex records:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Remove conflicting parking, forwarding, or default `A` and `CNAME` records before adding the GitHub Pages records.

## 4. Security and HTTPS

- Add the custom domain in GitHub before or alongside the DNS change.
- Verify `francinemariebautista.com` in GitHub account settings to reduce domain-takeover risk.
- Do not create wildcard records such as `*.francinemariebautista.com`.
- Return to **Settings > Pages** after DNS resolves.
- Enable **Enforce HTTPS** when GitHub makes the option available.

## 5. Website domain configuration already completed

The current website build already includes:

- canonical URL for `https://www.francinemariebautista.com/`
- Open Graph domain metadata
- domain-aware `robots.txt`
- sitemap for the official domain
- public email `Withlovefmb@gmail.com`
- Instagram `@bb.fmb`
- location `Masinloc, Zambales, Philippines`
