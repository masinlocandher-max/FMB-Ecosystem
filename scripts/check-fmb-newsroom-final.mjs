import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('../dist/', import.meta.url).pathname);
const newsRoot = path.join(root, 'news');
const newsroom = await readFile(path.join(root, 'fmbnews', 'index.html'), 'utf8');
const about = await readFile(path.join(root, 'fmbnews', 'about', 'index.html'), 'utf8');
const canonicalLanding = await readFile(path.join(newsRoot, 'index.html'), 'utf8');
const morningArchive = await readFile(path.join(newsRoot, 'morning-special', 'index.html'), 'utf8');
const genericVisual = /(?:newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;
const nonEditorialCompatibilityPages = new Set(['news/why-websites-cost-and-how-senz-makes-them-accessible/index.html', 'news/filipino-centered-training-institution-cognita-vision/index.html']);
const retired = /fmb-shell-header|fmb-shell-footer|fmb-news-livebar|fmb-news-channel-command|fmb-v2-news-command/;
const fatal = (message) => { throw new Error(`FMB News clean publication audit: ${message}`); };
const count = (html, token) => (html.match(new RegExp(token, 'g')) || []).length;

function imageSources(html) {
  const out = [];
  for (const match of String(html || '').matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const tag = match[0];
    for (const name of ['src', 'srcset']) {
      const value = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] || '';
      for (const candidate of value.split(',').map((part) => part.trim().split(/\s+/)[0]).filter(Boolean)) out.push(candidate);
    }
  }
  return out;
}

function genuineAttachedImage(html) {
  return imageSources(html).some((value) => {
    try {
      const parsed = new URL(value, 'https://www.francinemariebautista.com');
      return parsed.origin === 'https://www.francinemariebautista.com' && parsed.pathname.startsWith('/assets/') && !genericVisual.test(parsed.pathname);
    } catch { return false; }
  });
}

function hasGenericImageDelivery(html) { return imageSources(html).some((value) => genericVisual.test(value)); }

async function assertImagesExist(html, name) {
  for (const value of imageSources(html)) {
    let parsed;
    try { parsed = new URL(value, 'https://www.francinemariebautista.com'); } catch { continue; }
    if (parsed.origin !== 'https://www.francinemariebautista.com' || !parsed.pathname.startsWith('/assets/')) continue;
    try { await access(path.join(root, parsed.pathname.replace(/^\/+/, ''))); } catch { fatal(`${name} references a missing image file: ${parsed.pathname}`); }
  }
}

