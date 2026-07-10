# With love, FMB

Official personal website and editorial home of **Francine Marie Bautista**.

## Repository structure

- `with-love-fmb-apple.zip` contains the original visual assets, portraits, logo files, and opening video.
- `site-overlay.tar.gz` contains the corrected HTML, CSS, JavaScript, privacy page, 404 page, and robots file.
- `.github/workflows/pages.yml` builds and deploys the finished website to GitHub Pages.
- `DOMAIN_SETUP.md` contains the verified custom-domain steps.

The deploy workflow extracts the original archive, overlays the corrected files, removes the accidental brace-named folder, and publishes the finished `_site` artifact.

## Fixes applied

- Expanded About Me section and positioning
- Added SENZ, MABAYANI, Cognita, and Cogniya context
- Replaced fake email verification with honest private reflection mode
- Made clear that the contact form is not connected yet
- Made Sinag transparent as a scripted companion
- Added crisis-language safety handoff
- Added privacy page, 404 page, robots file, skip link, accessibility improvements, image dimensions, and resilient JavaScript guards
- Added GitHub Pages deployment workflow

## Important launch status

The site is safe to preview publicly, but these features remain intentionally limited until real services are connected:

- The contact form validates only; it does not send or store messages.
- Unspoken Thoughts stays in the visitor's browser and clears locally.
- Sinag is scripted; it is not a human, therapist, or connected AI service.
- Journal entries and bookshelf titles are still placeholders.
- Final project URLs and official social links still need to be added.

## Turn on GitHub Pages

1. Open **Settings > Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Open **Actions** and run **Deploy With love, FMB**, or push a new commit to `main`.
4. Test the deployment URL on desktop and mobile.

## Services still needed

### Contact

Connect a dedicated public business email, a hosted form endpoint, or a serverless function connected to an email provider.

### Unspoken Thoughts community mode

A public submission system needs secure storage, authentication or email verification, explicit consent, moderation, abuse prevention, rate limiting, reporting, and deletion rules.

### Content

Still needed before the full public launch:

- Exact custom domain
- Public business email
- Official social links
- Final journal articles
- Real bookshelf titles and notes
- Live links for SENZ, MABAYANI, Cognita, and Cogniya
- Updated privacy notice after forms, analytics, email, or database services are connected
