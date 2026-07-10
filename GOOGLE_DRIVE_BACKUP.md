# Google Drive backup policy

Google Drive is an optional encrypted backup destination for the With love, FMB member system. It is not the live database and must not be used as an ordinary Sheet containing readable member journals, IP addresses, or sensitive reflections.

## Primary rule

Supabase remains the system of record for authentication, private journals, Freedom Wall submissions, contact messages, consent evidence, privacy requests, and security events.

Only encrypted backup archives may be placed in Google Drive.

## Prohibited practices

Do not:

- copy raw journal entries into Google Sheets
- store readable IP-address logs in a Sheet or shared document
- create public or link-accessible backups
- enable domain-wide sharing
- store the encryption key in the same Drive folder as the encrypted archive
- email unencrypted database exports
- download backups to shared or unmanaged devices
- keep every backup indefinitely

## Backup contents

A backup may include:

- database schema and migrations
- encrypted database exports
- moderation and policy configuration
- consent-record exports
- encrypted storage metadata
- restoration instructions

Exclude data that is not required for restoration. Test exports using synthetic data before handling real member information.

## Encryption

Encrypt each backup before upload using a modern authenticated-encryption tool approved by the technical administrator.

The encryption key or passphrase must:

- be unique and strong
- be stored separately in a password manager or secure key-management service
- never be committed to GitHub
- never be written inside the backup folder
- be available to at least one designated recovery administrator under a documented emergency process

## Drive access

Create a dedicated private backup folder owned by the organization or responsible data controller.

Limit access to the smallest possible number of administrators. Give read access only to people responsible for recovery and writer access only to people responsible for creating or rotating backups.

Review the access list regularly and remove former staff or contractors immediately.

## Suggested schedule

- daily encrypted backup during active launch periods
- weekly encrypted backup during normal operation
- monthly restoration test using a separate test project
- immediate backup before a major schema migration

The schedule must reflect actual risk, member volume, and the ability to restore service.

## Retention

Suggested starting policy:

- daily copies: retain 14 days
- weekly copies: retain 8 weeks
- monthly copies: retain 12 months

Shorten or extend these periods only for a documented operational or legal reason. Deleting a member account does not automatically remove that member from an older encrypted backup, so restoration procedures must include reapplying valid deletion and restriction requests.

## Backup register

Maintain a restricted register containing:

- backup date and time
- responsible administrator
- source environment
- encrypted archive filename
- checksum
- retention or destruction date
- restoration-test result
- access or incident notes

The register should not contain journal text or raw sensitive data.

## Restoration

A restoration must be authorized and documented.

After restoration:

1. verify the archive checksum
2. restore into a restricted environment
3. reapply later deletion, correction, restriction, and suspension records
4. test Row Level Security before reopening access
5. rotate credentials if compromise is suspected
6. record who restored the data and why

## Incident handling

If a backup is exposed, lost, shared incorrectly, or decrypted by an unauthorized person:

- revoke access immediately
- preserve relevant security evidence
- assess the affected data and members
- follow the documented incident and breach-response process
- obtain legal and privacy advice regarding notification duties
- rotate keys and credentials where needed

Google Drive convenience must never override confidentiality, access control, data minimization, and retention duties.
