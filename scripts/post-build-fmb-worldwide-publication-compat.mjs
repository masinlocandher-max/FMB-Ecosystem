import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const worldRoot = path.join(dist, 'news', 'world');
const assetsCss = path.join(dist, 'assets', 'css');
const worldCssSource = path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-worldwide.css');
const worldCssTarget = path.join(assetsCss, 'fmb-worldwide.css');
const worldV2CssSource = path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-worldwide-v2.css');
const worldV2CssTarget = path.join(assetsCss, 'fmb-worldwide-v2.css');
const cleanLink = '<link rel="stylesheet" href="/assets/css/fmbnews-clean-v1.css?v=20260831-worldwide">';
const worldLink = '<link rel="stylesheet" href="/assets/css/fmb-worldwide.css?v=20260831-worldwide-v2">';
const worldV2Link = '<link rel="stylesheet" href="/assets/css/fmb-worldwide-v2.css?v=20260831-worldwide-v2">';

async function htmlFiles(directory) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (full, attrs = '') => {
    if (/\bclass=(['"])/i.test(full)) {
      return full.replace(/\bclass=(['"])(.*?)\1/i, (_match, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    }
    return `<body class="${className}"${attrs}>`;
  });
}

function ensureWorldAssets(html) {
  let next = addBodyClass(html, 'fmb-worldwide-route');
  if (!next.includes('fmbnews-clean-v1.css')) next = next.replace('</head>', `${cleanLink}</head>`);
  if (!next.includes('fmb-worldwide.css')) next = next.replace('</head>', `${worldLink}</head>`);
  if (!next.includes('fmb-worldwide-v2.css')) next = next.replace('</head>', `${worldV2Link}</head>`);
  return next;
}

function worldGatewayHtml() {
  return `<!doctype html>
<html lang="en-PH">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>FMB Worldwide | The World in the Past 24 Hours</title>
  <meta name="description" content="FMB Worldwide is the verified global desk of FMB News: consequential developments from the rolling past 24 hours, organized for Filipino readers.">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta name="theme-color" content="#21102e">
  <link rel="canonical" href="https://www.francinemariebautista.com/news/world/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="FMB News">
  <meta property="og:title" content="FMB Worldwide">
  <meta property="og:description" content="The consequential verified developments shaping the world in the past 24 hours, made clear for Filipino readers.">
  <meta property="og:url" content="https://www.francinemariebautista.com/news/world/">
  <link rel="stylesheet" href="/assets/css/fmb-news-final.css?v=20260831-worldwide">
  ${cleanLink}
  ${worldLink}
  ${worldV2Link}
  <script src="/assets/js/fmb-news-approved.js?v=20260831-worldwide-v2" defer></script>
</head>
<body class="fmb-worldwide-route">
  <header class="masthead">
    <div class="shell mast-row">
      <a class="brand" href="/news/" aria-label="FMB News home"><img data-fmb-asset="logo" alt="FMB News, Filipino Media Bulletin"></a>
      <nav class="desktop-nav" aria-label="FMB News sections">
        <a href="/news/fmb-brief/">FMB Brief</a>
        <a href="/news/world/" aria-current="page">FMB Worldwide</a>
        <a href="/news/#stories">Philippines</a>
        <a href="/news/#stories">Economy</a>
        <a href="/news/#stories">Culture</a>
        <a href="/news/about/">About</a>
      </nav>
      <div class="actions">
        <a class="submit-button" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Share a Story</a>
        <button class="menu-button" data-menu aria-label="Open menu" aria-expanded="false">☰</button>
      </div>
    </div>
    <nav class="mobile-nav" data-mobile-nav aria-label="Mobile navigation">
      <a href="/news/fmb-brief/">FMB Brief</a>
      <a href="/news/world/" aria-current="page">FMB Worldwide</a>
      <a href="/news/#stories">Philippines</a>
      <a href="/news/about/">About FMB News</a>
    </nav>
  </header>

  <main>
    <section class="world-gateway-hero">
      <div class="shell">
        <div class="world-gateway-topline">
          <span class="world-gateway-kicker">FMB News · Global Desk</span>
          <span class="world-gateway-live"><i aria-hidden="true"></i> Live 24-hour desk</span>
        </div>
        <h1>FMB <span>Worldwide</span></h1>
        <p class="world-gateway-deck">The consequential verified developments shaping the world right now, filtered through a rolling 24-hour window and made clear for Filipino readers. No forced country quota. No filler.</p>
        <div class="world-gateway-actions">
          <a class="world-gateway-primary" href="/news/world/live/">Open the live briefing →</a>
          <a class="world-gateway-secondary" href="#archive">Browse archived editions</a>
        </div>
        <div class="world-gateway-rule" aria-label="FMB Worldwide editorial rules">
          <span>Rolling 24-hour window</span><span>Verified sources</span><span>Country by country</span><span>Fact separated from analysis</span>
        </div>
      </div>
    </section>

    <section class="world-gateway-main">
      <div class="shell">
        <div class="world-gateway-grid">
          <article class="world-gateway-livecard">
            <p class="world-gateway-label">Current desk</p>
            <h2>The world, in one verified briefing.</h2>
            <p>The live edition is the source of truth for the newest FMB Worldwide coverage. Each entry identifies what is verified, why it matters, and the strategic or reputational implications worth watching.</p>
            <a href="/news/world/live/">Enter the live global desk <span aria-hidden="true">→</span></a>
          </article>
          <div class="world-gateway-side" id="archive">
            <a class="world-gateway-card" href="/news/world/august-30-2026/">
              <small>Archive · Latest preserved edition</small>
              <div><h3>Dated editions stay permanent.</h3><p>Verified reporting remains accessible after it leaves the rolling live window.</p></div>
            </a>
            <a class="world-gateway-card" href="/news/about/">
              <small>FMB standard</small>
              <div><h3>Evidence first. Context visible.</h3><p>See how FMB News handles sourcing, analysis, corrections, and editorial clarity.</p></div>
            </a>
          </div>
        </div>

        <div class="world-gateway-method" aria-label="How FMB Worldwide works">
          <article><strong>What happened</strong><p>The verified development, stated without unnecessary interpretation.</p></article>
          <article><strong>Why it matters</strong><p>The economic, political, cultural, technological, or human consequence.</p></article>
          <article><strong>What to watch</strong><p>The next signal that could materially change the story or its impact.</p></article>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="shell footer-grid">
      <div><img class="footer-logo" data-fmb-asset="logo" alt="FMB News"><p>The news that matters. Made clear for Filipinos.</p></div>
      <nav><h3>Sections</h3><a href="/news/fmb-brief/">FMB Brief</a><a href="/news/world/">FMB Worldwide</a><a href="/news/#stories">Philippines</a><a href="/news/#stories">Economy</a><a href="/news/#stories">Culture</a></nav>
      <nav><h3>Worldwide</h3><a href="/news/world/live/">Live briefing</a><a href="/news/world/august-30-2026/">Archived editions</a></nav>
      <nav><h3>Resources</h3><a href="/news/about/">About FMB News</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">Corrections</a><a href="mailto:withlovefmb@gmail.com">Contact</a></nav>
    </div>
    <div class="shell footer-bottom"><span>© 2026 Filipino Media Bulletin.</span><span>Sources visible · Evidence first · Built for Filipinos</span></div>
  </footer>
</body>
</html>`;
}

await mkdir(assetsCss, { recursive: true });
await writeFile(worldCssTarget, await readFile(worldCssSource, 'utf8'), 'utf8');
await writeFile(worldV2CssTarget, await readFile(worldV2CssSource, 'utf8'), 'utf8');
await mkdir(worldRoot, { recursive: true });

const landingPath = path.join(worldRoot, 'index.html');
await writeFile(landingPath, worldGatewayHtml(), 'utf8');

const files = await htmlFiles(worldRoot);
for (const file of files) {
  const relative = path.relative(worldRoot, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') continue;
  let html = await readFile(file, 'utf8');
  html = ensureWorldAssets(html);
  html = addBodyClass(html, 'fmb-worldwide-edition');
  html = html.replace(/<a href="\/news\/world\/"([^>]*)>(.*?)<\/a>/i, '<a href="/news/world/"$1>$2</a>');
  await writeFile(file, html, 'utf8');
}

const sitemapPath = path.join(dist, 'sitemap.xml');
try {
  let sitemap = await readFile(sitemapPath, 'utf8');
  const urls = [
    ['https://www.francinemariebautista.com/news/world/', '2026-08-31', 'hourly', '0.9'],
    ['https://www.francinemariebautista.com/news/world/live/', '2026-08-31', 'hourly', '0.9'],
    ['https://www.francinemariebautista.com/news/world/august-30-2026/', '2026-08-30', 'monthly', '0.8'],
    ['https://www.francinemariebautista.com/news/world/august-29-2026/', '2026-08-29', 'monthly', '0.7'],
  ];
  for (const [loc, lastmod, changefreq, priority] of urls) {
    if (sitemap.includes(`<loc>${loc}</loc>`)) continue;
    const entry = `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>\n`;
    sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
  }
  await writeFile(sitemapPath, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(`Prepared authoritative FMB Worldwide gateway plus ${Math.max(files.length - 1, 0)} live/archive page(s).`);
