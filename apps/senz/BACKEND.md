# SENZ Strategic Communications Backend

This folder includes a small Node backend for the website. It validates
inquiries and forwards accepted submissions to the official SENZ inbox. It
does not store casual website inquiries in Supabase or on the Render
filesystem.

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://127.0.0.1:4177
```

## Endpoints

- `GET /api/health` checks the backend status.
- `GET /api/agents` lists the SENZ Strategic Communications routing agents.
- `POST /api/agents/recommend` recommends an agent for a draft inquiry.
- `POST /api/inquiries` validates, anti-spam checks, and emails an inquiry.

## Agents

Every accepted inquiry is automatically routed to a SENZ Strategic
Communications agent profile such as Brand Direction, Public Relations,
Creative Production, Digital Products, Events Platform, or Founder Review.
The assigned route is included in the email and returned to the form after
submission.

## Delivery and storage

The default delivery endpoint is:

```text
https://formsubmit.co/ajax/info.senz.pr@gmail.com
```

FormSubmit requires a one-time activation from the receiving inbox after the
first deployed test submission. The endpoint can be replaced without a code
change by setting `SENZ_FORM_DELIVERY_ENDPOINT`.

No inquiry database is required before SENZ has paid operational demand.
Appointment forms collect a preferred schedule as a pending request; SENZ
confirms the appointment manually by email.

## Production setup

1. Deploy `server.js` to the existing Render service.
2. Add these server environment variables:

```text
SITE_ORIGIN=https://senzpr.com,https://www.senzpr.com
SENZ_FORM_DELIVERY_ENDPOINT=https://formsubmit.co/ajax/info.senz.pr@gmail.com
```

After the backend is deployed, update `components/site-config.js`:

```js
window.SENZ_API_BASE_URL = "https://senz-api-8vt4.onrender.com";
```

Then publish the static site, send one real inquiry, and approve FormSubmit's
activation email in `info.senz.pr@gmail.com`. Subsequent inquiries will be
delivered by email without a SENZ Supabase dependency.
