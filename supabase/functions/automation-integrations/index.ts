import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FUNCTION_SLUG = "automation-integrations";
const AUTOMATION_RETURN_URL =
  "https://data.francinemariebautista.com/admin.html";
const META_DEFAULT_VERSION = "v24.0";
const LINKEDIN_DEFAULT_VERSION = "202606";
const OWNER_EMAILS = new Set([
  "fbautisat23@gmail.com",
  "withlovefmb@gmail.com",
]);

const allowedOrigins = new Set([
  "https://www.francinemariebautista.com",
  "https://francinemariebautista.com",
  "https://data.francinemariebautista.com",
  "http://localhost:3000",
  "http://localhost:4173",
]);

type JsonRecord = Record<string, unknown>;
type IntegrationKey =
  | "meta"
  | "google"
  | "linkedin"
  | "canva"
  | "github"
  | "openai";
type OAuthIntegrationKey = Exclude<IntegrationKey, "openai">;

type ProviderKey =
  | "facebook_page"
  | "instagram_business"
  | "messenger"
  | "linkedin_page"
  | "youtube_channel"
  | "canva"
  | "google_drive"
  | "gmail"
  | "github"
  | "chatgpt_handoff";

type CredentialRow = {
  integration_key: IntegrationKey;
  client_id: string | null;
  client_secret: string | null;
  api_key: string | null;
  config: JsonRecord;
};

type TokenRow = {
  provider_key: ProviderKey;
  access_token: string;
  refresh_token: string | null;
  token_type: string;
  scopes: string[];
  expires_at: string | null;
  external_account_id: string | null;
  external_account_label: string | null;
  metadata: JsonRecord;
  connected_by: string;
};

type OAuthStateRow = {
  integration_key: OAuthIntegrationKey;
  provider_key: ProviderKey;
  owner_id: string;
  code_verifier: string;
  redirect_to: string;
};

type Owner = {
  id: string;
  email: string;
};

type Verification = {
  providerKey: ProviderKey;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string | null;
  accountId: string;
  accountLabel: string;
  metadata?: JsonRecord;
  note: string;
  managementUrl: string;
};

type ProviderDefinition = {
  key: ProviderKey;
  integration: IntegrationKey;
  scopes: string[];
  developerUrl: string;
};

const PROVIDERS: Record<ProviderKey, ProviderDefinition> = {
  facebook_page: {
    key: "facebook_page",
    integration: "meta",
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "pages_manage_metadata",
      "read_insights",
    ],
    developerUrl: "https://developers.facebook.com/apps/",
  },
  instagram_business: {
    key: "instagram_business",
    integration: "meta",
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "instagram_manage_insights",
    ],
    developerUrl: "https://developers.facebook.com/apps/",
  },
  messenger: {
    key: "messenger",
    integration: "meta",
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_messaging",
    ],
    developerUrl: "https://developers.facebook.com/apps/",
  },
  linkedin_page: {
    key: "linkedin_page",
    integration: "linkedin",
    scopes: [
      "openid",
      "profile",
      "email",
      "rw_organization_admin",
      "w_organization_social",
      "r_organization_social_feed",
    ],
    developerUrl: "https://www.linkedin.com/developers/apps",
  },
  youtube_channel: {
    key: "youtube_channel",
    integration: "google",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    developerUrl: "https://console.cloud.google.com/apis/credentials",
  },
  canva: {
    key: "canva",
    integration: "canva",
    scopes: [
      "profile:read",
      "asset:read",
      "asset:write",
      "design:meta:read",
      "design:content:read",
      "design:content:write",
      "folder:read",
      "folder:write",
      "comment:read",
      "comment:write",
    ],
    developerUrl: "https://www.canva.com/developers/integrations",
  },
  google_drive: {
    key: "google_drive",
    integration: "google",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/drive.file",
    ],
    developerUrl: "https://console.cloud.google.com/apis/credentials",
  },
  gmail: {
    key: "gmail",
    integration: "google",
    scopes: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    developerUrl: "https://console.cloud.google.com/apis/credentials",
  },
  github: {
    key: "github",
    integration: "github",
    scopes: ["read:user", "repo"],
    developerUrl: "https://github.com/settings/developers",
  },
  chatgpt_handoff: {
    key: "chatgpt_handoff",
    integration: "openai",
    scopes: [],
    developerUrl:
      "https://platform.openai.com/settings/organization/api-keys",
  },
};

class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

