# Supabase setup for the free member system

This guide activates verified email membership, private journals, Freedom Wall moderation, contact messages, privacy requests, and disclosed security logging.

## 1. Create a dedicated project

Create a new Supabase project specifically for With love, FMB. Use a strong database password and enable multi-factor authentication on administrator accounts.

Do not reuse a project that contains unrelated customer or business data.

## 2. Install the database schema

Open the Supabase SQL Editor and run:

`supabase/schema.sql`

The schema creates:

- member profiles
- recorded policy acceptances
- private journal entries
- Freedom Wall posts and moderation status
- verified contact messages
- security events
- privacy and data-rights requests

It also enables Row Level Security and creates owner, moderator, administrator, public-feed, and retention policies.

## 3. Deploy the authenticated write function

Install the Supabase CLI, then run:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy member-write
```

The function validates authenticated writes, applies rate limits, checks suspension status, records consent evidence, and creates security events for protected operations.

Never place the Supabase service-role key in website JavaScript, GitHub source files, screenshots, or public configuration.

## 4. Configure authentication

In Supabase Authentication settings:

1. Enable email sign-in and email confirmation.
2. Set the temporary Site URL to the GitHub Pages preview address.
3. Add allowed redirect URLs for:
   - the GitHub Pages preview
   - `https://www.francinemariebautista.com/`
   - `https://francinemariebautista.com/`
   - localhost only while testing
4. Customize the magic-link email so it clearly identifies With love, FMB.
5. Configure a trusted transactional SMTP provider before a larger public launch.

## 5. Add the public website configuration

Copy:

`assets/js/config.example.js`

to:

`assets/js/config.js`

Then add only the public project URL and publishable or anon key:

```javascript
window.FMB_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_PUBLIC_ANON_KEY"
};
```

The anon key is designed for browser use only when Row Level Security is correctly enabled. The service-role key must remain server-side.

## 6. Create the first administrator

1. Register normally through the website using the administrator email.
2. Confirm the magic-link email.
3. In the Supabase Table Editor, change that profile role from `member` to `admin`.
4. Sign out and sign in again.
5. Confirm that the moderation queue becomes available.

Use separate everyday and administrator accounts where practical.

## 7. Required isolation test

Before launch, create two test member accounts.

Confirm that:

- Account A cannot read, update, or delete Account B's journal.
- Account A cannot read Account B's private contact messages or privacy requests.
- Pending and rejected wall posts are not public.
- Published wall posts contain the approved alias, content, and server timestamp only.
- Moderators can review wall posts but cannot read private journals.
- Only administrators can access protected security-event records.

Do not invite real members until these tests pass.

## 8. Consent and security test

Confirm that:

- membership cannot be completed without the required legal checkboxes
- policy version, acceptance time, and member ID are recorded
- sensitive-data consent is specific and recorded
- optional marketing consent is separate and can remain unchecked
- security events record only the disclosed fields needed for abuse prevention
- IP and user-agent information do not appear in the public Freedom Wall or member journal interface
- suspended accounts cannot create protected records
- rate limits block repeated abusive submissions

## 9. Retention and deletion

Schedule the cleanup function defined in the schema.

Operational targets in the current Privacy Notice include:

- security events normally retained for 90 days unless needed for a documented investigation or legal obligation
- deleted journal, wall, and contact records purged within the stated deletion window
- member content retained only while the account or record remains active, subject to lawful exceptions

Document every exception instead of keeping data indefinitely.

## 10. Go-live checklist

Before opening registration:

- complete the two-account isolation test
- review database policies after every schema change
- configure administrator MFA
- establish an incident and breach-response process
- assign moderation responsibility and response times
- test data access, export, correction, restriction, deletion, and account closure
- configure automated retention cleanup
- create encrypted backups under `GOOGLE_DRIVE_BACKUP.md`
- review the Privacy Notice, Membership Agreement, Community Guidelines, and Data Rights page with a Philippine lawyer or privacy professional
- confirm that emergency information remains public
- verify that the website never claims a record was saved when Supabase is unavailable

## Herra and payments

Herra subscriptions and payment processing are intentionally outside this free-membership phase. They require separate billing, entitlement, AI safety, privacy, refund, and cancellation systems.
