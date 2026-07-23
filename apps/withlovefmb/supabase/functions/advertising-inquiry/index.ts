import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://www.francinemariebautista.com",
  "https://francinemariebautista.com",
]);

const headers = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin)
    ? origin
    : "https://www.francinemariebautista.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin",
});

Deno.serve((request: Request) => {
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 403,
      headers: headers(origin),
    });
  }
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: headers(origin) });
  }
  if (request.method === "GET") {
    return new Response(JSON.stringify({
      ok: true,
      available: false,
      message: "No advertising offer or package is currently published.",
    }), { status: 200, headers: headers(origin) });
  }
  return new Response(JSON.stringify({
    ok: false,
    message: "This retired inquiry route does not accept submissions. Use the official FMB inquiry form.",
  }), { status: 410, headers: headers(origin) });
});
