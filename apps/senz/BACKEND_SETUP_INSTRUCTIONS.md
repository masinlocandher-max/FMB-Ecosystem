# BACKEND SETUP INSTRUCTIONS

## 1. Recommended Backend Option

Use Google Apps Script connected to:

- Google Sheets for storing submissions
- Gmail for sending notification emails to `info.senz.pr@gmail.com`

This keeps the static website simple and avoids exposing credentials in the public repository.

## 2. How To Connect Google Apps Script

1. Create a Google Sheet named `SENZ Website Submissions`.
2. Add one tab for each form:
   - `Contact Inquiries`
   - `Consultation Requests`
   - `Creative Pool`
3. Open Extensions > Apps Script from the Google Sheet.
4. Create a `doPost(e)` script that:
   - Parses the JSON payload from the website
   - Reads `formType`
   - Appends the fields to the correct sheet tab
   - Sends a Gmail notification to `info.senz.pr@gmail.com`
   - Returns a JSON response such as `{ "ok": true }`
5. Deploy the script as a Web App.
6. Set access to allow public form submissions.
7. Copy the Web App URLs into `components/site-config.js`:

```js
window.CONTACT_FORM_ENDPOINT = "PASTE_CONTACT_WEB_APP_URL_HERE";
window.CONSULTATION_FORM_ENDPOINT = "PASTE_CONSULTATION_WEB_APP_URL_HERE";
window.CAREERS_FORM_ENDPOINT = "PASTE_CAREERS_WEB_APP_URL_HERE";
```

Do not commit API keys, private credentials, or secret tokens.

## 3. Required Form Fields Per Form

Contact Us form:

- Full name
- Email address
- Phone number, optional
- Company or organization, optional
- Position or role, optional
- Inquiry type
- Message
- Date and time of submission

Book a Consultation modal:

- Preferred date
- Preferred time
- Full name
- Email address
- Phone number
- Business or organization
- Service needed
- Project notes
- Submission date and time
- Status: `pending`

Careers / Creative Pool form:

- Full name
- Email address
- Creative role
- Portfolio link
- Short introduction
- Date and time of submission

## 4. Expected Email Subject Per Form

Contact Us:

`New SENZ Website Inquiry - [Full Name]`

Book a Consultation:

`New SENZ Consultation Request - [Full Name]`

Careers / Creative Pool:

`New SENZ Creative Pool Submission - [Full Name]`

## 5. Expected Google Sheet Columns

Contact Inquiries:

- Submitted At
- Form Type
- Full Name
- Email
- Phone
- Company / Organization
- Position / Role
- Inquiry Type
- Message
- Destination Email
- Email Subject

Consultation Requests:

- Submitted At
- Form Type
- Status
- Preferred Date
- Preferred Time
- Full Name
- Email
- Phone
- Business / Organization
- Service Needed
- Project Notes
- Calendar Rule
- Destination Email
- Email Subject

Creative Pool:

- Submitted At
- Form Type
- Full Name
- Email
- Creative Role
- Portfolio Link
- Short Introduction
- Destination Email
- Email Subject

## 6. Calendar Approval Rule

Do not automatically create confirmed calendar bookings.

Correct workflow:

1. User submits consultation request.
2. Google Apps Script stores it as `pending`.
3. Gmail sends the request details to `info.senz.pr@gmail.com`.
4. SENZ reviews the preferred schedule manually.
5. Only approved appointments are added to the calendar.
6. Calendar confirmation happens only after SENZ approves the request.

## 7. Endpoint URLs Still Needed

The following endpoint placeholders are ready in `components/site-config.js`:

- `CONTACT_FORM_ENDPOINT`
- `CONSULTATION_FORM_ENDPOINT`
- `CAREERS_FORM_ENDPOINT`

Current status: endpoint URLs are blank, so forms remain in prototype mode and do not send emails yet.
