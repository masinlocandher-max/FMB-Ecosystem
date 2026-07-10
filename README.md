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

1. Add the exact domain to a root-level file named `CNAME`.
2. In **GitHub > Repository Settings > Pages**, choose **GitHub Actions** as the source.
3. At the domain registrar, point the domain to GitHub Pages using the DNS records shown in GitHub's custom-domain instructions.
4. Enable **Enforce HTTPS** after DNS propagation.

Do not add a `CNAME` file until the final domain spelling is confirmed.

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
- Add privacy policy if forms, analytics, or mailing-list tools are introduced
- Connect analytics only after a consent/privacy decision

## Deployment

A GitHub Pages workflow is included in `.github/workflows/deploy.yml`. Every push to `main` deploys the site after Pages is enabled in the repository settings.
