# Cognita Production Environment

## Official public origin

- Canonical domain: `https://thecognitainstitute.com`
- Preferred host: apex domain
- `www.thecognitainstitute.com` should redirect to the apex domain
- GitHub Pages is the current frontend host
- Base44 remains the current authentication, entity, file, workflow, and server-function runtime until a documented migration is completed

## Required GitHub Actions secrets

Create these repository secrets before treating the custom-domain app as operational:

| Secret | Purpose |
|---|---|
| `VITE_BASE44_APP_ID` | Connects the frontend to the correct Base44 app |
| `VITE_BASE44_APP_BASE_URL` | Provides the hosted Base44 application origin used by authentication and SDK operations |
| `VITE_BASE44_FUNCTIONS_VERSION` | Selects the deployed Base44 function version when required |

Repository path:

`Settings → Secrets and variables → Actions → New repository secret`

These are public frontend configuration values after the JavaScript bundle is built. They are stored as GitHub secrets to avoid accidental repository drift, but they must never be mistaken for private service-role credentials. Private API keys, signing keys, payment secrets, or service-role tokens must not use a `VITE_` prefix and must never be bundled into the frontend.

## Base44 production settings to verify

Before a real learner signs in from the custom domain, verify in the Base44 runtime:

1. `https://thecognitainstitute.com` is an allowed application origin.
2. `https://www.thecognitainstitute.com` is either allowed or redirected before authentication.
3. Login, registration, Google authentication, OTP verification, logout, password reset, and recovery callbacks return to the official domain.
4. Entity schemas in `base44/entities/` have been deployed.
5. Workflows in `base44/workflows/` have been deployed and enabled deliberately.
6. `sendLifecycleEmail` is deployed in the Base44/Deno runtime.
7. File uploads use private storage for payment proofs and learner evidence.
8. Public access to credential records is restricted to the minimum verification fields.
9. Record-level permissions follow `docs/BASE44_PERMISSION_MATRIX.md`.
10. Separate test accounts exist for applicant, student, facilitator, reviewer, finance, registrar, support, and administrator testing.

## Authentication test matrix

Test all flows on the final HTTPS domain, not only on a Base44 preview URL:

- Email registration and OTP
- Google sign-in
- Existing-user login
- Incorrect-password behavior
- Password reset request
- Reset link callback
- Expired reset link
- Logout
- Expired session
- Direct navigation to a protected route
- Student without agreement
- Student without confirmed payment
- Student with payment confirmed
- Facilitator with assigned students
- Facilitator attempting to access an unassigned student
- Non-admin attempting to open administration routes

## Deployment rule

A green GitHub build proves only that the frontend compiles. It does not prove that Base44 permissions, workflows, email delivery, financial controls, private files, or role isolation work correctly.

Do not enable public paid enrollment until:

- the production secrets are set;
- the Base44 schemas and functions are deployed;
- the domain callbacks are verified;
- the permission matrix is tested with separate accounts;
- the end-to-end launch checklist passes;
- the legal operator, refund terms, and privacy details are approved.
