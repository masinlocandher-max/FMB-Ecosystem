# Cognita Open Learning Implementation Standard

## Purpose

Cognita Open Learning is the self-paced pathway. It should automate access, sequencing, progress, reminders, and self-check activities while preserving human judgment for portfolio audit and credentialing.

## Non-negotiable rule

The system may determine whether a learner completed a lesson, opened a resource, passed a low-stakes self-check, or supplied required fields.

The system and AI must not independently determine that:

- professional competence has been demonstrated;
- a portfolio meets the Cognita Standard;
- a learner is approved for a credential;
- a credential should be revoked.

Those decisions require an authorized human reviewer or approver.

## Data model

### LearningProduct

Defines each sellable or grantable pathway:

- title and product code
- delivery mode
- curriculum version
- lesson sequence
- access duration
- price and currency
- whether payment is required
- whether portfolio evidence is required
- whether Portfolio Audit is available or included
- whether a credential is available
- publication status

Products remain `Draft` until pricing, curriculum, source review, policies, and access rules are approved.

### LearningEnrollment

Represents one learner's access to one product:

- payment and agreement status
- activation and expiry
- product and curriculum version
- progress
- portfolio status
- audit and credential status

A general Student record must not be treated as proof that a learner purchased or received every product.

### ModuleProgress

Tracks self-paced learning without treating progress as competence:

- locked, available, in-progress, or completed state
- start, access, and completion timestamps
- self-check attempts and best score
- practical activity completion
- evidence requirement
- automatic unlock rule

### PortfolioAudit

Remains separate from lesson completion. The learner submits a locked portfolio version after satisfying the product's evidence requirements.

## Automated learner journey

1. Learner creates and verifies an account.
2. Learner chooses a Published Open Learning product.
3. The app presents the current price, access term, refund rule, credential availability, and whether audit is included or separately paid.
4. Learner accepts the applicable versioned agreement.
5. Payment is confirmed or access is formally granted.
6. A LearningEnrollment and AccessEntitlement become Active.
7. ModuleProgress records are created for the product's published lesson sequence.
8. The first module is unlocked according to its rule.
9. The app records progress and unlocks later modules based on approved automatic rules.
10. The learner completes practical work and evidence requirements.
11. The app marks the learning path complete only when objective completion rules are satisfied.
12. Where no credential is offered, the journey ends with a non-credential completion record.
13. Where Portfolio Audit is available, the learner submits a locked portfolio version.
14. A human reviewer audits the evidence and either requires revision or confirms the Cognita Standard.
15. A separate authorized approver authorizes credential issuance.
16. The Registrar issues the Certificate of Completion and public serial record.

## Completion versus credentialing

### Automated completion may include

- every required lesson opened or completed;
- required self-check score achieved;
- required activity confirmation completed;
- required evidence fields supplied;
- minimum product access rules met.

### Automated completion must not be described as

- professional certification;
- verified competence;
- Cognita Standard Met;
- human-approved portfolio;
- credential eligibility unless the applicable audit requirements are satisfied.

## Portfolio audit options

A LearningProduct must state one of the following clearly:

1. **No credential**
   - self-paced learning only
   - no portfolio audit
   - no Certificate of Completion

2. **Audit available separately**
   - learning access does not include human audit
   - learner may apply and pay for Portfolio Audit later
   - eligibility criteria and current audit price must be shown before purchase

3. **Audit included**
   - one initial audit and a defined number of revision rounds are included
   - extra revision or re-audit terms must be disclosed

4. **Institutionally sponsored audit**
   - an organization pays or grants access under a written agreement
   - reviewer capacity and reporting rules are defined

## Publishing controls

Before a product becomes `Published`, confirm:

- curriculum and source-pack version
- approved lessons and LearningSource records
- accessibility review
- product price and access duration
- refund and withdrawal terms
- support owner
- assessment and evidence requirements
- audit availability and included revision rounds
- credential wording
- privacy and file-retention rules
- product-specific Terms version
- end-to-end test result

## Source governance

Every published lesson should identify:

- lesson version
- source-pack version
- source IDs
- author
- academic reviewer
- publication date
- last review date
- next review date
- change notes

Changing AI products, platform features, prices, laws, and policies require scheduled source review. An AI-generated explanation is not a primary source.

## Access rules

- Access must come from an active product-specific entitlement or LearningEnrollment.
- A learner must not receive all Cognita products merely because a general Student record exists.
- Expired, suspended, withdrawn, refunded, or revoked access must be enforced by the backend.
- Completion data should remain available according to the retention policy even after content access ends.
- A refund or charge dispute must not silently erase academic or financial audit records.

## Human reviewer capacity

Open Learning can automate delivery, but credentialing creates human workload. Before publishing a credential-bearing product, define:

- expected audit volume
- reviewer qualifications
- reviewer assignment method
- review service standard
- revision rounds
- second-review and appeal capacity
- conflict-of-interest handling
- quality-assurance sampling
- reviewer compensation and availability

Do not sell unlimited or instant human audit unless Cognita has real capacity to deliver it.

## Launch state

The repository now contains the product, enrollment, module-progress, source, submission-version, portfolio-audit, and access-entitlement foundations.

Open Learning must remain an early-access pathway until:

- at least one product is fully populated and approved;
- live Base44 schemas and permissions are deployed;
- product price and terms are approved;
- the learner interface is built and tested against real product data;
- a controlled pilot passes;
- human audit capacity is confirmed.
