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

// The News Center index now contains the daily briefing plus the nine existing
// reports. Keep all ten visible so publishing a current briefing does not
// silently remove an earlier sourced story during the release build.
const indexStart = html.indexOf('<ol class="nc-index-list">');
const indexEnd = html.indexOf('</ol>', indexStart);
const indexMarkup = html.slice(indexStart, indexEnd);
const indexItems = indexMarkup.split('<li><a href="/news/').length - 1;
if (indexItems !== 10) {
  throw new Error(`SONA 2026 newsroom update: expected 10 indexed reports, found ${indexItems}`);
}

await writeFile(landingPath, html, 'utf8');
console.log('Applied the live SONA edition date and preserved the complete ten-report News Center index.');