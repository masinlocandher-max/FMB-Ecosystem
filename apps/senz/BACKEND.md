# SENZ Strategic Communications Backend

This folder now includes a small Node backend for the website.

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
- `POST /api/inquiries` receives inquiry records when a production form endpoint is connected.
- `GET /api/inquiries` lists saved inquiries only when `ADMIN_TOKEN` is set and sent as `Authorization: Bearer <token>`.

## Agents

Every inquiry is automatically routed to a SENZ Strategic Communications agent profile such as Brand Direction, Public Relations, Creative Production, Digital Products, Events Platform, or Founder Review. The assigned agent is stored with the inquiry and returned to the form after submission.

## Storage

Without Supabase credentials, inquiries and ebook orders are saved locally to:

```text
data/inquiries.jsonl
```

Those files are intentionally ignored by Git so private client leads are not uploaded publicly.

## Production Data Setup

Use Supabase for launch data.

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Deploy `server.js` to a Node host such as Render.
5. Add these server environment variables:

```text
SITE_ORIGIN=https://senzpr.com,https://www.senzpr.com
ADMIN_TOKEN=make-a-long-private-token
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` only on the backend host. Never place it in HTML, public JavaScript, GitHub Pages, or `components/site-config.js`.

After the backend is deployed, update `components/site-config.js`:

```js
window.SENZ_API_BASE_URL = "https://your-backend-host.example.com";
```

Then publish the static site again. The Get Started form and ebook checkout will send data to the backend, and the backend will save to Supabase.
