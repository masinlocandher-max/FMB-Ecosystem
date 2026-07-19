# SENZ Vercel Deployment

The repository uses a custom Node.js HTTP server (`server.js`) and static HTML, CSS, JavaScript, and image assets. Vercel should import it using the **Other** framework preset. The included `vercel.json` already sets this preset.

## Import settings

- Repository: `masinlocandher-max/Senz`
- Production branch: `main`
- Root directory: repository root
- Framework preset: Other
- Install command: `npm install`
- Build command: leave empty
- Output directory: leave empty
- Node.js: use a currently supported Node.js version compatible with `>=18`

## Required environment variables

Configure these in Vercel Project Settings before testing the inquiry form:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_TOKEN`
- `SITE_ORIGIN`
- `CANONICAL_HOST`
- `REDIRECT_HOSTS`

Recommended production values:

```text
SITE_ORIGIN=https://www.senzpr.com
CANONICAL_HOST=www.senzpr.com
REDIRECT_HOSTS=senzpr.com
```

Never commit the Supabase service-role key or admin token to GitHub. Store them only as encrypted Vercel environment variables.

## Important storage note

The server currently falls back to `data/inquiries.jsonl` when Supabase is not configured. Vercel Functions do not provide persistent project-file storage, so production inquiry submissions must use Supabase. A successful page deployment does not by itself verify that inquiry storage is working.

## Verification after deployment

1. Open the Vercel preview on an iPhone-sized viewport.
2. Check Home, About, Services, Creative Network, Contact, and FAQ.
3. Open and close the mobile navigation and the consultation bottom sheet.
4. Submit a test inquiry and confirm the new record appears in Supabase.
5. Open `/api/health` and confirm it returns an `ok` response.
6. Connect `senzpr.com` and `www.senzpr.com` only after the preview passes the checks above.
