import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(new URL('../dist/', import.meta.url).pathname);
const origin = 'https://www.francinemariebautista.com';
const roots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const fatal = (message) => { throw new Error(`FMB News unified publication audit: ${message}`); };
const failures = [];

async function walk(directory) {
  const files = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes:true }); }
  catch (error) { if (error?.code === 'ENOENT') return files; throw error; }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile() && entry.name === 'index.html') files.push(target);
  }
  return files;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] || '';
}

function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, 'property') || attr(tag, 'name')).toLowerCase() === key.toLowerCase()) return attr(tag, 'content');
  }
  return '';
}

function isRedirect(html) {
  return /http-equiv=(['"])refresh\1/i.test(html) || /\bnoindex\b/i.test(meta(html, 'robots'));
}

function canonicalPath(html, file) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (attr(tag, 'rel').toLowerCase() !== 'canonical') continue;
    try { return new URL(attr(tag, 'href'), origin).pathname; } catch {}
  }
  return `/${path.relative(dist, path.dirname(file)).replaceAll(path.sep, '/')}/`.replace(/\/+/g, '/');
}

function images(html) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => ({
    src: attr(match[0], 'src'),
    alt: attr(match[0], 'alt'),
    hasAlt: /\balt\s*=\s*(["'])/i.test(match[0]),
  })).filter((item) => item.src);
}

async function assertLocalImagesExist(html, relative) {
  for (const image of images(html)) {
    let parsed;
    try { parsed = new URL(image.src, origin); } catch { continue; }
    if (parsed.origin !== origin || !parsed.pathname.startsWith('/assets/')) continue;
    try { await access(path.join(dist, parsed.pathname.replace(/^\/+/, ''))); }
    catch { failures.push(`${relative}: missing local image ${parsed.pathname}`); }
  }
}

const files = [...new Set((await Promise.all(roots.map(walk))).flat())].sort();
if (!files.length) fatal('no generated /news or /fmbnews pages found');

let audited = 0;
let redirects = 0;
let articles = 0;
let briefs = 0;
const canonicalSeen = new Map();

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (isRedirect(html)) { redirects += 1; continue; }
  audited += 1;
  const pathname = canonicalPath(html, file);
  const canonicalKey = pathname.replace(/\/+$/, '/') || '/';
  if (canonicalSeen.has(canonicalKey) && !relative.startsWith('fmbnews/')) failures.push(`${relative}: duplicate canonical route also emitted by ${canonicalSeen.get(canonicalKey)}`);
  else canonicalSeen.set(canonicalKey, relative);

  if (!html.includes('fmb-publication')) failures.push(`${relative}: unified publication body class missing`);
  if (!html.includes('fmb-news-consistency.css')) failures.push(`${relative}: final consistency stylesheet missing`);
  if (!html.includes('fmbnews-clean-v1.css')) failures.push(`${relative}: clean publication stylesheet missing`);
  if (!html.includes('fmb-news-identity-lockup.css')) failures.push(`${relative}: FMB News identity lockup missing`);
  if (/FMB News Center|FMB(?:&|&amp;)CO\. News/i.test(html)) failures.push(`${relative}: retired newsroom identity remains`);
  if (/Morning Special/i.test(html)) failures.push(`${relative}: retired Morning Special branding remains`);
  if (/href=(['"])\/(?:news|fmbnews)\/morning-special\//i.test(html)) failures.push(`${relative}: retired Morning Special link remains`);
  if (!/<title>[\s\S]*?<\/title>/i.test(html)) failures.push(`${relative}: title missing`);

  const isBrief = pathname === '/news/fmb-brief/' || /^\/news\/fmb-brief-[^/]+\/$/.test(pathname);
  const isArticle = meta(html, 'og:type').toLowerCase() === 'article' || /\bnews-story-route\b|\bnews-article\b/i.test(html) || (isBrief && pathname !== '/news/fmb-brief/');
  if (isBrief) briefs += 1;
  if (isArticle) articles += 1;

  if (pathname !== '/news/about/' && pathname !== '/fmbnews/about/' && !/<main\b/i.test(html)) failures.push(`${relative}: main landmark missing`);
  if (isArticle) {
    if (!/<h1\b/i.test(html)) failures.push(`${relative}: article headline missing`);
    const pageImages = images(html);
    if (!pageImages.length) failures.push(`${relative}: article image missing`);
    if (pageImages.some((item) => !item.hasAlt)) failures.push(`${relative}: image alt attribute missing`);
    if (!meta(html, 'og:image')) failures.push(`${relative}: Open Graph image missing`);
    if (!meta(html, 'twitter:card')) failures.push(`${relative}: Twitter card metadata missing`);
  }
  if (isBrief && pathname !== '/news/fmb-brief/') {
    if (!html.includes('brief-credit')) failures.push(`${relative}: visible FMB Brief photo credit missing`);
    if (!meta(html, 'article:published_time')) failures.push(`${relative}: FMB Brief publication time missing`);
  }
  await assertLocalImagesExist(html, relative);
}

const briefArchiveFile = path.join(dist, 'news', 'fmb-brief', 'index.html');
let briefArchive = '';
try { briefArchive = await readFile(briefArchiveFile, 'utf8'); }
catch { failures.push('news/fmb-brief/index.html: visible FMB Brief archive missing'); }
for (let day = 11; day <= 20; day += 1) {
  const route = `/news/fmb-brief-august-${day}-2026/`;
  if (!briefArchive.includes(`href="${route}"`)) failures.push(`news/fmb-brief/index.html: August ${day} edition missing from visible archive`);
}

if (failures.length) fatal(`failed ${failures.length} check(s):\n${failures.join('\n')}`);
console.log(`FMB News unified publication audit passed ${audited} public page(s), including ${articles} article/edition page(s) and ${briefs} FMB Brief route(s); ${redirects} legacy redirect page(s) were intentionally exempted.`);
