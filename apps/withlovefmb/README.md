# With love, FMB

Official personal website, creative home, and inclusive digital safe space of **Francine Marie Bautista**.

- Production domain: `www.francinemariebautista.com`
- Production deployment: Vercel
- Backup publication: GitHub Pages through the repository workflow
- Contact: `withlovefmb@gmail.com`
- Founder: Francine Marie Bautista
- Main company: SENZ Strategic Communications
- Education platform: Cognita Institute of AI

## Purpose

With love, FMB is designed for women, LGBTQIA+ people, and men. It combines thoughtful reading, wellness information, music, community participation, private member tools, volunteer opportunities, and FMB-led creative work.

The website does not provide emergency, medical, psychological, or legal services. Public crisis and emergency contacts remain available without registration or payment.

## Current architecture

The project remains an enhanced version of the existing static GitHub Pages codebase. It has not been replaced with a new framework or template.

### Dedicated mental-health app

`app.francinemariebautista.com` is a separate mental-health and emotional-wellbeing environment under With Love, FMB. It is not the mobile version of the public website and must not reproduce the public bulletin, full website navigation, portfolio, FMB&CO. ecosystem, SENZ or Cognita company content, business packages, or unrelated announcements.

Every app feature must directly support mental health, emotional wellbeing, safe reflection, or access to support. The authoritative scope, privacy, safety, crisis-handling, membership, installation, navigation, and experience rules are documented in `docs/app-development-instructions.md`.

### Public website

- branded landing page and approved founder portrait
- dedicated clean routes for Ebooks, Music, Community Engagements - AMDG, About FMB, and FMB & Co.
- safe-space sections for women, LGBTQIA+ people, and men
- long-form reading pages
- public crisis and emergency contacts
- music player connected to published database entries when Supabase is active
- approved community-post feed
- volunteer application form
- contact form
- legal and privacy pages
- responsive website navigation
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

## Current service status

The frontend is connected to Supabase through the public project URL and public anonymous key in `assets/js/config.js`. Private credentials such as the service-role key, database password, and SMTP password must remain outside this repository.

The public account page currently communicates the member-service availability shown to visitors. Before changing registration availability, verify authentication redirects, email delivery, Row Level Security, moderation, and administrator access in the connected Supabase project.

When a service is unavailable, the interface reports that state instead of pretending a request succeeded.

## Go-live sequence

1. Confirm trusted authentication redirect URLs for the production website and app subdomain.
2. Confirm email confirmation, recovery, and transactional-email delivery.
3. Test visitor, member, suspended-member, moderator, and administrator access.
4. Test two-account data isolation.
5. Review the Privacy Policy, Membership Agreement, Community Guidelines, and Data Rights process with a qualified Philippine professional.
6. Confirm the custom domains, HTTPS, app redirect, and deployment.
7. Change public registration availability only after the full checklist passes.

See `SUPABASE_SETUP.md` for the detailed process.

## Main files

- `index.html` – public landing page and website directory
- `app/index.html` – dedicated mental-health app interface
- `docs/app-development-instructions.md` – authoritative app scope, safety, privacy, and experience rules
- `ebooks/index.html` – dedicated reading-library landing page
- `music/index.html` – app-like music landing page and player
- `communityengagements/index.html` – Community Engagements - AMDG
- `aboutfmb/index.html` – founder authority profile
- `fmb&co/index.html` – canonical three-brand portfolio
- `fmbandco/index.html` – compatibility redirect to the canonical FMB & Co. route
- `auth.html` – sign in and registration
- `reset-password.html` – password recovery completion
- `profile/index.html` – private signed-in member dashboard
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
- `docs/new-website-structure-todo.md` – approved structure and phased implementation checklist

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
