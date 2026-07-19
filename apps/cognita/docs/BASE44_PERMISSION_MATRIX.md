# Cognita Base44 Permission Matrix

## Security principle

Frontend route checks improve navigation but do not secure data. Every entity and server action must enforce role and record ownership in the Base44 runtime.

Use least privilege. A user should receive only the records and fields required for the current responsibility.

## Roles

- Public visitor
- Authenticated applicant
- Student
- Facilitator
- Human portfolio reviewer
- Admissions officer
- Student affairs or support officer
- Finance officer
- Registrar or credential officer
- Quality assurance officer
- Administrator
- Service workflow

## Entity access matrix

Legend:

- `C` create
- `R` read
- `U` update
- `D` delete
- `Own` only the authenticated person's record
- `Assigned` only records explicitly assigned to that staff member
- `Limited` restricted public fields or restricted status changes

| Entity | Public | Applicant / Student | Facilitator | Reviewer | Admissions | Support | Finance | Registrar | QA | Admin / Service |
|---|---|---|---|---|---|---|---|---|---|---|
| Application | C through protected intake only | R Own after authentication | None | None | R/U | Limited | Limited | Limited | Audit R | Full |
| Student | None | R Own; limited profile U | R Assigned | R audit subject | Limited R | Limited R | Payment fields only | Records fields only | Audit R | Full |
| ConsentRecord | None | C/R Own | None | None | Audit R | Privacy-request R | None | None | Audit R | Full |
| AccessEntitlement | None | R Own | R Assigned status only | R audit subject | Limited R | Limited R | Activate for confirmed payment only | R | Audit R | Full |
| Payment | None | R Own; submit proof to Own | None | None | Limited R | Limited R | Full operational access | Limited R | Audit R | Full |
| Invoice | None | R Own | None | None | Limited R | Limited R | Full | Limited R | Audit R | Full |
| Receipt | None | R Own | None | None | None | Limited R | Full | Limited R | Audit R | Full |
| Refund | None | C/R Own request | None | None | None | Limited R | Full | Limited R | Audit R | Full |
| Lesson | Published R only | Published R | Published R | Published R | None | None | None | Published R | Full review | Full |
| Quiz | Published R only where appropriate | Published R Own pathway | Published R | R | None | None | None | None | Full review | Full |
| QuizAttempt | None | C/R Own | R Assigned summary | R audit subject | None | None | None | Limited R | Audit R | Full |
| Submission | None | C/R/U Own only when status allows | R/U Assigned review fields | R audit subject | None | Limited support R with approval | None | Limited R | Audit R | Full |
| SubmissionVersion | None | C/R Own; no U after lock | R/U Assigned review fields | R audit subject | None | Limited support R with approval | None | Limited R | Audit R | Full |
| PortfolioAudit | None | C/R Own; limited resubmission | R Assigned evidence only | R/U Assigned | None | Limited status R | None | R approved record | Audit R/U | Full |
| Certificate | Serial verification endpoint only | R Own | R Assigned status | R related audit | None | Limited R | None | C/R/U issue and correction | Audit R | Full |
| SupportTicket | C through protected intake | R Own when authenticated | None | None | Assigned category only | R/U Assigned | Assigned payment category | Assigned credential category | Audit R | Full |
| Announcement | Published public or audience-limited R | R applicable audience | R applicable audience | R applicable audience | C/U assigned | C/U assigned | C/U assigned notices | C/U assigned notices | Audit R | Full |
| Message | None | C/R Own thread | C/R Assigned thread | C/R Assigned thread | C/R assigned | C/R assigned | C/R assigned | C/R assigned | Audit metadata | Full |
| Waitlist / Lead / PartnerInquiry / TeacherApplication | C through protected intake | R Own only if portal supports it | None | None | R/U assigned | Limited | Limited | None | Audit R | Full |

## Required field-level restrictions

### Student-editable fields

Students must not directly update:

- `payment_status`
- `access_status`
- `facilitator_id`
- `certificate_status`
- `certificate_id`
- `progress_status` except through an approved workflow
- reviewer or approval fields

### Facilitator-editable submission fields

Facilitators may update only assigned learner submissions and only review-related fields:

- status
- feedback
- revision instructions
- rubric scores
- reviewed-by and reviewed-date
- portfolio-ready flag after pass
- human-review attestation

Facilitators must not:

- issue credentials;
- change payment or access status;
- review unassigned learners;
- change the learner's submitted content or private files;
- erase prior versions.

### Reviewer-editable portfolio fields

A human reviewer may update only an assigned PortfolioAudit. The reviewer may record findings, rubric scores, revision requirements, and `Cognita Standard Met`. A separate authorized approver should change the status to `Credential Approved`.

### Finance-editable fields

Finance may verify payment proof and update payment, receipt, refund, and payment-related access fields. Finance must not change academic review outcomes or credential eligibility.

### Registrar-editable fields

The Registrar may issue, correct, replace, or revoke credential records only after the required academic approval exists. The Registrar must not create the academic approval itself unless formally holding both roles under an approved dual-control exception.

## Public verification endpoint

Do not expose the general Certificate entity filter publicly.

The public verification action should:

1. Require an exact serial number.
2. Apply rate limits and abuse monitoring.
3. Return only credential title, learner name, track, cohort, issue date, serial number, status, and verification note.
4. Never return student IDs, email addresses, reviewer emails, internal notes, payment data, portfolio evidence, or private file references.
5. Show revoked status without exposing unnecessary private details.

## Test procedure

Create separate accounts and attempt both allowed and forbidden actions. Record the result for each role. A frontend redirect is not a passed security test. The forbidden database or server request itself must fail.

At minimum, test:

- Student A reading Student B records
- Student changing payment or certificate status
- Facilitator A reading Facilitator B learners
- Facilitator issuing a certificate
- Public visitor listing certificates
- Public visitor querying applications by email
- Finance reading private academic feedback
- Support officer changing a grade
- Reviewer approving an unassigned portfolio
- Registrar issuing without an approved PortfolioAudit
- Revoked or suspended user retaining access

## Launch requirement

The institute is not ready for real learner data until this matrix is implemented and tested in the live Base44 environment.
