import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const landingPath = path.join(newsRoot, 'index.html');
const fmbNewsPath = path.join(distRoot, 'fmbnews', 'index.html');
const corporateCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-corporate-recovery.css');
const builtCssPath = path.join(distRoot, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const cognitaArtworkPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'images', 'news', 'cognita-filipino-centered-education.svg');
const suppliedColorNewsLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const suppliedWhiteNewsLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const warnings = [];

function fatal(message) {
  throw new Error(`FMB News editorial integrity audit: ${message}`);
}
function warn(message) {
  warnings.push(message);
  console.warn(`FMB News visual QA: ${message}`);
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

function auditVisualShell(html, fileName) {
  for (const marker of [
    'news-channel-v4',
    'news-futuristic-ph',
    'fmb-sitewide-visual-fixes.css',
    'data-fmb-news-ticker',
    'data-philippine-time',
    'Filipino ang Mismong Balita.',
    'nc-site-header',
  ]) {
    if (!html.includes(marker)) warn(`${fileName} is missing visual marker ${marker}`);
  }

  const masthead = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] || '';
  if (!masthead.includes(suppliedColorNewsLogo)) warn(`${fileName} is missing the supplied color masthead logo`);
  if (!footer.includes(suppliedWhiteNewsLogo)) warn(`${fileName} is missing the supplied white footer logo`);
  if (/data-fmb-news-final-styles|data-fmbnews-futuristic-ph/i.test(html)) {
    warn(`${fileName} still contains a retired inline visual layer`);
  }
}

const [landing, fmbNews, corporateCss, builtCss, artwork] = await Promise.all([
  readFile(landingPath, 'utf8'),
  readFile(fmbNewsPath, 'utf8'),
  readFile(corporateCssPath, 'utf8'),
  readFile(builtCssPath, 'utf8'),
  readFile(cognitaArtworkPath, 'utf8'),
]);

for (const [html, fileName] of [[landing, 'news/index.html'], [fmbNews, 'fmbnews/index.html']]) {
  if (!/FMB News|FMB(?:&amp;|&)CO\. News|Francine Marie Bautista/i.test(html)) {
    fatal(`${fileName} has no visible publisher identity`);
  }
  if (!html.includes('Latest reports')) fatal(`${fileName} is missing the latest reports desk`);
  if (!html.includes('data-news-updated')) fatal(`${fileName} is missing the update-time hook`);
  auditVisualShell(html, fileName);

  const tickerCount = (html.match(/data-fmb-news-ticker/g) || []).length;
  if (tickerCount !== 1) warn(`${fileName} should contain one headline ticker, found ${tickerCount}`);
  const socialImageWidth = Number(html.match(/<meta property="og:image:width" content="(\d+)">/)?.[1]);
  const socialImageHeight = Number(html.match(/<meta property="og:image:height" content="(\d+)">/)?.[1]);
  if (!Number.isFinite(socialImageWidth) || socialImageWidth <= 0 || !Number.isFinite(socialImageHeight) || socialImageHeight <= 0) {
    warn(`${fileName} social image dimensions are incomplete`);
  }
}

for (const marker of [
  '--fn-purple-950: #14051f',
  '--fn-gold: #c8a354',
  '.nc-site-header',
  '.nc-rundown-panel',
  '.news-story-route .nc-story-body',
  '@media (max-width: 760px)',
]) {
  if (!corporateCss.includes(marker)) warn(`corporate source CSS is missing ${marker}`);
  if (!builtCss.includes(marker)) warn(`built external stylesheet is missing ${marker}`);
}
if (!artwork.includes('width="1536" height="864"')) warn('Cognita artwork is not 1536×864');
if (artwork.includes('data:image/')) warn('Cognita artwork still embeds a raster data URI');

let articleCount = 0;
let sourcedArticleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === landingPath) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  const relative = path.relative(distRoot, filePath).replaceAll('\\', '/');
  articleCount += 1;

  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) fatal(`${relative} has no article headline`);
  if (!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html)) {
    fatal(`${relative} has no canonical URL`);
  }
  const hasReadableBody = html.includes('nc-story-body') || html.includes('senz-article-body');
  if (!hasReadableBody) fatal(`${relative} has no readable article body`);

  const isPromotional = html.includes('senz-website-article');
  const hasVisibleSources = html.includes('nc-sources') || html.includes('nc-source-box');
  if (!isPromotional && !hasVisibleSources) fatal(`${relative} is missing visible sourcing`);
  if (hasVisibleSources) sourcedArticleCount += 1;

  if (!/FMB News|FMB(?:&amp;|&)CO\. News|Francine Marie Bautista/i.test(html)) {
    fatal(`${relative} has no publisher identity`);
  }
  auditVisualShell(html, relative);
}

if (articleCount < 1) fatal('no News report pages were audited');
console.log(`FMB News editorial integrity audit passed ${articleCount} report pages, including ${sourcedArticleCount} visibly sourced reports, with ${warnings.length} non-blocking visual warning(s).`);
