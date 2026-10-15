/* Dedicated build gate for the Miss Intercontinental application microsite.
 *
 * The sitewide unified-design gate deliberately skips this route (see
 * scripts/lib/standalone-microsites.mjs), so it needs its own contract. This
 * script asserts the opposite of the unified gate: the page must be complete,
 * fully self-hosted, and free of the FMB corporate shell.
 *
 * Exits non-zero on any failure so the release build stops.
 */

import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const root = path.join(dist, 'MissIntercontinental');
const failures = [];
const fail = (message) => failures.push(message);

const exists = async (file, minBytes = 1) => {
  try {
    const info = await stat(file);
    return info.isFile() && info.size >= minBytes;
  } catch {
    return false;
  }
};

/* ---------------------------------------------------------- required files */

const indexFile = path.join(root, 'index.html');
if (!await exists(indexFile, 2000)) {
  fail('MissIntercontinental/index.html is missing or too small');
  console.error('Miss Intercontinental gate: cannot continue without index.html');
  for (const message of failures) console.error(` - ${message}`);
  process.exit(1);
}

if (!await exists(path.join(root, 'app.css'), 2000)) fail('MissIntercontinental/app.css is missing or too small');
if (!await exists(path.join(root, 'app.js'), 500)) fail('MissIntercontinental/app.js is missing or too small');

const html = await readFile(indexFile, 'utf8');

/* ------------------------------------------------- corporate shell absence */

const forbidden = [
  ['fmb-shell-header', 'FMB corporate header'],
  ['fmb-shell-footer', 'FMB corporate footer'],
  ['fmb-shell-rail', 'FMB ecosystem rail'],
  ['fmb-shell-nav', 'FMB ecosystem navigation'],
  ['fmb-unified-public', 'FMB unified body class'],
  ['fmb-unified-system.css', 'FMB unified stylesheet'],
  ['fmb-unified-system.js', 'FMB unified script'],
  ['fmb-sitewide-visual-fixes.css', 'FMB sitewide visual fixes'],
  ['FMB&amp;CO.', 'FMB&CO. corporate branding'],
  ['FMB&CO.', 'FMB&CO. corporate branding'],
  ['Explore the ecosystem', 'ecosystem cross-promotion'],
  ['Work with FMB', 'corporate CTA'],
  ['/work-with-fmb/', 'corporate CTA link'],
  ['yoni.francinemariebautista.com', 'Yoni cross-link'],
  ['Open Yoni', 'Yoni cross-link'],
];
for (const [needle, label] of forbidden) {
  if (html.includes(needle)) fail(`corporate shell leaked into the microsite: ${label} ("${needle}")`);
}

/* Sibling brands must not appear. Checked case-insensitively on word
   boundaries so ordinary copy is not caught by accident. */
for (const brand of ['SENZ', 'Cognita', 'Yoni']) {
  if (new RegExp(`\\b${brand}\\b`, 'i').test(html)) fail(`sibling brand "${brand}" appears on the microsite`);
}

/* ------------------------------------------------------------- positioning */

const lower = html.toLowerCase();
if (!lower.includes('work with the miss intercontinental organization')) {
  fail('page no longer states that she is applying to WORK WITH the organization');
}
for (const phrase of ['applying as a delegate', 'applying as a contestant', 'compete as a delegate', 'my candidacy']) {
  if (lower.includes(phrase)) fail(`copy suggests a delegate application: "${phrase}"`);
}
if (!lower.includes('not commissioned by')) {
  fail('creative studies are missing the uncommissioned / non-affiliation disclaimer');
}
if (!html.includes('name="robots" content="noindex,nofollow"')) fail('noindex,nofollow was removed');
if (!html.includes('https://www.francinemariebautista.com/MissIntercontinental')) fail('canonical URL is missing or wrong');

/* --------------------------------------------------- every local reference */

const refs = [...html.matchAll(/(?:src|href)="(\/MissIntercontinental\/[^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(refs)];
if (unique.length < 20) fail(`expected the full asset set to be referenced, found only ${unique.length} local references`);

for (const ref of unique) {
  const file = path.join(dist, ref.replace(/^\//, ''));
  if (!await exists(file)) fail(`referenced asset does not resolve in dist: ${ref}`);
}

/* No production media may be pulled from a third-party host. */
for (const match of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) {
  const url = match[1];
  if (/raw\.githubusercontent\.com|github\.com|googleusercontent\.com|drive\.google\.com/.test(url)) {
    fail(`critical media is referenced remotely instead of locally: ${url}`);
  }
}

/* ----------------------------------------------------- galleries and audio */

const imgDir = path.join(root, 'assets/img');
let images = [];
try {
  images = (await readdir(imgDir)).filter((name) => name.endsWith('.webp'));
} catch {
  fail('MissIntercontinental/assets/img is missing');
}
if (images.length < 25) fail(`expected the full visual set, found ${images.length} images in assets/img`);

for (const group of ['study-pride', 'study-queen', 'study-pubmat', 'study-sash', 'study-crown']) {
  if (!images.some((name) => name.startsWith(group))) fail(`visual portfolio is missing the "${group}" category`);
}
for (const required of ['portrait-front.webp', 'portrait-angle.webp', 'pageant-ms-gay-zambales.webp', 'speaking-01.webp', 'wordmark.webp']) {
  if (!images.includes(required)) fail(`required photograph is missing: ${required}`);
}

const audio = path.join(root, 'assets/audio/opening-music.mp3');
if (!await exists(audio, 10000)) fail('opening music is missing from assets/audio/opening-music.mp3');
if (!html.includes('assets/audio/opening-music.mp3')) fail('opening music is not referenced by the page');
if (/<audio[^>]*\bautoplay\b/.test(html)) fail('audio is set to autoplay, which breaks on iOS Safari and traps the visitor');

/* --------------------------------------------------------------- anchors */

const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]).filter((id) => id !== 'top');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
for (const anchor of [...new Set(anchors)]) {
  if (!ids.has(anchor)) fail(`navigation anchor #${anchor} has no matching element`);
}

/* ------------------------------------------------- mobile-critical markup */

if (!html.includes('viewport-fit=cover')) fail('viewport meta is missing viewport-fit=cover for iPhone safe areas');
if (!html.includes('class="dock"')) fail('mobile dock navigation is missing');

const css = await exists(path.join(root, 'app.css')) ? await readFile(path.join(root, 'app.css'), 'utf8') : '';
if (!css.includes('env(safe-area-inset-bottom)')) fail('stylesheet does not handle the iPhone safe area');
if (!css.includes('prefers-reduced-motion')) fail('stylesheet does not honour prefers-reduced-motion');

/* ---------------------------------------------------------------- report */

if (failures.length) {
  console.error(`Miss Intercontinental gate: ${failures.length} problem(s)`);
  for (const message of failures) console.error(` - ${message}`);
  process.exit(1);
}

console.log(`Miss Intercontinental gate: passed (${unique.length} local references, ${images.length} images, audio present, no corporate shell).`);
