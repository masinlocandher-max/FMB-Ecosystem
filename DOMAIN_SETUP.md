# Custom domain setup for With Love, FMB

Use this guide after the exact domain spelling is confirmed.

## 1. Enable GitHub Pages

1. Open this repository on GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Under **Custom domain**, enter the final domain and click **Save**.

Because this repository uses a custom GitHub Actions workflow, a `CNAME` file in the repository is not required.

## 2. Configure the apex domain

For a root domain such as `example.com`, add these four `A` records at the domain registrar:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Remove conflicting parking, forwarding, or default `A` records before adding these.

## 3. Configure the www version

Add this record:

| Type | Name | Value |
|---|---|---|
| CNAME | www | masinlocandher-max.github.io |

The CNAME target must not include `/Withlovefmb`.

GitHub recommends configuring both the apex domain and the `www` version so one can redirect to the other.

## 4. Security and HTTPS

- Do not use wildcard DNS records such as `*.example.com`.
- Verify the domain in GitHub account settings to reduce domain takeover risk.
- Return to **Repository Settings > Pages** after DNS propagation.
- Enable **Enforce HTTPS** when the option becomes available.
- DNS and certificate changes may take up to 24 hours.

## 5. Final website changes after the domain connects

Update the following using the exact live domain:

- Canonical URL in `index.html`
- Open Graph URL and absolute social preview image URL
- `robots.txt` with the sitemap URL
- A new `sitemap.xml`
- Public contact email and official social links

## 6. Assets still needed

- Official With Love, FMB logo in SVG and transparent PNG
- Official portrait in WebP
- Project cover images for SENZ, MABAYANI, Cognita, and Cogniya
- Social sharing preview in PNG or WebP, 1200 x 630 px
- Public email address for collaborations
- Official social profile URLs