function isAllowedOrigin(origin: string | null) {
  return !origin ||
    allowedOrigins.has(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function corsHeaders(origin: string | null) {
  const responseOrigin = origin && isAllowedOrigin(origin)
    ? origin
    : "https://data.francinemariebautista.com";

  return {
    "Access-Control-Allow-Origin": responseOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function redirectResult(
  provider: string,
  result: "success" | "error",
  message: string,
) {
  const target = new URL(AUTOMATION_RETURN_URL);
  target.searchParams.set("panel", "automation");
  target.searchParams.set("connection", provider.slice(0, 80));
  target.searchParams.set("result", result);
  target.searchParams.set("message", safeMessage(message, 180));
  return Response.redirect(target.toString(), 303);
}

function safeMessage(value: unknown, max = 500) {
  const raw = value instanceof Error ? value.message : String(value || "");
  return raw
    .replace(/https?:\/\/\S+/gi, "[provider endpoint]")
    .replace(/(?:access|refresh|id)[_-]?token\s*[=:]\s*\S+/gi, "token=[redacted]")
    .replace(/(?:client|app)[_-]?secret\s*[=:]\s*\S+/gi, "secret=[redacted]")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max) || "Provider verification failed.";
}

function integrationPath(req: Request) {
  const pathname = new URL(req.url).pathname;
  const marker = `/${FUNCTION_SLUG}`;
  const index = pathname.indexOf(marker);
  return index >= 0 ? pathname.slice(index + marker.length) || "/" : pathname;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function asString(value: unknown, max = 1000) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function stringArray(value: unknown, separator = " ") {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item, 300)).filter(Boolean);
  }
  return asString(value, 12000).split(separator).map((item) => item.trim())
    .filter(Boolean);
}

function expiresAt(seconds: unknown) {
  const duration = Number(seconds);
  return Number.isFinite(duration) && duration > 0
    ? new Date(Date.now() + duration * 1000).toISOString()
    : null;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function randomToken(byteLength = 48) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

async function hmacSha256(secret: string, body: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
  return [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function readJson(req: Request, maxBytes = 24000) {
  const contentLength = Number(req.headers.get("Content-Length") || 0);
  if (contentLength > maxBytes) throw new ProviderError("Request is too large.");
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new ProviderError("Request is too large.");
  }
  if (!text) return {};
  return asRecord(JSON.parse(text));
}

async function providerJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Accept": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data: JsonRecord = {};
  try {
    data = asRecord(text ? JSON.parse(text) : {});
  } catch {
    data = {};
  }
  if (!response.ok) {
    const nested = asRecord(data.error);
    const message = nested.message || data.error_description || data.message ||
      `${response.status} ${response.statusText}`;
    throw new ProviderError(safeMessage(message));
  }
  return data;
}

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Integration service configuration is incomplete.");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function ownerFromRequest(
  req: Request,
  admin: ReturnType<typeof adminClient>,
): Promise<Owner> {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ProviderError("Unauthorized.");

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const email = userData.user?.email?.toLowerCase() || "";
  if (userError || !userData.user || !OWNER_EMAILS.has(email)) {
    throw new ProviderError("FMB owner access is required.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role,status")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (
    profileError || !profile || profile.role !== "admin" ||
    profile.status !== "active"
  ) {
    throw new ProviderError("FMB owner access is required.");
  }

  return { id: userData.user.id, email };
}

async function rpcRow<T>(
  admin: ReturnType<typeof adminClient>,
  name: string,
  params: JsonRecord,
): Promise<T | null> {
  const { data, error } = await admin.rpc(name, params);
  if (error) throw new Error(error.message);
  if (Array.isArray(data)) return (data[0] as T) || null;
  return (data as T) || null;
}

async function credentials(
  admin: ReturnType<typeof adminClient>,
  integration: IntegrationKey,
) {
  return await rpcRow<CredentialRow>(
    admin,
    "ops_get_integration_credentials",
    { p_integration_key: integration },
  );
}

async function providerToken(
  admin: ReturnType<typeof adminClient>,
  provider: ProviderKey,
) {
  return await rpcRow<TokenRow>(
    admin,
    "ops_get_provider_token",
    { p_provider_key: provider },
  );
}

async function markProviderError(
  admin: ReturnType<typeof adminClient>,
  provider: ProviderKey,
  actorId: string,
  message: unknown,
) {
  await admin.rpc("ops_mark_provider_error", {
    p_provider_key: provider,
    p_actor_id: actorId,
    p_error: safeMessage(message),
  });
}

async function storeVerification(
  admin: ReturnType<typeof adminClient>,
  actorId: string,
  record: Verification,
) {
  const { error } = await admin.rpc("ops_store_provider_token", {
    p_provider_key: record.providerKey,
    p_actor_id: actorId,
    p_access_token: record.accessToken,
    p_refresh_token: record.refreshToken || null,
    p_token_type: record.tokenType || "Bearer",
    p_scopes: record.scopes,
    p_expires_at: record.expiresAt || null,
    p_external_account_id: record.accountId,
    p_external_account_label: record.accountLabel,
    p_metadata: record.metadata || {},
    p_verification_note: record.note,
    p_management_url: record.managementUrl,
  });
  if (error) throw new Error(error.message);
}

function callbackUrl(integration: OAuthIntegrationKey) {
  if (!SUPABASE_URL) return "";
  return `${SUPABASE_URL}/functions/v1/${FUNCTION_SLUG}/oauth/callback/${integration}`;
}

function webhookUrl(integration: "meta") {
  if (!SUPABASE_URL) return "";
  return `${SUPABASE_URL}/functions/v1/${FUNCTION_SLUG}/webhooks/${integration}`;
}

function credentialReady(key: IntegrationKey, row?: JsonRecord) {
  const hasClient = Boolean(row?.has_client_id && row?.has_client_secret);
  if (key === "openai") return Boolean(row?.has_api_key);
  if (key === "meta") return hasClient;
  return hasClient;
}

async function statusResponse(
  admin: ReturnType<typeof adminClient>,
  origin: string | null,
) {
  const { data, error } = await admin.rpc("ops_get_integration_readiness");
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data.map(asRecord) : [];
  const readiness = Object.fromEntries(
    (["meta", "google", "linkedin", "canva", "github", "openai"] as const)
      .map((key) => {
        const row = rows.find((item) => item.integration_key === key);
        const safeConfig = asRecord(row?.config);
        return [key, {
          ready: credentialReady(key, row),
          hasClientId: Boolean(row?.has_client_id),
          hasClientSecret: Boolean(row?.has_client_secret),
          hasApiKey: Boolean(row?.has_api_key),
          config: safeConfig,
          updatedAt: row?.updated_at || null,
          callbackUrl: key === "openai"
            ? null
            : callbackUrl(key as OAuthIntegrationKey),
          webhookUrl: key === "meta" ? webhookUrl("meta") : null,
        }];
      }),
  );

  return json({
    generatedAt: new Date().toISOString(),
    readiness,
    providers: Object.values(PROVIDERS).map((provider) => ({
      key: provider.key,
      integration: provider.integration,
      scopes: provider.scopes,
      developerUrl: provider.developerUrl,
    })),
  }, 200, origin);
}

function sanitizeConfig(integration: IntegrationKey, value: unknown) {
  const input = asRecord(value);
  if (integration === "meta") {
    const apiVersion = asString(input.apiVersion, 20) || META_DEFAULT_VERSION;
    if (!/^v\d{1,2}\.\d$/.test(apiVersion)) {
      throw new ProviderError("Use a Meta API version such as v24.0.");
    }
    const pageId = asString(input.pageId, 100);
    if (pageId && !/^\d+$/.test(pageId)) {
      throw new ProviderError("The Meta Page ID must contain digits only.");
    }
    return { apiVersion, pageId };
  }
  if (integration === "linkedin") {
    const apiVersion = asString(input.apiVersion, 10) ||
      LINKEDIN_DEFAULT_VERSION;
    if (!/^\d{6}$/.test(apiVersion)) {
      throw new ProviderError("Use a LinkedIn API version in YYYYMM format.");
    }
    const organizationId = asString(input.organizationId, 100);
    if (organizationId && !/^\d+$/.test(organizationId)) {
      throw new ProviderError(
        "The LinkedIn organization ID must contain digits only.",
      );
    }
    return { apiVersion, organizationId };
  }
  return {};
}

async function saveCredentials(
  req: Request,
  admin: ReturnType<typeof adminClient>,
  owner: Owner,
  origin: string | null,
) {
  const body = await readJson(req);
  const integration = asString(body.integrationKey, 40) as IntegrationKey;
  if (
    !["meta", "google", "linkedin", "canva", "github", "openai"].includes(
      integration,
    )
  ) {
    throw new ProviderError("Unknown integration.");
  }

  const clientId = asString(body.clientId, 500);
  const clientSecret = asString(body.clientSecret, 2000);
  const apiKey = asString(body.apiKey, 4000);
  const config = sanitizeConfig(integration, body.config);

  const { error } = await admin.rpc("ops_upsert_integration_credentials", {
    p_integration_key: integration,
    p_client_id: clientId || null,
    p_client_secret: clientSecret || null,
    p_api_key: apiKey || null,
    p_config: config,
    p_actor_id: owner.id,
  });
  if (error) throw new ProviderError(error.message);

  const stored = await credentials(admin, integration);
  if (!stored) throw new ProviderError("Provider credentials were not saved.");

  if (integration === "openai") {
    if (!stored.api_key) throw new ProviderError("An OpenAI API key is required.");
    try {
      const verified = await verifyOpenAI(stored.api_key);
      await storeVerification(admin, owner.id, verified);
    } catch (error) {
      await markProviderError(
        admin,
        "chatgpt_handoff",
        owner.id,
        error,
      );
      throw error;
    }
  }

  return statusResponse(admin, origin);
}

async function beginAuthorization(
  req: Request,
  admin: ReturnType<typeof adminClient>,
  owner: Owner,
  providerKey: string,
  origin: string | null,
) {
  const provider = PROVIDERS[providerKey as ProviderKey];
  if (!provider || provider.integration === "openai") {
    throw new ProviderError("This provider does not use OAuth.");
  }

  const integration = provider.integration as OAuthIntegrationKey;
  const stored = await credentials(admin, integration);
  if (!stored?.client_id || !stored.client_secret) {
    throw new ProviderError(
      "Save the provider app client ID and client secret first.",
    );
  }
  if (provider.key === "messenger" && !stored.api_key) {
    throw new ProviderError(
      "Save a private Meta webhook verification token first.",
    );
  }

  const state = randomToken(48);
  const verifier = randomToken(72);
  const stateHash = await sha256(state);
  const returnTo = AUTOMATION_RETURN_URL;
  const { error } = await admin.rpc("ops_issue_oauth_state", {
    p_state_hash: stateHash,
    p_integration_key: integration,
    p_provider_key: provider.key,
    p_actor_id: owner.id,
    p_code_verifier: verifier,
    p_redirect_to: returnTo,
  });
  if (error) throw new ProviderError(error.message);

  const redirectUri = callbackUrl(integration);
  const challenge = await sha256(verifier);
  let authorizationUrl: URL;

  if (integration === "google") {
    authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.search = new URLSearchParams({
      client_id: stored.client_id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: provider.scopes.join(" "),
      access_type: "offline",
      include_granted_scopes: "true",
      prompt: "consent",
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
  } else if (integration === "github") {
    authorizationUrl = new URL("https://github.com/login/oauth/authorize");
    authorizationUrl.search = new URLSearchParams({
      client_id: stored.client_id,
      redirect_uri: redirectUri,
      scope: provider.scopes.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      allow_signup: "false",
    }).toString();
  } else if (integration === "canva") {
    authorizationUrl = new URL("https://www.canva.com/api/oauth/authorize");
    authorizationUrl.search = new URLSearchParams({
      client_id: stored.client_id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: provider.scopes.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    }).toString();
  } else if (integration === "linkedin") {
    authorizationUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authorizationUrl.search = new URLSearchParams({
      client_id: stored.client_id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: provider.scopes.join(" "),
      state,
    }).toString();
  } else {
    const config = asRecord(stored.config);
    const version = asString(config.apiVersion, 20) || META_DEFAULT_VERSION;
    authorizationUrl = new URL(
      `https://www.facebook.com/${version}/dialog/oauth`,
    );
    authorizationUrl.search = new URLSearchParams({
      client_id: stored.client_id,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: provider.scopes.join(","),
      state,
      auth_type: "rerequest",
    }).toString();
  }

  return json({
    provider: provider.key,
    authorizationUrl: authorizationUrl.toString(),
  }, 200, origin);
}

async function exchangeGoogle(
  code: string,
  verifier: string,
  credential: CredentialRow,
) {
  return providerJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credential.client_id || "",
      client_secret: credential.client_secret || "",
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl("google"),
    }),
  });
}

