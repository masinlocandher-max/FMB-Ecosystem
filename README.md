# With love, FMB

Official personal website and editorial home of **Francine Marie Bautista**.

- Planned domain: `www.francinemariebautista.com`
- Temporary host: GitHub Pages
- Contact: `Withlovefmb@gmail.com`
- Location: Masinloc, Zambales, Philippines
- Instagram: `@bb.fmb`
- Main company: SENZ Strategic Communications
- Education platform: Cognita Institute of AI

## Current phase

This version completes the free-site architecture before Herra and payment processing.

### Public features

- personal website, portfolio, quotes, projects, and contact information
- searchable Source of Truth previews
- emergency mental-health contacts kept outside membership
- local-only Unspoken Thoughts reflection that is not uploaded
- public approved Freedom Wall feed with server timestamps

### Free verified membership

- passwordless email magic-link access
- recorded acceptance of the Privacy Notice, Membership Agreement, and Community Guidelines
- member-only full Source of Truth reader
- private personal journal
- Freedom Wall submission and status history
- verified contact messages
- member data and rights information
- moderator and administrator Freedom Wall queue

## Backend choice

The live member database is designed for Supabase, not a normal Google Drive or Sheet. Supabase provides authentication, Postgres storage, Row Level Security, and authenticated Edge Functions.

Google Drive may be used later only for encrypted, restricted backups. See `GOOGLE_DRIVE_BACKUP.md`.

## Privacy and security

Security-relevant member writes may record the account ID, IP address, browser or user-agent information, action, resource identifier, and timestamp. This collection is explicitly disclosed in the Privacy Notice and Membership Agreement. It is not hidden.

Private journals are visible only to their authenticated owner under Row Level Security. Freedom Wall posts remain pending until moderation. Emergency information is never paywalled or membership-gated.

## Main files

- `index.html`: complete public and member interface
- `privacy.html`: long-form operational Privacy Notice
- `membership-agreement.html`: free membership terms
- `community-guidelines.html`: Freedom Wall and community rules
- `data-rights.html`: access, correction, export, deletion, and account-closure process
- `assets/js/app.js`: public interactions, authentication, journal, wall, moderation, messaging, and reader
- `assets/js/config.js`: public Supabase configuration placeholder
- `supabase/schema.sql`: tables, indexes, Row Level Security, and retention cleanup
- `supabase/functions/member-write/index.ts`: authenticated writes, validation, rate limiting, IP and security logs
- `SUPABASE_SETUP.md`: deployment steps
- `ADMIN_MODERATION.md`: moderation standard
- `GOOGLE_DRIVE_BACKUP.md`: encrypted-backup rules

## Important launch status

The interface and backend code are complete, but real membership remains inactive until a Supabase project is created and its public configuration is added. The site never pretends that an account or journal has been saved when the backend is not connected.

Before inviting members:

1. Create and configure Supabase.
2. Run the database schema and deploy the Edge Function.
3. Configure email verification and allowed redirect URLs.
4. Create the first administrator.
5. Test two-account data isolation.
6. Review the legal documents with a Philippine lawyer or privacy professional.
7. Establish breach response, moderation, retention cleanup, and encrypted backups.
8. Activate GitHub Pages.
9. Connect the custom domain after it becomes active.

## Domain

The website already includes metadata for `www.francinemariebautista.com`, but the domain is awaiting activation. The temporary GitHub Pages preview works without the custom domain.
