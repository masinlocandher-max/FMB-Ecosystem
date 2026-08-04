import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const previewRoot = path.join(dist, 'fmbnews-preview');
const outputPath = path.join(dist, 'assets', 'data', 'fmbnews-manifest.json');
const overridesPath = path.join(previewRoot, 'content-overrides.json');
const origin = 'https://www.francinemariebautista.com';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] ?? '';
}

function decode(value = '') {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}

function text(value = '') {
  return decode(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = attr(tag, 'property') || attr(tag, 'name');
    if (name.toLowerCase() === key.toLowerCase()) return decode(attr(tag, 'content'));
  }
  return '';
}

function canonicalRoute(html, filePath) {
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]).find((tag) => attr(tag, 'rel').toLowerCase() === 'canonical');
  const fallback = `${origin}/${path.relative(dist, path.dirname(filePath)).split(path.sep).join('/')}/`;
  const href = canonical ? attr(canonical, 'href') : fallback;
  try {
    const pathname = new URL(href, origin).pathname.replace(/\/{2,}/g, '/');
    if (!pathname.startsWith('/news/') || pathname === '/news/') return '';
    return pathname.endsWith('/') ? pathname : `${pathname}/`;
  } catch {
    return '';
  }
}

function firstImage(html) {
  const preferred = html.match(/<(?:figure|picture)\b[^>]*(?:nc-story-media|news-visual)[^>]*>[\s\S]*?<\/\s*(?:figure|picture)>/i)?.[0] ?? html;
  const tag = preferred.match(/<img\b[^>]*>/i)?.[0] ?? '';
  return { src: attr(tag, 'src'), alt: decode(attr(tag, 'alt')) };
}

function jsonLdDate(html, key) {
  const pattern = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i');
  return decode(html.match(pattern)?.[1] ?? '');
}

function normalizeCategory(value = '') {
  const key = value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const aliases = { national: 'philippines', local: 'philippines', politics: 'politics-government', government: 'politics-government', money: 'business', finance: 'business', economy: 'business', tech: 'technology', entertainment: 'culture', arts: 'culture' };
  return aliases[key] || key;
}

function inferCategory(source = '') {
  const value = source.toLowerCase();
  if (/\b(world|global|international|united states|u\.s\.|china|japan|korea|iran|israel|gaza|ukraine|russia|europe|united nations|\bun\b)\b/.test(value)) return 'world';
  if (/\b(business|market|stocks?|peso|bank|finance|economy|economic|inflation|prices?|tax|investment|company|companies|energy|fuel)\b/.test(value)) return 'business';
  if (/\b(technology|tech|digital|artificial intelligence|\bai\b|software|cyber|innovation|satellite)\b/.test(value)) return 'technology';
  if (/\b(politics|political|government|governance|policy|president|senate|congress|election|sona|cabinet)\b/.test(value)) return 'politics-government';
  if (/\b(environment|climate|weather|storm|typhoon|habagat|landfill|wildfire|water|pollution)\b/.test(value)) return 'environment';
  if (/\b(health|wellness|medicine|medical|hospital|disease|mental health)\b/.test(value)) return 'health';
  if (/\b(education|school|student|teacher|university|learning|deped)\b/.test(value)) return 'education';
  if (/\b(science|research|discovery|space|astronomy)\b/.test(value)) return 'science';
  if (/\b(sports?|games|athlete|basketball|volleyball|boxing)\b/.test(value)) return 'sports';
  if (/\b(culture|pageant|identity|faith|tourism|arts?|music|film|entertainment|heritage)\b/.test(value)) return 'culture';
  if (/\b(lifestyle|travel|food|relationship|fashion|home|beauty)\b/.test(value)) return 'lifestyle';
  return 'philippines';
}

function inferSegment(source = '') {
  const value = source.toLowerCase();
  if (/alam[-\s]?mo[-\s]?ba|did you know/.test(value)) return 'alam-mo-ba';
  if (/\blotto\b|pcso/.test(value)) return 'lotto';
  if (/\bhoroscope\b|zodiac/.test(value)) return 'horoscope';
  if (/fmb[-\s]?message|publisher[-\s]?message/.test(value)) return 'fmb-message';
  return '';
}

