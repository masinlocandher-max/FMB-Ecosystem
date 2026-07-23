# FMB Automation Hub

## Purpose

This is the separate communication layer for Facebook, Messenger, Instagram, website, email, and authenticated ChatGPT intake. It classifies and organizes inquiries, routes them to the correct FMB desk, and records questions that do not yet have an approved answer.

It does **not** place casual inquiries in the FMB/Yoni or SENZ production databases. Supabase remains reserved for authenticated members, paying clients, and records required to serve them.

It also does **not** invent final replies. The operating mode is `review_first` and `HUMAN_REVIEW_ONLY=true`.

## Central register

Google Sheet:

`https://docs.google.com/spreadsheets/d/1LBiJYYi8u2yajiBlDdJ9GGFo3lHncLz2XaQHLuHgQ3Y/edit`

Tabs:

- `Inbox`: normalized inquiries from every connected channel
- `Routing Rules`: deterministic brand and owner assignment
- `Response Library`: approved reply variations only
- `Unknown Questions`: questions requiring research and approval
- `Automation Log`: delivery, deduplication, and failure history
- `Setup`: non-secret readiness checklist

Never place app secrets or access tokens in the Sheet.

## Endpoints

- `GET|POST /api/automation/meta-webhook`
  - GET completes Meta's `hub.challenge` verification.
  - POST validates `X-Hub-Signature-256`, ignores message echoes, normalizes inbound Messenger or Instagram messages, and forwards them to the Sheet receiver.
- `POST /api/automation/intake`
  - Authenticated server-to-server intake for website services, approved ChatGPT actions, email processors, or future connectors.
  - Requires `Authorization: Bearer <AUTOMATION_INTAKE_SECRET>`.
- `GET /api/automation/status`
  - Reports configuration readiness without exposing secret values.

## Google Apps Script receiver

1. Open the central Google Sheet.
2. Open **Extensions > Apps Script**.
3. Replace the editor contents with `automation/google-apps-script/Code.gs`.
4. In **Project Settings > Script properties**, add:
   - `FMB_AUTOMATION_SHEET_ID` = `1LBiJYYi8u2yajiBlDdJ9GGFo3lHncLz2XaQHLuHgQ3Y`
   - `FMB_AUTOMATION_SECRET` = a long random secret used only by the Vercel webhook
5. Run `verifyAutomationHubSetup` once and approve access.
6. Deploy as a Web App:
   - Execute as: the owner
   - Who has access: anyone
7. Save the `/exec` URL as the Vercel variable `AUTOMATION_INGEST_URL`.
8. Save the same Script Property secret as the encrypted Vercel variable `AUTOMATION_INGEST_SECRET`.

The Apps Script receiver deduplicates events by `Source Event ID`, appends unknown questions separately, and records all intake results in `Automation Log`.

## Vercel variables

Copy `automation/.env.automation.example` into encrypted project variables. Required for inbound processing:

- `HUMAN_REVIEW_ONLY=true`
- `AUTOMATION_INGEST_URL`
- `AUTOMATION_INGEST_SECRET`
- `AUTOMATION_INTAKE_SECRET`
- `META_VERIFY_TOKEN`
- `META_APP_SECRET`

Page and Instagram access tokens are not required merely to receive and organize signed events. They become necessary only if approved outbound replies are enabled later.

## Meta connection

Use this callback URL in Meta for Developers:

`https://www.francinemariebautista.com/api/automation/meta-webhook`

Use the same private value in Meta and Vercel for `META_VERIFY_TOKEN`. Subscribe the connected Facebook Page and professional Instagram account to the messaging fields required for the approved use case, including incoming messages and messaging postbacks.

The endpoint rejects unsigned payloads. If the Google Sheet receiver is unavailable, it returns a temporary failure instead of silently losing the event.

## Generic intake example

```bash
curl -X POST 'https://www.francinemariebautista.com/api/automation/intake' \
  -H 'Authorization: Bearer REPLACE_WITH_AUTOMATION_INTAKE_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{
    "channel": "Website",
    "senderId": "contact-form-visitor",
    "senderName": "Example Visitor",
    "contact": "visitor@example.com",
    "message": "May I request a branding proposal?",
    "sourceEventId": "website-example-001",
    "consent": "Submitted inquiry"
  }'
```

## Privacy boundary

- General messages remain in the external Sheet register.
- Only a human-approved conversion to a paying client or authenticated member may create a matching record in the appropriate isolated Supabase project.
- Journal text, check-in notes, passwords, payment-card data, government IDs, and unrelated sensitive data must not be copied into the automation register.
- FMB/Yoni, SENZ, and Cognita production data remain separated.

## Release checklist

- Google Apps Script receiver deployed and its GET status returns `ok: true`
- Vercel variables added as encrypted production variables
- `/api/automation/status` returns all required components as `true`
- Meta callback verification succeeds
- Meta test messages appear once in `Inbox`
- Unknown test questions appear in both `Inbox` and `Unknown Questions`
- Duplicate event IDs are ignored and recorded in `Automation Log`
- No general inquiry appears in either Supabase project
