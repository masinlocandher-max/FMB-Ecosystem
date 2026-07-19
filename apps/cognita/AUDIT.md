# Cognita Technical and Learner-Readiness Audit

Audit updated: 2026-07-11

Current verdict: **The frontend and learner-safety foundation are substantially improved, but Cognita is not yet approved for public paid enrollment.**

## Verified repository scope

The repository contains:

- public institutional website and authentication pages;
- administrator, facilitator, and student portals;
- applications, waitlist, teacher applications, partner inquiries, and leads;
- batches, lessons, quizzes, submissions, portfolios, and credentials;
- payments, invoices, receipts, and refunds;
- announcements, messaging, lifecycle email workflows, and a Base44/Deno server function;
- a GitHub Pages deployment workflow for `thecognitainstitute.com`;
- no committed private key, payment secret, service-role key, or production `.env` file found in the exported source.

## Repository quality controls

GitHub Actions checks:

- dependency installation;
- lint;
- frontend typecheck;
- dependency audit;
- production build.

These checks prove that the repository builds. They do not prove live Base44 security, permissions, authentication callbacks, email delivery, payment reconciliation, or complete user journeys.

## Learner-readiness improvements implemented

### Consent and application privacy

- Registration requires Terms and Privacy acceptance.
- Consent versions and timestamps can be recorded in `ConsentRecord`.
- Applications store policy versions, submission timestamps, and source domain.
- The public application form no longer queries admissions status by an arbitrary email address.
- Public confirmation messages remain neutral.

### Enrollment and access control

- Enrollment agreement acceptance is versioned and timestamped.
- Learning routes require a signed agreement.
- Learning routes require payment confirmation or an approved waiver.
- Suspended, expired, and revoked learners are blocked.
- An `AccessEntitlement` model is available for a protected production implementation.

### Support

- The former simulated Contact form was replaced with support-record creation.
- Support requests receive traceable reference numbers.
- A SupportTicket entity and administrator workspace were added.
- A Lead fallback remains while the new schema is deployed.

### Private learner evidence and versioning

- Learner evidence uses private-file upload when available.
- Private files are opened through short-lived signed links.
- Each submission and resubmission can create an immutable `SubmissionVersion`.
- The current version is locked while human review is pending.
- Previous versions and reviewer findings are retained for audit and appeal.

### Human review

- Weekly pass, revision, and fail decisions require a reviewer attestation.
- Every rubric criterion must be completed before a decision is saved.
- Revision instructions are required when revision is requested.
- Portfolio review is a separate `PortfolioAudit` workflow.
- Portfolio versions are locked at submission.
- Human-review and conflict-of-interest confirmations are required.
- `Cognita Standard Met` and `Credential Approved` are separate decisions.

### Credential controls

- The official credential title is `Certificate of Completion`.
- Credential issuance requires an approved human PortfolioAudit.
- Credential records include audit, reviewer, approver, issuance, and revocation metadata.
- Public verification accepts an exact serial number instead of providing a name or cohort directory.
- Credential language identifies the record as non-degree and not attendance-only.

### Policy and domain alignment

- Public Terms and Privacy pages were rewritten for the institutional model.
- Lifecycle emails use `thecognitainstitute.com`.
- The deployment workflow accepts protected Base44 frontend configuration.
- Production environment and backend permission documentation were added.

## Remaining launch blockers

### 1. Base44 schemas are not proven deployed

GitHub changes to `base44/entities`, `base44/functions`, and `base44/workflows` must not be assumed to update the live Base44 app automatically. Deploy or synchronize the schemas deliberately and verify the live versions.

### 2. Backend authorization remains unverified

Frontend role checks are not security controls. Implement and test the matrix in `docs/BASE44_PERMISSION_MATRIX.md` so:

- students can access only their own records;
- facilitators can access only assigned learners;
- reviewers can change only assigned audits;
- finance cannot change academic outcomes;
- support cannot change grades or payments without authority;
- the Registrar cannot issue without approved human audit;
- public users cannot list applications, students, files, or credentials.

### 3. Production authentication configuration is unverified

Set and test:

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_APP_BASE_URL`
- `VITE_BASE44_FUNCTIONS_VERSION`
- official custom-domain origins;
- Google OAuth callbacks;
- OTP, password-reset, recovery, logout, and expired-session behavior.

### 4. Critical operations are still client-coordinated

Enrollment, payment confirmation, receipt generation, access activation, serial-number generation, credential issuance, and revocation include frontend-coordinated operations. They need protected server-side actions with:

- authorization;
- idempotency;
- unique constraints;
- transaction or recovery handling;
- immutable audit logging;
- duplicate prevention.

### 5. Public credential verification needs a restricted backend endpoint

The UI now requires a serial number, but the live backend must prevent general Certificate listing and return only minimum verification fields. Add rate limits and abuse monitoring.

### 6. Email operations require production validation

The updated lifecycle function must be tested for:

- workflow authorization;
- valid recipients;
- sender identity;
- SPF, DKIM, and DMARC;
- retry and failure logging;
- rate limits;
- bounce handling;
- official mailboxes and staffed ownership.

### 7. Payments and refunds are not launch-approved

Before accepting money:

- approve product pricing and discounts;
- publish refund, withdrawal, cancellation, and balance policies;
- verify payment account ownership;
- establish reconciliation and duplicate-payment controls;
- confirm receipt and tax-document requirements;
- test payment confirmation, waiver, failure, balance, refund, and charge dispute cases.

### 8. Open Learning is still a phased product

The public Open Learning page remains an early-access list. A complete self-paced product still needs:

- product and access-entitlement rules;
- lesson publishing and versioning;
- progress and completion records;
- access term or expiry;
- self-check assessments;
- optional paid Portfolio Audit enrollment;
- source-pack integration;
- learner support and withdrawal rules.

### 9. Automated testing is incomplete

The repository has build checks but no meaningful unit, integration, permission, or browser end-to-end suite. Test the complete journeys with separate role accounts.

### 10. Legal and operational approvals are incomplete

Before public paid enrollment, finalize:

- legal operator name and business address;
- governing law and dispute terms;
- privacy contacts and retention schedule;
- processor list;
- refund and cancellation policy;
- minors policy;
- official payment instructions;
- legal, privacy, accounting, and tax review;
- actual organizational appointments and public-representation consent.

## Safe current use

The system may be used for:

- public institutional information;
- an honest early-access waitlist;
- internal configuration;
- controlled testing with test accounts;
- a small, clearly disclosed pilot after live permissions are validated.

The system should not yet be used for:

- unsupervised public paid enrollment;
- storage of sensitive real learner evidence before permission testing;
- automatic credential issuance;
- representing proposed staff as actual employees;
- relying on frontend redirects as data security;
- claiming Open Learning is operational when it remains phased.

## Launch approval reference

Use:

- `LAUNCH_READINESS.md`
- `docs/PRODUCTION_ENVIRONMENT.md`
- `docs/BASE44_PERMISSION_MATRIX.md`

A green build is necessary, but launch approval requires live backend, operational, financial, legal, privacy, and end-to-end evidence.
