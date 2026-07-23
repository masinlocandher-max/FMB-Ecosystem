import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb');
const outputRoot = path.join(repositoryRoot, 'dist');
const assetOutput = path.join(outputRoot, 'assets');
const version = '20260723-unified-v1';

const stylesheetHref = `/assets/css/fmb-unified-redesign.css?v=${version}`;
const priorityHref = `/assets/css/fmb-unified-priority.css?v=${version}`;
const contentHref = `/assets/css/fmb-unified-content.css?v=${version}`;
const cleanupHref = `/assets/css/fmb-unified-cleanup.css?v=${version}`;
const scriptSrc = `/assets/js/fmb-unified-shell.js?v=${version}`;
const fontHref = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Montserrat:wght@400;500;600;700;800&display=swap';

const excludedPrefixes = [
  '_sites/',
  'app/',
  'admin/',
  'data-center/',
  'auth/',
  'api/',
];

const readingFiles = new Set([
  'reading.html',
  'dress-with-intention.html',
  'womens-health.html',
  'skin-care-makeup.html',
  'coming-out-respect.html',
  'men-can-cry.html',
]);

const routes = [
  { label: 'Home', href: '/', match: ['home'] },
  { label: 'About FMB', href: '/aboutfmb/', match: ['about'] },
  { label: 'News', href: '/news/', match: ['news'] },
  { label: 'Projects', href: '/projects/', match: ['projects', 'mabayani'] },
  { label: 'Reading', href: '/ebooks/', match: ['ebooks', 'reading'] },
  { label: 'Music', href: '/music/', match: ['music'] },
  { label: 'Get Involved', href: '/withlovefmb/#volunteer', match: ['withlove', 'community'] },
  { label: 'Get Help', href: '/gethelp/', match: ['help'] },
  { label: 'FMB&amp;CO.', href: '/fmbandco/', match: ['company'] },
];

function normalize(relativePath) {
  return relativePath.replaceAll(path.sep, '/');
}

