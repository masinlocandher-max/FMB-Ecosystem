const assert = require("node:assert/strict");
const http = require("node:http");
const { after, before, test } = require("node:test");

let deliveryServer;
let deliveryUrl;
let apiServer;
let apiUrl;
const deliveries = [];

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

before(async () => {
  deliveryServer = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    deliveries.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
  });
  deliveryUrl = await listen(deliveryServer);

  process.env.SITE_ORIGIN = "https://www.senzpr.com,https://senzpr.com";
  process.env.SENZ_FORM_DELIVERY_ENDPOINT = deliveryUrl;
  ({ server: apiServer } = require("../server"));
  apiUrl = await listen(apiServer);
});

after(async () => {
  await close(apiServer);
  await close(deliveryServer);
});

test("health reports an email-only service with no storage", async () => {
  const response = await fetch(`${apiUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.service, "senz-inquiry-email");
  assert.equal(body.storage, "none");
});

test("invalid inquiries are rejected before delivery", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({ name: "Test Visitor" })
  });
  assert.equal(response.status, 422);
  assert.equal(deliveries.length, 0);
});

test("valid inquiries are delivered as email payloads", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({
      formType: "consultation",
      name: "Test Visitor",
      email: "visitor@example.com",
      projectType: "Website strategy",
      timeline: "2026-08-04 10:00",
      message: "A test project brief.",
      fields: { preferredDate: "2026-08-04" }
    })
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(deliveries.length, 1);
  assert.match(deliveries[0]._subject, /consultation request/i);
  assert.equal(deliveries[0]._replyto, "visitor@example.com");
  assert.equal(deliveries[0]["Detail — preferredDate"], "2026-08-04");
});

test("unapproved browser origins are blocked", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://example.invalid"
    },
    body: JSON.stringify({
      name: "Blocked Visitor",
      email: "visitor@example.com",
      projectType: "General",
      message: "This should not be delivered."
    })
  });
  assert.equal(response.status, 403);
  assert.equal(deliveries.length, 1);
});

test("honeypot submissions return success without delivery", async () => {
  const response = await fetch(`${apiUrl}/api/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://www.senzpr.com"
    },
    body: JSON.stringify({
      name: "Spam Bot",
      email: "bot@example.com",
      projectType: "General",
      message: "Automated spam.",
      senzWebsite: "https://spam.invalid"
    })
  });
  assert.equal(response.status, 201);
  assert.equal(deliveries.length, 1);
});
