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
  throw new Error('FMB campaign showcase stylesheet is missing or incomplete.');
}
await mkdir(path.dirname(cssTarget), { recursive: true });
await copyFile(cssSource, cssTarget);

/* Preserve the exact supplied Cognita landscape pubmat already stored in the repository. */
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
  if (binary.length < 500) throw new Error(`Cognita advertisement asset is incomplete: ${prefix}`);
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

function removeSectionById(html, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const marker = new RegExp(`<section\\b[^>]*id=(['"])${escapedId}\\1[^>]*>`, 'i').exec(html);
  if (!marker) return html;
  const end = findSectionEnd(html, marker.index);
  if (end < 0) throw new Error(`Homepage section is not balanced: ${id}`);
  return `${html.slice(0, marker.index)}${html.slice(end)}`;
}

const cognitaEnrollment = 'https://cdn.shopify.com/s/files/1/0989/1912/1191/files/cognita-enrollment-opening-soon.webp?v=1785715847';
const cognitaRate = 'https://cdn.shopify.com/s/files/1/0989/1912/1191/files/cognita-rate-per-course.webp?v=1785715858';
const senzBanner = 'https://cdn.shopify.com/s/files/1/0989/1912/1191/files/senz-influence-through-clarity-banner.jpg?v=1785715790';
const senzAssistant = 'https://cdn.shopify.com/s/files/1/0989/1912/1191/files/senz-digital-assistant.jpg?v=1785715812';
const senzSpace = 'https://cdn.shopify.com/s/files/1/0989/1912/1191/files/senz-digital-space-rental.jpg?v=1785715824';
const senzWebsite = 'https://cdn.shopify.com/s/files/1/0989/1912/1191/files/senz-professional-website-solutions.jpg?v=1785715836';

const stylesheet = '<link rel="stylesheet" href="/assets/css/fmb-cognita-ad-grid.css?v=20260803-exact-pubmats-v2">';
const campaignShowcase = `<section class="fmb-brand-campaigns" id="featured-campaigns" aria-label="Featured FMB and Company campaigns">
  <section class="fmb-campaign fmb-campaign-cognita" id="cognita-advertisements" aria-labelledby="cognitaAdsTitle">
    <header class="fmb-campaign-head">
      <div>
        <small>FMB&amp;CO. Learning</small>
        <h2 id="cognitaAdsTitle">Cognita Institute of AI</h2>
        <p>Practical AI education for future-ready thinkers, creators, and problem solvers.</p>
      </div>
      <a href="https://thecognitainstitute.com/" target="_blank" rel="noopener">Explore Cognita <span aria-hidden="true">→</span></a>
    </header>
    <div class="fmb-campaign-grid fmb-campaign-grid-cognita" aria-label="Cognita campaign advertisements">
      <a class="fmb-pubmat fmb-pubmat-wide" href="https://thecognitainstitute.com/" target="_blank" rel="noopener" aria-label="Discover Cognita Institute of AI">
        <img src="/assets/images/cognita/ads/cognita-brand-banner.webp" width="900" height="450" loading="eager" decoding="async" fetchpriority="high" alt="Cognita Institute of AI: Empowering minds, building the future">
      </a>
      <a class="fmb-pubmat" href="https://thecognitainstitute.com/" target="_blank" rel="noopener" aria-label="Cognita enrollment opening soon">
        <img src="${cognitaEnrollment}" width="550" height="550" loading="lazy" decoding="async" fetchpriority="low" alt="Cognita Institute of AI enrollment opening soon">
      </a>
      <a class="fmb-pubmat" href="https://thecognitainstitute.com/" target="_blank" rel="noopener" aria-label="Cognita courses at 1,500 pesos per course">
        <img src="${cognitaRate}" width="550" height="550" loading="lazy" decoding="async" fetchpriority="low" alt="Cognita Institute of AI rate of 1,500 pesos per course">
      </a>
    </div>
  </section>

  <section class="fmb-campaign fmb-campaign-senz" id="senz-advertisements" aria-labelledby="senzAdsTitle">
    <header class="fmb-campaign-head">
      <div>
        <small>FMB&amp;CO. Communications</small>
        <h2 id="senzAdsTitle">SENZ</h2>
        <p>Strategic communications, marketing, and digital solutions built to create clarity and measurable results.</p>
      </div>
      <a href="https://senzpr.com/" target="_blank" rel="noopener">Explore SENZ <span aria-hidden="true">→</span></a>
    </header>
    <div class="fmb-campaign-grid fmb-campaign-grid-senz" aria-label="SENZ campaign advertisements">
      <a class="fmb-pubmat fmb-pubmat-wide" href="https://senzpr.com/" target="_blank" rel="noopener" aria-label="SENZ Influence Through Clarity">
        <img src="${senzBanner}" width="1536" height="768" loading="lazy" decoding="async" fetchpriority="low" alt="SENZ Strategic Communications and Digital Solutions: Influence Through Clarity">
      </a>
      <a class="fmb-pubmat" href="https://senzpr.com/" target="_blank" rel="noopener" aria-label="SENZ Digital Assistant">
        <img src="${senzAssistant}" width="1254" height="1254" loading="lazy" decoding="async" fetchpriority="low" alt="SENZ Digital Assistant services">
      </a>
      <a class="fmb-pubmat" href="https://senzpr.com/" target="_blank" rel="noopener" aria-label="SENZ Digital Space Rental">
        <img src="${senzSpace}" width="1254" height="1254" loading="lazy" decoding="async" fetchpriority="low" alt="SENZ Digital Space Rental services">
      </a>
      <a class="fmb-pubmat" href="https://senzpr.com/" target="_blank" rel="noopener" aria-label="SENZ Professional Website Solutions">
        <img src="${senzWebsite}" width="1254" height="1254" loading="lazy" decoding="async" fetchpriority="low" alt="SENZ Professional Website Solutions">
      </a>
    </div>
  </section>
</section>`;