async function readOverrides() {
  try {
    const parsed = JSON.parse(await readFile(overridesPath, 'utf8'));
    return { categories: parsed.categories && typeof parsed.categories === 'object' ? parsed.categories : {}, segments: parsed.segments && typeof parsed.segments === 'object' ? parsed.segments : {} };
  } catch (error) {
    if (error?.code === 'ENOENT') return { categories: {}, segments: {} };
    throw error;
  }
}

function categoryLabel(slug) {
  const labels = { philippines: 'Philippines', world: 'World', business: 'Business', lifestyle: 'Lifestyle', technology: 'Technology', 'politics-government': 'Politics & Government', environment: 'Environment', health: 'Health', education: 'Education', science: 'Science', sports: 'Sports', culture: 'Culture', other: 'More Categories' };
  return labels[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function extractArticle(html, filePath, overrides) {
  if (!/\bnews-story-route\b/i.test(html)) return null;
  const route = canonicalRoute(html, filePath);
  if (!route) return null;
  const image = firstImage(html);
  const title = meta(html, 'og:title') || text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '') || text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = meta(html, 'og:description') || text(html.match(/<[^>]+class=(["'])[^"']*\bnc-article-deck\b[^"']*\1[^>]*>([\s\S]*?)<\//i)?.[2] ?? '') || 'Read the complete FMB News report.';
  const imageUrl = meta(html, 'og:image') || image.src;
  const imageAlt = meta(html, 'og:image:alt') || image.alt || `Editorial image for ${title}`;
  const label = meta(html, 'article:section') || text(html.match(/<[^>]+class=(["'])[^"']*\b(?:nc-kicker|nc-signal-tag)\b[^"']*\1[^>]*>([\s\S]*?)<\//i)?.[2] ?? '') || 'FMB News';
  const publishedAt = meta(html, 'article:published_time') || meta(html, 'datePublished') || jsonLdDate(html, 'datePublished') || attr(html.match(/<time\b[^>]*datetime=(["'])[^"']+\1[^>]*>/i)?.[0] ?? '', 'datetime');
  const updatedAt = meta(html, 'article:modified_time') || meta(html, 'dateModified') || jsonLdDate(html, 'dateModified') || publishedAt;
  const readTime = text(html).match(/\b\d+\s*min(?:ute)?s?\s*read\b/i)?.[0] ?? 'Read report';
  const sourceText = `${label} ${title} ${description} ${route}`;
  const explicitCategory = overrides.categories[route] || meta(html, 'article:section');
  const category = normalizeCategory(explicitCategory) || inferCategory(sourceText);
  const segment = overrides.segments[route] || inferSegment(sourceText);
  if (!title || !imageUrl) throw new Error(`Published article is missing a title or image: ${filePath}`);
  return { route, canonical: `${origin}${route}`, title: title.replace(/\s*[|·-]\s*FMB News.*$/i, '').trim(), description, image: imageUrl, imageAlt, label, category, categoryLabel: categoryLabel(category), segment, publishedAt, updatedAt, readTime };
}

const previewIndex = path.join(previewRoot, 'index.html');
await readFile(previewIndex, 'utf8');
const overrides = await readOverrides();
const files = (await walk(newsRoot)).filter((filePath) => filePath !== path.join(newsRoot, 'index.html'));
const records = [];
for (const filePath of files) {
  const record = extractArticle(await readFile(filePath, 'utf8'), filePath, overrides);
  if (record) records.push(record);
}
const unique = new Map();
for (const record of records) {
  if (unique.has(record.route)) throw new Error(`Duplicate published FMB News route: ${record.route}`);
  unique.set(record.route, record);
}
const articles = [...unique.values()].sort((left, right) => (Date.parse(right.publishedAt || '') || 0) - (Date.parse(left.publishedAt || '') || 0) || left.route.localeCompare(right.route));
if (!articles.length) throw new Error('Protected FMB News preview found no published article routes.');
const categories = {};
for (const article of articles) categories[article.category] = (categories[article.category] || 0) + 1;
const manifest = { version: 1, generatedAt: new Date().toISOString(), timezone: 'Asia/Manila', total: articles.length, preservation: { source: '/news/', articleRoutesChanged: false, articleContentChanged: false, imagesChanged: false }, categories, articles };
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Built protected FMB News preview manifest with ${articles.length} preserved article route(s) at ${path.relative(root, outputPath)}.`);
await import('./check-fmbnews-preview.mjs');
