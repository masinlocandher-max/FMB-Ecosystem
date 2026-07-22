import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.1/+esm";

const SUPABASE_URL = "https://wjnavdpppnhxbuydkrkd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8";
const FUNCTION_NAME = "fmb-data-center";
const CACHE_KEY = "fmb_data_center_last_good_v1";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const state = {
  data: null,
  stale: false,
  loading: false,
  currentView: "overview",
  refreshTimer: null,
};

const views = {
  overview: ["Operations Overview", "What is happening now, what needs attention, and what should happen next."],
  audience: ["Audience and Membership", "Understand membership growth without exposing private profile information."],
  content: ["Publishing and Media", "See what is live, what remains in draft, and how the media library is growing."],
  community: ["Community Operations", "Watch moderation demand and participation while preserving member privacy."],
  messages: ["Messages and Inquiries", "Review recent contact and volunteer inquiries that need a response."],
  system: ["System and Data Health", "See connected sources, current boundaries, and the trust status of each metric."],
};

const el = (id) => document.getElementById(id);
const authScreen = el("authScreen");
const dashboardShell = el("dashboardShell");
const loginForm = el("loginForm");
const loginButton = el("loginButton");
const loginStatus = el("loginStatus");
const refreshButton = el("refreshButton");
const mobileRefresh = el("mobileRefresh");
const logoutButton = el("logoutButton");
const liveState = el("liveState");
const updatedAt = el("updatedAt");
const globalAlert = el("globalAlert");
const sidebar = el("sidebar");
const menuToggle = el("menuToggle");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plural(value, singular, pluralForm = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PH").format(Number(value || 0));
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function formatDate(value, options = {}) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: options.year ? "numeric" : undefined,
    hour: options.time ? "numeric" : undefined,
    minute: options.time ? "2-digit" : undefined,
  }).format(date);
}

function timeAgo(value) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return "Unknown";
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function setStatus(kind, text) {
  liveState.className = `live-state ${kind || ""}`.trim();
  liveState.querySelector("span").textContent = text;
}

function showAlert(message, type = "warning") {
  globalAlert.hidden = false;
  globalAlert.className = `global-alert ${type === "error" ? "error" : ""}`.trim();
  globalAlert.textContent = message;
}

function clearAlert() {
  globalAlert.hidden = true;
  globalAlert.textContent = "";
}

function setLoading(isLoading) {
  state.loading = isLoading;
  refreshButton.disabled = isLoading;
  mobileRefresh.disabled = isLoading;
  refreshButton.textContent = isLoading ? "Refreshing…" : "Refresh data";
}

function showAuth() {
  authScreen.hidden = false;
  dashboardShell.hidden = true;
  stopRefreshTimer();
}

function showDashboard() {
  authScreen.hidden = true;
  dashboardShell.hidden = false;
  startRefreshTimer();
}

function cacheData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: new Date().toISOString() }));
  } catch {
    // Storage can be unavailable in strict privacy modes. The live dashboard still works.
  }
}

function readCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function verifySession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    showAuth();
    return;
  }
  showDashboard();
  await loadDashboard({ allowCache: true });
}

async function handleLogin(event) {
  event.preventDefault();
  loginStatus.textContent = "";
  loginStatus.className = "form-status";

  const email = el("emailInput").value.trim();
  const password = el("passwordInput").value;
  if (!email || !password) {
    loginStatus.textContent = "Enter your administrator email and password.";
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Verifying access…";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginStatus.textContent = "Access could not be verified. Check your credentials and administrator role.";
    loginButton.disabled = false;
    loginButton.textContent = "Enter Data Center";
    return;
  }

  loginStatus.className = "form-status success";
  loginStatus.textContent = "Access verified.";
  showDashboard();
  await loadDashboard({ allowCache: false });
  loginButton.disabled = false;
  loginButton.textContent = "Enter Data Center";
}

async function handleLogout() {
  await supabase.auth.signOut();
  state.data = null;
  localStorage.removeItem(CACHE_KEY);
  showAuth();
}

async function fetchDashboardData() {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body: {} });
  if (error) throw new Error(error.message || "The dashboard service did not respond.");
  if (!data || data.error) throw new Error(data?.error || "The dashboard returned an invalid response.");
  return data;
}