async function exchangeGitHub(
  code: string,
  verifier: string,
  credential: CredentialRow,
) {
  return providerJson("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: credential.client_id || "",
      client_secret: credential.client_secret || "",
      code,
      code_verifier: verifier,
      redirect_uri: callbackUrl("github"),
    }),
  });
}

async function exchangeCanva(
  code: string,
  verifier: string,
  credential: CredentialRow,
) {
  const basic = btoa(
    `${credential.client_id || ""}:${credential.client_secret || ""}`,
  );
  return providerJson("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: callbackUrl("canva"),
    }),
  });
}

async function exchangeLinkedIn(code: string, credential: CredentialRow) {
  return providerJson("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: credential.client_id || "",
      client_secret: credential.client_secret || "",
      redirect_uri: callbackUrl("linkedin"),
    }),
  });
}

async function exchangeMeta(code: string, credential: CredentialRow) {
  const config = asRecord(credential.config);
  const version = asString(config.apiVersion, 20) || META_DEFAULT_VERSION;
  const tokenUrl = new URL(
    `https://graph.facebook.com/${version}/oauth/access_token`,
  );
  tokenUrl.search = new URLSearchParams({
    client_id: credential.client_id || "",
    client_secret: credential.client_secret || "",
    redirect_uri: callbackUrl("meta"),
    code,
  }).toString();
  const shortToken = await providerJson(tokenUrl.toString());
  const shortAccess = asString(shortToken.access_token, 8000);
  if (!shortAccess) throw new ProviderError("Meta did not return an access token.");

  const longUrl = new URL(
    `https://graph.facebook.com/${version}/oauth/access_token`,
  );
  longUrl.search = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: credential.client_id || "",
    client_secret: credential.client_secret || "",
    fb_exchange_token: shortAccess,
  }).toString();
  try {
    return await providerJson(longUrl.toString());
  } catch {
    return shortToken;
  }
}

