import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const homepage = path.join(dist, 'index.html');
const protectedPrefixes = ['app/', '_sites/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const yoniBookPrefix = 'app/content/books/';
const retiredRoutes = [
  '/ebooks/',
  '/music/',
  '/music.html',
  '/reading.html',
  '/womens-health.html',
  '/skin-care-makeup.html',
  '/coming-out-respect.html',
  '/men-can-cry.html',
  '/dress-with-intention.html',
];
const retiredFiles = [
  'ebooks',
  'music',
  'music.html',
  'reading.html',
  'womens-health.html',
  'skin-care-makeup.html',
  'coming-out-respect.html',
  'men-can-cry.html',
  'dress-with-intention.html',
];

function findSectionEnd(html, start) {
  const token = /<section\b|<\/section>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(html))) {
    if (match[0].toLowerCase().startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) return token.lastIndex;
  }
  return -1;
}

function removeSectionByLabel(html, labelId) {
  const pattern = new RegExp(`<section\\b[^>]*aria-labelledby=["']${labelId}["'][^>]*>`, 'i');
  const match = pattern.exec(html);
  if (!match) return html;
  const end = findSectionEnd(html, match.index);
  return end > match.index ? html.slice(0, match.index) + html.slice(end) : html;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeRetiredLinks(html) {
  let output = html;
  for (const route of retiredRoutes) {
    const escaped = escapeRegex(route);
    output = output.replace(new RegExp(`<a\\b[^>]*href=["']${escaped}(?:[?#][^"']*)?["'][^>]*>[\\s\\S]*?<\\/a>`, 'gi'), '');
  }
  return output;
}

function neutralizeYoniBookNavigation(html) {
  return removeRetiredLinks(html).replace(
    /<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi,
    (tag, before, href, after, inner) => href.startsWith('#') ? tag : inner,
  );
}

function isProtected(relative) {
  if (relative.startsWith(yoniBookPrefix)) return false;
  return protectedPrefixes.some((prefix) => relative.startsWith(prefix));
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

for (const relative of retiredFiles) {
  await rm(path.join(dist, relative), { recursive: true, force: true });
}

let html = await readFile(homepage, 'utf8');
html = removeSectionByLabel(html, 'approvedMusicTitle');
html = removeSectionByLabel(html, 'approvedBooksTitle');
html = removeRetiredLinks(html)
  .replace(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i, '')
  .replace(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i, '')
  .replace(/<nav\b[^>]*class=["'][^"']*\bmobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i, '')
  .replace('Explore verified news, projects, reading, music, and ecosystem destinations.', 'Explore verified news, projects, selected work, and ecosystem destinations.')
  .replace('Verified news, projects, reading, music, and ecosystem destinations from the official website of Francine Marie Bautista.', 'Verified news, projects, selected work, and ecosystem destinations from the official website of Francine Marie Bautista.')
  .replace('fmb-approved-library-grid fmb-approved-editorial-grid', 'fmb-approved-library-grid fmb-approved-editorial-grid fmb-approved-news-only');
await writeFile(homepage, html, 'utf8');

const allFiles = await walk(dist);
for (const file of allFiles) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (isProtected(relative)) continue;
  if (/\.html$/i.test(file)) {
    const before = await readFile(file, 'utf8');
    let after = relative.startsWith(yoniBookPrefix)
      ? neutralizeYoniBookNavigation(before)
      : removeRetiredLinks(before);
    if (!relative.startsWith(yoniBookPrefix)) {
      after = after
        .replace(/<article\b[^>]*>[\s\S]*?<h3>Reading and Music<\/h3>[\s\S]*?<\/article>/gi, '')
        .replace(/<section\b[^>]*aria-labelledby=["']approvedMusicTitle["'][^>]*>[\s\S]*?<\/section>/gi, '')
        .replace(/<section\b[^>]*aria-labelledby=["']approvedBooksTitle["'][^>]*>[\s\S]*?<\/section>/gi, '');
    }
    if (after !== before) await writeFile(file, after, 'utf8');
  }
}

for (const file of allFiles.filter((item) => /sitemap[^/]*\.xml$/i.test(item))) {
  let xml = await readFile(file, 'utf8');
  const before = xml;
  for (const route of retiredRoutes) {
    const escaped = escapeRegex(route.replace(/\/$/, ''));
    xml = xml.replace(new RegExp(`<url>[^<]*(?:<[^>]+>[^<]*)*?<loc>[^<]*${escaped}\/?[^<]*<\\/loc>[\\s\\S]*?<\\/url>`, 'gi'), '');
  }
  if (xml !== before) await writeFile(file, xml, 'utf8');
}

const violations = [];
for (const relative of retiredFiles) {
  try {
    const parent = path.dirname(path.join(dist, relative));
    const base = path.basename(relative);
    const entries = await readdir(parent);
    if (entries.includes(base)) violations.push(`retired output still exists: ${relative}`);
  } catch {}
}

for (const file of await walk(dist)) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (isProtected(relative)) continue;
  if (!/\.(?:html|xml|webmanifest)$/i.test(file)) continue;
  const content = await readFile(file, 'utf8');
  for (const route of retiredRoutes) {
    if (new RegExp(`href=["']${escapeRegex(route)}(?:[?#][^"']*)?["']`, 'i').test(content)) {
      violations.push(`${relative} still links to ${route}`);
    }
    if (/\.xml$/i.test(file) && content.includes(route)) {
      violations.push(`${relative} still publishes ${route}`);
    }
  }
}

const finalHome = await readFile(homepage, 'utf8');
if (/approvedMusicTitle|Music Library/i.test(finalHome)) violations.push('Music Library remains on homepage');
if (/approvedBooksTitle|eBook Library/i.test(finalHome)) violations.push('eBook Library remains on homepage');
if (/class=["'][^"']*\bsite-header\b/i.test(finalHome)) violations.push('legacy duplicate header remains');
if (/class=["'][^"']*\bsite-footer\b/i.test(finalHome)) violations.push('legacy duplicate footer remains');
if (/class=["'][^"']*\bmobile-dock\b/i.test(finalHome)) violations.push('legacy mobile dock remains');
if (!/class=["'][^"']*\bfmb-shell-header\b/i.test(finalHome)) violations.push('unified header is missing');
if (!/class=["'][^"']*\bfmb-shell-footer\b/i.test(finalHome)) violations.push('unified footer is missing');
if (!/href=["']\/news\/["']/i.test(finalHome)) violations.push('FMB News link is missing');
if (!/href=["']\/work-with-fmb\/["']/i.test(finalHome)) violations.push('Work with FMB link is missing');

if (violations.length) {
  throw new Error(`FMB public Reading/Music hard deletion failed:\n${violations.join('\n')}`);
}

console.log('FMB public Reading/Music hard deletion passed: retired routes removed, public links and sitemaps scrubbed before audits, one landing shell retained, and Yoni book content preserved without obsolete public navigation.');
