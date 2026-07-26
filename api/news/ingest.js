'use strict';

const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_SOURCES_PER_RUN = 20;
const MAX_ITEMS_PER_SOURCE = 15;
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const HIGH_RISK_PATTERN = /\b(alleg(?:ed|ation|ations)|accus(?:ed|ation|ations)|arrest(?:ed|s)?|charg(?:ed|es)|crime|criminal|corrupt(?:ion)?|court|dead|death|disease|drug|election|fraud|government|governor|health|hospital|killed|lawsuit|legal|mayor|medical|military|murder|police|politic(?:s|al)?|president|rape|senate|sexual|suicide|violence|weapon)\b/i;

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function env(name, fallback = '') {
  return String(process.env[name] || fallback).trim();
}

function adminKey() {
  return env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
}

function publicKey() {
  return env('SUPABASE_PUBLISHABLE_KEY') || env('SUPABASE_ANON_KEY');
}

function supabaseHeaders(key, extra = {}) {
  const headers = { apikey: key, 'Content-Type': 'application/json', ...extra };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function supabase(path, options = {}) {
  const baseUrl = env('SUPABASE_URL').replace(/\/$/, '');
  const key = adminKey();
  if (!baseUrl || !key) throw new Error('SUPABASE_URL and a server-side Supabase key are required.');
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: supabaseHeaders(key, options.headers || {})
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!response.ok) {
    const detail = data?.message || data?.hint || data?.details || text || response.statusText;
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }
  return data;
}

