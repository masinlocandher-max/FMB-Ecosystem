import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const landingPath = path.join(repositoryRoot, 'dist', 'news', 'index.html');

let html = await readFile(landingPath, 'utf8');
const datedMarkup = '<time>Updated 27 July 2026</time>';
const liveMarkup = '<time data-news-updated>Updated today</time>';

if (html.includes(datedMarkup)) {
  html = html.replace(datedMarkup, liveMarkup);
}

if (!html.includes('data-news-updated')) {
  throw new Error('SONA 2026 newsroom update: live update date hook is missing');
}

// Protect the complete News Center index without freezing it at an obsolete
// story count. New sourced reports may increase the total, but the current
// briefing and SONA analysis must remain present and every route must be unique.
const indexStart = html.indexOf('<ol class="nc-index-list">');
const indexEnd = html.indexOf('</ol>', indexStart);
if (indexStart < 0 || indexEnd < 0) {
  throw new Error('SONA 2026 newsroom update: complete report index is missing');
}

const indexMarkup = html.slice(indexStart, indexEnd);
const indexHrefs = [...indexMarkup.matchAll(/<li><a href="(\/news\/[^"]+\/)"/g)]
  .map(match => match[1]);
if (indexHrefs.length < 10) {
  throw new Error(`SONA 2026 newsroom update: expected at least 10 indexed reports, found ${indexHrefs.length}`);
}
if (new Set(indexHrefs).size !== indexHrefs.length) {
  throw new Error('SONA 2026 newsroom update: duplicate indexed report routes found');
}

for (const requiredHref of [
  '/news/todays-headlines-august-2-2026/',
  '/news/pbbm-sona-2026-accountability-delivery/',
]) {
  if (!indexHrefs.includes(requiredHref)) {
    throw new Error(`SONA 2026 newsroom update: required report is missing: ${requiredHref}`);
  }
}

await writeFile(landingPath, html, 'utf8');
console.log(`Applied the live SONA edition date and preserved the complete ${indexHrefs.length}-report News Center index.`);
