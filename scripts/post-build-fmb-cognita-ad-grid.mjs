import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
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
  ['cognita-brand-banner', 'assets/images/cognita/ads/cognita-brand-banner.webp'],
];
const encodedAssetRoot = path.join(repositoryRoot, 'scripts', 'assets', 'cognita');
const encodedPartNames = await readdir(encodedAssetRoot);

for (const [prefix, targetRelative] of encodedAssets) {
  const parts = encodedPartNames
    .filter((name) => name.startsWith(`${prefix}.part`))
    .sort();
  if (!parts.length) throw new Error(`Cognita advertisement source parts are missing: ${prefix}`);
  const encoded = (await Promise.all(parts.map((name) => readFile(path.join(encodedAssetRoot, name), 'utf8'))))
    .join('')
    .trim();
  const binary = Buffer.from(encoded, 'base64');
  if (binary.length < 500) {
    throw new Error(`Cognita advertisement asset is missing or incomplete: ${prefix}`);
  }
  const targetFile = path.join(distRoot, targetRelative);
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
      <img class="fmb-cognita-ad-media" src="/assets/images/cognita/ads/cognita-brand-banner.webp" width="900" height="450" loading="eager" decoding="async" alt="Cognita Institute of AI: Empowering minds, building the future">
    </a>
    <a class="fmb-cognita-ad fmb-cognita-ad-poster enrollment" href="https://thecognitainstitute.com/" rel="noopener" aria-label="Cognita enrollment opening soon">
      <img class="fmb-cognita-poster-logo" src="/assets/images/projects/cognita-logo-clean.png" width="1359" height="491" loading="lazy" decoding="async" alt="Cognita Institute of AI">
      <div class="fmb-cognita-poster-copy">
        <h3>Enrollment<br><em>Opening Soon!</em></h3>
        <svg class="fmb-cognita-poster-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 8v10M46 8v10M10 24h44M14 14h36a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4Z"/><path d="M20 32h8v8h-8zm16 0h8v8h-8zM20 44h8v8h-8z"/></svg>
        <p>The future belongs to those who learn today. Prepare with future-ready skills for tomorrow’s opportunities.</p>
        <span class="fmb-cognita-poster-cta">Stay tuned</span>
      </div>
      <div class="fmb-cognita-poster-features"><span>AI-Powered Learning</span><span>Practical Skills</span><span>Future-Ready Careers</span><span>Innovate Every Day</span></div>
    </a>
    <a class="fmb-cognita-ad fmb-cognita-ad-poster course-rate" href="https://thecognitainstitute.com/" rel="noopener" aria-label="Cognita courses at 1,500 pesos per course">
      <img class="fmb-cognita-poster-logo" src="/assets/images/projects/cognita-logo-clean.png" width="1359" height="491" loading="lazy" decoding="async" alt="Cognita Institute of AI">
      <div class="fmb-cognita-poster-copy">
        <h3>Quality Education.<br><em>Affordable for Every Learner.</em></h3>
        <div class="fmb-cognita-price"><small>₱</small><strong>1,500</strong><span>Rate per course</span></div>
      </div>
      <div class="fmb-cognita-poster-features"><span>Expert-Led Courses</span><span>Hands-On Learning</span><span>Industry-Ready Skills</span><span>Affordable Excellence</span></div>
    </a>
  </div>
</section>`;

let home = await readFile(homeFile, 'utf8');
home = removeExistingGrid(removeHeroStack(home));

if (!home.includes('fmb-cognita-ad-grid.css')) {
  const sitewideStylesheet = /<link\b[^>]*href=(["'])\/assets\/css\/fmb-sitewide-visual-fixes\.css[^"']*\1[^>]*>/i;
  if (sitewideStylesheet.test(home)) {
    home = home.replace(sitewideStylesheet, `${stylesheet}\n$&`);
  } else {
    home = home.replace('</head>', `${stylesheet}\n</head>`);
  }
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
]) {
  if (!home.includes(required)) throw new Error(`Cognita advertisement grid is missing: ${required}`);
}

console.log('Removed the homepage time, ecosystem and quote card stack, then installed the responsive Cognita advertisement grid directly below the hero.');
