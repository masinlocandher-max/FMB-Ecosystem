# With love, FMB

Official personal website, creative home, and inclusive digital safe space of **Francine Marie Bautista**.

- Planned domain: `www.francinemariebautista.com`
- Temporary host: GitHub Pages
- Contact: `withlovefmb@gmail.com`
- Founder: Francine Marie Bautista
- Main company: SENZ Strategic Communications
- Education platform: Cognita Institute of AI

## Purpose

With love, FMB is designed for women, LGBTQIA+ people, and men. It combines thoughtful reading, wellness information, music, community participation, private member tools, volunteer opportunities, and FMB-led creative work.

The website does not provide emergency, medical, psychological, or legal services. Public crisis and emergency contacts remain available without registration or payment.

## Current architecture

The project remains an enhanced version of the existing static GitHub Pages codebase. It has not been replaced with a new framework or template.

### Public website

- branded landing page and approved founder portrait
- safe-space sections for women, LGBTQIA+ people, and men
- long-form reading pages
- public crisis and emergency contacts
- music player connected to published database entries when Supabase is active
- approved community-post feed
- volunteer application form
- contact form
- legal and privacy pages
- responsive app-like mobile navigation
- web manifest and service worker foundation

### Verified member tools

- email and password registration
- email verification
- sign in, session persistence, sign out, and password recovery
- dashboard with real saved-item, journal, and post counts
- private journal entries
- saved reading content
- moderated community submissions and status history
- editable full name, username, biography, interests, and avatar
- password change and privacy links

### Administrator tools

- role-protected administrator dashboard
- real member counts and recent registrations
- member search, filters, role changes, suspension, and reactivation
- community moderation
- content and wellness-resource management
- music management
- media upload and deletion
- contact and volunteer-message management
- administrative activity records

## Backend

The member and administrator system uses Supabase for:

- authentication
- PostgreSQL data
- Row Level Security
- protected administrator functions
- profile and site-media storage

Run `supabase/schema.sql` in a dedicated Supabase project, then add only the public project URL and public anon key to `assets/js/config.js`.

Never place the Supabase service-role key, database password, SMTP password, or any private credential in this repository.

## Security model

- new profiles always begin with the `member` role
- members cannot update role, status, verified email, or joined date
- member updates are limited to approved profile columns
- administrator changes use protected database functions
- private journals are restricted to their owner
- saved content is restricted to its owner
- unpublished community posts are visible only to their owner and authorized staff
- public community posts must be approved first
- administrator routes verify the database role instead of hiding buttons only
- avatars are restricted to the owner’s storage folder
- site media is restricted to administrators

## Important launch status

The frontend, schema, validation, and role protections are implemented in the repository. **Real registration and database-backed features remain intentionally inactive until a Supabase project is connected.**

`assets/js/config.js` currently contains blank Supabase values. While those values are blank:

- no account is created
- no password is changed
- no journal or community post is saved
- no contact or volunteer message is submitted through the database
- no administrator data is shown

The interface reports this state instead of pretending a request succeeded.

## Go-live sequence

1. Create a dedicated Supabase project.
2. Run `supabase/schema.sql`.
3. Enable email confirmation and configure trusted authentication redirect URLs.
4. Configure a transactional email provider for production authentication.
5. Add the public Supabase URL and anon key to `assets/js/config.js`.
6. Register the first account and change its profile role to `admin` directly in Supabase.
7. Test visitor, member, suspended-member, moderator, and administrator access.
8. Test two-account data isolation.
9. Review the Privacy Policy, Membership Agreement, Community Guidelines, and Data Rights process with a qualified Philippine professional.
10. Replace remaining externally hosted volunteer gallery photos with repository or managed-media copies when the approved originals are available.
11. Confirm the custom domain, HTTPS, email delivery, and GitHub Pages deployment.
12. Open public registration only after the full checklist passes.

See `SUPABASE_SETUP.md` for the detailed process.

## Main files

- `index.html` – public landing page
- `about.html` – founder profile
- `auth.html` – sign in and registration
- `reset-password.html` – password recovery completion
- `member.html` – private member dashboard
- `admin.html` – protected administrator dashboard
- `music.html` – music player
- `volunteer.html` – volunteer roles and application
- `privacy-policy.html` – operational privacy notice
- `membership-agreement.html` – membership terms
- `community-guidelines.html` – community rules
- `data-rights.html` – account and information request process
- `assets/js/site.js` – shared website behavior
- `assets/js/auth.js` – authentication
- `assets/js/member.js` – member tools
- `assets/js/admin.js` – administrator tools
- `assets/js/music.js` – dynamic music library and player
- `assets/js/config.js` – public Supabase configuration
- `supabase/schema.sql` – tables, functions, storage, permissions, and RLS
- `scripts/quality_check.py` – static link and asset checks
- `.github/workflows/quality.yml` – automated quality workflow

## Deliberately excluded

No Tina Sambal dictionary, Sambal language-learning module, cultural archive, heritage quiz, cultural database, or MABAYANI module is part of this website.

## Quality checks

GitHub Actions validates:

- internal page and asset references
- duplicate HTML IDs
- image alt attributes
- JSON syntax
- JavaScript syntax
- accidental return of removed cultural modules
- accidental public service-role credential text

The checks reduce regressions but do not replace browser, accessibility, database, security, or real-user testing.
