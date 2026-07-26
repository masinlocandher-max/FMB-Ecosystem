import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const cognitaArtworkPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'images', 'news', 'cognita-filipino-centered-education.svg');

function fail(message) {
  throw new Error(`FMB Newsroom final audit: ${message}`);
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function assertStylesheetOrder(html, fileName, required) {
  let previous = -1;
  for (const marker of required) {
    const position = html.indexOf(marker);
    if (position < 0) fail(`${fileName} is missing ${marker}`);
    if (position <= previous) fail(`${fileName} loads ${marker} out of order`);
    previous = position;
  }
}

const landing = await readFile(landingPath, 'utf8');
if (!landing.includes('THE NEWSROOM')) fail('landing page is missing the text masthead');
if (!landing.includes('data-news-edition')) fail('landing page is missing its live edition date hook');
if (!landing.includes('data-news-updated')) fail('landing page is missing its live update date hook');
if (landing.includes('Sunday edition · 26 July 2026')) fail('landing page still hardcodes the edition date');
if (landing.includes('<time>Updated 26 July 2026</time>')) fail('landing page still hardcodes the update date');
if (!landing.includes('fmb-news-identity-record')) fail('landing page is missing the non-rendered identity record');
if (/<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp/i.test(landing)) fail('landing page visibly renders the retired News logo');
if (!landing.includes('og:image:width" content="800"') || !landing.includes('og:image:height" content="533"')) fail('landing page social image dimensions are incomplete');
assertStylesheetOrder(landing, 'news/index.html', ['fmb-sitewide-visual-fixes.css', 'news-center-v2.css', 'fmb-news-polish-v3.css', 'fmb-news-masthead-v3.css']);

const artwork = await readFile(cognitaArtworkPath, 'utf8');
if (!artwork.includes('width="1536" height="864"')) fail('Cognita artwork is not 1536×864');
if (artwork.includes('data:image/')) fail('Cognita artwork still embeds a low-resolution raster');
if (!artwork.includes('/assets/images/fmb-approved/francine-portrait-front.webp')) fail('Cognita artwork does not use the approved portrait');

let articleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === landingPath) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  const relative = path.relative(path.join(repositoryRoot, 'dist'), filePath).replaceAll('\\', '/');
  articleCount += 1;
  if (!html.includes('newsroom-polish-v3')) fail(`${relative} is missing the final Newsroom body class`);
  if (!html.includes('THE NEWSROOM')) fail(`${relative} is missing the text-led masthead`);
  if (/<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp/i.test(html)) fail(`${relative} visibly renders the retired News logo`);
  assertStylesheetOrder(html, relative, ['fmb-sitewide-visual-fixes.css', 'fmb-news-polish-v3.css', 'fmb-news-masthead-v3.css']);

  if (relative.includes('filipino-centered-training-institution-cognita-vision')) {
    if (!html.includes('og:image:width" content="1536"') || !html.includes('og:image:height" content="864"')) fail('Cognita article metadata is not 1536×864');
    if (!html.includes('width="1536" height="864"')) fail('Cognita article image dimensions are not 1536×864');
  }
}

if (articleCount < 1) fail('no News article pages were audited');
console.log(`FMB Newsroom final audit verified the landing page, ${articleCount} article pages, live date hooks, stylesheet order, retired-logo removal, and HD Cognita artwork.`);