async function refreshGoogle(
  refreshToken: string,
  credential: CredentialRow,
) {
  return providerJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: credential.client_id || "",
      client_secret: credential.client_secret || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
}

async function refreshCanva(
  refreshToken: string,
  credential: CredentialRow,
) {
  const basic = btoa(
    `${credential.client_id || ""}:${credential.client_secret || ""}`,
  );
  return providerJson("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
}

async function verifyGoogle(
  provider: ProviderKey,
  token: JsonRecord,
) {
  const accessToken = asString(token.access_token, 8000);
  if (!accessToken) throw new ProviderError("Google did not return an access token.");
  const headers = { "Authorization": `Bearer ${accessToken}` };
  const user = await providerJson(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers },
  );
  const email = asString(user.email, 300) || "Google account";
  const scopes = stringArray(token.scope);
  const common = {
    accessToken,
    refreshToken: asString(token.refresh_token, 8000) || null,
    tokenType: asString(token.token_type, 30) || "Bearer",
    scopes,
    expiresAt: expiresAt(token.expires_in),
  };

  if (provider === "google_drive") {
    const about = await providerJson(
      "https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress),storageQuota(limit,usage)",
      { headers },
    );
    const driveUser = asRecord(about.user);
    const label = asString(driveUser.displayName, 200) || email;
    return {
      providerKey: provider,
      ...common,
      accountId: asString(driveUser.emailAddress, 300) || email,
      accountLabel: label,
      metadata: { email },
      note: "Google Drive API returned the authorized account and storage profile.",
      managementUrl: "https://drive.google.com/",
    } satisfies Verification;
  }

  if (provider === "gmail") {
    const profile = await providerJson(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers },
    );
    const profileEmail = asString(profile.emailAddress, 300) || email;
    return {
      providerKey: provider,
      ...common,
      accountId: profileEmail,
      accountLabel: profileEmail,
      metadata: {
        email: profileEmail,
        messagesTotal: Number(profile.messagesTotal || 0),
      },
      note: "Gmail API returned the authorized mailbox profile.",
      managementUrl: "https://mail.google.com/",
    } satisfies Verification;
  }

  const channels = await providerJson(
    "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
    { headers },
  );
  const first = Array.isArray(channels.items)
    ? asRecord(channels.items[0])
    : {};
  const snippet = asRecord(first.snippet);
  const channelId = asString(first.id, 300);
  if (!channelId) {
    throw new ProviderError(
      "No YouTube channel was returned for the authorized Google account.",
    );
  }
  return {
    providerKey: "youtube_channel",
    ...common,
    accountId: channelId,
    accountLabel: asString(snippet.title, 300) || channelId,
    metadata: { email },
    note: "YouTube Data API returned the authorized channel.",
    managementUrl: `https://www.youtube.com/channel/${channelId}`,
  } satisfies Verification;
}

async function metaPage(
  accessToken: string,
  credential: CredentialRow,
) {
  const config = asRecord(credential.config);
  const version = asString(config.apiVersion, 20) || META_DEFAULT_VERSION;
  const requestedPageId = asString(config.pageId, 100);
  const pagesUrl = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  pagesUrl.search = new URLSearchParams({
    fields:
      "id,name,access_token,tasks,instagram_business_account{id,username}",
    access_token: accessToken,
  }).toString();
  const pages = await providerJson(pagesUrl.toString());
  const entries = Array.isArray(pages.data)
    ? pages.data.map(asRecord)
    : [];
  const page = requestedPageId
    ? entries.find((entry) => asString(entry.id, 100) === requestedPageId)
    : entries[0];
  if (!page) {
    throw new ProviderError(
      requestedPageId
        ? "The configured Facebook Page was not returned by Meta."
        : "Meta did not return a Facebook Page managed by this account.",
    );
  }
  const pageToken = asString(page.access_token, 8000);
  if (!pageToken) throw new ProviderError("Meta did not return a Page access token.");
  return { page, pageToken, version };
}