async function verifyAdminJwt(token) {
  const baseUrl = env('SUPABASE_URL').replace(/\/$/, '');
  const key = publicKey();
  if (!token || !baseUrl || !key) return false;
  const userResponse = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` }
  });
  if (!userResponse.ok) return false;
  const user = await userResponse.json();
  if (!user?.id) return false;
  const rows = await supabase(`profiles?id=eq.${encodeURIComponent(user.id)}&select=role,status&limit=1`);
  return rows?.[0]?.role === 'admin' && rows?.[0]?.status === 'active';
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function authorize(req) {
  const authorization = String(req.headers.authorization || '');
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const cronSecret = env('CRON_SECRET');
  if (cronSecret && safeEqual(bearer, cronSecret)) {
    return { ok: true, trigger: 'cron' };
  }
  const manualSecret = env('NEWS_ADMIN_TOKEN');
  const providedManual = String(req.headers['x-news-admin-token'] || '');
  if (manualSecret && safeEqual(providedManual, manualSecret)) {
    return { ok: true, trigger: 'manual' };
  }
  if (bearer && await verifyAdminJwt(bearer)) return { ok: true, trigger: 'manual' };
  return { ok: false, trigger: 'manual' };
}

function isPrivateIp(address) {
  const value = String(address || '').toLowerCase().split('%')[0];
  if (net.isIP(value) === 4) {
    const parts = value.split('.').map(Number);
    const [a, b] = parts;
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224;
  }
  if (net.isIP(value) === 6) {
    if (value === '::' || value === '::1') return true;
    if (value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')) return true;
    const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIp(mapped[1]) : false;
  }
  return true;
}

function externalUrl(value, base = undefined) {
  try {
    const parsed = new URL(String(value || '').trim(), base);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

async function assertPublicFeedUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || '').trim()); }
  catch { throw new Error('Feed URL is invalid.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Feed URL must use public HTTPS without embedded credentials.');
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Private or local feed hosts are not allowed.');
  }
  if (net.isIP(hostname) && isPrivateIp(hostname)) throw new Error('Private network feed addresses are not allowed.');
  if (!net.isIP(hostname)) {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isPrivateIp(record.address))) throw new Error('Feed host does not resolve to a public network address.');
  }
  return parsed;
}

async function fetchPublicFeed(initialUrl, options) {
  let current = String(initialUrl || '');
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const safeUrl = await assertPublicFeedUrl(current);
    const response = await fetch(safeUrl, { ...options, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    if (!location) throw new Error('Feed redirect did not include a destination.');
    current = new URL(location, safeUrl).toString();
  }
  throw new Error('Feed redirected too many times.');
}

function decodeEntities(value = '') {
  const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => map[name.toLowerCase()] ?? match);
}

function stripHtml(value = '') {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max) {
  const text = String(value || '').trim();
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function firstMatch(block, patterns) {
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return '';
}

function attr(block, tagPattern, attrName) {
  const tag = block.match(tagPattern)?.[0] || '';
  return decodeEntities(tag.match(new RegExp(`${attrName}=["']([^"']+)["']`, 'i'))?.[1] || '').trim();
}

function parseDate(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function parseFeed(xml, source) {
  const isAtom = /<feed[\s>]/i.test(xml) || source.source_type === 'atom';
  const blocks = xml.match(isAtom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi) || [];
  return blocks.slice(0, MAX_ITEMS_PER_SOURCE).map((block) => {
    const title = stripHtml(firstMatch(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]));
    const rssLink = firstMatch(block, [/<link[^>]*>([\s\S]*?)<\/link>/i]);
    const atomLink = attr(block, /<link\b[^>]*>/i, 'href');
    const url = externalUrl((isAtom ? atomLink || rssLink : rssLink || atomLink).trim(), source.feed_url);
    const guid = firstMatch(block, [/<guid[^>]*>([\s\S]*?)<\/guid>/i, /<id[^>]*>([\s\S]*?)<\/id>/i]) || url;
    const rawExcerpt = firstMatch(block, [
      /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i,
      /<description[^>]*>([\s\S]*?)<\/description>/i,
      /<summary[^>]*>([\s\S]*?)<\/summary>/i,
      /<content[^>]*>([\s\S]*?)<\/content>/i
    ]);
    const published = firstMatch(block, [
      /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i,
      /<published[^>]*>([\s\S]*?)<\/published>/i,
      /<updated[^>]*>([\s\S]*?)<\/updated>/i,
      /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i
    ]);
    const author = stripHtml(firstMatch(block, [
      /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i,
      /<author[^>]*>\s*<name[^>]*>([\s\S]*?)<\/name>[\s\S]*?<\/author>/i,
      /<author[^>]*>([\s\S]*?)<\/author>/i
    ]));
    const mediaUrl = attr(block, /<media:content\b[^>]*>/i, 'url') || attr(block, /<media:thumbnail\b[^>]*>/i, 'url');
    const enclosureTag = block.match(/<enclosure\b[^>]*>/i)?.[0] || '';
    const enclosureType = attr(enclosureTag, /<enclosure\b[^>]*>/i, 'type');
    const enclosureUrl = enclosureType.startsWith('image/') ? attr(enclosureTag, /<enclosure\b[^>]*>/i, 'url') : '';
    return {
      title: truncate(title, 240),
      url,
      guid: truncate(guid, 500),
      excerpt: truncate(stripHtml(rawExcerpt), 1200),
      publishedAt: parseDate(published),
      author: truncate(author, 160),
      imageUrl: truncate(externalUrl(mediaUrl || enclosureUrl, source.feed_url), 1200)
    };
  }).filter((item) => item.title && /^https?:\/\//i.test(item.url));
}

function slugify(title, url) {
  const base = String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'news-brief';
  const suffix = crypto.createHash('sha256').update(url).digest('hex').slice(0, 8);
  return `${base}-${suffix}`;
}

function inferRisk(source, item) {
  const combined = `${item.title} ${item.excerpt}`;
  if (HIGH_RISK_PATTERN.test(combined)) return 'high';
  return source.risk_level || 'medium';
}

async function createSummary(item, source) {
  const apiKey = env('OPENAI_API_KEY');
  if (!apiKey || !item.excerpt) return { summary: truncate(item.excerpt, 420), ai: false };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env('NEWS_SUMMARY_MODEL', 'gpt-5-mini'),
      input: [
        {
          role: 'developer',
          content: 'Create a neutral, concise news brief using only the supplied title and excerpt. Do not add facts, names, numbers, motives, or context not present. Return only valid JSON with keys summary and seo_description. The summary must be 2 to 3 sentences and the SEO description must be under 155 characters.'
        },
        {
          role: 'user',
          content: `Source: ${source.name}\nTitle: ${item.title}\nExcerpt: ${item.excerpt}`
        }
      ],
      max_output_tokens: 260
    })
  });
  if (!response.ok) throw new Error(`OpenAI summarization failed with ${response.status}.`);
  const payload = await response.json();
  const outputText = payload.output_text || payload.output?.flatMap((entry) => entry.content || []).find((entry) => entry.type === 'output_text')?.text || '';
  const cleaned = String(outputText).replace(/^```json\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(cleaned);
  return {
    summary: truncate(stripHtml(parsed.summary), 700) || truncate(item.excerpt, 420),
    seoDescription: truncate(stripHtml(parsed.seo_description), 155),
    ai: true
  };
}

async function fetchSource(source) {
  const headers = { Accept: 'application/rss+xml, application/atom+xml, application/feed+json, application/json, text/xml;q=0.9, */*;q=0.5', 'User-Agent': 'FMB-News-Ingestion/1.0 (+https://www.francinemariebautista.com/news/)' };
  if (source.etag) headers['If-None-Match'] = source.etag;
  if (source.last_modified) headers['If-Modified-Since'] = source.last_modified;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchPublicFeed(source.feed_url, { headers, signal: controller.signal });
    if (response.status === 304) return { items: [], notModified: true, etag: source.etag, lastModified: source.last_modified };
    if (!response.ok) throw new Error(`Feed returned ${response.status}.`);
    const contentType = response.headers.get('content-type') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_FEED_BYTES) throw new Error('Feed exceeds the 2 MB safety limit.');
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_FEED_BYTES) throw new Error('Feed exceeds the 2 MB safety limit.');
    let items;
    if (source.source_type === 'json_feed' || /json/i.test(contentType)) {
      const json = JSON.parse(text);
      items = (json.items || []).slice(0, MAX_ITEMS_PER_SOURCE).map((entry) => ({
        title: truncate(stripHtml(entry.title), 240),
        url: externalUrl(entry.url || entry.external_url || '', source.feed_url),
        guid: truncate(entry.id || entry.url || '', 500),
        excerpt: truncate(stripHtml(entry.summary || entry.content_text || entry.content_html), 1200),
        publishedAt: parseDate(entry.date_published || entry.date_modified),
        author: truncate(stripHtml(entry.author?.name || entry.authors?.[0]?.name), 160),
        imageUrl: truncate(externalUrl(entry.image || entry.banner_image || '', source.feed_url), 1200)
      })).filter((item) => item.title && /^https?:\/\//i.test(item.url));
    } else {
      items = parseFeed(text, source);
    }
    return { items, notModified: false, etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') };
  } finally {
    clearTimeout(timeout);
  }
}

