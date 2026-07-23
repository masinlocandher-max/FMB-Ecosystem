'use strict';

const {
  bearerToken,
  clean,
  forwardEvent,
  json,
  normalizeGenericEvent,
  parseJson,
  readRawBody,
  timingSafeEqualText
} = require('./_automation-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    json(res, 405, {ok: false, error: 'Method not allowed.'});
    return;
  }

  const configuredSecret = process.env.AUTOMATION_INTAKE_SECRET || '';
  const suppliedSecret = bearerToken(req);
  if (!configuredSecret || !timingSafeEqualText(configuredSecret, suppliedSecret)) {
    json(res, 401, {ok: false, error: 'Invalid intake credentials.'});
    return;
  }

  try {
    const raw = await readRawBody(req);
    const payload = parseJson(raw);
    const event = normalizeGenericEvent(payload);
    const result = await forwardEvent(event);
    json(res, 202, {
      ok: true,
      eventId: event.sourceEventId,
      routedTo: event.brand,
      intent: event.intent,
      priority: event.priority,
      humanReviewOnly: true,
      receiverStatus: result.status
    });
  } catch (error) {
    console.error('Automation intake error', clean(error?.message, 500));
    json(res, error.statusCode || 500, {ok: false, error: clean(error.message || 'Intake failed.', 300)});
  }
};
