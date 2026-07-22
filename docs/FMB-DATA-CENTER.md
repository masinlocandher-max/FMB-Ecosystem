# FMB Data Center

Private operational dashboard for `www.francinemariebautista.com` and the FMB/Yoni member platform.

## Route

- Production: `/data-center/`
- Public navigation: intentionally omitted
- Search indexing: disabled with `noindex`, `nofollow`, and `noarchive`

## Security model

1. The dashboard signs in through the existing `withlovefmb` Supabase Auth tenant.
2. The `fmb-data-center` Edge Function requires a valid user JWT.
3. The function verifies that `public.profiles.role = 'admin'` and `status = 'active'`.
4. Aggregate and administrator-only data are assembled server-side with the Supabase service role.
5. The service-role credential never appears in browser code.
6. SENZ and Cognita data are not queried or combined.

## Privacy boundary

The dashboard does not return journal text, journal titles, daily check-in notes, member-level mood histories, full legal names, or private profile metadata. Community participation is shown only as counts. The client keeps a last-known-good dashboard response in local storage so temporary reconnects do not blank the interface; stale data is clearly labelled.

## Current data sources

- Profiles and membership settings
- Content items and music entries
- Contact and volunteer messages
- Freedom Wall moderation status
- Aggregate daily check-in counts
- Media asset registry
- Saved content count
- Administrator activity log

## Deliberately not claimed yet

- Website visitors and page views
- Referral or campaign analytics
- Facebook and Instagram performance
- SENZ or Cognita production data

These require separate, properly authorized analytics connectors. Database activity must not be presented as website traffic.

## Deployment

The static route is copied automatically by `apps/withlovefmb/build.mjs`. Deploy the Edge Function with JWT verification enabled. No public homepage link is required.
