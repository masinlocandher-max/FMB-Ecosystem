import {json} from './_automation-lib.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    json(res, 405, {ok: false, error: 'Method not allowed.'});
    return;
  }

  const state = {
    metaWebhook: Boolean(process.env.META_VERIFY_TOKEN && process.env.META_APP_SECRET),
    sheetReceiver: Boolean(process.env.AUTOMATION_INGEST_URL && process.env.AUTOMATION_INGEST_SECRET),
    authenticatedIntake: Boolean(process.env.AUTOMATION_INTAKE_SECRET),
    humanReviewOnly: process.env.HUMAN_REVIEW_ONLY !== 'false'
  };

  json(res, 200, {
    ok: true,
    service: 'FMB Automation Hub',
    mode: 'review_first',
    ready: state.metaWebhook && state.sheetReceiver && state.authenticatedIntake,
    components: state,
    storageBoundary: 'General inquiries remain in the external automation register. Supabase is reserved for authenticated members and paying clients.'
  });
}
