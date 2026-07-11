# Supabase production setup

This guide activates real registration, member profiles, private journals, saved content, moderated community posts, contact messages, administrator tools, music entries, and managed media.

## 1. Create a dedicated project

Create a Supabase project used only for With love, FMB.

- Use a strong database password.
- Enable multi-factor authentication for owner and administrator access.
- Do not mix unrelated customer, agency, or school data into this project.
- Keep the service-role key and database password outside GitHub and browser code.

## 2. Install the production schema

Open the Supabase SQL Editor and run:

```text
supabase/schema.sql
```

The script creates or upgrades:

- member profiles
- legal acceptance records
- private journals
- saved content
- moderated community posts
- managed content and wellness resources
- music entries
- media records
- contact and volunteer messages
- administrator activity records
- avatar and site-media storage buckets
- protected administrator functions
- Row Level Security and column-level permissions

Read any SQL error before continuing. Do not open registration after a partial or failed migration.

## 3. Confirm the security rules

The production schema is designed so that:

- a new account always receives the `member` role
- a member cannot edit `role`, `status`, verified email, or joined date
- only an administrator can change another member’s role or status
- a suspended account cannot use protected member tools
- journals and saved content are readable only by their owner
- moderators may review community posts but cannot read journals
- unpublished posts are not public
- public posts require a published status
- contact messages and administrator activity are administrator-only
- avatar uploads are restricted to the owner’s folder
- site-media uploads are administrator-only

Do not weaken these policies to solve a frontend error. Fix the frontend query or data model instead.

## 4. Configure authentication

In Supabase Authentication settings:

1. Enable email and password sign-in.
2. Require email confirmation.
3. Set the Site URL to the live website URL.
4. Add redirect URLs for:
   - the custom domain
   - the temporary GitHub Pages preview
   - local development only while testing
5. Make sure these pages are allowed:
   - `member.html`
   - `reset-password.html`
6. Configure a trusted transactional SMTP provider before a larger public launch.
7. Customize verification and password-reset emails so the sender and website name are clear.

The current frontend uses email and password authentication. It does not claim to use magic-link-only access.

## 5. Add the public browser configuration

Update `assets/js/config.js` with only the public project URL and public anon key:

```javascript
(function(){
  const base = new URL('./', window.location.href).href;
  window.FMB_CONFIG = {
    SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
    SUPABASE_ANON_KEY: 'YOUR_PUBLIC_ANON_KEY',
    SITE_URL: base,
    AUTH_REDIRECT_URL: new URL('member.html', base).href
  };
})();
```

The anon key is intended for browser use only when Row Level Security is correct. Never use the service-role key in this file.

## 6. Create the first administrator

1. Register normally through `auth.html`.
2. Confirm the verification email.
3. Open the `profiles` table in Supabase.
4. Change that account’s role from `member` to `admin`.
5. Confirm that status remains `active`.
6. Sign out and sign in again.
7. Open `admin.html` and verify that real data loads.

After the first administrator exists, role and suspension changes should be made through the protected dashboard function rather than direct browser queries.

## 7. Test authentication

Test all of the following with real email accounts:

- new registration
- duplicate-email behavior
- invalid password validation
- email confirmation
- sign in with correct and incorrect credentials
- local remembered session
- session-only sign in
- sign out
- password reset request
- valid reset link
- expired or reused reset link
- password change from the member dashboard
- suspended-account rejection

## 8. Run the two-account isolation test

Create Account A and Account B.

Confirm that:

- Account A cannot read, update, or delete Account B’s profile.
- Account A cannot read, update, or delete Account B’s journal.
- Account A cannot read or remove Account B’s saved content.
- Account A cannot read Account B’s unpublished community posts.
- Account A cannot upload an avatar into Account B’s folder.
- neither account can assign itself an administrator role
- neither account can remove its own suspension through a direct API request

Do not invite real members until these checks pass.

## 9. Test administrator permissions

Confirm that an administrator can:

- view real member counts
- search and filter members
- change roles through the protected function
- suspend and reactivate accounts
- moderate community submissions
- create, edit, publish, unpublish, and delete managed content
- manage music entries
- upload and remove managed media
- resolve and archive messages

Also confirm that a normal member receives no administrator data even when manually opening `admin.html` or calling the underlying tables.

## 10. Add real music

The music player loads published rows from `music_entries`.

Each playable entry needs:

- title
- artist
- category
- valid public audio URL
- optional description and cover image
- `published` status

Upload approved audio through the administrator media library or use another stable public source that supports browser audio playback. Confirm the MIME type, CORS behavior, mobile playback, and usage rights.

## 11. Test forms and moderation

Confirm that:

- the contact form creates one real contact record
- the volunteer form creates one volunteer record
- repeated submissions trigger the rate limit
- messages are private to administrators
- pending community posts are not public
- publishing adds a public timestamp
- requesting changes shows the review note to the submitting member
- deleting or unpublishing a post removes it from the public feed

## 12. Review privacy and operations

Before registration opens:

- review the Privacy Policy, Membership Agreement, Community Guidelines, and Data Rights process with a qualified Philippine professional
- assign who will moderate posts and answer privacy requests
- create an incident and breach-response procedure
- define message, account, content, and backup retention procedures
- document administrator access and MFA requirements
- test account export and deletion manually
- make sure emergency information remains public

## 13. Replace fragile external media

The approved hero, founder portrait, icon, signature, and volunteer gallery photos are stored as local repository assets. Keep the originals archived separately and replace a local file only with another approved version.

## 14. Final go-live test

Test on:

- Android Chrome
- iPhone Safari
- desktop Chrome
- desktop Safari or Firefox
- a slow mobile connection
- keyboard-only navigation
- reduced-motion mode
- a screen reader smoke test

Then verify:

- GitHub Actions quality workflow passes
- custom domain serves HTTPS
- no browser console errors appear
- every internal link works
- every approved image loads
- no removed cultural module remains
- database logs show no unexpected permission failures
- real email verification and reset messages arrive

Only then should public registration be announced.
