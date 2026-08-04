import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

await import('./post-build-fmbnews-exact-logo-share-pht.mjs');

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const newsPath = path.join(newsRoot, 'index.html');
const fmbNewsPath = path.join(distRoot, 'fmbnews', 'index.html');
const sitemapPath = path.join(distRoot, 'sitemap.xml');
const corporateCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-corporate-recovery.css');
const builtCssPath = path.join(distRoot, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');

function fail(message) {
  throw new Error(`FMBNEWS CORPORATE CHECK: ${message}`);
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

const [newsHtml, fmbNewsHtml, corporateCss, builtCss, sitemap] = await Promise.all([
  readFile(newsPath, 'utf8'),
  readFile(fmbNewsPath, 'utf8'),
  readFile(corporateCssPath, 'utf8'),
  readFile(builtCssPath, 'utf8'),
  readFile(sitemapPath, 'utf8'),
]);

const requiredLandingMarkers = [
  'news-futuristic-ph',
  'data-fmb-news-ticker',
  'data-philippine-time',
  'Asia/Manila',
  'Philippine Standard Time',
  'fmb-news-ticker-track',
  'https://www.francinemariebautista.com/fmbnews/',
  'Latest reports',
  'fmb-sitewide-visual-fixes.css',
];

for (const marker of requiredLandingMarkers) {
  if (!fmbNewsHtml.includes(marker)) fail(`/fmbnews is missing ${marker}`);
}

if (!newsHtml.includes('news-futuristic-ph')) fail('/news did not retain the corporate landing design class');
if (!newsHtml.includes('<link rel="canonical" href="https://www.francinemariebautista.com/fmbnews/">')) {
  fail('/news does not canonicalize to /fmbnews');
}

for (const retired of ['data-fmb-news-final-styles', 'data-fmbnews-futuristic-ph']) {
  if (fmbNewsHtml.includes(retired)) fail(`/fmbnews still contains retired inline style layer ${retired}`);
}

const requiredCssMarkers = [
  '--fn-purple-950: #14051f',
  '--fn-purple-800: #32144f',
  '--fn-gold: #c8a354',
  '--fn-ivory: #fbfaf8',
  '.fmb-news-ticker',
  '@keyframes fnCorporateTicker',
  '.nc-broadcast-grid',
  'grid-template-columns: minmax(0, 1.85fr) minmax(320px, .82fr)',
  'content-visibility: auto',
  '.news-story-route .nc-article-layout',
  '@media (max-width: 760px)',
  '@media (prefers-reduced-motion: reduce)',
];

for (const marker of requiredCssMarkers) {
  if (!corporateCss.includes(marker)) fail(`corporate source CSS is missing ${marker}`);
  if (!builtCss.includes(marker)) fail(`built final stylesheet is missing ${marker}`);
}

const recoveryStart = (builtCss.match(/FMB_NEWS_CORPORATE_RECOVERY_START/g) || []).length;
const recoveryEnd = (builtCss.match(/FMB_NEWS_CORPORATE_RECOVERY_END/g) || []).length;
if (recoveryStart !== 1 || recoveryEnd !== 1) {
  fail(`built stylesheet must contain one corporate recovery block, found ${recoveryStart}/${recoveryEnd}`);
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
  if (!html.includes('news-futuristic-ph')) fail(`${relative} is missing the corporate News class`);
  if (!html.includes('data-fmb-news-ticker')) fail(`${relative} is missing the moving headline ticker`);
  if (!html.includes('data-philippine-time')) fail(`${relative} is missing Philippine time`);
  if (!html.includes('fmb-sitewide-visual-fixes.css')) fail(`${relative} is missing the final external design stylesheet`);
  if (/data-fmb-news-final-styles|data-fmbnews-futuristic-ph/i.test(html)) {
    fail(`${relative} still contains retired inline design CSS`);
  }
}

if (articleCount < 1) fail('no News report pages received the corporate design');

if (!sitemap.includes('<loc>https://www.francinemariebautista.com/fmbnews/</loc>')) {
  fail('sitemap.xml does not expose /fmbnews');
}
if (sitemap.includes('<loc>https://www.francinemariebautista.com/news/</loc>')) {
  fail('sitemap.xml still exposes the old landing URL as a separate canonical page');
}

console.log(`Verified one optimized FMB News shell, external purple-gold corporate styling, moving headlines, Philippine time, responsive hierarchy and ${articleCount} matching report pages.`);
