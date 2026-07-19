const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");
const { agents, recommendAgent } = require("./agents");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const inquiryFile = path.join(dataDir, "inquiries.jsonl");
const port = Number(process.env.PORT || 4177);
const siteOrigins = String(process.env.SITE_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const adminToken = process.env.ADMIN_TOKEN || "";
const canonicalHost = process.env.CANONICAL_HOST || "www.senzpr.com";
const redirectHosts = new Set(
  String(process.env.REDIRECT_HOSTS || "senzpr.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
);
const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...corsHeaders()
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders() {
  if (!siteOrigins.length) return {};
  return {
    "Access-Control-Allow-Origin": siteOrigins.length === 1 ? siteOrigins[0] : "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function hasSupabase() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: supabaseServiceRoleKey,
    Authorization: `Bearer ${supabaseServiceRoleKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseRequest(pathname, options = {}) {
  if (!hasSupabase()) throw new Error("Supabase is not configured.");
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, {
    ...options,
    headers: supabaseHeaders(options.headers || {})
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.message || payload?.hint || `Supabase request failed with ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

function inquiryToRow(inquiry) {
  return {
    id: inquiry.id,
    created_at: inquiry.createdAt,
    name: inquiry.name,
    brand: inquiry.brand,
    email: inquiry.email,
    contact: inquiry.contact,
    preferred_contact: inquiry.preferredContact,
    project_type: inquiry.projectType,
    timeline: inquiry.timeline,
    budget: inquiry.budget,
    message: inquiry.message,
    source: inquiry.source,
    user_agent: inquiry.userAgent,
    ip: inquiry.ip,
    assigned_agent: inquiry.assignedAgent
  };
}

function clean(value, maxLength = 500) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanLong(value, maxLength = 3000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function buildInquiry(input, req) {
  const contact = clean(input.contact || input.phone || input.contactNumber, 180);
  const timeline = clean(input.timeline || input.date || input.availability, 120);
  const messageParts = [
    cleanLong(input.message, 3000),
    input.date ? `Preferred date or callback time: ${clean(input.date, 120)}` : "",
    input.meetingType ? `Meeting type: ${clean(input.meetingType, 120)}` : "",
    input.location ? `Location: ${clean(input.location, 160)}` : "",
    input.locationNote ? `Location note: ${clean(input.locationNote, 240)}` : ""
  ].filter(Boolean);

  const inquiry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: clean(input.name, 120),
    brand: clean(input.brand, 160),
    email: clean(input.email, 180).toLowerCase(),
    contact,
    preferredContact: clean(input.preferredContact, 80),
    projectType: clean(input.projectType, 160),
    timeline,
    budget: clean(input.budget, 120),
    message: messageParts.join("\n\n").slice(0, 3000),
    source: "website-intake",
    userAgent: clean(req.headers["user-agent"], 300),
    ip: clientIp(req)
  };
  const assignedAgent = recommendAgent(inquiry);
  inquiry.assignedAgent = {
    id: assignedAgent.id,
    name: assignedAgent.name,
    label: assignedAgent.label,
    focus: assignedAgent.focus
  };

  const errors = [];
  if (!inquiry.name) errors.push("Name is required.");
  if (inquiry.email && !isEmail(inquiry.email)) errors.push("Email must be valid when provided.");
  if (!inquiry.email && !inquiry.contact) errors.push("Email or phone/Messenger contact is required.");
  if (!inquiry.projectType) errors.push("Project type is required.");
  if (!inquiry.message) errors.push("Project goal is required.");

  return { inquiry, errors };
}

async function saveInquiry(inquiry) {
  if (hasSupabase()) {
    await supabaseRequest("inquiries", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(inquiryToRow(inquiry))
    });
    return;
  }
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.appendFile(inquiryFile, `${JSON.stringify(inquiry)}\n`, "utf8");
}

async function handleInquiry(req, res) {
  try {
    const input = await readJsonBody(req);
    const { inquiry, errors } = buildInquiry(input, req);

    if (errors.length) {
      sendJson(res, 422, { ok: false, errors });
      return;
    }

    await saveInquiry(inquiry);
    sendJson(res, 201, {
      ok: true,
      id: inquiry.id,
      assignedAgent: inquiry.assignedAgent,
      message: "Inquiry received. SENZ Strategic Communications will review your brief and respond soon."
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || "Unable to submit inquiry."]
    });
  }
}

async function handleAgentRecommendation(req, res) {
  try {
    const input = await readJsonBody(req);
    const agent = recommendAgent(input);
    sendJson(res, 200, {
      ok: true,
      agent: {
        id: agent.id,
        name: agent.name,
        label: agent.label,
        focus: agent.focus
      }
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      ok: false,
      errors: [error.message || "Unable to recommend an agent."]
    });
  }
}

async function handleInquiryList(req, res) {
  if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) {
    sendJson(res, 401, { ok: false, errors: ["Unauthorized."] });
    return;
  }

  try {
    if (hasSupabase()) {
      const inquiries = await supabaseRequest("inquiries?select=*&order=created_at.desc");
      sendJson(res, 200, { ok: true, inquiries });
      return;
    }
    const raw = await fsp.readFile(inquiryFile, "utf8").catch(() => "");
    const inquiries = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .reverse();
    sendJson(res, 200, { ok: true, inquiries });
  } catch {
    sendJson(res, 500, { ok: false, errors: ["Unable to read inquiries."] });
  }
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, normalized === "/" ? "index.html" : normalized);
  if (!filePath.startsWith(rootDir)) return null;
  return filePath;
}

function redirectToCanonicalHost(req, res, url) {
  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  if (!canonicalHost || !redirectHosts.has(host)) return false;

  const proto = req.headers["x-forwarded-proto"] || "https";
  const location = `${proto}://${canonicalHost}${url.pathname}${url.search}`;
  res.writeHead(308, { Location: location, "Cache-Control": "public, max-age=3600" });
  res.end();
  return true;
}

async function serveStatic(req, res, pathname) {
  let filePath = safeStaticPath(pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable"
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await fsp.readFile(path.join(rootDir, "index.html"), "utf8"));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (redirectToCanonicalHost(req, res, url)) {
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "senz-backend", time: new Date().toISOString() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/agents") {
    sendJson(res, 200, {
      ok: true,
      agents: agents.map(({ id, name, label, focus }) => ({ id, name, label, focus }))
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/agents/recommend") {
    await handleAgentRecommendation(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/inquiries") {
    await handleInquiry(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/inquiries") {
    await handleInquiryList(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res, url.pathname);
    return;
  }

  sendJson(res, 405, { ok: false, errors: ["Method not allowed."] });
});

server.listen(port, () => {
  console.log(`SENZ Strategic Communications website backend running at http://127.0.0.1:${port}`);
});