async function verifyMeta(
  provider: ProviderKey,
  token: JsonRecord,
  credential: CredentialRow,
) {
  const userAccess = asString(token.access_token, 8000);
  if (!userAccess) throw new ProviderError("Meta did not return an access token.");
  const { page, pageToken, version } = await metaPage(userAccess, credential);
  const pageId = asString(page.id, 300);
  const pageName = asString(page.name, 300) || pageId;
  const scopes = stringArray(token.scope).length
    ? stringArray(token.scope)
    : PROVIDERS[provider].scopes;
  const common = {
    accessToken: pageToken,
    refreshToken: null,
    tokenType: "Bearer",
    scopes,
    expiresAt: expiresAt(token.expires_in),
  };

  if (provider === "facebook_page") {
    const pageUrl = new URL(`https://graph.facebook.com/${version}/${pageId}`);
    pageUrl.search = new URLSearchParams({
      fields: "id,name,link",
      access_token: pageToken,
    }).toString();
    const verifiedPage = await providerJson(pageUrl.toString());
    return {
      providerKey: provider,
      ...common,
      accountId: pageId,
      accountLabel: asString(verifiedPage.name, 300) || pageName,
      metadata: { pageId, apiVersion: version },
      note: "Meta Graph API returned the authorized Facebook Page.",
      managementUrl: asString(verifiedPage.link, 1000) ||
        `https://www.facebook.com/${pageId}`,
    } satisfies Verification;
  }

  if (provider === "instagram_business") {
    const instagram = asRecord(page.instagram_business_account);
    const instagramId = asString(instagram.id, 300);
    if (!instagramId) {
      throw new ProviderError(
        "The selected Facebook Page has no linked Instagram professional account.",
      );
    }
    const instagramUrl = new URL(
      `https://graph.facebook.com/${version}/${instagramId}`,
    );
    instagramUrl.search = new URLSearchParams({
      fields: "id,username,name,profile_picture_url",
      access_token: pageToken,
    }).toString();
    const profile = await providerJson(instagramUrl.toString());
    const username = asString(profile.username, 300);
    return {
      providerKey: provider,
      ...common,
      accountId: instagramId,
      accountLabel: username ? `@${username}` : instagramId,
      metadata: { pageId, apiVersion: version },
      note: "Meta Graph API returned the linked Instagram professional account.",
      managementUrl: username
        ? `https://www.instagram.com/${username}/`
        : "https://www.instagram.com/",
    } satisfies Verification;
  }

  const subscribeUrl = new URL(
    `https://graph.facebook.com/${version}/${pageId}/subscribed_apps`,
  );
  const subscription = await providerJson(subscribeUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      subscribed_fields:
        "messages,messaging_postbacks,message_deliveries,message_reads",
      access_token: pageToken,
    }),
  });
  if (subscription.success !== true) {
    throw new ProviderError("Meta did not confirm the Page webhook subscription.");
  }
  return {
    providerKey: "messenger",
    ...common,
    accountId: pageId,
    accountLabel: `${pageName} Messenger`,
    metadata: {
      pageId,
      apiVersion: version,
      webhookUrl: webhookUrl("meta"),
    },
    note: "Meta confirmed the Messenger Page webhook subscription.",
    managementUrl: `https://business.facebook.com/latest/inbox/all?asset_id=${pageId}`,
  } satisfies Verification;
}

async function verifyStoredMeta(
  provider: ProviderKey,
  storedToken: TokenRow,
  credential: CredentialRow,
) {
  const config = asRecord(credential.config);
  const metadata = asRecord(storedToken.metadata);
  const version = asString(metadata.apiVersion, 20) ||
    asString(config.apiVersion, 20) || META_DEFAULT_VERSION;
  const accessToken = storedToken.access_token;
  const common = {
    accessToken,
    refreshToken: storedToken.refresh_token,
    tokenType: storedToken.token_type || "Bearer",
    scopes: storedToken.scopes,
    expiresAt: storedToken.expires_at,
  };

  if (provider === "facebook_page") {
    const pageId = storedToken.external_account_id ||
      asString(metadata.pageId, 300);
    if (!pageId) throw new ProviderError("The stored Facebook Page ID is missing.");
    const pageUrl = new URL(`https://graph.facebook.com/${version}/${pageId}`);
    pageUrl.search = new URLSearchParams({
      fields: "id,name,link",
      access_token: accessToken,
    }).toString();
    const page = await providerJson(pageUrl.toString());
    return {
      providerKey: provider,
      ...common,
      accountId: pageId,
      accountLabel: asString(page.name, 300) ||
        storedToken.external_account_label || pageId,
      metadata: { pageId, apiVersion: version },
      note: "Meta Graph API returned the connected Facebook Page.",
      managementUrl: asString(page.link, 1000) ||
        `https://www.facebook.com/${pageId}`,
    } satisfies Verification;
  }

  if (provider === "instagram_business") {
    const instagramId = storedToken.external_account_id;
    if (!instagramId) {
      throw new ProviderError("The stored Instagram account ID is missing.");
    }
    const instagramUrl = new URL(
      `https://graph.facebook.com/${version}/${instagramId}`,
    );
    instagramUrl.search = new URLSearchParams({
      fields: "id,username,name,profile_picture_url",
      access_token: accessToken,
    }).toString();
    const profile = await providerJson(instagramUrl.toString());
    const username = asString(profile.username, 300);
    return {
      providerKey: provider,
      ...common,
      accountId: instagramId,
      accountLabel: username
        ? `@${username}`
        : storedToken.external_account_label || instagramId,
      metadata: {
        pageId: asString(metadata.pageId, 300),
        apiVersion: version,
      },
      note: "Meta Graph API returned the connected Instagram professional account.",
      managementUrl: username
        ? `https://www.instagram.com/${username}/`
        : "https://www.instagram.com/",
    } satisfies Verification;
  }

  const pageId = asString(metadata.pageId, 300) ||
    storedToken.external_account_id;
  if (!pageId) throw new ProviderError("The stored Messenger Page ID is missing.");
  const subscribeUrl = new URL(
    `https://graph.facebook.com/${version}/${pageId}/subscribed_apps`,
  );
  const subscription = await providerJson(subscribeUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      subscribed_fields:
        "messages,messaging_postbacks,message_deliveries,message_reads",
      access_token: accessToken,
    }),
  });
  if (subscription.success !== true) {
    throw new ProviderError("Meta did not confirm the Page webhook subscription.");
  }
  return {
    providerKey: "messenger",
    ...common,
    accountId: pageId,
    accountLabel: storedToken.external_account_label ||
      `Messenger Page ${pageId}`,
    metadata: {
      pageId,
      apiVersion: version,
      webhookUrl: webhookUrl("meta"),
    },
    note: "Meta reconfirmed the Messenger Page webhook subscription.",
    managementUrl:
      `https://business.facebook.com/latest/inbox/all?asset_id=${pageId}`,
  } satisfies Verification;
}

