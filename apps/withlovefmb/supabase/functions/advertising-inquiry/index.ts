import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const allowedOrigins = new Set([
  "https://www.francinemariebautista.com",
  "https://francinemariebautista.com",
]);

const canonicalRequest =
  "Please send us the current advertising tier packages and available placement options across the With love, FMB website.";

const jsonHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin)
    ? origin
    : "https://www.francinemariebautista.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

const response = (
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
) => new Response(JSON.stringify(body), { status, headers: jsonHeaders(origin) });

const clean = (value: unknown, max: number) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);

const getPublishableKey = () => {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    if (typeof keys.default === "string" && keys.default) return keys.default;
  } catch {
    // The legacy environment variable remains a safe fallback for hosted projects.
  }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? "";
};

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = getPublishableKey();

  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return response({ ok: false }, 403, origin);
    return new Response("ok", { headers: jsonHeaders(origin) });
  }

  if (request.method === "GET") {
    return response({
      ok: true,
      emailConfigured: Boolean(resendApiKey),
      storageConfigured: Boolean(supabaseUrl && publishableKey),
    }, 200, origin);
  }

  if (request.method !== "POST") return response({ ok: false }, 405, origin);
  if (!origin || !allowedOrigins.has(origin)) return response({ ok: false }, 403, origin);
  if (!resendApiKey || !supabaseUrl || !publishableKey) {
    return response({ ok: false, message: "Inquiry service is not configured." }, 503, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return response({ ok: false, message: "Invalid request." }, 400, origin);
  }

  const name = clean(payload.name, 80);
  const businessName = clean(payload.businessName, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const honeypot = clean(payload.website, 200);
  const formStartedAt = Number(payload.formStartedAt);
  const elapsed = Date.now() - formStartedAt;

  if (honeypot) return response({ ok: true }, 200, origin);
  if (!Number.isFinite(formStartedAt) || elapsed < 1500 || elapsed > 43_200_000) {
    return response({ ok: false, message: "Please refresh the form and try again." }, 400, origin);
  }
  if (name.length < 2 || businessName.length < 2) {
    return response({ ok: false, message: "Please complete your name and business name." }, 400, origin);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response({ ok: false, message: "Please enter a valid email address." }, 400, origin);
  }

  const subject = "Advertise with us: Tier packages request";
  const storedMessage = [
    "Category: Advertise with us",
    `Business name: ${businessName}`,
    `Contact name: ${name}`,
    `Email: ${email}`,
    `Request: ${canonicalRequest}`,
  ].join("\n\n");

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: inquiryId, error: storageError } = await supabase.rpc(
    "submit_contact_message",
    {
      p_name: name,
      p_email: email,
      p_subject: subject,
      p_message: storedMessage,
      p_kind: "contact",
    },
  );
  if (storageError || !inquiryId) {
    console.error("Advertising inquiry storage failed", storageError?.code ?? "unknown");
    return response({ ok: false, message: "The inquiry could not be recorded." }, 429, origin);
  }

  const safeName = escapeHtml(name);
  const safeBusiness = escapeHtml(businessName);
  const safeEmail = escapeHtml(email);
  const from = Deno.env.get("FMB_FROM_EMAIL") ??
    "With love, FMB <noreply@francinemariebautista.com>";
  const ownerEmail = Deno.env.get("FMB_INQUIRY_EMAIL") ?? "withlovefmb@gmail.com";
  const detailRows = `
    <tr><td style="padding:7px 0;color:#74677b">Category</td><td style="padding:7px 0;color:#2f0a40;font-weight:700">Advertise with us</td></tr>
    <tr><td style="padding:7px 0;color:#74677b">Name</td><td style="padding:7px 0;color:#2f0a40;font-weight:700">${safeName}</td></tr>
    <tr><td style="padding:7px 0;color:#74677b">Business</td><td style="padding:7px 0;color:#2f0a40;font-weight:700">${safeBusiness}</td></tr>
    <tr><td style="padding:7px 0;color:#74677b">Email</td><td style="padding:7px 0;color:#2f0a40;font-weight:700">${safeEmail}</td></tr>`;

  const ownerHtml = `<!doctype html><html><body style="margin:0;background:#f6eef8;font-family:Arial,sans-serif;color:#2f0a40"><div style="max-width:640px;margin:0 auto;padding:30px 18px"><div style="padding:28px;border-radius:22px;background:#fff"><p style="margin:0 0 7px;color:#7b238f;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">New website inquiry</p><h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:30px">Advertising tier request</h1><table style="width:100%;border-collapse:collapse">${detailRows}</table><div style="margin-top:20px;padding:17px;border-radius:14px;background:#f7edcf"><strong>Prefilled request</strong><p style="margin:7px 0 0;line-height:1.6">${escapeHtml(canonicalRequest)}</p></div><p style="margin:22px 0 0;font-size:12px;color:#74677b">Reply directly to this email to contact ${safeName}.</p></div></div></body></html>`;
  const acknowledgmentHtml = `<!doctype html><html><body style="margin:0;background:#f6eef8;font-family:Arial,sans-serif;color:#2f0a40"><div style="max-width:640px;margin:0 auto;padding:30px 18px"><div style="padding:30px;border-radius:22px;background:#fff"><p style="margin:0 0 7px;color:#7b238f;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">With love, FMB</p><h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px">We received your advertising inquiry.</h1><p style="margin:0 0 20px;line-height:1.7">Thank you, ${safeName}. Our team received the request for ${safeBusiness} and will review the appropriate advertising tier packages and website placement options.</p><table style="width:100%;border-collapse:collapse">${detailRows}</table><div style="margin-top:20px;padding:17px;border-radius:14px;background:#f7edcf"><strong>Your request</strong><p style="margin:7px 0 0;line-height:1.6">${escapeHtml(canonicalRequest)}</p></div><p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#74677b">This is an automated no-reply acknowledgment. The With love, FMB team will respond separately after reviewing your inquiry.</p></div></div></body></html>`;

  const emailResponse = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `fmb-advertising-${inquiryId}`,
    },
    body: JSON.stringify([
      {
        from,
        to: [ownerEmail],
        reply_to: email,
        subject: `[Advertise with us] ${businessName} requests tier packages`,
        html: ownerHtml,
        text: storedMessage,
      },
      {
        from,
        to: [email],
        subject: "We received your advertising inquiry | With love, FMB",
        html: acknowledgmentHtml,
        text: `We received your advertising inquiry.\n\n${storedMessage}\n\nThis is an automated no-reply acknowledgment. The With love, FMB team will respond separately after reviewing your inquiry.`,
      },
    ]),
  });

  if (!emailResponse.ok) {
    console.error("Advertising inquiry email failed", emailResponse.status);
    return response({ ok: false, message: "The inquiry was recorded but email delivery is unavailable." }, 502, origin);
  }

  return response({ ok: true, inquiryId }, 200, origin);
});