async function loadDashboard({ allowCache = true } = {}) {
  if (state.loading) return;
  setLoading(true);
  clearAlert();
  setStatus("", "Refreshing");

  try {
    const data = await fetchDashboardData();
    state.data = data;
    state.stale = false;
    cacheData(data);
    renderAll(data);
    setStatus("live", "Live");
    updatedAt.textContent = formatDate(data.generatedAt, { time: true });
  } catch (error) {
    const cached = allowCache ? readCache() : null;
    if (cached?.data) {
      state.data = cached.data;
      state.stale = true;
      renderAll(cached.data);
      setStatus("stale", "Stale data");
      updatedAt.textContent = `${formatDate(cached.cachedAt, { time: true })} cached`;
      showAlert("The live source is temporarily unavailable. Showing the last known good data instead.");
    } else {
      setStatus("error", "Unavailable");
      updatedAt.textContent = "No data";
      showAlert(error.message || "The dashboard could not load.", "error");
      if (/unauthorized|admin|jwt|401/i.test(error.message || "")) {
        await supabase.auth.signOut();
        showAuth();
        loginStatus.textContent = "This account does not have administrator access.";
      }
    }
  } finally {
    setLoading(false);
  }
}

function metricCard(label, value, note, delta, tone = "") {
  return `<article class="metric-card ${tone}">
    <small>${escapeHtml(label)}</small>
    <strong>${escapeHtml(value)}</strong>
    <p>${escapeHtml(note)}</p>
    <span class="metric-delta">${escapeHtml(delta)}</span>
  </article>`;
}

function sectionStat(label, value, note) {
  return `<article class="section-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`;
}

function renderAll(data) {
  renderOverview(data);
  renderAudience(data);
  renderContent(data);
  renderCommunity(data);
  renderMessages(data);
  renderSystem(data);
}

function renderOverview(data) {
  const o = data.overview;
  el("overviewMetrics").innerHTML = [
    metricCard("Members", formatNumber(o.membersTotal), `${formatNumber(o.membersActive)} active accounts`, `+${formatNumber(o.membersNew7d)} in 7 days`, "neutral"),
    metricCard("Published", formatNumber(o.publishedTotal), "Content and music currently live", `${formatNumber(o.draftTotal)} drafts waiting`, ""),
    metricCard("New inquiries", formatNumber(o.messagesNew), "Contact and volunteer messages", o.messagesNew ? "Response needed" : "Inbox clear", o.messagesNew ? "alert" : ""),
    metricCard("Moderation", formatNumber(o.moderationPending), "Freedom Wall posts awaiting review", o.moderationPending ? "Review queue open" : "Queue clear", o.moderationPending ? "alert" : ""),
  ].join("");

  const attention = [];
  if (o.messagesNew > 0) attention.push(["urgent", "New inquiries", plural(o.messagesNew, "message"), "Respond"]);
  if (o.moderationPending > 0) attention.push(["urgent", "Moderation queue", plural(o.moderationPending, "post"), "Review"]);
  if (o.draftTotal > 0) attention.push(["", "Draft inventory", plural(o.draftTotal, "item"), "Plan"]);
  if (!o.registrationOpen) attention.push(["", "Membership", "Registration is closed", "Policy"]);
  if (!attention.length) attention.push(["good", "Operations", "No urgent queue detected", "Clear"]);
  el("attentionList").innerHTML = attention.map(([tone, title, detail, action]) => `<div class="attention-item ${tone}"><i></i><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div><b>${escapeHtml(action)}</b></div>`).join("");

  const published = data.content.contentPublished + data.content.musicPublished;
  const total = published + data.content.contentDraft + data.content.musicDraft;
  const angle = total ? Math.round((published / total) * 360) : 0;
  el("contentDonut").style.background = `conic-gradient(var(--violet-2) 0deg,var(--violet-2) ${angle}deg,rgba(255,255,255,.07) ${angle}deg)`;
  el("publishedTotal").textContent = formatNumber(published);
  const maximum = Math.max(1, data.content.contentPublished, data.content.contentDraft, data.content.musicPublished, data.content.musicDraft);
  el("contentBreakdown").innerHTML = [
    ["Published articles", data.content.contentPublished],
    ["Draft articles", data.content.contentDraft],
    ["Published music", data.content.musicPublished],
    ["Draft music", data.content.musicDraft],
  ].map(([label, value]) => `<div class="breakdown-row"><span>${escapeHtml(label)}</span><strong>${formatNumber(value)}</strong><i style="--value:${Math.max(4, Math.round((value/maximum)*100))}%"></i></div>`).join("");

  const activity = data.activity || [];
  el("activityList").innerHTML = activity.length ? activity.map((item) => `<div class="activity-item"><i>${escapeHtml((item.entityType || "A").slice(0,2).toUpperCase())}</i><div><strong>${escapeHtml(humanizeAction(item.action))}</strong><span>${escapeHtml(humanizeEntity(item.entityType))}</span></div><time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(timeAgo(item.createdAt))}</time></div>`).join("") : `<div class="empty-state">No administrator activity has been recorded yet.</div>`;

  drawActivityChart(data.trend || []);
}

