import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const sourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb');
const distRoot = path.join(repositoryRoot, 'dist');
const homeFile = path.join(distRoot, 'index.html');

const cssSource = path.join(sourceRoot, 'assets', 'css', 'fmb-cognita-ad-grid.css');
const cssTarget = path.join(distRoot, 'assets', 'css', 'fmb-cognita-ad-grid.css');
const cssInfo = await stat(cssSource);
if (!cssInfo.isFile() || cssInfo.size < 500) {
  throw new Error('Cognita advertisement stylesheet is missing or incomplete.');
}
await mkdir(path.dirname(cssTarget), { recursive: true });
await copyFile(cssSource, cssTarget);

const encodedAssets = [
  ['scripts/assets/cognita/cognita-brand-banner.webp.b64', 'assets/images/cognita/ads/cognita-brand-banner.webp'],
  ['scripts/assets/cognita/cognita-enrollment-opening.webp.b64', 'assets/images/cognita/ads/cognita-enrollment-opening.webp'],
  ['scripts/assets/cognita/cognita-course-rate.webp.b64', 'assets/images/cognita/ads/cognita-course-rate.webp'],
];

for (const [sourceRelative, targetRelative] of encodedAssets) {
  const sourceFile = path.join(repositoryRoot, sourceRelative);
  const targetFile = path.join(distRoot, targetRelative);
  const encoded = (await readFile(sourceFile, 'utf8')).trim();
  const binary = Buffer.from(encoded, 'base64');
  if (binary.length < 500) {
    throw new Error(`Cognita advertisement asset is missing or incomplete: ${sourceRelative}`);
  }
  await mkdir(path.dirname(targetFile), { recursive: true });
  await writeFile(targetFile, binary);
}

function findSectionEnd(html, start) {
  const token = /<section\b|<\/section>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(html))) {
    if (match[0].toLowerCase().startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) return token.lastIndex;
  }
  return -1;
}

function removeHeroStack(html) {
  return html.replace(
    /\s*<aside\b[^>]*class=(['"])[^'"]*\bfmb-approved-hero-stack\b[^'"]*\1[^>]*>[\s\S]*?<\/aside>\s*/i,
    '\n'
  );
}

function removeExistingGrid(html) {
  const marker = /<section\b[^>]*id=(['"])cognita-advertisements\1[^>]*>/i.exec(html);
  if (!marker) return html;
  const end = findSectionEnd(html, marker.index);
  if (end < 0) throw new Error('Existing Cognita advertisement grid is not balanced.');
  return `${html.slice(0, marker.index)}${html.slice(end)}`;
}

const stylesheet = '<link rel="stylesheet" href="/assets/css/fmb-cognita-ad-grid.css?v=20260803-cognita-grid-v1">';
const adGrid = `<section class="fmb-cognita-ad-showcase" id="cognita-advertisements" aria-labelledby="cognitaAdsTitle">
  <header class="fmb-cognita-ad-head">
    <div>
      <small>FMB&amp;CO. Learning</small>
      <h2 id="cognitaAdsTitle">Cognita Institute of AI</h2>
      <p>Practical AI education designed for future-ready thinkers, creators, and problem solvers.</p>
    </div>
    <a href="https://thecognitainstitute.com/" rel="noopener">Visit Cognita <span aria-hidden="true">→</span></a>
  </header>
  <div class="fmb-cognita-ad-grid" aria-label="Cognita advertisements">
    <a class="fmb-cognita-ad fmb-cognita-ad-wide" href="https://thecognitainstitute.com/" rel="noopener" aria-label="Discover Cognita Institute of AI">
      <img src="/assets/images/cognita/ads/cognita-brand-banner.webp" width="1200" height="600" loading="eager" decoding="async" alt="Cognita Institute of AI: Empowering minds, building the future">
    </a>
    <a class="fmb-cognita-ad" href="https://thecognitainstitute.com/" rel="noopener" aria-label="Cognita enrollment opening soon">
      <img src="/assets/images/cognita/ads/cognita-enrollment-opening.webp" width="850" height="850" loading="lazy" decoding="async" alt="Cognita Institute of AI enrollment opening soon">
    </a>
    <a class="fmb-cognita-ad" href="https://thecognitainstitute.com/" rel="noopener" aria-label="Cognita courses at 1,500 pesos per course">
      <img src="/assets/images/cognita/ads/cognita-course-rate.webp" width="850" height="850" loading="lazy" decoding="async" alt="Cognita Institute of AI rate of 1,500 pesos per course">
    </a>
  </div>
</section>`;

let home = await readFile(homeFile, 'utf8');
home = removeExistingGrid(removeHeroStack(home));

if (!home.includes('fmb-cognita-ad-grid.css')) {
  home = home.replace('</head>', `${stylesheet}\n</head>`);
}

const heroStart = /<section\b[^>]*class=(['"])[^'"]*\bhero\b[^'"]*\1[^>]*>/i.exec(home)?.index ?? -1;
if (heroStart < 0) throw new Error('Homepage hero section is missing.');
const heroEnd = findSectionEnd(home, heroStart);
if (heroEnd < 0) throw new Error('Homepage hero section is not balanced.');
home = `${home.slice(0, heroEnd)}\n${adGrid}\n${home.slice(heroEnd)}`;

await writeFile(homeFile, home, 'utf8');

for (const forbidden of ['fmb-approved-hero-stack', 'fmb-approved-time', 'fmb-approved-ecosystem', 'fmb-approved-quote']) {
  if (home.includes(forbidden)) throw new Error(`Retired homepage card remains: ${forbidden}`);
}
for (const required of [
  'id="cognita-advertisements"',
  'class="fmb-cognita-ad-grid"',
  '/assets/images/cognita/ads/cognita-brand-banner.webp',
  '/assets/images/cognita/ads/cognita-enrollment-opening.webp',
  '/assets/images/cognita/ads/cognita-course-rate.webp',
]) {
  if (!home.includes(required)) throw new Error(`Cognita advertisement grid is missing: ${required}`);
}

console.log('Removed the homepage time, ecosystem and quote card stack, then installed the responsive Cognita advertisement grid directly below the hero.');