async function verifyLinkedIn(
  token: JsonRecord,
  credential: CredentialRow,
) {
  const accessToken = asString(token.access_token, 8000);
  if (!accessToken) throw new ProviderError("LinkedIn did not return an access token.");
  const config = asRecord(credential.config);
  const apiVersion = asString(config.apiVersion, 10) ||
    LINKEDIN_DEFAULT_VERSION;
  const requestedOrganizationId = asString(config.organizationId, 100);
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "LinkedIn-Version": apiVersion,
    "X-Restli-Protocol-Version": "2.0.0",
  };
  const user = await providerJson("https://api.linkedin.com/v2/userinfo", {
    headers,
  });
  const aclUrl = new URL("https://api.linkedin.com/rest/organizationAcls");
  aclUrl.search = new URLSearchParams({
    q: "roleAssignee",
    role: "ADMINISTRATOR",
    state: "APPROVED",
  }).toString();
  const acl = await providerJson(aclUrl.toString(), { headers });
  const entries = Array.isArray(acl.elements) ? acl.elements.map(asRecord) : [];
  const organizationIds = entries.map((entry) => {
    const urn = asString(
      entry.organization || entry.organizationTarget || entry.organizationUrn,
      300,
    );
    return urn.match(/organization:(\d+)$/)?.[1] || "";
  }).filter(Boolean);
  const organizationId = requestedOrganizationId
    ? organizationIds.find((id) => id === requestedOrganizationId)
    : organizationIds[0];
  if (!organizationId) {
    throw new ProviderError(
      requestedOrganizationId
        ? "LinkedIn did not confirm administrator access to the configured Page."
        : "LinkedIn did not return a Page where this account is an administrator. Community Management API approval may still be required.",
    );
  }
  const organization = await providerJson(
    `https://api.linkedin.com/rest/organizations/${organizationId}`,
    { headers },
  );
  const vanityName = asString(organization.vanityName, 200);
  const label = asString(organization.localizedName, 300) ||
    asString(user.name, 300) || organizationId;
  return {
    providerKey: "linkedin_page",
    accessToken,
    refreshToken: asString(token.refresh_token, 8000) || null,
    tokenType: asString(token.token_type, 30) || "Bearer",
    scopes: stringArray(token.scope),
    expiresAt: expiresAt(token.expires_in),
    accountId: organizationId,
    accountLabel: label,
    metadata: { apiVersion, vanityName },
    note: "LinkedIn confirmed administrator access to the organization Page.",
    managementUrl: vanityName
      ? `https://www.linkedin.com/company/${vanityName}/`
      : `https://www.linkedin.com/company/${organizationId}/`,
  } satisfies Verification;
}

async function verifyCanva(token: JsonRecord) {
  const accessToken = asString(token.access_token, 8000);
  if (!accessToken) throw new ProviderError("Canva did not return an access token.");
  const headers = { "Authorization": `Bearer ${accessToken}` };
  const user = await providerJson(
    "https://api.canva.com/rest/v1/users/me",
    { headers },
  );
  const teamUser = asRecord(user.team_user);
  let profile: JsonRecord = {};
  try {
    profile = await providerJson(
      "https://api.canva.com/rest/v1/users/me/profile",
      { headers },
    );
  } catch {
    profile = {};
  }
  const profileData = asRecord(profile.profile);
  const userId = asString(teamUser.user_id, 300);
  const teamId = asString(teamUser.team_id, 300);
  if (!userId) throw new ProviderError("Canva did not return the authorized user.");
  return {
    providerKey: "canva",
    accessToken,
    refreshToken: asString(token.refresh_token, 8000) || null,
    tokenType: asString(token.token_type, 30) || "Bearer",
    scopes: stringArray(token.scope),
    expiresAt: expiresAt(token.expires_in),
    accountId: userId,
    accountLabel: asString(profileData.display_name, 300) ||
      (teamId ? `Canva team ${teamId}` : "Canva account"),
    metadata: { teamId },
    note: "Canva Connect API returned the authorized user and team.",
    managementUrl: "https://www.canva.com/",
  } satisfies Verification;
}

async function verifyGitHub(token: JsonRecord) {
  const accessToken = asString(token.access_token, 8000);
  if (!accessToken) throw new ProviderError("GitHub did not return an access token.");
  const user = await providerJson("https://api.github.com/user", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "FMB-Automation-Center",
    },
  });
  const login = asString(user.login, 300);
  const id = asString(user.id, 300);
  if (!login || !id) throw new ProviderError("GitHub did not return the user profile.");
  return {
    providerKey: "github",
    accessToken,
    refreshToken: asString(token.refresh_token, 8000) || null,
    tokenType: asString(token.token_type, 30) || "Bearer",
    scopes: stringArray(token.scope, ","),
    expiresAt: expiresAt(token.expires_in),
    accountId: id,
    accountLabel: `@${login}`,
    metadata: { login },
    note: "GitHub API returned the authorized user profile.",
    managementUrl: `https://github.com/${login}`,
  } satisfies Verification;
}