function renderAudience(data) {
  const o = data.overview;
  el("audienceMetrics").innerHTML = [
    sectionStat("Total members", formatNumber(o.membersTotal), "FMB public and member platform only"),
    sectionStat("Active accounts", formatNumber(o.membersActive), "Suspended accounts are excluded"),
    sectionStat("New in 30 days", formatNumber(o.membersNew30d), "Membership movement"),
  ].join("");

  const rows = data.recentMembers || [];
  el("membersTable").innerHTML = rows.length ? rows.map((member) => `<tr>
    <td><div class="table-primary"><strong>${escapeHtml(member.displayName || "Member")}</strong><span>FMB member</span></div></td>
    <td>${escapeHtml(member.username ? `@${member.username}` : "Not set")}</td>
    <td>${escapeHtml(member.role || "member")}</td>
    <td><span class="status-pill ${escapeHtml(member.status || "active")}">${escapeHtml(member.status || "active")}</span></td>
    <td>${escapeHtml(formatDate(member.joinedAt, { year: true }))}</td>
  </tr>`).join("") : `<tr><td colspan="5">No member records are available.</td></tr>`;
}

function renderContent(data) {
  const c = data.content;
  el("contentMetrics").innerHTML = [
    sectionStat("Published items", formatNumber(c.contentPublished + c.musicPublished), "Available to the intended audience"),
    sectionStat("Draft items", formatNumber(c.contentDraft + c.musicDraft), "Not yet published"),
    sectionStat("Media assets", formatNumber(c.mediaCount), formatBytes(c.mediaBytes)),
  ].join("");

  el("inventoryList").innerHTML = [
    ["Articles and eBooks", c.contentPublished, c.contentDraft],
    ["Music library", c.musicPublished, c.musicDraft],
    ["Saved member content", c.savedContentTotal, null],
  ].map(([label, live, draft]) => `<div class="inventory-row"><div><strong>${escapeHtml(label)}</strong><span>${draft === null ? "Member saves" : `${formatNumber(draft)} draft`}</span></div><b>${formatNumber(live)}${draft === null ? "" : " live"}</b></div>`).join("");

  const softCapacity = 1024 * 1024 * 1024;
  const usage = Math.min(100, Math.max(2, Math.round((c.mediaBytes / softCapacity) * 100)));
  el("storageSummary").innerHTML = `<div class="storage-number"><span>Recorded media size</span><strong>${escapeHtml(formatBytes(c.mediaBytes))}</strong></div><div class="storage-bar"><i style="--usage:${usage}%"></i></div><p>This is the size recorded in the media asset registry, not a billing or Supabase quota statement. Unregistered files are not included.</p>`;
}

function renderCommunity(data) {
  const c = data.community;
  el("communityMetrics").innerHTML = [
    sectionStat("Check-ins today", formatNumber(c.checkinsToday), "Participation count only"),
    sectionStat("Check-ins in 7 days", formatNumber(c.checkins7d), "No notes or user identities shown"),
    sectionStat("Pending posts", formatNumber(c.moderationPending), "Freedom Wall review queue"),
  ].join("");

  el("moderationSummary").innerHTML = [
    ["Pending review", c.moderationPending],
    ["Published", c.moderationPublished],
    ["Rejected or changes requested", c.moderationOther],
  ].map(([label, value]) => `<div class="moderation-row"><span>${escapeHtml(label)}</span><strong>${formatNumber(value)}</strong></div>`).join("");
}

function renderMessages(data) {
  const m = data.messages;
  el("messageMetrics").innerHTML = [
    sectionStat("New messages", formatNumber(m.newCount), "Needs response or review"),
    sectionStat("Resolved", formatNumber(m.resolvedCount), "Closed messages"),
    sectionStat("Archived", formatNumber(m.archivedCount), "No longer active"),
  ].join("");

  const rows = data.recentMessages || [];
  el("messagesTable").innerHTML = rows.length ? rows.map((message) => `<tr>
    <td><div class="table-primary"><strong>${escapeHtml(message.name)}</strong><span>${escapeHtml(message.email)}</span></div></td>
    <td>${escapeHtml(message.subject)}</td>
    <td>${escapeHtml(message.kind)}</td>
    <td><span class="status-pill ${escapeHtml(message.status)}">${escapeHtml(message.status)}</span></td>
    <td>${escapeHtml(formatDate(message.createdAt, { year: true, time: true }))}</td>
  </tr>`).join("") : `<tr><td colspan="5">No inquiries have been recorded yet.</td></tr>`;
}