function classify(relativePath) {
  const file = normalize(relativePath).toLowerCase();
  if (excludedPrefixes.some((prefix) => file.startsWith(prefix))) return null;
  if (file === 'index.html') return 'home';
  if (readingFiles.has(file)) return 'reading';
  if (file.startsWith('aboutfmb/')) return 'about';
  if (file.startsWith('news/')) return 'news';
  if (file.startsWith('projects/')) return 'projects';
  if (file.startsWith('ebooks/')) return 'ebooks';
  if (file.startsWith('music/')) return 'music';
  if (file.startsWith('withlovefmb/')) return 'withlove';
  if (file.startsWith('communityengagements/')) return 'community';
  if (file.startsWith('gethelp/')) return 'help';
  if (file.startsWith('fmbandco/')) return 'company';
  if (file.startsWith('mabayani/')) return 'mabayani';
  return null;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function sharedShell(page) {
  const navigation = routes.map((route) => {
    const current = route.match.includes(page) ? ' aria-current="page"' : '';
    return `<a href="${route.href}"${current}>${route.label}</a>`;
  }).join('');

  return `<div class="fmb-unified-shell">
  <div class="fmb-unified-rail">
    <i aria-hidden="true"></i>
    <span>Francine Marie Bautista · Official Digital Headquarters</span>
    <a href="/news/">Open the latest bulletin</a>
  </div>
  <div class="fmb-unified-nav-shell">
    <a class="fmb-unified-brand" href="/" aria-label="Francine Marie Bautista home">
      <img src="/assets/images/fmb-approved/fmb-master-transparent.webp" width="1129" height="724" loading="lazy" decoding="async" alt="FMB, Francine Marie Bautista">
    </a>
    <nav class="fmb-unified-nav" id="fmbUnifiedNav" aria-label="Primary navigation">${navigation}</nav>
    <div class="fmb-unified-actions">
      <a class="quiet" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
      <a class="primary" href="/aboutfmb/#work-with-fmb">Work with FMB</a>
      <button class="fmb-unified-menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav"><span></span><span></span></button>
    </div>
  </div>
</div>`;
}

function sharedFooter() {
  return `<footer class="fmb-unified-footer">
  <div class="fmb-unified-footer-grid">
    <section class="fmb-unified-footer-brand" aria-labelledby="fmbFooterTitle">
      <img src="/assets/images/fmb-approved/fmb-master-transparent.webp" width="1129" height="724" loading="lazy" decoding="async" alt="FMB">
      <h2 id="fmbFooterTitle">The vision behind the ecosystem.</h2>
      <p>The official public headquarters for Francine Marie Bautista, her projects, published work, advocacy, and the companies organized through FMB&amp;CO.</p>
    </section>
    <nav aria-label="Official website links"><strong>Official Site</strong><a href="/">Home</a><a href="/aboutfmb/">About FMB</a><a href="/news/">News</a><a href="/projects/">Projects</a><a href="/aboutfmb/#work-with-fmb">Work with FMB</a></nav>
    <nav aria-label="Public resources"><strong>Explore</strong><a href="/ebooks/">Reading</a><a href="/music/">Music</a><a href="/withlovefmb/#volunteer">Get Involved</a><a href="/gethelp/">Get Help</a><a href="https://yoni.francinemariebautista.com/">Open Yoni</a></nav>
    <nav aria-label="Ecosystem links"><strong>Ecosystem</strong><a href="/fmbandco/">FMB&amp;CO.</a><a href="https://senzpr.com/">SENZ</a><a href="https://thecognitainstitute.com/">Cognita</a><a href="/withlovefmb/">With Love, FMB</a><a href="/mabayani/">Mabayani</a></nav>
  </div>
  <div class="fmb-unified-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span><a href="/privacy-policy.html">Privacy</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="mailto:withlovefmb@gmail.com?subject=Accessibility%20Support">Accessibility</a></span></div>
</footer>
<button class="fmb-back-to-top" type="button" aria-label="Back to top">↑</button>`;
}

function setBodyPage(html, page) {
  return html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    const withoutPage = attributes.replace(/\sdata-fmb-page=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    const withoutShell = withoutPage.replace(/\sdata-fmb-unified-shell=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    return `<body${withoutShell} data-fmb-page="${page}" data-fmb-unified-shell="true">`;
  });
}

function addHeadAssets(html) {
  let next = html;
  const fontLinks = next.includes('fonts.googleapis.com/css2?family=Cinzel')
    ? ''
    : `\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="${fontHref}" rel="stylesheet">`;
  const designLinks = [stylesheetHref, priorityHref, contentHref, cleanupHref]
    .filter((href) => !next.includes(href))
    .map((href) => `  <link rel="stylesheet" href="${href}">`)
    .join('\n');

  if (fontLinks || designLinks) {
    next = next.replace('</head>', `${fontLinks}${designLinks ? `\n${designLinks}` : ''}\n</head>`);
  }
  return next;
}

function addSharedChrome(html, page) {
  let next = html;
  if (!next.includes('class="fmb-unified-shell"')) {
    next = next.replace(/(<body\b[^>]*>)/i, `$1\n${sharedShell(page)}`);
  }
  if (!next.includes('class="fmb-unified-footer"')) {
    next = next.replace('</body>', `${sharedFooter()}\n</body>`);
  }
  return next;
}

function addHomeMark(html, page) {
  if (page !== 'home' || html.includes('class="fmb-hero-mark"')) return html;
  return html.replace(
    /(<div\b[^>]*class=["'][^"']*\bhero-copy\b[^"']*["'][^>]*>)/i,
    '$1\n<img class="fmb-hero-mark" src="/assets/images/fmb-approved/fmb-master-transparent.webp" width="1129" height="724" loading="lazy" decoding="async" alt="FMB">',
  );
}

function addShellScript(html) {
  if (html.includes(scriptSrc)) return html;
  return html.replace('</body>', `  <script src="${scriptSrc}" defer></script>\n</body>`);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

await mkdir(path.join(assetOutput, 'css'), { recursive: true });
await mkdir(path.join(assetOutput, 'js'), { recursive: true });
for (const stylesheet of [
  'fmb-unified-redesign.css',
  'fmb-unified-priority.css',
  'fmb-unified-content.css',
  'fmb-unified-cleanup.css',
]) {
  await copyFile(
    path.join(sourceRoot, 'assets', 'css', stylesheet),
    path.join(assetOutput, 'css', stylesheet),
  );
}
await copyFile(
  path.join(sourceRoot, 'assets', 'js', 'fmb-unified-shell.js'),
  path.join(assetOutput, 'js', 'fmb-unified-shell.js'),
);

const publicPages = [];
for (const file of await walk(outputRoot)) {
  if (path.extname(file).toLowerCase() !== '.html') continue;
  const relative = normalize(path.relative(outputRoot, file));
  const page = classify(relative);
  if (!page) continue;

  let html = await readFile(file, 'utf8');
  if (!/<head\b/i.test(html) || !/<body\b/i.test(html) || !/<\/body>/i.test(html)) {
    throw new Error(`${relative}: cannot apply the unified design because the HTML shell is incomplete`);
  }

  html = setBodyPage(html, page);
  html = addHeadAssets(html);
  html = addSharedChrome(html, page);
  html = addHomeMark(html, page);
  html = addShellScript(html);
  await writeFile(file, html, 'utf8');
  publicPages.push({ file, relative, page });
}

if (!publicPages.some(({ relative }) => relative === 'index.html')) {
  throw new Error('Unified FMB redesign failed: the public homepage was not found');
}

const errors = [];
for (const { file, relative, page } of publicPages) {
  const html = await readFile(file, 'utf8');
  if (count(html, stylesheetHref) !== 1) errors.push(`${relative}: unified stylesheet must appear exactly once`);
  if (count(html, priorityHref) !== 1) errors.push(`${relative}: priority stylesheet must appear exactly once`);
  if (count(html, contentHref) !== 1) errors.push(`${relative}: content stylesheet must appear exactly once`);
  if (count(html, cleanupHref) !== 1) errors.push(`${relative}: cleanup stylesheet must appear exactly once`);
  if (count(html, scriptSrc) !== 1) errors.push(`${relative}: unified shell script must appear exactly once`);
  if (count(html, 'class="fmb-unified-shell"') !== 1) errors.push(`${relative}: shared header shell must appear exactly once`);
  if (count(html, 'class="fmb-unified-footer"') !== 1) errors.push(`${relative}: shared footer must appear exactly once`);
  if (count(html, 'class="fmb-back-to-top"') !== 1) errors.push(`${relative}: back-to-top control must appear exactly once`);
  if (!new RegExp(`<body\\b[^>]*data-fmb-page=["']${page}["'][^>]*data-fmb-unified-shell=["']true["']`, 'i').test(html)) {
    errors.push(`${relative}: missing route and unified-shell body markers`);
  }
}

if (errors.length) {
  throw new Error(`Unified FMB redesign validation failed:\n- ${errors.join('\n- ')}`);
}

console.log(`Rendered the unified FMB public-site design system into ${publicPages.length} HTML pages without removing their original content.`);