async function verifyOpenAI(apiKey: string) {
  const models = await providerJson("https://api.openai.com/v1/models", {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const count = Array.isArray(models.data) ? models.data.length : 0;
  return {
    providerKey: "chatgpt_handoff",
    accessToken: apiKey,
    refreshToken: null,
    tokenType: "Bearer",
    scopes: [],
    expiresAt: null,
    accountId: "openai-api-project",
    accountLabel: "OpenAI API project",
    metadata: { accessibleModelCount: count },
    note: "OpenAI API authentication succeeded and returned the project model catalog.",
    managementUrl: "https://platform.openai.com/settings/organization/api-keys",
  } satisfies Verification;
}

async function verifyWithToken(
  provider: ProviderKey,
  token: JsonRecord,
  credential: CredentialRow,
) {
  const integration = PROVIDERS[provider].integration;
  if (integration === "google") return verifyGoogle(provider, token);
  if (integration === "meta") return verifyMeta(provider, token, credential);
  if (integration === "linkedin") return verifyLinkedIn(token, credential);
  if (integration === "canva") return verifyCanva(token);
  if (integration === "github") return verifyGitHub(token);
  return verifyOpenAI(asString(token.access_token, 8000));
}

async function handleOAuthCallback(
  req: Request,
  admin: ReturnType<typeof adminClient>,
  integration: string,
) {
  if (
    !["meta", "google", "linkedin", "canva", "github"].includes(integration)
  ) {
    return redirectResult(integration, "error", "Unknown OAuth callback.");
  }
  const url = new URL(req.url);
  const rawState = asString(url.searchParams.get("state"), 500);
  if (!rawState) {
    return redirectResult(integration, "error", "OAuth state is missing.");
  }
  const state = await rpcRow<OAuthStateRow>(
    admin,
    "ops_consume_oauth_state",
    { p_state_hash: await sha256(rawState) },
  );
  if (!state || state.integration_key !== integration) {
    return redirectResult(
      integration,
      "error",
      "OAuth state is invalid or expired. Start the connection again.",
    );
  }
  const provider = state.provider_key;
  const providerError = asString(url.searchParams.get("error_description"), 500) ||
    asString(url.searchParams.get("error"), 200);
  if (providerError) {
    await markProviderError(admin, provider, state.owner_id, providerError);
    return redirectResult(provider, "error", providerError);
  }
  const code = asString(url.searchParams.get("code"), 8000);
  if (!code) {
    await markProviderError(
      admin,
      provider,
      state.owner_id,
      "Provider authorization code is missing.",
    );
    return redirectResult(
      provider,
      "error",
      "Provider authorization code is missing.",
    );
  }

  try {
    const credential = await credentials(
      admin,
      integration as OAuthIntegrationKey,
    );
    if (!credential?.client_id || !credential.client_secret) {
      throw new ProviderError("Provider app credentials are incomplete.");
    }
    let token: JsonRecord;
    if (integration === "google") {
      token = await exchangeGoogle(code, state.code_verifier, credential);
    } else if (integration === "github") {
      token = await exchangeGitHub(code, state.code_verifier, credential);
    } else if (integration === "canva") {
      token = await exchangeCanva(code, state.code_verifier, credential);
    } else if (integration === "linkedin") {
      token = await exchangeLinkedIn(code, credential);
    } else {
      token = await exchangeMeta(code, credential);
    }
    const verified = await verifyWithToken(provider, token, credential);
    await storeVerification(admin, state.owner_id, verified);
    return redirectResult(
      provider,
      "success",
      `${verified.accountLabel} is connected and verified.`,
    );
  } catch (error) {
    await markProviderError(admin, provider, state.owner_id, error);
    return redirectResult(provider, "error", safeMessage(error));
  }
}

async function verifyExisting(
  admin: ReturnType<typeof adminClient>,
  owner: Owner,
  providerKey: string,
  origin: string | null,
) {
  const provider = PROVIDERS[providerKey as ProviderKey];
  if (!provider) throw new ProviderError("Unknown provider.");
  const credential = await credentials(admin, provider.integration);
  if (!credential) throw new ProviderError("Configure this provider first.");

  try {
    if (provider.integration === "openai") {
      if (!credential.api_key) {
        throw new ProviderError("Save an OpenAI project API key first.");
      }
      const verified = await verifyOpenAI(credential.api_key);
      await storeVerification(admin, owner.id, verified);
      return json({
        provider: provider.key,
        status: "connected_api",
        accountLabel: verified.accountLabel,
        checkedAt: new Date().toISOString(),
      }, 200, origin);
    }

    const storedToken = await providerToken(admin, provider.key);
    if (!storedToken) {
      throw new ProviderError("Connect this provider before verifying it.");
    }
    let token: JsonRecord = {
      access_token: storedToken.access_token,
      refresh_token: storedToken.refresh_token,
      token_type: storedToken.token_type,
      scope: storedToken.scopes.join(" "),
    };
    const expiresSoon = storedToken.expires_at &&
      new Date(storedToken.expires_at).getTime() <= Date.now() + 90_000;
    if (expiresSoon && provider.integration === "google") {
      if (!storedToken.refresh_token) {
        throw new ProviderError(
          "The Google authorization expired. Reconnect the account.",
        );
      }
      const refreshed = await refreshGoogle(
        storedToken.refresh_token,
        credential,
      );
      token = {
        ...refreshed,
        refresh_token: storedToken.refresh_token,
        scope: storedToken.scopes.join(" "),
      };
    } else if (expiresSoon && provider.integration === "canva") {
      if (!storedToken.refresh_token) {
        throw new ProviderError(
          "The Canva authorization expired. Reconnect the account.",
        );
      }
      token = await refreshCanva(storedToken.refresh_token, credential);
    } else if (expiresSoon) {
      throw new ProviderError(
        "The provider authorization expired. Reconnect the account.",
      );
    }
    const verified = provider.integration === "meta"
      ? await verifyStoredMeta(provider.key, storedToken, credential)
      : await verifyWithToken(provider.key, token, credential);
    await storeVerification(admin, owner.id, verified);
    return json({
      provider: provider.key,
      status: "connected_api",
      accountLabel: verified.accountLabel,
      checkedAt: new Date().toISOString(),
    }, 200, origin);
  } catch (error) {
    await markProviderError(admin, provider.key, owner.id, error);
    throw error;
  }
}

async function disconnectProvider(
  admin: ReturnType<typeof adminClient>,
  owner: Owner,
  providerKey: string,
  origin: string | null,
) {
  const provider = PROVIDERS[providerKey as ProviderKey];
  if (!provider) throw new ProviderError("Unknown provider.");
  const storedToken = await providerToken(admin, provider.key);
  const credential = await credentials(admin, provider.integration);

  if (storedToken && credential) {
    try {
      if (provider.integration === "google") {
        const revoke = storedToken.refresh_token || storedToken.access_token;
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(revoke)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );
      } else if (provider.integration === "canva") {
        const basic = btoa(
          `${credential.client_id || ""}:${credential.client_secret || ""}`,
        );
        await fetch("https://api.canva.com/rest/v1/oauth/revoke", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            token: storedToken.refresh_token || storedToken.access_token,
          }),
        });
      }
    } catch {
      // Local token removal still proceeds. The provider can also be revoked
      // from its own account security page.
    }
  }

  const { error } = await admin.rpc("ops_disconnect_provider", {
    p_provider_key: provider.key,
    p_actor_id: owner.id,
  });
  if (error) throw new ProviderError(error.message);
  return json({
    provider: provider.key,
    status: "setup_required",
    disconnectedAt: new Date().toISOString(),
  }, 200, origin);
}

