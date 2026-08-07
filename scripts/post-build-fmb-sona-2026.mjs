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
  console.warn('SONA 2026 newsroom update: legacy date hook is absent; the final feed renderer will supply it.');
}

// Protect the legacy News Center index when it is present. The current feed
// renderer rebuilds this index at the end of the release pipeline, so an older
// layout must not stop the build simply because these hooks are no longer used.
const indexStart = html.indexOf('<ol class="nc-index-list">');
const indexEnd = html.indexOf('</ol>', indexStart);
let indexHrefs = [];

if (indexStart >= 0 && indexEnd >= 0) {
  const indexMarkup = html.slice(indexStart, indexEnd);
  indexHrefs = [...indexMarkup.matchAll(/<li><a href="(\/news\/[^\"]+\/)"/g)]
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
} else {
  console.warn('SONA 2026 newsroom update: legacy report index is absent; the final feed renderer will rebuild it.');
}

await writeFile(landingPath, html, 'utf8');
console.log(indexHrefs.length
  ? `Applied the live SONA edition date and preserved the complete ${indexHrefs.length}-report News Center index.`
  : 'Preserved SONA compatibility for the final FMB News feed renderer.');
