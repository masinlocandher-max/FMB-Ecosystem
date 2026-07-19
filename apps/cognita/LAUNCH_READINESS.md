# Cognita Learner Launch Readiness

Status: **Controlled development build, not yet approved for public paid enrollment**

Official domain: `https://thecognitainstitute.com`

## Implemented in the learner-readiness foundation

### Applicant and account safeguards

- Terms and Privacy acceptance on registration
- Versioned consent records
- Application consent fields and timestamps
- Neutral public application response
- Removal of unauthenticated email-based admissions-status lookup
- Official domain and institutional email constants

### Enrollment and access

- Versioned enrollment agreement acceptance
- Agreement signing timestamp
- Payment-confirmed or formally waived access gate
- Suspended, expired, and revoked access handling
- Explicit AccessEntitlement entity for the production backend
- Corrected enrollment checklist

### Support

- Traceable support-ticket creation
- Ticket reference numbers
- Priority and status fields
- Administrator support-ticket workspace
- Backward-compatible Lead fallback while the new entity is deployed
- Official support email references

### Learner evidence

- Private learner-file upload with legacy fallback
- Time-limited signed links for private files
- Locked submission state while review is pending
- Immutable SubmissionVersion records
- Clear version numbers for resubmissions
- Revision history separated from the mutable current submission record

### Human assessment

- Human reviewer attestation for weekly decisions
- Required rubric completion
- Required revision instructions when revision is requested
- Human-only portfolio audit workflow
- Locked portfolio versions
- Reviewer findings and seven-part portfolio rubric
- Conflict-of-interest declaration
- Separate `Cognita Standard Met` and `Credential Approved` decisions

### Credentialing

- Official credential name: Certificate of Completion
- Credential issuance requires an approved human PortfolioAudit
- Audit, reviewer, approver, and revocation metadata
- Serial-number-only public verification interface
- Minimum public verification fields
- Updated certificate design and non-degree wording

### Production and governance

- GitHub Pages workflow accepts protected Base44 configuration
- Environment template
- Production environment activation guide
- Backend permission matrix
- Updated Privacy Policy and Terms of Use
- Official custom-domain lifecycle email links and language

## Manual production work still required

These tasks cannot be truthfully completed by frontend code alone.

### Base44 deployment

- Deploy every new or changed entity schema
- Deploy the updated lifecycle email function
- Confirm every workflow trigger
- Configure the official domain as an allowed origin and callback
- Set record-level and field-level permissions
- Confirm private-file storage and signed-link behavior
- Confirm the public credential query cannot list general Certificate data

### GitHub settings

Set these Actions secrets:

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_APP_BASE_URL`
- `VITE_BASE44_FUNCTIONS_VERSION`

### Organization and legal approval

Before paid enrollment, approve and publish:

- legal operator name
- legal business address
- official privacy and complaints contacts
- final refund, withdrawal, and cancellation policy
- payment instructions and account ownership
- retention schedule
- processor and service-provider list
- minors policy
- governing law and dispute procedure
- qualified Philippine legal and privacy review

### Operational appointments

The website currently labels the organization roster as proposed. Do not represent proposed names or generated portraits as actual employees without appointment, consent, biography verification, and authority records.

### Communications

Create and test the actual mailboxes used in the application:

- `support@thecognitainstitute.com`
- `admissions@thecognitainstitute.com`
- `registrar@thecognitainstitute.com`
- `privacy@thecognitainstitute.com`
- `partnerships@thecognitainstitute.com`

Configure sender authentication, delivery monitoring, bounce handling, and escalation ownership.

### Finance

- Approve the actual product price and discounts
- Verify bank, GCash, Maya, and other payment instructions
- Establish reconciliation and duplicate-payment handling
- Approve official receipt and tax-document requirements
- Test refunds, balance due, waiver, and failed payment cases
- Move critical financial state changes to protected server-side actions

### Testing

Pass full end-to-end tests using separate accounts for:

1. Public visitor
2. Applicant
3. Accepted applicant
4. Student awaiting agreement
5. Student awaiting payment
6. Active student
7. Student requiring revision
8. Facilitator
9. Human portfolio reviewer
10. Finance officer
11. Registrar
12. Support officer
13. Administrator

## Pilot rule

Before a wider launch, run a controlled pilot with a very small number of participants who are clearly informed that the platform is being validated. Do not issue a credential until the complete portfolio-audit and registry flow has been tested from submission through public verification.

## Launch approval standard

Cognita may be declared ready for public paid enrollment only when:

- the frontend build passes;
- the live backend permission matrix passes;
- registration and recovery work on the official HTTPS domain;
- payment and access controls are reconciled;
- support requests reach a staffed queue;
- private files remain private;
- human review and portfolio versioning work correctly;
- credentials cannot be issued without approved human audit;
- legal and operational approvals are documented;
- end-to-end evidence is retained in a launch test report.