let home = await readFile(homeFile, 'utf8');
home = removeHeroStack(home);
for (const id of ['featured-campaigns', 'cognita-advertisements', 'senz-advertisements', 'senz-managed-website-space']) {
  home = removeSectionById(home, id);
}

const existingCampaignStyles = /<link\b[^>]*href=(["'])\/assets\/css\/fmb-cognita-ad-grid\.css[^"']*\1[^>]*>/i;
if (existingCampaignStyles.test(home)) {
  home = home.replace(existingCampaignStyles, stylesheet);
} else {
  const sitewideStylesheet = /<link\b[^>]*href=(["'])\/assets\/css\/fmb-sitewide-visual-fixes\.css[^"']*\1[^>]*>/i;
  home = sitewideStylesheet.test(home)
    ? home.replace(sitewideStylesheet, `${stylesheet}\n$&`)
    : home.replace('</head>', `${stylesheet}\n</head>`);
}

const heroStart = /<section\b[^>]*class=(['"])[^'"]*\bhero\b[^'"]*\1[^>]*>/i.exec(home)?.index ?? -1;
if (heroStart < 0) throw new Error('Homepage hero section is missing.');
const heroEnd = findSectionEnd(home, heroStart);
if (heroEnd < 0) throw new Error('Homepage hero section is not balanced.');
home = `${home.slice(0, heroEnd)}\n${campaignShowcase}\n${home.slice(heroEnd)}`;

await writeFile(homeFile, home, 'utf8');

for (const forbidden of [
  'fmb-approved-hero-stack',
  'fmb-approved-time',
  'fmb-approved-ecosystem',
  'fmb-approved-quote',
  'id="senz-managed-website-space"',
  'fmb-cognita-poster-copy',
  'fmb-cognita-price',
]) {
  if (home.includes(forbidden)) throw new Error(`Retired homepage element remains: ${forbidden}`);
}
for (const required of [
  'id="featured-campaigns"',
  'id="cognita-advertisements"',
  'id="senz-advertisements"',
  '/assets/images/cognita/ads/cognita-brand-banner.webp',
  cognitaEnrollment,
  cognitaRate,
  senzBanner,
  senzAssistant,
  senzSpace,
  senzWebsite,
]) {
  if (!home.includes(required)) throw new Error(`Campaign showcase is missing: ${required}`);
}

console.log('Installed the exact supplied Cognita and SENZ pubmats in a responsive two-brand homepage campaign showcase and removed the retired SENZ promo and utility-card stack.');
