import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const sourceShell = path.join(root, 'apps', 'withlovefmb', 'fmbnews', 'index.html');
const fmbNewsLanding = path.join(dist, 'fmbnews', 'index.html');
const newsLanding = path.join(newsRoot, 'index.html');
const manifestPath = path.join(dist, 'assets', 'data', 'fmbnews-editorial-manifest.json');
const hdDirectory = path.join(dist, 'assets', 'images', 'news', 'editorial-hd');
const logo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const cssHref = '/assets/css/fmbnews-editorial.css?v=20260805a';
const articleJs = '/assets/js/fmbnews-article.js?v=20260805a';

const CATEGORY_LABELS = {
  philippines: 'Philippines',
  world: 'World',
  business: 'Business',
  lifestyle: 'Lifestyle',
  politics: 'Politics and Government',
  weather: 'Weather',
  technology: 'Technology',
  health: 'Health',
  sports: 'Sports',
  education: 'Education',
  environment: 'Environment',
  culture: 'Culture and Local',
};

const cleanText = (value = '') => String(value)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

const attribute = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<meta\\b[^>]*(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escaped}["'][^>]*>`, 'i'));
  return cleanText(match?.[1] || match?.[2] || '');
};

const firstMatch = (html, patterns) => {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }
  return '';
};

const absoluteToLocal = (value = '') => value
  .replace(/^https?:\/\/(?:www\.)?francinemariebautista\.com/i, '')
  .replace(/^https?:\/\/francinemariebautista\.com/i, '');

const normalizeSection = (value = '') => cleanText(value).toLowerCase();

function classify(section, title, keywords = '') {
  const text = normalizeSection(`${section} ${title} ${keywords}`);
  if (/world|international|global|china|united states|united nations|middle east|asean/.test(text)) return 'world';
  if (/business|economy|economic|market|finance|peso|bank|investment|tax|trade|jobs/.test(text)) return 'business';
  if (/weather|typhoon|storm|pagasa|rain|flood|heat index|low pressure/.test(text)) return 'weather';
  if (/technology|artificial intelligence|\bai\b|digital|cyber|internet|data center/.test(text)) return 'technology';
  if (/health|medical|hospital|disease|mental health|wellness/.test(text)) return 'health';
  if (/education|school|student|teacher|training|learning|cognita/.test(text)) return 'education';
  if (/environment|water|climate|landfill|waste|forest|marine|energy/.test(text)) return 'environment';
  if (/sports|boxing|basketball|volleyball|athlete|tournament|pageant/.test(text)) return 'sports';
  if (/culture|heritage|identity|history|language|arts|entertainment|lifestyle|tourism/.test(text)) return /lifestyle|entertainment|tourism/.test(text) ? 'lifestyle' : 'culture';
  if (/politics|government|president|senate|congress|sona|impeachment|election|public affairs/.test(text)) return 'politics';
  return 'philippines';
}

function jsonLdValues(html) {
  const values = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const current = queue.shift();
        if (!current || typeof current !== 'object') continue;
        values.push(current);
        if (Array.isArray(current['@graph'])) queue.push(...current['@graph']);
      }
    } catch {
      // Older reports may contain non-strict JSON-LD. Metadata fallbacks remain available.
    }
  }
  return values;
}

function textFingerprint(html) {
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || html;
  return createHash('sha256').update(cleanText(main)).digest('hex');
}

async function walkArticles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkArticles(absolute));
    else if (entry.isFile() && entry.name === 'index.html' && absolute !== newsLanding) files.push(absolute);
  }
  return files;
}