function auditStoryCollection(html, name) {
  if (hasGenericImageDelivery(html)) fatal(`${name} exposes generic editorial artwork`);
  for (const match of html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)) {
    if (!/href=(["'])\/news\/[^"'#?]+\/\1/i.test(match[0])) continue;
    if (!genuineAttachedImage(match[0])) fatal(`${name} lists a report without a genuine attached image`);
  }
}

function auditLanding(html, name) {
  if (!html.includes('fmb-news-clean') || !html.includes('fmb-news-landing')) fatal(`${name} is not using the redesigned publication system`);
  if (count(html, 'class="mast"') !== 1) fatal(`${name} must contain exactly one newsroom masthead`);
  if (count(html, 'class="footer"') !== 1) fatal(`${name} must contain exactly one newsroom footer`);
  if (retired.test(html)) fatal(`${name} still contains a retired corporate or newsroom shell`);
  if (!html.includes('<meta name="viewport"')) fatal(`${name} is missing its mobile viewport`);
  if (!html.includes('Latest News') || !html.includes('More Reports')) fatal(`${name} is missing the latest-news desk`);
  if (!html.includes('The news that matters.') || !html.includes('Made clear for Filipinos.')) fatal(`${name} is missing the approved newsroom positioning`);
  for (const destination of ['/news/morning-special/', '/news/archive/', '/news/about/']) if (!html.includes(`href="${destination}"`)) fatal(`${name} is missing navigation to ${destination}`);
  if (!html.includes('@media(max-width:900px)') || !html.includes('@media(max-width:560px)')) fatal(`${name} is missing responsive mobile layouts`);
  if (!html.includes('lead-grid') || !html.includes('story-card')) fatal(`${name} is missing the editorial lead and report grid`);
  const editorial = html.replace(/<header\b[\s\S]*?<\/header>/gi, '').replace(/<footer\b[\s\S]*?<\/footer>/gi, '');
  if (hasGenericImageDelivery(editorial)) fatal(`${name} contains generic editorial artwork`);
  let cards = 0;
  for (const match of html.matchAll(/<article\b[^>]*class=(["'])[^"']*\b(?:lead-card|story-card)\b[^"']*\1[^>]*>[\s\S]*?<\/article>/gi)) {
    cards++;
    if (!genuineAttachedImage(match[0])) fatal(`${name} lists a report card without a genuine attached image`);
  }
  if (cards < 1) fatal(`${name} does not expose any image-backed reports`);
  if (!/loading="eager"[^>]*fetchpriority="high"/i.test(html)) fatal(`${name} does not prioritize a first-paint editorial image`);
}

auditLanding(newsroom, 'fmbnews/index.html');
auditLanding(canonicalLanding, 'news/index.html');
await assertImagesExist(newsroom, 'fmbnews/index.html');
await assertImagesExist(canonicalLanding, 'news/index.html');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(file);
  }
  return out;
}

let articles = 0;
let sourceWarnings = 0;
for (const file of await walk(newsRoot)) {
  if (file === path.join(newsRoot, 'index.html') || file === path.join(newsRoot, 'about', 'index.html') || file.startsWith(path.join(newsRoot, 'morning-special'))) continue;
  const html = await readFile(file, 'utf8');
  if (/http-equiv=(["'])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(["'])robots\1[^>]*content=(["'])[^"']*noindex/i.test(html)) continue;
  if (!html.includes('news-story-route')) continue;
  const name = path.relative(root, file).replaceAll(path.sep, '/');
  if (nonEditorialCompatibilityPages.has(name)) continue;
  const route = '/' + name.replace(/index\.html$/, '');
  if (!newsroom.includes(`href="${route}"`) && !canonicalLanding.includes(`href="${route}"`)) continue;
  articles++;
  if (!html.includes('fmb-news-clean')) fatal(`${name} is not using the clean article shell`);
  if (count(html, 'class="fnc-header"') !== 1 || count(html, 'class="fnc-footer"') !== 1) fatal(`${name} has duplicate or missing publication chrome`);
  if (retired.test(html)) fatal(`${name} still contains a retired shell`);
  if (!/<main\b[^>]*>[\s\S]{300,}<\/main>/i.test(html)) fatal(`${name} has no substantial readable article content`);
  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) fatal(`${name} has no article headline`);
  if (!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html)) fatal(`${name} has no canonical URL`);
  const editorialMedia = html.match(/<section\b[^>]*class=(["'])[^"']*\bnc-story-media\b[^"']*\1[^>]*>[\s\S]*?<\/section>/i)?.[0] || '';
  if (!genuineAttachedImage(editorialMedia)) fatal(`${name} has no genuine attached editorial image`);
  if (!html.includes('/assets/images/news/fmb-news-primary-logo-2026.webp')) fatal(`${name} is missing the supplied FMB News identity`);
  if (!/nc-sources|nc-source-box|class=(["'])[^"']*\bsources\b[^"']*\1|Sources and (?:public record|documents)|Source:/i.test(html)) sourceWarnings++;
  await assertImagesExist(html, name);
}
if (articles < 1) fatal('no standard article pages were audited');

auditStoryCollection(await readFile(path.join(newsRoot, 'archive', 'index.html'), 'utf8'), 'news/archive/index.html');
if (hasGenericImageDelivery(morningArchive)) fatal('Morning Special archive exposes generic editorial artwork');
if (!morningArchive.includes('Today &amp; Archive') || !morningArchive.includes('one continuous magazine-style article')) fatal('Morning Special archive does not explain the complete-edition format');

const expectedEditions = ['2026-08-14', '2026-08-13'];
for (const date of expectedEditions) {
  const route = `/news/morning-special/${date}/`;
  if (!morningArchive.includes(`href="${route}"`)) fatal(`Morning Special archive is missing ${date}`);
  if (!canonicalLanding.includes(`href="${route}"`) && date === expectedEditions[0]) fatal(`news/index.html is missing today's Morning Special`);
  const file = path.join(newsRoot, 'morning-special', date, 'index.html');
  const html = await readFile(file, 'utf8');
  const name = `news/morning-special/${date}/index.html`;
  if (count(html, 'class="morning-edition"') !== 1) fatal(`${name} must contain exactly one complete magazine article`);
  if (!html.includes(`data-edition-date="${date}"`)) fatal(`${name} has the wrong edition date`);
  if (count(html, 'class="chapter"') !== 3) fatal(`${name} must contain exactly three magazine chapters`);
  if (count(html, 'class="sources"') !== 3) fatal(`${name} must expose sources for every chapter`);
  if (count(html, 'class="chapter-figure"') !== 2 || count(html, 'class="edition-hero"') !== 1) fatal(`${name} must expose one hero and two chapter images`);
  if (!/<main\b[^>]*>[\s\S]{5000,}<\/main>/i.test(html)) fatal(`${name} is not a full long-form edition`);
  if (!html.includes('<nav class="toc"') || !html.includes('3 chapters · One complete edition')) fatal(`${name} is missing magazine navigation or edition framing`);
  if (hasGenericImageDelivery(html)) fatal(`${name} contains generic fallback artwork`);
  if (!genuineAttachedImage(html)) fatal(`${name} has no genuine attached images`);
  if (!/loading="eager"[^>]*fetchpriority="high"/i.test(html)) fatal(`${name} does not prioritize its hero image`);
  if (count(html, 'class="figcaption"') !== 3) fatal(`${name} is missing visible image captions and credits`);
  if (!html.includes(`rel="canonical" href="https://www.francinemariebautista.com${route}"`)) fatal(`${name} has the wrong canonical URL`);
  await assertImagesExist(html, name);
}
await assertImagesExist(morningArchive, 'news/morning-special/index.html');

for (const marker of ['Our mission', 'Our vision', 'What happened?', 'What is the context?', 'Why does it matter to Filipinos?', 'What should readers watch next?', 'Evidence first', 'Context always']) if (!about.includes(marker)) fatal(`fmbnews/about/index.html is missing ${marker}`);

console.log(`FMB News audit passed ${articles} standard articles plus complete August 13 and August 14 Morning Special magazine editions, with real local images, visible credits and mobile-first layouts.`);