async function handleMetaWebhook(
  req: Request,
  admin: ReturnType<typeof adminClient>,
) {
  const credential = await credentials(admin, "meta");
  if (!credential?.client_secret || !credential.api_key) {
    return new Response("Webhook is not configured.", { status: 503 });
  }
  const url = new URL(req.url);
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token") || "";
    const challenge = url.searchParams.get("hub.challenge") || "";
    if (
      mode === "subscribe" &&
      timingSafeEqual(verifyToken, credential.api_key)
    ) {
      await admin.from("automation_connection_events").insert({
        provider_key: "messenger",
        event_type: "webhook_verified",
        detail: { source: "meta" },
      });
      await admin.from("automation_connections").update({
        last_checked_at: new Date().toISOString(),
        last_error: null,
      }).eq("provider_key", "messenger");
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
    return new Response("Verification failed.", { status: 403 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed.", { status: 405 });
  }
  const declaredLength = Number(req.headers.get("Content-Length") || 0);
  if (declaredLength > 1_000_000) {
    return new Response("Payload too large.", { status: 413 });
  }
  const body = new Uint8Array(await req.arrayBuffer());
  if (body.byteLength > 1_000_000) {
    return new Response("Payload too large.", { status: 413 });
  }
  const signature = req.headers.get("X-Hub-Signature-256") || "";
  const expected = `sha256=${await hmacSha256(credential.client_secret, body)}`;
  if (!timingSafeEqual(signature, expected)) {
    return new Response("Invalid signature.", { status: 401 });
  }

  let payload: JsonRecord;
  try {
    payload = asRecord(JSON.parse(new TextDecoder().decode(body)));
  } catch {
    return new Response("Invalid JSON.", { status: 400 });
  }

  const rows: JsonRecord[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry.map(asRecord) : [];
  for (const entry of entries) {
    const events = Array.isArray(entry.messaging)
      ? entry.messaging.map(asRecord)
      : [];
    for (const event of events) {
      const message = asRecord(event.message);
      const postback = asRecord(event.postback);
      const sender = asRecord(event.sender);
      const recipient = asRecord(event.recipient);
      const eventType = message.mid
        ? "message"
        : postback.payload
        ? "postback"
        : event.delivery
        ? "delivery"
        : event.read
        ? "read"
        : "messaging_event";
      const externalEventId = asString(
        message.mid || postback.mid ||
          `${asString(entry.id, 100)}:${asString(event.timestamp, 100)}:${asString(sender.id, 100)}:${eventType}`,
        500,
      );
      rows.push({
        provider_key: "messenger",
        external_event_id: externalEventId || null,
        event_type: eventType,
        sender_ref: asString(sender.id, 500) || null,
        recipient_ref: asString(recipient.id, 500) || null,
        payload: {
          page_id: asString(entry.id, 300) || null,
          event,
        },
      });
    }
  }
  if (rows.length) {
    const { error } = await admin.from("automation_inbox_events").upsert(rows, {
      onConflict: "provider_key,external_event_id",
      ignoreDuplicates: true,
    });
    if (error) return new Response("Event storage failed.", { status: 500 });
  }
  await admin.from("automation_connections").update({
    last_checked_at: new Date().toISOString(),
    last_error: null,
  }).eq("provider_key", "messenger");
  return new Response("EVENT_RECEIVED", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  const path = integrationPath(req);

  try {
    const admin = adminClient();

    if (path === "/webhooks/meta") {
      return await handleMetaWebhook(req, admin);
    }

    if (path.startsWith("/oauth/callback/") && req.method === "GET") {
      return await handleOAuthCallback(
        req,
        admin,
        path.split("/").filter(Boolean).at(-1) || "",
      );
    }

    if (origin && !isAllowedOrigin(origin)) {
      return json({ error: "Origin not allowed." }, 403, null);
    }
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders(origin) });
    }
    if (path === "/health" && req.method === "GET") {
      return json({
        service: "FMB Automation Integrations",
        status: "ready",
        generatedAt: new Date().toISOString(),
      }, 200, origin);
    }

    const owner = await ownerFromRequest(req, admin);

    if (path === "/status" && req.method === "GET") {
      return await statusResponse(admin, origin);
    }
    if (path === "/credentials" && req.method === "POST") {
      return await saveCredentials(req, admin, owner, origin);
    }
    if (path.startsWith("/connect/") && req.method === "POST") {
      return await beginAuthorization(
        req,
        admin,
        owner,
        path.split("/").filter(Boolean).at(-1) || "",
        origin,
      );
    }
    if (path.startsWith("/verify/") && req.method === "POST") {
      return await verifyExisting(
        admin,
        owner,
        path.split("/").filter(Boolean).at(-1) || "",
        origin,
      );
    }
    if (path.startsWith("/disconnect/") && req.method === "POST") {
      return await disconnectProvider(
        admin,
        owner,
        path.split("/").filter(Boolean).at(-1) || "",
        origin,
      );
    }

    return json({ error: "Route not found." }, 404, origin);
  } catch (error) {
    const message = safeMessage(error);
    const status = message === "Unauthorized."
      ? 401
      : message === "FMB owner access is required."
      ? 403
      : error instanceof SyntaxError
      ? 400
      : error instanceof ProviderError
      ? 400
      : 500;
    if (status >= 500) console.error("Automation integration request failed.");
    return json({ error: message }, status, origin);
  }
});
