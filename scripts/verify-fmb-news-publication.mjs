import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const articleRoot = path.join(root, 'apps', 'withlovefmb', 'content', 'news', 'articles');
const fallback = '/assets/images/news/fmb-news-editorial-fallback.svg';

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

async function walk(dir, predicate) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target, predicate));
    else if (entry.isFile() && predicate(target)) out.push(target);
  }
  return out;
}

const htmlFiles = await walk(newsRoot, file => path.basename(file) === 'index.html');
if (!htmlFiles.length) throw new Error('FMB News publication QA: no /dist/news/**/index.html files found.');

const failures = [];
const warnings = [];
let articlePages = 0;

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(dist, file).replaceAll(path.sep, '/');
  const fail = message => failures.push(`${rel}: ${message}`);

  if (!/<body[^>]*class=["'][^"']*fmb-ref/i.test(html)) fail('missing canonical fmb-ref publication body');
  if (count(html, 'class="brand-wordmark') < 2) fail('header/footer do not both use the canonical typographic FMB News wordmark');
  if (!html.includes('<span class="brand-fmb">FMB</span><span class="brand-news">News</span>')) fail('wordmark is not FMB bold + News regular markup');
  if (/fmb-news-official-transparent\.webp|fmb-news-logo-white-supplied\.webp|class=["']footer-logo["']/i.test(html)) fail('legacy image-logo dependency remains');

  if (count(html, 'class="headline-ticker"') !== 1) fail('must contain exactly one moving-headline rail');
  if (!html.includes('class="ticker-clock"')) fail('missing fixed PHT clock beside ticker');
  if (!html.includes('class="ticker-window"')) fail('missing independent moving-headline window');
  const tickerBlock = html.match(/<div class="headline-ticker"[\s\S]*?<\/div><\/div><\/div>/i)?.[0] || '';
  if (/<time\b/i.test(tickerBlock)) fail('headline rail contains per-story time; only the fixed live PHT clock is allowed');

  for (const required of ['/news/">Latest', '/news/fmb-brief/">FMB Brief', '/news/archive/">Archive', '/news/about/">About', 'Submit a Story']) {
    if (!html.includes(required)) fail(`canonical navigation missing ${required.replace(/<[^>]+>/g, '')}`);
  }

  if (!html.includes('data-fmb-newsletter-form')) fail('newsletter signup missing');
  if (!html.includes('class="footer-socials"')) fail('verified newsroom social/contact icons missing');
  if (!html.includes('/assets/css/fmb-news-reference-final.css')) fail('final corporate broadcast stylesheet missing');

  if (html.includes('class="article-shell"')) {
    articlePages += 1;
    if (!html.includes('class="article-grid"')) fail('article layout grid missing');
    if (!html.includes('class="article-figure"')) fail('article hero/figure missing');
    if (!html.includes('class="related"')) fail('related reports rail missing');
    if (!/Why this matters/i.test(html)) fail('Why this matters editorial lens missing');
    if (!/What to watch next/i.test(html)) fail('What to watch next editorial lens missing');
    if (!/class=["']sources["']/i.test(html)) fail('sources section missing');
  }
}

const homePath = path.join(newsRoot, 'index.html');
if (await exists(homePath)) {
  const home = await readFile(homePath, 'utf8');
  if (!home.includes('class="home-hero"')) failures.push('news/index.html: homepage hero missing');
  if (!home.includes('class="brief-promo"')) failures.push('news/index.html: FMB Brief promotion missing');
  if (home.includes(fallback)) failures.push('news/index.html: generic editorial fallback is visible on the current homepage');
  if (!/Philippine flag at Rizal Park in Manila/i.test(home)) failures.push('news/index.html: approved civic Philippine hero image treatment is missing');
}

const jsonFiles = await walk(articleRoot, file => file.endsWith('.json'));
const published = [];
for (const file of jsonFiles) {
  try {
    const story = JSON.parse(await readFile(file, 'utf8'));
    if (story.status === 'published' && story.slug && story.headline && story.publishedAt) published.push(story);
  } catch {}
}
published.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

for (const story of published.slice(0, 12)) {
  const url = String(story?.image?.url || '').trim();
  if (!url || url === fallback) failures.push(`content/news: current story "${story.headline}" does not have story-specific imagery`);
  if (url.startsWith('/') && !url.startsWith('//') && !(await exists(path.join(dist, url.slice(1))))) {
    failures.push(`content/news: current story "${story.headline}" references missing local image ${url}`);
  }
  if (!String(story?.image?.alt || '').trim()) failures.push(`content/news: current story "${story.headline}" is missing image alt text`);
  if (!String(story?.image?.credit || story?.image?.creator || '').trim()) warnings.push(`current story "${story.headline}" has no explicit image credit/creator`);
}

const briefDirs = (await readdir(newsRoot, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && /^fmb-brief-/.test(entry.name));
if (!briefDirs.length) failures.push('FMB Brief: no dated editions found');

if (warnings.length) {
  console.warn(`FMB News publication QA warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  throw new Error(`FMB News publication QA failed (${failures.length}):\n${failures.map(item => `- ${item}`).join('\n')}`);
}

console.log(`FMB News publication QA passed: ${htmlFiles.length} newsroom routes, ${articlePages} article pages, ${Math.min(12, published.length)} current-story image checks, typographic identity, fixed PHT clock + independent headline ticker, canonical navigation/footer, newsletter, and article editorial structure verified.`);