function renderSystem(data) {
  const s = data.system;
  el("systemMetrics").innerHTML = [
    sectionStat("Database", s.databaseStatus, "Supabase project health"),
    sectionStat("Registration", data.overview.registrationOpen ? "Open" : "Closed", "Current membership setting"),
    sectionStat("Data freshness", state.stale ? "Stale" : "Live", state.stale ? "Last known good response" : "Fresh function response"),
  ].join("");

  el("sourceList").innerHTML = [
    ["Supabase Auth", "Administrator session and role verification", "Connected", true],
    ["FMB database", "Members, content, community, messages, and media", "Connected", true],
    ["Admin audit trail", "Recent administrative actions", data.activity?.length ? "Connected" : "No events", true],
    ["Website analytics", "Page views, visitors, referrals, and campaigns", "Not connected", false],
  ].map(([name, detail, status, connected]) => `<div class="source-row ${connected ? "" : "disconnected"}"><i></i><div><strong>${escapeHtml(name)}</strong><span>${escapeHtml(detail)}</span></div><b>${escapeHtml(status)}</b></div>`).join("");
}

function humanizeAction(value = "Activity") {
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeEntity(value = "system") {
  return String(value).replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function drawActivityChart(trend) {
  const canvas = el("activityChart");
  const empty = el("emptyChart");
  if (!canvas) return;
  const totalActivity = trend.reduce((sum, point) => sum + Number(point.joins || 0) + Number(point.checkins || 0), 0);
  empty.hidden = totalActivity > 0;

  const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(300, Math.round(rect.width));
  const height = Math.max(220, Math.round(rect.height));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);

  const styles = getComputedStyle(document.documentElement);
  const muted = styles.getPropertyValue("--muted").trim();
  const violet = styles.getPropertyValue("--violet-2").trim();
  const green = styles.getPropertyValue("--green").trim();
  const line = "rgba(207,195,218,.10)";
  const padding = { top: 20, right: 10, bottom: 32, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = trend.flatMap((point) => [Number(point.joins || 0), Number(point.checkins || 0)]);
  const max = Math.max(4, ...values);

  ctx.lineWidth = 1;
  ctx.strokeStyle = line;
  ctx.fillStyle = muted;
  ctx.font = "8px Montserrat";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const label = Math.round(max - (max / 4) * i);
    ctx.fillText(String(label), padding.left - 7, y);
  }

  if (!trend.length) return;
  const xFor = (index) => padding.left + (chartWidth * index) / Math.max(1, trend.length - 1);
  const yFor = (value) => padding.top + chartHeight - (Number(value || 0) / max) * chartHeight;

  function drawSeries(key, color) {
    ctx.beginPath();
    trend.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point[key]);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    trend.forEach((point, index) => {
      if (!point[key]) return;
      ctx.beginPath();
      ctx.arc(xFor(index), yFor(point[key]), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  drawSeries("joins", violet);
  drawSeries("checkins", green);

  ctx.fillStyle = muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const labelIndexes = [0, Math.floor((trend.length - 1) / 2), trend.length - 1];
  labelIndexes.forEach((index) => {
    const label = new Date(`${trend[index].date}T00:00:00`);
    ctx.fillText(new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(label), xFor(index), height - 19);
  });
}

function switchView(view) {
  state.currentView = view;
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".dashboard-view").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
  const [title, description] = views[view] || views.overview;
  el("viewTitle").textContent = title;
  el("viewDescription").textContent = description;
  sidebar.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  if (view === "overview" && state.data) requestAnimationFrame(() => drawActivityChart(state.data.trend || []));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startRefreshTimer() {
  stopRefreshTimer();
  state.refreshTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") loadDashboard({ allowCache: true });
  }, REFRESH_INTERVAL_MS);
}

function stopRefreshTimer() {
  if (state.refreshTimer) window.clearInterval(state.refreshTimer);
  state.refreshTimer = null;
}

loginForm.addEventListener("submit", handleLogin);
logoutButton.addEventListener("click", handleLogout);
refreshButton.addEventListener("click", () => loadDashboard({ allowCache: true }));
mobileRefresh.addEventListener("click", () => loadDashboard({ allowCache: true }));
menuToggle.addEventListener("click", () => {
  const open = !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && state.data) {
    const age = Date.now() - new Date(state.data.generatedAt).getTime();
    if (age > 2 * 60 * 1000) loadDashboard({ allowCache: true });
  }
});
window.addEventListener("resize", () => {
  if (state.currentView === "overview" && state.data) drawActivityChart(state.data.trend || []);
});

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") showAuth();
});

verifySession();
