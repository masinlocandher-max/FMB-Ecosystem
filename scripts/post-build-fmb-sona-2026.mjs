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

// Preserve the complete News Center index as new sourced reports are added.
// The guard checks integrity without imposing a fixed ceiling on future editions.
const indexStart = html.indexOf('<ol class="nc-index-list">');
const indexEnd = html.indexOf('</ol>', indexStart);
if (indexStart < 0 || indexEnd < 0) {
  throw new Error('SONA 2026 newsroom update: report index is missing or incomplete');
}
const indexMarkup = html.slice(indexStart, indexEnd);
const indexedReports = [...indexMarkup.matchAll(/<li><a href="(\/news\/[^"]+\/)"/g)].map(([, href]) => href);
if (indexedReports.length < 10) {
  throw new Error(`SONA 2026 newsroom update: expected at least 10 indexed reports, found ${indexedReports.length}`);
}
if (new Set(indexedReports).size !== indexedReports.length) {
  throw new Error('SONA 2026 newsroom update: duplicate report links found in the index');
}
if (!indexedReports.includes('/news/todays-headlines-august-2-2026/')) {
  throw new Error('SONA 2026 newsroom update: August 2 daily briefing is missing from the index');
}

await writeFile(landingPath, html, 'utf8');
console.log(`Applied the live SONA edition date and preserved ${indexedReports.length} unique News Center reports.`);