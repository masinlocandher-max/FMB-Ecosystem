const crypto = require('node:crypto');
const { agents, recommendAgent } = require('../agents');

const siteOrigins = String(process.env.SITE_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const adminToken = process.env.ADMIN_TOKEN || '';
const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function setCors(req, res) {
  const origin = String(req.headers.origin || '');
  if (siteOrigins.length === 1) res.setHeader('Access-Control-Allow-Origin', siteOrigins[0]);
  if (siteOrigins.length > 1 && siteOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Vary', 'Origin');
}

function sendJson(req, res, statusCode, payload) {
  setCors(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(statusCode).json(payload);
}

function clean(value, maxLength = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanLong(value, maxLength = 3000) {
  return String(value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function routeFromRequest(req) {
  const queryPath = req.query?.path;
  if (Array.isArray(queryPath)) return `/${queryPath.join('/')}`;
  if (queryPath) return `/${String(queryPath).replace(/^\/+/, '')}`;
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  return pathname.replace(/^\/api\/handler\/?/, '/');
}

function requestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.statusCode = 400;
    throw error;
  }
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return '';
}

function buildInquiry(input, req) {
  const contact = clean(input.contact || input.phone || input.contactNumber, 180);
  const timeline = clean(input.timeline || input.date || input.availability, 120);
  const messageParts = [
    cleanLong(input.message, 3000),
    input.date ? `Preferred date or callback time: ${clean(input.date, 120)}` : '',
    input.meetingType ? `Meeting type: ${clean(input.meetingType, 120)}` : '',
    input.location ? `Location: ${clean(input.location, 160)}` : '',
    input.locationNote ? `Location note: ${clean(input.locationNote, 240)}` : '',
  ].filter(Boolean);
  const assignedAgent = recommendAgent(input);
  const inquiry = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    name: clean(input.name, 120),
    brand: clean(input.brand, 160),
    email: clean(input.email, 180).toLowerCase(),
    contact,
    preferred_contact: clean(input.preferredContact, 80),
    project_type: clean(input.projectType, 160),
    timeline,
    budget: clean(input.budget, 120),
    message: messageParts.join('\n\n').slice(0, 3000),
    source: 'website-intake',
    user_agent: clean(req.headers['user-agent'], 300),
    ip: clientIp(req),
    assigned_agent: {
      id: assignedAgent.id,
      name: assignedAgent.name,
      label: assignedAgent.label,
      focus: assignedAgent.focus,
    },
  };
  const errors = [];
  if (!inquiry.name) errors.push('Name is required.');
  if (inquiry.email && !isEmail(inquiry.email)) errors.push('Email must be valid when provided.');
  if (!inquiry.email && !inquiry.contact) errors.push('Email or phone/Messenger contact is required.');
  if (!inquiry.project_type) errors.push('Project type is required.');
  if (!inquiry.message) errors.push('Project goal is required.');
  return { inquiry, errors };
}

async function supabaseRequest(pathname, options = {}) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const error = new Error('SENZ inquiry storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.message || payload?.hint || `Supabase request failed with ${response.status}.`);
  return payload;
}

module.exports = async function handler(req, res) {
  const route = routeFromRequest(req);
  if (req.method === 'OPTIONS') {
    setCors(req, res);
    res.status(204).end();
    return;
  }

  try {
    if (req.method === 'GET' && route === '/health') {
      sendJson(req, res, 200, { ok: true, service: 'senz-backend', time: new Date().toISOString() });
      return;
    }
    if (req.method === 'GET' && route === '/agents') {
      sendJson(req, res, 200, {
        ok: true,
        agents: agents.map(({ id, name, label, focus }) => ({ id, name, label, focus })),
      });
      return;
    }
    if (req.method === 'POST' && route === '/agents/recommend') {
      const agent = recommendAgent(requestBody(req));
      sendJson(req, res, 200, {
        ok: true,
        agent: { id: agent.id, name: agent.name, label: agent.label, focus: agent.focus },
      });
      return;
    }
    if (req.method === 'POST' && route === '/inquiries') {
      const { inquiry, errors } = buildInquiry(requestBody(req), req);
      if (errors.length) {
        sendJson(req, res, 422, { ok: false, errors });
        return;
      }
      await supabaseRequest('inquiries', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(inquiry),
      });
      sendJson(req, res, 201, {
        ok: true,
        id: inquiry.id,
        assignedAgent: inquiry.assigned_agent,
        message: 'Inquiry received. SENZ Marketing and Digital Solutions will review your brief and respond soon.',
      });
      return;
    }
    if (req.method === 'GET' && route === '/inquiries') {
      if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) {
        sendJson(req, res, 401, { ok: false, errors: ['Unauthorized.'] });
        return;
      }
      const inquiries = await supabaseRequest('inquiries?select=*&order=created_at.desc');
      sendJson(req, res, 200, { ok: true, inquiries });
      return;
    }
    sendJson(req, res, 404, { ok: false, errors: ['API route not found.'] });
  } catch (error) {
    sendJson(req, res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || 'Unable to complete the request.'],
    });
  }
};
