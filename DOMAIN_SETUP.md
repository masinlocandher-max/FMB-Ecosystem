# Custom domain setup for With love, FMB

Use this after the exact domain spelling is confirmed.

## 1. Enable Pages and add the domain

1. Open **Settings > Pages** in this repository.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Under **Custom domain**, enter the final domain and click **Save**.

For a custom GitHub Actions workflow, GitHub does not create a `CNAME` file, and an existing `CNAME` file is ignored and not required.

## 2. Apex-domain DNS

For a root domain such as `example.com`, add these `A` records:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Remove conflicting parking, forwarding, or default records.

## 3. www DNS

Add:

| Type | Name | Value |
|---|---|---|
| CNAME | www | masinlocandher-max.github.io |

Do not include `/Withlovefmb` in the CNAME target. Configure both the apex and `www` versions so GitHub Pages can redirect between them.

## 4. Security and HTTPS

- Add the custom domain in GitHub before changing DNS.
- Verify the domain in GitHub account settings to reduce takeover risk.
- Do not use wildcard DNS records such as `*.example.com`.
- DNS changes may take up to 24 hours.
- Enable **Enforce HTTPS** when GitHub makes the option available.

## 5. Finish after the domain is live

Update the site with the exact domain for:

- Canonical URL
- Open Graph URL and absolute preview-image URL
- Sitemap
- `robots.txt` sitemap entry
- Public business email and official social links
