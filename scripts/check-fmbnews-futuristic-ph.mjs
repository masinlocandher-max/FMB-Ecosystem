import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-futuristic-ph.css');
const readabilityCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-final-readability.css');
const newsPath = path.join(distRoot, 'news', 'index.html');
const fmbNewsPath = path.join(distRoot, 'fmbnews', 'index.html');
const sitemapPath = path.join(distRoot, 'sitemap.xml');

function fail(message) {
  throw new Error(`FMBNEWS FUTURISTIC CHECK: ${message}`);
}

await stat(fmbNewsPath).catch(() => fail('dist/fmbnews/index.html was not generated'));

const [newsHtml, fmbNewsHtml, css, readabilityCss, sitemap] = await Promise.all([
  readFile(newsPath, 'utf8'),
  readFile(fmbNewsPath, 'utf8'),
  readFile(sourceCssPath, 'utf8'),
  readFile(readabilityCssPath, 'utf8'),
  readFile(sitemapPath, 'utf8'),
]);

const requiredLandingMarkers = [
  'news-futuristic-ph',
  'class="nc-ph-orbit"',
  'class="nc-ph-sun"',
  'nc-ph-star-one',
  'nc-ph-star-two',
  'nc-ph-star-three',
  'data-fmbnews-futuristic-ph',
  'https://www.francinemariebautista.com/fmbnews/',
  'Latest reports',
  'Stories that deserve more than a scroll.',
  'Clear sourcing. Visible perspective. No manufactured certainty.',
];

for (const marker of requiredLandingMarkers) {
  if (!fmbNewsHtml.includes(marker)) fail(`/fmbnews is missing ${marker}`);
}

if (!newsHtml.includes('news-futuristic-ph')) fail('/news did not retain the redesigned landing content for legacy access');
if (!newsHtml.includes('<link rel="canonical" href="https://www.francinemariebautista.com/fmbnews/">')) {
  fail('/news does not canonicalize to /fmbnews');
}
if (fmbNewsHtml.includes('<link rel="stylesheet" href="/assets/css/fmbnews-futuristic-ph.css')) {
  fail('the futuristic layer must be inline so the sitewide safeguard remains the final external stylesheet');
}

const count = (source, pattern) => (source.match(pattern) || []).length;
const structures = [
  ['latest report rows', /class="nc-rundown-story"/g],
  ['news index entries', /class="nc-index-number"/g],
  ['editorial feature sections', /class="nc-context-feature"/g],
];
for (const [label, pattern] of structures) {
  const legacyCount = count(newsHtml, pattern);
  const canonicalCount = count(fmbNewsHtml, pattern);
  if (legacyCount < 1 || canonicalCount !== legacyCount) {
    fail(`${label} were not preserved (${legacyCount} legacy vs ${canonicalCount} canonical)`);
  }
}

const requiredCssMarkers = [
  '--fmbnews-blue: #0038a8',
  '--fmbnews-yellow: #fcd116',
  '--fmbnews-ink: #343b48',
  '.nc-ph-sun',
  '.nc-ph-star-one',
  'perspective: 1200px',
  'box-shadow:',
  '.news-visual img',
  'filter: none !important',
  '@media (max-width: 700px)',
  '@media (prefers-reduced-motion: reduce)',
];
for (const marker of requiredCssMarkers) {
  if (!css.includes(marker)) fail(`futuristic CSS is missing ${marker}`);
  if (!fmbNewsHtml.includes(marker)) fail(`/fmbnews did not inline the futuristic CSS marker ${marker}`);
}

const requiredReadabilityMarkers = [
  '.nc-newsroom-title .nc-hero-summary',
  'color: #46505f !important',
  '.nc-wire-track span',
  'grid-template-rows: auto auto !important',
  'aspect-ratio: 4 / 3 !important',
  'content-visibility: visible !important',
];
for (const marker of requiredReadabilityMarkers) {
  if (!readabilityCss.includes(marker)) fail(`readability CSS is missing ${marker}`);
  if (!fmbNewsHtml.includes(marker)) fail(`/fmbnews did not inline the readability marker ${marker}`);
}

if (!sitemap.includes('<loc>https://www.francinemariebautista.com/fmbnews/</loc>')) {
  fail('sitemap.xml does not expose /fmbnews');
}
if (sitemap.includes('<loc>https://www.francinemariebautista.com/news/</loc>')) {
  fail('sitemap.xml still exposes the old landing URL as a separate canonical page');
}

console.log('Verified /fmbnews canonical routing, preserved newsroom content, Philippine sun and three stars, blue-yellow depth system, readable gray surfaces, undarkened imagery, corrected hero contrast, mobile lead sizing, responsive safeguards, and launch-gate stylesheet order.');
