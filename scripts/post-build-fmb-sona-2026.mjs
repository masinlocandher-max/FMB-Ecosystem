import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const landingPath = path.join(repositoryRoot, 'dist', 'news', 'index.html');

let html = await readFile(landingPath, 'utf8');
const datedMarkup = '<time>Updated 27 July 2026</time>';
const liveMarkup = '<time data-news-updated>Updated today</time>';

if (html.includes(datedMarkup)) {
  html = html.replace(datedMarkup, liveMarkup);
  await writeFile(landingPath, html, 'utf8');
}

if (!html.includes('data-news-updated')) {
  throw new Error('SONA 2026 newsroom update: live update date hook is missing');
}

console.log('Applied the live News Center update date for the 27 July 2026 SONA edition.');
