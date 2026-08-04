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
const officialNewsLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const visibleOfficialLogo = /<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp/i;
const visibleRetiredLogo = /<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official\.svg/i;

function fail(message) {
  throw new Error(`FMB News Center final audit: ${message}`);
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

// The official supplied raster identity is permitted only inside the final masthead lockup.
function assertApprovedMastheadLogo(html, fileName) {
  if (visibleRetiredLogo.test(html)) fail(`${fileName} visibly renders the retired SVG News logo`);

  const masthead = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn12-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (!masthead.includes('data-fmb-news-logo') || !masthead.includes(`src="${officialNewsLogo}"`)) {
    fail(`${fileName} is missing the approved official FMB News masthead logo`);
  }

  if (!visibleOfficialLogo.test(masthead)) fail(`${fileName} does not visibly render the official FMB News logo in its masthead`);
  const outsideMasthead = html.replace(masthead, '');
  if (visibleOfficialLogo.test(outsideMasthead)) fail(`${fileName} renders the official FMB News logo outside the approved masthead lockup`);
}

function assertOptimizedPage(html, fileName) {
  if (!html.includes('news-channel-v4')) fail(`${fileName} is missing the News channel class`);
  if (!html.includes('news-futuristic-ph')) fail(`${fileName} is missing the corporate editorial class`);
  if (!html.includes('fmb-sitewide-visual-fixes.css')) fail(`${fileName} is missing the final external stylesheet`);
  if (html.includes('data-fmb-news-final-styles')) fail(`${fileName} still contains the retired compiled inline layer`);
  if (html.includes('data-fmbnews-futuristic-ph')) fail(`${fileName} still contains the retired futuristic inline layer`);
  assertApprovedMastheadLogo(html, fileName);
  if (!html.includes('data-fmb-news-ticker')) fail(`${fileName} is missing the single headline ticker`);
  if (!html.includes('data-philippine-time')) fail(`${fileName} is missing live Philippine time`);
  if (!html.includes('Filipino ang Mismong Balita.')) fail(`${fileName} is missing the approved Filipino tagline`);
  if (!html.includes('nc-site-header')) fail(`${fileName} is missing the publication masthead`);
}

const [landing, fmbNews, corporateCss, builtCss, artwork] = await Promise.all([
  readFile(landingPath, 'utf8'),
  readFile(fmbNewsPath, 'utf8'),
  readFile(corporateCssPath, 'utf8'),
  readFile(builtCssPath, 'utf8'),
  readFile(cognitaArtworkPath, 'utf8'),
]);

assertOptimizedPage(landing, 'news/index.html');
assertOptimizedPage(fmbNews, 'fmbnews/index.html');

for (const [html, fileName] of [[landing, 'news/index.html'], [fmbNews, 'fmbnews/index.html']]) {
  const tickerCount = (html.match(/data-fmb-news-ticker/g) || []).length;
  if (tickerCount !== 1) fail(`${fileName} must contain exactly one headline ticker, found ${tickerCount}`);
  if (!html.includes('Latest reports')) fail(`${fileName} is missing the latest reports desk`);
  if (!html.includes('data-news-updated')) fail(`${fileName} is missing the update-time hook`);
  const socialImageWidth = Number(html.match(/<meta property="og:image:width" content="(\d+)">/)?.[1]);
  const socialImageHeight = Number(html.match(/<meta property="og:image:height" content="(\d+)">/)?.[1]);
  if (!Number.isFinite(socialImageWidth) || socialImageWidth <= 0 || !Number.isFinite(socialImageHeight) || socialImageHeight <= 0) {
    fail(`${fileName} social image dimensions are incomplete`);
  }
}

const cssMarkers = [
  '--fn-purple-950: #14051f',
  '--fn-gold: #c8a354',
  '.nc-site-header',
  'content-visibility: auto',
  '.nc-lead-broadcast',
  '.nc-rundown-panel',
  '.nc-index-list li:first-child',
  '.news-story-route .nc-article-hero',
  '.news-story-route .nc-story-body',
  '@media (max-width: 760px)',
  '@media (prefers-reduced-motion: reduce)',
];

for (const marker of cssMarkers) {
  if (!corporateCss.includes(marker)) fail(`corporate source CSS is missing ${marker}`);
  if (!builtCss.includes(marker)) fail(`built external stylesheet is missing ${marker}`);
}

if ((builtCss.match(/FMB_NEWS_CORPORATE_RECOVERY_START/g) || []).length !== 1) {
  fail('the built external stylesheet must contain exactly one corporate recovery start marker');
}
if ((builtCss.match(/FMB_NEWS_CORPORATE_RECOVERY_END/g) || []).length !== 1) {
  fail('the built external stylesheet must contain exactly one corporate recovery end marker');
}

if (!artwork.includes('width="1536" height="864"')) fail('Cognita artwork is not 1536×864');
if (artwork.includes('data:image/')) fail('Cognita artwork still embeds a low-resolution raster');
if (!artwork.includes('/assets/images/fmb-approved/francine-portrait-front.webp')) fail('Cognita artwork does not use the approved portrait');

let articleCount = 0;
let promotionalArticleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === landingPath) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  const relative = path.relative(distRoot, filePath).replaceAll('\\', '/');
  articleCount += 1;
  assertOptimizedPage(html, relative);

  const isSenzPromotionalArticle = html.includes('senz-website-article');
  if (isSenzPromotionalArticle) {
    promotionalArticleCount += 1;
    if (!html.includes('senz-article-hero')) fail(`${relative} is missing its SENZ article headline surface`);
    if (!html.includes('senz-article-body')) fail(`${relative} is missing its SENZ article body`);
  } else {
    if (!html.includes('nc-article-hero')) fail(`${relative} is missing the article headline surface`);
    if (!html.includes('nc-story-body')) fail(`${relative} is missing the readable article body`);
    if (!html.includes('nc-sources') && !html.includes('nc-source-box')) fail(`${relative} is missing visible sourcing`);
  }

  if (relative.includes('filipino-centered-training-institution-cognita-vision')) {
    if (!html.includes('og:image:width" content="1536"') || !html.includes('og:image:height" content="864"')) {
      fail('Cognita article metadata is not 1536×864');
    }
    if (!html.includes('width="1536" height="864"')) fail('Cognita article image dimensions are not 1536×864');
  }
}

if (articleCount < 1) fail('no News report pages were audited');
console.log(`FMB News Center final audit verified one optimized corporate shell, the approved official masthead logo, purple-gold visual authority, ${articleCount} report pages (${promotionalArticleCount} labeled SENZ feature), responsive layouts, source visibility, live Philippine time, retired-layer removal and HD Cognita artwork.`);
