# With Love, FMB

Official personal website and creative home of **Francine Marie Bautista (FMB)**: founder, author, speaker, brand strategist, creative director, storyteller, and cultural advocate.

## Website sections

- Home
- About
- Work and ventures
- Notes and quotes
- Contact

## Local preview

This is a lightweight static website. Open `index.html` directly in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Custom domain

This repository deploys through a custom GitHub Actions workflow, so a repository `CNAME` file is not required.

1. In **Repository Settings > Pages**, select **GitHub Actions** as the publishing source.
2. In the same Pages screen, enter the exact custom domain and save it.
3. At the domain registrar, add the appropriate GitHub Pages DNS records.
4. Add both the apex domain and `www` version when possible so GitHub can redirect between them.
5. Enable **Enforce HTTPS** after DNS propagation and certificate issuance.
6. Verify the domain through GitHub for stronger takeover protection.

See `DOMAIN_SETUP.md` for the current DNS values and step-by-step instructions.

## Replace the temporary portrait

The current portrait is a branded placeholder. Replace `assets/francine-placeholder.svg` with the final optimized portrait, or update the image path in `index.html`.

Recommended export:

- File: `assets/francine-portrait.webp`
- Size: 1600 x 2000 px
- Format: WebP
- Target weight: below 400 KB

## Launch checklist

- Confirm the exact domain
- Add the final logo files
- Add the final portrait and project images
- Confirm the public contact email and social links
- Replace the SVG social preview with a 1200 x 630 PNG or WebP image
- Add a canonical URL and sitemap after the domain is connected
- Add a privacy policy if forms, analytics, or mailing-list tools are introduced
- Connect analytics only after a consent/privacy decision

## Deployment

A GitHub Pages workflow is included in `.github/workflows/deploy.yml`. Every push to `main` deploys the site after Pages is enabled in the repository settings.
