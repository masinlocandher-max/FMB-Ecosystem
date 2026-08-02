import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-futuristic-ph.css');
const newsRoot = path.join(distRoot, 'news');
const newsPath = path.join(newsRoot, 'index.html');
const fmbNewsPath = path.join(distRoot, 'fmbnews', 'index.html');
const sitemapPath = path.join(distRoot, 'sitemap.xml');

function fail(message) {
  throw new Error(`FMBNEWS EDITORIAL CHECK: ${message}`);
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

await stat(fmbNewsPath).catch(() => fail('dist/fmbnews/index.html was not generated'));

const [newsHtml, fmbNewsHtml, css, sitemap] = await Promise.all([
  readFile(newsPath, 'utf8'),
  readFile(fmbNewsPath, 'utf8'),
  readFile(sourceCssPath, 'utf8'),
  readFile(sitemapPath, 'utf8'),
]);

const requiredLandingMarkers = [
  'news-futuristic-ph',
  'data-fmbnews-futuristic-ph',
  'data-fmb-news-ticker',
  'data-philippine-time',
  'Asia/Manila',
  'Philippine Standard Time',
  'fmb-news-ticker-track',
  'https://www.francinemariebautista.com/fmbnews/',
  'Latest reports',
];

for (const marker of requiredLandingMarkers) {
  if (!fmbNewsHtml.includes(marker)) fail(`/fmbnews is missing ${marker}`);
}

if (!newsHtml.includes('news-futuristic-ph')) fail('/news did not retain the redesigned landing content for legacy access');
if (!newsHtml.includes('<link rel="canonical" href="https://www.francinemariebautista.com/fmbnews/">')) {
  fail('/news does not canonicalize to /fmbnews');
}
if (fmbNewsHtml.includes('<link rel="stylesheet" href="/assets/css/fmbnews-futuristic-ph.css')) {
  fail('the final editorial layer must remain inline so it loads after the shared safeguards');
}

const requiredCssMarkers = [
  '--fmbnews-purple-950: #14051f',
  '--fmbnews-purple-800: #32144f',
  '--fmbnews-gold: #c9a44d',
  '--fmbnews-ivory: #fbfaf8',
  '.fmb-news-ticker',
  '@keyframes fmb-news-ticker-move',
  '.nc-broadcast-grid',
  'grid-template-columns: minmax(0, 2fr) minmax(280px, .9fr)',
  '.news-story-route .nc-article-layout',
  '@media (max-width: 760px)',
  '@media (prefers-reduced-motion: reduce)',
];

for (const marker of requiredCssMarkers) {
  if (!css.includes(marker)) fail(`editorial CSS is missing ${marker}`);
  if (!fmbNewsHtml.includes(marker)) fail(`/fmbnews did not inline the editorial CSS marker ${marker}`);
}

const forbiddenVisualTokens = ['#0038a8', '#1266d6', '#ce1126'];
for (const token of forbiddenVisualTokens) {
  if (css.toLowerCase().includes(token)) fail(`editorial CSS still contains retired visual token ${token}`);
}

const tickerCount = (fmbNewsHtml.match(/data-fmb-news-ticker/g) || []).length;
if (tickerCount !== 1) fail(`/fmbnews must render exactly one headline ticker, found ${tickerCount}`);
if (!/class="fmb-news-ticker-group"[\s\S]*class="fmb-news-ticker-group"/i.test(fmbNewsHtml)) {
  fail('the ticker does not contain its duplicated continuous-scroll headline group');
}

let articleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === newsPath) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  articleCount += 1;
  const relative = path.relative(distRoot, filePath).replaceAll('\\', '/');
  if (!html.includes('news-futuristic-ph')) fail(`${relative} is missing the final FMB&CO. editorial class`);
  if (!html.includes('data-fmb-news-ticker')) fail(`${relative} is missing the moving headline ticker`);
  if (!html.includes('data-philippine-time')) fail(`${relative} is missing Philippine time`);
  if (!html.includes('--fmbnews-purple-950: #14051f')) fail(`${relative} did not receive the purple-gold design system`);
}

if (articleCount < 1) fail('no News report pages received the connected branch design');

if (!sitemap.includes('<loc>https://www.francinemariebautista.com/fmbnews/</loc>')) {
  fail('sitemap.xml does not expose /fmbnews');
}
if (sitemap.includes('<loc>https://www.francinemariebautista.com/news/</loc>')) {
  fail('sitemap.xml still exposes the old landing URL as a separate canonical page');
}

console.log(`Verified the FMB&CO. purple-gold News landing, moving headlines, live Philippine time, responsive editorial hierarchy and matching design across ${articleCount} report pages.`);