function removeEditorialShell(html) {
  return html
    .replace(/<header\b[^>]*data-fmbnews-editorial-shell[^>]*>[\s\S]*?<\/header>\s*/gi, '')
    .replace(/<div\b[^>]*data-fmbn-article-scrim[^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<aside\b[^>]*data-fmbn-article-drawer[^>]*>[\s\S]*?<\/aside>\s*/gi, '')
    .replace(/<footer\b[^>]*data-fmbnews-editorial-footer[^>]*>[\s\S]*?<\/footer>\s*/gi, '')
    .replace(/<link\b[^>]*href=["']\/assets\/css\/fmbnews-editorial\.css(?:\?[^"']*)?["'][^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=["']\/assets\/js\/fmbnews-article\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>\s*/gi, '');
}

function addBodyClass(html) {
  return html.replace(/<body\b([^>]*)>/i, (full, attributes) => {
    if (/\bclass=["']/.test(attributes)) {
      return `<body${attributes.replace(/class=(["'])([^"']*)\1/i, (match, quote, classes) => `class=${quote}${classes.includes('fmbn-editorial-article') ? classes : `${classes} fmbn-editorial-article`}${quote}`)}>`;
    }
    return `<body${attributes} class="fmbn-editorial-article">`;
  });
}

const primaryLinks = `
  <a href="/fmbnews/">Home</a>
  <a href="/fmbnews/?view=alam-mo-ba">Alam Mo Ba?</a>
  <a href="/fmbnews/?view=lotto">Lotto</a>
  <a href="/fmbnews/?view=horoscope">Horoscope</a>
  <a href="/fmbnews/?view=about">About</a>
  <a href="/fmbnews/?view=fmb-message">FMB Message</a>
  <a href="/fmbnews/?view=submit">Submit Your Story</a>`;

const articleHeader = `<header class="fmbn-article-header" data-fmbnews-editorial-shell>
  <div class="fmbn-article-top">
    <a class="fmbn-article-logo" href="/fmbnews/" aria-label="FMB News home"><img src="${logo}" width="909" height="210" alt="FMB News"></a>
    <nav class="fmbn-article-nav" aria-label="FMB News navigation">${primaryLinks}</nav>
    <time class="fmbn-article-time" data-fmbn-article-time>Philippine Standard Time</time>
    <button class="fmbn-article-menu" type="button" data-fmbn-article-menu-open aria-label="Open menu" aria-controls="fmbnArticleDrawer" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
  </div>
  <div class="fmbn-article-wire"><div class="fmbn-article-wire-track" data-fmbn-article-wire><span>Loading the latest FMB News reports</span></div></div>
</header>
<div class="fmbn-drawer-scrim" data-fmbn-article-scrim aria-hidden="true"></div>
<aside class="fmbn-drawer" id="fmbnArticleDrawer" data-fmbn-article-drawer aria-label="FMB News menu" aria-hidden="true" inert>
  <div class="fmbn-drawer-head"><a href="/fmbnews/" aria-label="FMB News home"><span class="fmbn-drawer-logo"><img src="${logo}" width="909" height="210" alt="FMB News"></span></a><button type="button" data-fmbn-article-menu-close aria-label="Close menu"></button></div>
  <nav class="fmbn-drawer-nav" aria-label="FMB News mobile navigation">${primaryLinks}<a href="/fmbnews/?archive=all">News Archives</a></nav>
  <p class="fmbn-drawer-note">Clear reporting. Responsible context. Why it matters to us Filipinos.</p>
</aside>`;

const articleFooter = `<footer class="fmbn-article-footer" data-fmbnews-editorial-footer>
  <span><img src="${logo}" width="909" height="210" alt="FMB News"></span>
  <p>Clearer, sharper reporting made for Filipinos.</p>
  <nav aria-label="FMB News footer navigation"><a href="/fmbnews/">Home</a><a href="/fmbnews/?archive=all">Archives</a><a href="/fmbnews/?view=submit">Submit Your Story</a></nav>
</footer>`;

function injectArticleShell(html) {
  let next = removeEditorialShell(html);
  next = next.replace('</head>', `<link rel="stylesheet" href="${cssHref}">\n</head>`);
  next = addBodyClass(next);
  next = next.replace(/<body\b[^>]*>/i, (match) => `${match}\n${articleHeader}`);
  next = next.replace('</body>', `${articleFooter}\n<script src="${articleJs}" defer></script>\n</body>`);
  return next;
}

async function upgradeImage(article, html, slug) {
  const local = absoluteToLocal(article.image);
  if (!local.startsWith('/assets/') || /\.svg(?:\?|$)/i.test(local)) return { article, html, upgraded: false };
  const source = path.join(dist, local.replace(/^\//, '').split('?')[0]);
  try {
    const metadata = await sharp(source).metadata();
    const width = Number(metadata.width) || article.imageWidth || 0;
    const height = Number(metadata.height) || article.imageHeight || 0;
    if (width >= 1200 && height >= 675) return { article: { ...article, image: local, imageWidth: width, imageHeight: height }, html, upgraded: false };
    await mkdir(hdDirectory, { recursive: true });
    const output = path.join(hdDirectory, `${slug}.webp`);
    await sharp(source).rotate().resize(1600, 900, { fit: 'cover', position: 'attention', withoutEnlargement: false }).webp({ quality: 88 }).toFile(output);
    const upgradedPath = `/assets/images/news/editorial-hd/${slug}.webp`;
    const escaped = local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updatedHtml = html.replace(new RegExp(`src=(["'])${escaped}\\1`, 'i'), `src="${upgradedPath}"`);
    return { article: { ...article, image: upgradedPath, imageWidth: 1600, imageHeight: 900, originalImage: local }, html: updatedHtml, upgraded: true };
  } catch {
    return { article: { ...article, image: local }, html, upgraded: false };
  }
}

function landingHtml(source, canonical) {
  return source
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}">`);
}

await mkdir(path.dirname(manifestPath), { recursive: true });
await mkdir(path.dirname(fmbNewsLanding), { recursive: true });
const shell = await readFile(sourceShell, 'utf8');
if (!shell.includes('fmbn-editorial-app') || !shell.includes(logo)) throw new Error('The FMB News editorial source shell is missing its publication identity.');

const articleFiles = await walkArticles(newsRoot);
const routesBefore = [];
const articles = [];
let upgradedImages = 0;

for (const filePath of articleFiles) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/i.test(html)) continue;
  const relativeDirectory = path.relative(newsRoot, path.dirname(filePath)).replaceAll(path.sep, '/');
  const route = `/news/${relativeDirectory}/`.replace('/./', '/');
  const slug = route.split('/').filter(Boolean).pop() || `story-${articles.length + 1}`;
  const beforeTextHash = textFingerprint(html);
  routesBefore.push(route);
  const ld = jsonLdValues(html);
  const newsLd = ld.find((item) => /NewsArticle|Article|Report/i.test(String(item['@type'] || ''))) || {};
  const title = attribute(html, 'og:title') || firstMatch(html, [/<main\b[^>]*>[\s\S]*?<h1\b[^>]*>([\s\S]*?)<\/h1>/i, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i, /<title>([\s\S]*?)<\/title>/i]);
  const description = attribute(html, 'description') || attribute(html, 'og:description') || cleanText(newsLd.description || '');
  const publishedAt = attribute(html, 'article:published_time') || cleanText(newsLd.datePublished || '') || firstMatch(html, [/<time\b[^>]*datetime=["']([^"']+)["']/i]);
  const section = cleanText(newsLd.articleSection || attribute(html, 'article:section') || firstMatch(html, [/<p\b[^>]*class=["'][^"']*(?:kicker|category|section)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i]));
  const keywords = Array.isArray(newsLd.keywords) ? newsLd.keywords.join(', ') : cleanText(newsLd.keywords || attribute(html, 'keywords'));
  const category = classify(section, title, keywords);
  const image = absoluteToLocal(attribute(html, 'og:image') || cleanText(Array.isArray(newsLd.image) ? newsLd.image[0] : newsLd.image?.url || newsLd.image || '') || firstMatch(html, [/<main\b[^>]*>[\s\S]*?<img\b[^>]*src=["']([^"']+)["']/i, /<img\b[^>]*src=["']([^"']+)["']/i]));
  const imageAlt = attribute(html, 'og:image:alt') || firstMatch(html, [/<main\b[^>]*>[\s\S]*?<img\b[^>]*alt=["']([^"']*)["']/i, /<img\b[^>]*alt=["']([^"']*)["']/i]) || title;
  const imageWidth = Number(attribute(html, 'og:image:width')) || Number(firstMatch(html, [/<img\b[^>]*width=["']?(\d+)/i])) || 0;
  const imageHeight = Number(attribute(html, 'og:image:height')) || Number(firstMatch(html, [/<img\b[^>]*height=["']?(\d+)/i])) || 0;
  const readTime = firstMatch(html, [/(\d+\s+minute\s+read)/i, /(\d+\s+min\s+read)/i]);
  let article = { route, slug, title: title || slug.replaceAll('-', ' '), description, publishedAt, section, category, categoryLabel: CATEGORY_LABELS[category], keywords, image: image || logo, imageAlt, imageWidth, imageHeight, readTime };
  const upgraded = await upgradeImage(article, html, slug);
  article = upgraded.article;
  html = upgraded.html;
  if (upgraded.upgraded) upgradedImages += 1;
  html = injectArticleShell(html);
  const afterTextHash = textFingerprint(html);
  if (beforeTextHash !== afterTextHash) throw new Error(`The article text changed during the FMB News shell upgrade: ${route}`);
  await writeFile(filePath, html, 'utf8');
  articles.push(article);
}

const routesAfter = articles.map((article) => article.route).sort();
if (routesBefore.sort().join('\n') !== routesAfter.join('\n')) throw new Error('A published FMB News route was deleted or duplicated during the editorial rebuild.');
if (!articles.length) throw new Error('No published FMB News articles were discovered.');
articles.sort((a, b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0));
const manifest = {
  generatedAt: new Date().toISOString(),
  timeZone: 'Asia/Manila',
  total: articles.length,
  categories: Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label, total: articles.filter((article) => article.category === key).length })),
  preservation: { routesPreserved: true, articleTextPreserved: true, originalImagesRetained: true, hdDisplayImagesGenerated: upgradedImages },
  articles,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
await writeFile(fmbNewsLanding, landingHtml(shell, 'https://www.francinemariebautista.com/fmbnews/'), 'utf8');
await writeFile(newsLanding, landingHtml(shell, 'https://www.francinemariebautista.com/news/'), 'utf8');
console.log(`Built the FMB News editorial publication with ${articles.length} preserved article routes and ${upgradedImages} HD display-image upgrade(s).`);
