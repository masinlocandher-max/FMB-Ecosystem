import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const landingPath = path.join(repositoryRoot, 'dist', 'news', 'index.html');

let html = await readFile(landingPath, 'utf8');
const datedMarkup = '<time>Updated 27 July 2026</time>';
const liveMarkup = '<time data-news-updated>Updated today</time>';
const goodNewsIndexItem = '<li><a href="/news/good-news/"><span class="nc-index-number">09</span><span class="nc-index-category">Constructive reporting</span><strong>Three reasons for credible hope</strong><span class="nc-index-action">Progress without pretending that difficult realities have disappeared.</span></a></li>';

if (html.includes(datedMarkup)) {
  html = html.replace(datedMarkup, liveMarkup);
}

// The approved News Center index holds eight reports. Good News remains fully
// visible in its dedicated sourced feature while the SONA analysis enters the
// index as the current public-affairs report.
if (html.includes(goodNewsIndexItem)) {
  html = html.replace(goodNewsIndexItem, '');
}

if (!html.includes('data-news-updated')) {
  throw new Error('SONA 2026 newsroom update: live update date hook is missing');
}

const indexStart = html.indexOf('<ol class="nc-index-list">');
const indexEnd = html.indexOf('</ol>', indexStart);
const indexMarkup = html.slice(indexStart, indexEnd);
const indexItems = indexMarkup.split('<li><a href="/news/').length - 1;
if (indexItems !== 8) {
  throw new Error(`SONA 2026 newsroom update: expected 8 indexed reports, found ${indexItems}`);
}

await writeFile(landingPath, html, 'utf8');
console.log('Applied the live SONA edition date and preserved the approved eight-report News Center index.');
