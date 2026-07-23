import crypto from 'node:crypto';

const MAX_BODY_BYTES = 1024 * 1024;
const FORWARD_TIMEOUT_MS = 4200;

const ROUTES = [
  {
    brand: 'FMB&CO. / SENZ',
    owner: 'Business Desk',
    intent: 'business_general',
    words: ['price', 'pricing', 'package', 'proposal', 'branding', 'website', 'social media', 'marketing', 'booking', 'service', 'campaign', 'client', 'quotation', 'quote']
  },
  {
    brand: 'With Love, FMB',
    owner: 'Community Desk',
    intent: 'community_general',
    words: ['volunteer', 'community', 'advocacy', 'lgbtq', 'women', 'culture', 'heritage', 'mental health', 'donation', 'support project']
  },
  {
    brand: 'Yoni',
    owner: 'Member Support',
    intent: 'account_support',
    words: ['yoni', 'sign in', 'login', 'account', 'journal', 'check-in', 'check in', 'membership', 'install app', 'profile', 'password']
  },
  {
    brand: 'FMB',
    owner: 'Reception Desk',
    intent: 'media_and_collaboration',
    words: ['interview', 'media', 'press', 'speaking', 'speaker', 'training', 'workshop', 'collaboration', 'partnership', 'appearance']
  },
  {
    brand: 'Mabayani',
    owner: 'Culture Desk',
    intent: 'culture_and_history',
    words: ['mabayani', 'sambal', 'masinloc history', 'dictionary', 'heritage research', 'language preservation']
  },
  {
    brand: 'Cognita',
    owner: 'Cognita Desk',
    intent: 'cognita_general',
    words: ['cognita', 'course', 'program', 'artificial intelligence training', 'ai training']
  }
];

const URGENT_TERMS = [
  'suicide', 'kill myself', 'self harm', 'self-harm', 'immediate danger', 'emergency',
  'abuse right now', 'violence right now', 'missing person', 'medical emergency'
];

export function clean(value, max = 5000) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readRawBody(req, maxBytes = MAX_BODY_BYTES) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(buffer);
  }

  if (chunks.length) return Buffer.concat(chunks);
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
  return Buffer.alloc(0);
}

export function parseJson(raw) {
  try {
    return JSON.parse(raw.toString('utf8') || '{}');
  } catch {
    const error = new Error('Invalid JSON payload.');
    error.statusCode = 400;
    throw error;
  }
}

export function timingSafeEqualText(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyMetaSignature(raw, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(raw).digest('hex')}`;
  return timingSafeEqualText(expected, signatureHeader);
}

function hashId(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
}

export function classify(message, hint = '') {
  const combined = `${hint} ${message}`.toLowerCase();
  const urgent = URGENT_TERMS.some(term => combined.includes(term));

  for (const route of ROUTES) {
    if (route.words.some(word => combined.includes(word))) {
      return {
        brand: route.brand,
        owner: route.owner,
        intent: route.intent,
        priority: urgent ? 'Urgent' : 'Normal',
        unknown: false
      };
    }
  }

  return {
    brand: 'Unknown',
    owner: 'Human Review',
    intent: 'unknown_question',
    priority: urgent ? 'Urgent' : 'Normal',
    unknown: true
  };
}

function messageFromMetaItem(item) {
  if (item.message?.is_echo) return null;
  if (item.message?.text) return clean(item.message.text);
  if (item.postback?.title || item.postback?.payload) {
    return clean([item.postback.title, item.postback.payload].filter(Boolean).join(' | '));
  }
  if (Array.isArray(item.message?.attachments) && item.message.attachments.length) {
    const types = item.message.attachments.map(attachment => clean(attachment.type, 40)).filter(Boolean);
    return `[Attachment: ${types.join(', ') || 'file'}]`;
  }
  if (item.referral?.ref) return `Referral: ${clean(item.referral.ref, 500)}`;
  return null;
}

export function normalizeMetaEvents(payload) {
  const channel = payload.object === 'instagram' ? 'Instagram' : 'Messenger';
  const output = [];

  for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
    for (const item of Array.isArray(entry.messaging) ? entry.messaging : []) {
      const message = messageFromMetaItem(item);
      if (!message) continue;

      const sourceEventId = clean(
        item.message?.mid || item.postback?.mid || `${channel}:${item.sender?.id || 'unknown'}:${item.timestamp || Date.now()}`,
        300
      );
      const route = classify(message, channel);
      output.push({
        receivedAt: new Date(Number(item.timestamp) || Date.now()).toISOString(),
        channel,
        brand: route.brand,
        senderId: clean(item.sender?.id, 250),
        senderName: '',
        contact: '',
        message,
        intent: route.intent,
        priority: route.priority,
        status: 'Needs Review',
        assignedTo: route.owner,
        consent: 'Platform interaction',
        followUpAt: '',
        qualified: 'Pending',
        clientMemberId: '',
        sourceEventId,
        threadUrl: '',
        notes: route.unknown ? 'Unknown question captured. Do not invent a reply.' : 'Classified by deterministic routing rules.',
        unknown: route.unknown,
        rawType: item.postback ? 'postback' : item.message ? 'message' : 'event'
      });
    }
  }

  return output;
}

export function normalizeGenericEvent(input) {
  const message = clean(input.message, 10000);
  if (!message) {
    const error = new Error('message is required.');
    error.statusCode = 400;
    throw error;
  }

  const channel = clean(input.channel || 'Website', 40);
  const hint = clean([input.brandHint, input.intentHint].filter(Boolean).join(' '), 500);
  const route = classify(message, hint);
  const sourceEventId = clean(input.sourceEventId, 300) || hashId(`${channel}|${input.senderId || ''}|${message}|${Date.now()}`);

  return {
    receivedAt: new Date(input.receivedAt || Date.now()).toISOString(),
    channel,
    brand: route.brand,
    senderId: clean(input.senderId, 250),
    senderName: clean(input.senderName, 250),
    contact: clean(input.contact, 500),
    message,
    intent: route.intent,
    priority: route.priority,
    status: 'Needs Review',
    assignedTo: route.owner,
    consent: clean(input.consent || 'Submitted inquiry', 120),
    followUpAt: '',
    qualified: 'Pending',
    clientMemberId: '',
    sourceEventId,
    threadUrl: clean(input.threadUrl, 1000),
    notes: route.unknown ? 'Unknown question captured. Do not invent a reply.' : 'Classified by deterministic routing rules.',
    unknown: route.unknown,
    rawType: clean(input.rawType || 'generic', 80)
  };
}

export function bearerToken(req) {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export async function forwardEvent(event) {
  const url = process.env.AUTOMATION_INGEST_URL;
  const secret = process.env.AUTOMATION_INGEST_SECRET;
  if (!url || !secret) {
    const error = new Error('Automation Sheet receiver is not configured.');
    error.code = 'AUTOMATION_RECEIVER_NOT_CONFIGURED';
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ingestSecret: secret, event}),
      redirect: 'follow',
      signal: controller.signal
    });
    const responseText = await response.text();
    if (!response.ok) {
      const error = new Error(`Automation receiver returned HTTP ${response.status}.`);
      error.statusCode = 502;
      error.receiverResponse = clean(responseText, 500);
      throw error;
    }
    return {ok: true, status: response.status, durationMs: Date.now() - started};
  } finally {
    clearTimeout(timer);
  }
}