async function createRun(trigger) {
  const rows = await supabase('news_ingestion_runs', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ trigger_type: trigger, status: 'running' })
  });
  return rows?.[0]?.id || null;
}

async function finishRun(id, payload) {
  if (!id) return;
  await supabase(`news_ingestion_runs?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ ...payload, finished_at: new Date().toISOString() })
  });
}

async function ingest(trigger) {
  const runId = await createRun(trigger);
  const totals = { sources_checked: 0, items_seen: 0, items_imported: 0, items_published: 0 };
  const errors = [];
  try {
    const sources = await supabase(`news_sources?select=*&active=eq.true&order=last_checked_at.asc.nullsfirst&limit=${MAX_SOURCES_PER_RUN}`);
    for (const source of sources || []) {
      totals.sources_checked += 1;
      const checkedAt = new Date().toISOString();
      try {
        const feed = await fetchSource(source);
        totals.items_seen += feed.items.length;
        for (const item of feed.items) {
          try {
            const risk = inferRisk(source, item);
            let summary;
            try { summary = await createSummary(item, source); }
            catch (error) {
              summary = { summary: truncate(item.excerpt, 420), ai: false };
              errors.push(`${source.name}: ${error.message}`);
            }
            const canAutoPublish = Boolean(source.auto_publish && risk === 'low');
            const article = {
              source_id: source.id,
              source_item_id: item.guid || item.url,
              source_url: item.url,
              source_name: source.name,
              title: item.title,
              slug: slugify(item.title, item.url),
              source_excerpt: item.excerpt || null,
              summary: summary.summary || null,
              category: source.category || 'Philippines',
              region: source.region || null,
              author_line: item.author || null,
              image_url: item.imageUrl || null,
              status: canAutoPublish ? 'published' : 'pending_review',
              risk_level: risk,
              verification_status: canAutoPublish ? 'verified' : 'imported',
              is_ai_assisted: Boolean(summary.ai),
              seo_title: truncate(item.title, 70),
              seo_description: summary.seoDescription || truncate(summary.summary || item.excerpt, 155) || null,
              source_published_at: item.publishedAt,
              published_at: canAutoPublish ? new Date().toISOString() : null
            };
            const inserted = await supabase('news_articles?on_conflict=source_url', {
              method: 'POST',
              headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
              body: JSON.stringify(article)
            });
            if (inserted?.length) {
              totals.items_imported += 1;
              if (canAutoPublish) totals.items_published += 1;
            }
          } catch (error) {
            errors.push(`${source.name} / ${truncate(item.title, 80)}: ${error.message}`);
          }
        }
        await supabase(`news_sources?id=eq.${encodeURIComponent(source.id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({
            last_checked_at: checkedAt,
            last_success_at: checkedAt,
            last_error: null,
            etag: feed.etag || source.etag || null,
            last_modified: feed.lastModified || source.last_modified || null,
            updated_at: checkedAt
          })
        });
      } catch (error) {
        errors.push(`${source.name}: ${error.message}`);
        await supabase(`news_sources?id=eq.${encodeURIComponent(source.id)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ last_checked_at: checkedAt, last_error: truncate(error.message, 1000), updated_at: checkedAt })
        });
      }
    }
    const status = errors.length ? (totals.items_imported ? 'partial' : 'failed') : 'completed';
    await finishRun(runId, { ...totals, status, error_summary: errors.length ? truncate(errors.join(' | '), 4000) : null });
    return { run_id: runId, status, ...totals, errors };
  } catch (error) {
    await finishRun(runId, { ...totals, status: 'failed', error_summary: truncate(error.message, 4000) });
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Method not allowed.' });
  }
  try {
    const access = await authorize(req);
    if (!access.ok) return send(res, 401, { error: 'Authorized newsroom access is required.' });
    const result = await ingest(access.trigger);
    return send(res, result.status === 'failed' ? 502 : 200, result);
  } catch (error) {
    console.error('[news-ingest]', error);
    return send(res, 500, { error: 'News ingestion failed.', detail: env('VERCEL_ENV') === 'production' ? undefined : error.message });
  }
};
