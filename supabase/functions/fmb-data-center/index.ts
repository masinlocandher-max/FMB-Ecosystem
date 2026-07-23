import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const allowedOrigins = new Set([
  "https://www.francinemariebautista.com",
  "https://francinemariebautista.com",
  "https://data.francinemariebautista.com",
  "https://yoni.francinemariebautista.com",
  "https://app.francinemariebautista.com",
  "http://localhost:3000",
  "http://localhost:4173",
]);

function isAllowedOrigin(origin: string | null) {
  return !origin ||
    allowedOrigins.has(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

function corsHeaders(origin: string | null) {
  const responseOrigin = origin && isAllowedOrigin(origin)
    ? origin
    : "https://www.francinemariebautista.com";

  return {
    "Access-Control-Allow-Origin": responseOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    },
  });
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDayIso(daysAgo = 0) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString();
}

function dateRange(days: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - 1 - index));
    return isoDate(date);
  });
}

function countByDate(rows: Array<Record<string, unknown>>, field: string) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    const raw = row[field];
    if (!raw) return counts;
    const key = String(raw).slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (origin && !isAllowedOrigin(origin)) {
    return json({ error: "Origin not allowed." }, 403, null);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, origin);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Dashboard service configuration is incomplete." }, 500, origin);
  }

  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized." }, 401, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return json({ error: "Unauthorized." }, 401, origin);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role,status")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin" ||
    profile.status !== "active"
  ) {
    return json({ error: "Administrator access is required." }, 403, origin);
  }

  const sevenDaysAgo = startOfDayIso(6);
  const thirtyDaysAgo = startOfDayIso(29);
  const today = isoDate(new Date());

  try {
    const [
      membersTotalResult,
      membersActiveResult,
      membersNew7dResult,
      membersNew30dResult,
      contentPublishedResult,
      contentDraftResult,
      musicPublishedResult,
      musicDraftResult,
      messagesNewResult,
      messagesResolvedResult,
      messagesArchivedResult,
      moderationPendingResult,
      moderationPublishedResult,
      moderationOtherResult,
      checkinsTodayResult,
      checkins7dResult,
      mediaResult,
      savedContentResult,
      settingsResult,
      memberTrendResult,
      checkinTrendResult,
      recentMembersResult,
      recentMessagesResult,
      activityResult,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("profiles").select("id", { count: "exact", head: true }).gte("joined_at", sevenDaysAgo),
      admin.from("profiles").select("id", { count: "exact", head: true }).gte("joined_at", thirtyDaysAgo),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("content_items").select("id", { count: "exact", head: true }).eq("status", "draft"),
      admin.from("music_entries").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("music_entries").select("id", { count: "exact", head: true }).eq("status", "draft"),
      admin.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      admin.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      admin.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "archived"),
      admin.from("freedom_wall_posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("freedom_wall_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("freedom_wall_posts").select("id", { count: "exact", head: true }).in("status", ["rejected", "changes_requested"]),
      admin.from("daily_checkins").select("id", { count: "exact", head: true }).eq("checkin_date", today),
      admin.from("daily_checkins").select("id", { count: "exact", head: true }).gte("checkin_date", sevenDaysAgo.slice(0, 10)),
      admin.from("media_assets").select("size_bytes"),
      admin.from("saved_content").select("id", { count: "exact", head: true }),
      admin.from("membership_settings").select("registration_open,updated_at").eq("singleton", true).maybeSingle(),
      admin.from("profiles").select("joined_at").gte("joined_at", thirtyDaysAgo).order("joined_at", { ascending: true }),
      admin.from("daily_checkins").select("checkin_date").gte("checkin_date", thirtyDaysAgo.slice(0, 10)).order("checkin_date", { ascending: true }),
      admin.from("profiles").select("display_name,username,role,status,joined_at").order("joined_at", { ascending: false }).limit(12),
      admin.from("contact_messages").select("name,email,subject,kind,status,created_at").order("created_at", { ascending: false }).limit(20),
      admin.from("admin_activity").select("action,entity_type,created_at").order("created_at", { ascending: false }).limit(12),
    ]);

    const results = [
      membersTotalResult,
      membersActiveResult,
      membersNew7dResult,
      membersNew30dResult,
      contentPublishedResult,
      contentDraftResult,
      musicPublishedResult,
      musicDraftResult,
      messagesNewResult,
      messagesResolvedResult,
      messagesArchivedResult,
      moderationPendingResult,
      moderationPublishedResult,
      moderationOtherResult,
      checkinsTodayResult,
      checkins7dResult,
      mediaResult,
      savedContentResult,
      settingsResult,
      memberTrendResult,
      checkinTrendResult,
      recentMembersResult,
      recentMessagesResult,
      activityResult,
    ];

    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const memberCounts = countByDate(memberTrendResult.data || [], "joined_at");
    const checkinCounts = countByDate(checkinTrendResult.data || [], "checkin_date");
    const trend = dateRange(30).map((date) => ({
      date,
      joins: memberCounts[date] || 0,
      checkins: checkinCounts[date] || 0,
    }));

    const mediaBytes = (mediaResult.data || []).reduce(
      (sum, row) => sum + Number(row.size_bytes || 0),
      0,
    );
    const contentPublished = contentPublishedResult.count || 0;
    const contentDraft = contentDraftResult.count || 0;
    const musicPublished = musicPublishedResult.count || 0;
    const musicDraft = musicDraftResult.count || 0;

    return json({
      generatedAt: new Date().toISOString(),
      overview: {
        membersTotal: membersTotalResult.count || 0,
        membersActive: membersActiveResult.count || 0,
        membersNew7d: membersNew7dResult.count || 0,
        membersNew30d: membersNew30dResult.count || 0,
        publishedTotal: contentPublished + musicPublished,
        draftTotal: contentDraft + musicDraft,
        messagesNew: messagesNewResult.count || 0,
        moderationPending: moderationPendingResult.count || 0,
        registrationOpen: Boolean(settingsResult.data?.registration_open),
      },
      content: {
        contentPublished,
        contentDraft,
        musicPublished,
        musicDraft,
        mediaCount: mediaResult.data?.length || 0,
        mediaBytes,
        savedContentTotal: savedContentResult.count || 0,
      },
      community: {
        checkinsToday: checkinsTodayResult.count || 0,
        checkins7d: checkins7dResult.count || 0,
        moderationPending: moderationPendingResult.count || 0,
        moderationPublished: moderationPublishedResult.count || 0,
        moderationOther: moderationOtherResult.count || 0,
      },
      messages: {
        newCount: messagesNewResult.count || 0,
        resolvedCount: messagesResolvedResult.count || 0,
        archivedCount: messagesArchivedResult.count || 0,
      },
      trend,
      recentMembers: (recentMembersResult.data || []).map((row) => ({
        displayName: row.display_name,
        username: row.username,
        role: row.role,
        status: row.status,
        joinedAt: row.joined_at,
      })),
      recentMessages: (recentMessagesResult.data || []).map((row) => ({
        name: row.name,
        email: row.email,
        subject: row.subject,
        kind: row.kind,
        status: row.status,
        createdAt: row.created_at,
      })),
      activity: (activityResult.data || []).map((row) => ({
        action: row.action,
        entityType: row.entity_type,
        createdAt: row.created_at,
      })),
      system: {
        databaseStatus: "Healthy",
        project: "withlovefmb",
        source: "Supabase",
        registrationUpdatedAt: settingsResult.data?.updated_at || null,
        isolation: "FMB public and member data only",
      },
    }, 200, origin);
  } catch (error) {
    console.error("FMB Data Center error", error);
    return json({ error: "The dashboard data could not be assembled." }, 500, origin);
  }
});
