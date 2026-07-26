import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const fail = (message) => { throw new Error(`FMB approved launch gate: ${message}`); };
const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const excludedFiles = new Set(['admin.html', 'login.html', 'signup.html', 'reset-password.html', 'confirm-email.html']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const relative = (file) => path.relative(dist, file).replaceAll(path.sep, '/');
const publicHtml = (await walk(dist)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

const cssPath = path.join(dist, 'assets', 'css', 'fmb-unified-system.css');
const jsPath = path.join(dist, 'assets', 'js', 'fmb-unified-system.js');
const sitewideVisualCssPath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
for (const file of [cssPath, jsPath, sitewideVisualCssPath]) {
  const info = await stat(file);
  if (!info.isFile() || info.size < 1000) fail(`${relative(file)} is missing or incomplete`);
}

for (const duplicate of [
  path.join(dist, 'assets', 'css', 'fmb-approved-launch.css'),
  path.join(dist, 'assets', 'js', 'fmb-approved-launch.js'),
]) {
  try {
    await stat(duplicate);
    fail(`${relative(duplicate)} must not ship as a duplicate compiled file`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const css = await readFile(cssPath, 'utf8');
for (const marker of [
  'Approved FMB&CO. launch layer',
  '--fmb-launch-dark',
  '--fmb-launch-light',
  '.fmb-announcement-track',
  '@keyframes fmb-announcement-motion',
  '.fmb-news-livebar',
  '@keyframes fmb-headline-motion',
  'env(safe-area-inset-bottom',
  'mix-blend-mode: screen',
]) {
  if (!css.includes(marker)) fail(`unified stylesheet is missing ${marker}`);
}

const js = await readFile(jsPath, 'utf8');
for (const marker of [
  "timeZone: 'Asia/Manila'",
  'data-fmb-pst',
  'fmbApprovedLaunchReady',
  'prefers-reduced-motion',
]) {
  if (!js.includes(marker)) fail(`unified interaction script is missing ${marker}`);
}

let checkedPages = 0;
for (const file of publicHtml) {
  const name = relative(file);
  const html = await readFile(file, 'utf8');
  checkedPages += 1;

  for (const marker of [
    'fmb-unified-public',
    'fmb-approved-launch',
    'fmb-announcement-track',
    '/assets/css/fmb-unified-system.css',
    '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2',
    '/assets/js/fmb-unified-system.js',
  ]) {
    if (!html.includes(marker)) fail(`${name} is missing ${marker}`);
  }

  if (/class=["'][^"']*\b(?:fmb-mobile-dock|nc-mobile-dock)\b/i.test(html)) fail(`${name} still contains a retired sticky mobile dock`);
  if ((html.match(/fmb-unified-system\.css/g) || []).length !== 1) fail(`${name} must load exactly one unified stylesheet`);
  if ((html.match(/fmb-sitewide-visual-fixes\.css/g) || []).length !== 1) fail(`${name} must load exactly one sitewide visual safeguards stylesheet`);
  if ((html.match(/fmb-unified-system\.js/g) || []).length !== 1) fail(`${name} must load exactly one unified interaction script`);
  if ((html.match(/class="fmb-shell-header"/g) || []).length !== 1) fail(`${name} must contain exactly one unified header`);
  if ((html.match(/class="fmb-shell-footer"/g) || []).length !== 1) fail(`${name} must contain exactly one unified footer`);

  const stylesheetHrefs = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => /\brel=["'][^"']*\bstylesheet\b[^"']*["']/i.test(tag))
    .map((tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
  if (stylesheetHrefs.at(-1) !== '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2') {
    fail(`${name} must load the sitewide visual safeguards after every other stylesheet`);
  }

  for (const forbidden of ['fmb-coded-visual', 'shots-v2', 'final-showcase', 'localhost:', '127.0.0.1:', 'TODO:', 'PLACEHOLDER']) {
    if (html.includes(forbidden)) fail(`${name} contains preview or temporary marker ${forbidden}`);
  }

  if (name.startsWith('news/')) {
    for (const marker of ['class="fmb-news-livebar"', 'data-fmb-pst', 'fmb-news-ticker-track', 'Philippine Standard Time']) {
      if (!html.includes(marker)) fail(`${name} is missing newsroom requirement ${marker}`);
    }
  }
}

const home = await readFile(path.join(dist, 'index.html'), 'utf8');
for (const marker of [
  'id="fmb-visual-ecosystem"',
  '/assets/images/fmb-approved/francine-standing-landscape.webp',
  '/assets/images/volunteer/francine-leading-with-love-fmb.webp',
  '/app/assets/yoni/yoni-hero.webp',
  '/assets/images/news/new-clark-city-pax-silica-pia.jpg',
]) {
  if (!home.includes(marker)) fail(`homepage is missing approved visual ${marker}`);
}
if ((home.match(/id="how-fmb-can-help"/g) || []).length !== 1) fail('homepage must preserve exactly one How FMB can help section');
if ((home.match(/id="bulletin"/g) || []).length !== 1) fail('homepage must preserve exactly one bulletin');
if (!home.includes('fmb-corporate-luxury-approved.css?v=20260726-visual-fix-v2')) {
  fail('homepage is missing the cache-busted approved dashboard stylesheet');
}

const approvedCss = await readFile(path.join(dist, 'assets', 'css', 'fmb-corporate-luxury-approved.css'), 'utf8');
for (const marker of [
  'body.fmb-corporate-luxury-v2.fmb-approved-dashboard .hero{',
  'grid-template-columns:minmax(340px,.86fr) minmax(320px,.72fr) minmax(260px,.52fr)!important',
  'mask-composite:add!important',
  '-webkit-mask-composite:source-over!important',
]) {
  if (!approvedCss.includes(marker)) fail(`approved dashboard stylesheet is missing visual regression guard ${marker}`);
}

const sitewideVisualCss = await readFile(sitewideVisualCssPath, 'utf8');
for (const marker of [
  'body.fmb-unified-public > .top-shell',
  'body.fmb-corporate-luxury-v2.fmb-unified-news .nc-broadcast-identity',
  'body.fmb-reader-modern :is(.reader-cover, .reading-hero)',
  'body.fmb-unified-about .fmb-about-hero h1',
  'body.fmb-unified-withlove .wlf-hero h1',
  'body.fmb-unified-fmbandco .fco-hero h1',
  'body:is(.fmb-unified-participate, .fmb-unified-work) .fmb-journey-main > h1',
  '@media (max-width: 520px)',
]) {
  if (!sitewideVisualCss.includes(marker)) fail(`sitewide visual safeguards are missing ${marker}`);
}

const originalPax = await readFile(path.join(dist, 'news', 'pax-silica', 'index.html'), 'utf8');
for (const marker of ['Pax Silica, Without the Jargon', '/news/pax-silica/']) {
  if (!originalPax.includes(marker)) fail(`Original Pax Silica explainer is missing ${marker}`);
}

const philippinesPax = await readFile(path.join(dist, 'news', 'pax-silica-philippines', 'index.html'), 'utf8');
for (const marker of ['Pax Silica and the Philippines', 'id="fmb-message-title"', 'Transparency must come before consent', '/news/pax-silica-philippines/']) {
  if (!philippinesPax.includes(marker)) fail(`Separate Pax Silica Philippines article is missing ${marker}`);
}

const newsIndex = await readFile(path.join(dist, 'news', 'index.html'), 'utf8');
if (!newsIndex.includes('href="/news/pax-silica-philippines/"')) fail('News front page is missing the separate Pax Silica Philippines article link');

for (const route of ['index.html', 'withlovefmb/index.html', 'get-involved/index.html']) {
  const html = await readFile(path.join(dist, route), 'utf8');
  if (/\baccept(?:s|ing)? donations?\b/i.test(html)) fail(`${route} conflicts with the no-donation policy`);
  if (/sponsorship, donations/i.test(html)) fail(`${route} still advertises donations`);
}

for (const privateRoute of ['app/index.html', 'admin.html']) {
  const file = path.join(dist, privateRoute);
  try {
    const html = await readFile(file, 'utf8');
    for (const marker of ['fmb-approved-launch', 'data-fmb-mobile-dock', 'fmb-announcement-track']) {
      if (html.includes(marker)) fail(`${privateRoute} was incorrectly repainted with public launch UI`);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

console.log(`FMB approved launch gate passed ${checkedPages} public pages with hamburger-only mobile navigation, live news routes, PST headlines, and no duplicate launch bundles.`);
