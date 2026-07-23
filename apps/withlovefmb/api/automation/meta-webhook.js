import {
  clean,
  forwardEvent,
  json,
  normalizeMetaEvents,
  parseJson,
  readRawBody,
  timingSafeEqualText,
  verifyMetaSignature
} from './_automation-lib.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const requestUrl = new URL(req.url || '/api/automation/meta-webhook', 'https://www.francinemariebautista.com');
    const mode = requestUrl.searchParams.get('hub.mode');
    const token = requestUrl.searchParams.get('hub.verify_token');
    const challenge = requestUrl.searchParams.get('hub.challenge');
    const configuredToken = process.env.META_VERIFY_TOKEN || '';

    if (mode === 'subscribe' && configuredToken && timingSafeEqualText(token, configuredToken)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(clean(challenge, 500));
      return;
    }

    json(res, 403, {ok: false, error: 'Webhook verification failed.'});
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    json(res, 405, {ok: false, error: 'Method not allowed.'});
    return;
  }

  try {
    const raw = await readRawBody(req);
    const appSecret = process.env.META_APP_SECRET || '';
    const signature = String(req.headers['x-hub-signature-256'] || '');

    if (!appSecret || !verifyMetaSignature(raw, signature, appSecret)) {
      json(res, 401, {ok: false, error: 'Invalid Meta signature.'});
      return;
    }

    const payload = parseJson(raw);
    const events = normalizeMetaEvents(payload);
    if (!events.length) {
      json(res, 200, {ok: true, accepted: 0, ignored: true});
      return;
    }

    const results = await Promise.allSettled(events.map(event => forwardEvent(event)));
    const failures = results.filter(result => result.status === 'rejected');

    if (failures.length) {
      console.error('Automation Hub forwarding failed', failures.map(failure => clean(failure.reason?.message, 500)));
      json(res, 503, {
        ok: false,
        accepted: events.length - failures.length,
        failed: failures.length,
        error: 'Temporary automation receiver failure. Meta may retry this delivery.'
      });
      return;
    }

    json(res, 200, {ok: true, accepted: events.length, humanReviewOnly: true});
  } catch (error) {
    console.error('Meta webhook error', clean(error?.message, 500));
    json(res, error.statusCode || 500, {ok: false, error: clean(error.message || 'Webhook processing failed.', 300)});
  }
}
