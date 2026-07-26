const { agents, recommendAgent } = require("../agents");
const {
  buildInquiry,
  deliverInquiry,
  wasSubmittedTooQuickly
} = require("../server");

const siteOrigins = String(process.env.SITE_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(req) {
  const origin = String(req.headers.origin || "").trim();
  return !siteOrigins.length || !origin || siteOrigins.includes(origin);
}

function setCors(req, res) {
  const origin = String(req.headers.origin || "").trim();
  if (siteOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(req, res, statusCode, payload) {
  setCors(req, res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(statusCode).json(payload);
}

function routeFromRequest(req) {
  const queryPath = req.query?.path;
  if (Array.isArray(queryPath)) return `/${queryPath.join("/")}`;
  if (queryPath) return `/${String(queryPath).replace(/^\/+/, "")}`;
  const pathname = new URL(req.url || "/", "http://localhost").pathname;
  return pathname.replace(/^\/api\/handler\/?/, "/");
}

function requestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

module.exports = async function handler(req, res) {
  const route = routeFromRequest(req);

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(req)) {
      sendJson(req, res, 403, { ok: false, errors: ["Origin is not allowed."] });
      return;
    }
    setCors(req, res);
    res.status(204).end();
    return;
  }

  try {
    if (req.method === "GET" && route === "/health") {
      sendJson(req, res, 200, {
        ok: true,
        service: "senz-inquiry-email",
        storage: "none",
        time: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && route === "/agents") {
      sendJson(req, res, 200, {
        ok: true,
        agents: agents.map(({ id, name, label, focus }) => ({ id, name, label, focus }))
      });
      return;
    }

    if (req.method === "POST" && route === "/agents/recommend") {
      const agent = recommendAgent(requestBody(req));
      sendJson(req, res, 200, {
        ok: true,
        agent: { id: agent.id, name: agent.name, label: agent.label, focus: agent.focus }
      });
      return;
    }

    if (req.method === "POST" && route === "/inquiries") {
      if (!isAllowedOrigin(req)) {
        sendJson(req, res, 403, { ok: false, errors: ["Origin is not allowed."] });
        return;
      }

      const { inquiry, errors, spamTrap, formStartedAt } = buildInquiry(requestBody(req));
      if (errors.length) {
        sendJson(req, res, 422, { ok: false, errors });
        return;
      }

      if (spamTrap) {
        sendJson(req, res, 201, {
          ok: true,
          message: "Inquiry received. SENZ Strategic Communications will review your brief and respond soon."
        });
        return;
      }

      if (wasSubmittedTooQuickly(formStartedAt)) {
        sendJson(req, res, 429, {
          ok: false,
          errors: ["Please wait a moment, then submit the form again."]
        });
        return;
      }

      await deliverInquiry(inquiry);
      sendJson(req, res, 201, {
        ok: true,
        id: inquiry.id,
        assignedAgent: inquiry.assignedAgent,
        message: "Inquiry received. SENZ Strategic Communications will review your brief and respond soon."
      });
      return;
    }

    sendJson(req, res, 404, { ok: false, errors: ["API route not found."] });
  } catch (error) {
    sendJson(req, res, error.statusCode || 500, {
      ok: false,
      errors: ["Unable to deliver the inquiry. Please email info.senz.pr@gmail.com directly."]
    });
  }
};
