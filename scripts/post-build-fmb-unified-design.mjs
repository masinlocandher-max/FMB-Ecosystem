import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
const cssHref = '/assets/css/fmb-unified-system.css?v=20260820-home-foundation-v1';
const jsSrc = '/assets/js/fmb-unified-system.js?v=20260820-home-foundation-v1';
const logoSrc = '/assets/images/fmbandco/fmbandco-primary-reversed.png';

const excludedPrefixes = ['_sites/', 'api/', 'admin/', 'data/'];
const excludedFiles = new Set(['admin.html', 'admin-login.html', 'admin-activate.html']);

const publicNavigation = [
  ['/', 'Home'],
  ['/aboutfmb/', 'About FMB'],
  ['/news/', 'News'],
  ['/projects/', 'Projects'],
  ['/get-involved/', 'Get Involved'],
  ['/gethelp/', 'Get Help'],
  ['/fmbandco/', 'FMB&CO.'],
  ['/work-with-fmb/', 'Work with FMB'],
];

const shellHeader = `
<header class="fmb-shell-header" data-fmb-unified-shell>
  <a class="fmb-shell-brand" href="/" aria-label="Francine Marie Bautista home">
    <img src="${logoSrc}" width="1414" height="405" alt="FMB&CO. Francine Marie Bautista">
  </a>
  <nav class="fmb-shell-nav" id="fmbUnifiedNav" aria-label="Primary navigation">
    ${publicNavigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n    ')}
  </nav>
  <a class="fmb-shell-cta" href="/work-with-fmb/">Work with FMB</a>
  <button class="fmb-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav"><span></span></button>
</header>`;

const shellFooter = `
<footer class="fmb-shell-footer" data-fmb-unified-shell>
  <div class="fmb-shell-footer-grid">
    <div class="fmb-shell-footer-brand">
      <img src="${logoSrc}" width="1414" height="405" loading="lazy" decoding="async" alt="FMB&CO. Francine Marie Bautista">
      <p>The official digital home and public gateway of Francine Marie Bautista.</p>
    </div>
    <nav aria-label="Official site links">
      <strong>Official Site</strong>
      <a href="/">Home</a>
      <a href="/aboutfmb/">About FMB</a>
      <a href="/news/">News</a>
      <a href="/projects/">Projects</a>
      <a href="/work-with-fmb/">Work with FMB</a>
    </nav>
    <nav aria-label="Public resources">
      <strong>Public Resources</strong>
      <a href="/withlovefmb/">With Love, FMB</a>
      <a href="/get-involved/">Get Involved</a>
      <a href="/gethelp/">Get Help</a>
      <a href="/mabayani/">Mabayani</a>
    </nav>
    <nav aria-label="FMB ecosystem links">
      <strong>FMB&amp;CO.</strong>
      <a href="/fmbandco/">FMB&amp;CO.</a>
      <a href="https://senzpr.com/">SENZ</a>
      <a href="https://thecognitainstitute.com/">Cognita</a>
    </nav>
  </div>
  <div class="fmb-shell-footer-bottom">
    <span>© 2026 Francine Marie Bautista. All rights reserved.</span>
    <div class="fmb-shell-footer-socials">
      <a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener">Instagram @bb.fmb</a>
      <a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener">Facebook</a>
      <a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>
    </div>
  </div>
</footer>`;

async function walk(directory, relative = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, entry.name);
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(child, childRelative));
    else files.push(childRelative);
  }
  return files;
}

function isPublicHtml(relative) {
  if (!relative.endsWith('.html') || excludedFiles.has(relative)) return false;
  return !excludedPrefixes.some((prefix) => relative.startsWith(prefix));
}

function pageKey(relative) {
  if (relative === 'index.html') return 'home';
  const route = relative.replace(/\/index\.html$/i, '').replace(/\.html$/i, '');
  if (route.startsWith('aboutfmb')) return 'about';
  if (route === 'news') return 'news';
  if (route.startsWith('news/')) return 'news-article';
  if (route.startsWith('projects')) return 'projects';
  if (route.startsWith('withlovefmb')) return 'withlove';
  if (route === 'fmbandco') return 'fmbandco';
  if (route.startsWith('fmbandco/')) return 'company-gateway';
  if (route.startsWith('mabayani')) return 'mabayani';
  if (route.startsWith('gethelp')) return 'help';
  if (route.startsWith('work-with-fmb')) return 'work';
  if (route.startsWith('get-involved')) return 'participate';
  if (route.startsWith('communityengagements')) return 'community';
  if (/^(privacy|terms|data-deletion|community-guidelines)/.test(route)) return 'policy';
  return 'public';
}

function addBodyIdentity(html, key) {
  return html.replace(/<body([^>]*)>/i, (match, attrs = '') => {
    let next = attrs;
    if (/class=(['"])([^'"]*)\1/i.test(next)) {
      next = next.replace(/class=(['"])([^'"]*)\1/i, (full, quote, value) => {
        const classes = new Set(`${value} fmb-unified-public fmb-unified-${key}`.trim().split(/\s+/));
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      next += ` class="fmb-unified-public fmb-unified-${key}"`;
    }
    if (!/data-fmb-page=/i.test(next)) next += ` data-fmb-page="${key}"`;
    return `<body${next}>`;
  });
}

function removeLegacyVisualPatches(html) {
  const obsoleteStyles = [
    'fmb-network-optimized.css',
    'fmb-network-core.css',
    'fmb-network-pages.css',
    'fmb-network-channels.css',
    'fmb-network-reception.css',
    'fmb-network-responsive.css',
    'fmb-identity-v3.css',
    'fmb-production-qa.css',
    'fmb-strategy-completion.css',
    'fmb-sitewide-gateway.css',
    'aboutfmb-seamless.css',
    'fmb-page-home.css',
    'fmb-page-about.css',
    'fmb-page-withlove.css',
    'fmb-page-community.css',
    'fmb-page-help.css',
    'fmb-page-news.css',
    'fmb-page-company.css',
    'fmb-page-senz-gateway.css',
    'fmb-page-cognita-gateway.css',
  ];
  for (const file of obsoleteStyles) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${escaped}[^"']*["'][^>]*>\\s*`, 'gi'), '');
  }

  const obsoleteScripts = ['fmb-network-optimized.js', 'fmb-network-motion.js', 'fmb-reception-search.js', 'fmb-home-approved.js'];
  for (const file of obsoleteScripts) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`<script\\b[^>]*src=["'][^"']*${escaped}[^"']*["'][^>]*><\\/script>\\s*`, 'gi'), '');
  }

  return html
    .replace(/<style>html\{background:[^}]+\}body\{visibility:hidden\}<\/style>/i, '<style>html{background:#100129}</style>')
    .replace(/body\{visibility:hidden\}/gi, 'body{visibility:visible}');
}

function applyContentConsistency(html) {
  return html
    .replaceAll('/aboutfmb/#work-with-fmb', '/work-with-fmb/')
    .replaceAll('/withlovefmb/#volunteer', '/get-involved/')
    .replaceAll('href="#volunteer"', 'href="/get-involved/"')
    .replaceAll('With Love, FMB, Yoni, and Mabayani', 'With Love, FMB and Mabayani')
    .replaceAll('Yoni, Mabayani, and With Love, FMB', 'Mabayani and With Love, FMB')
    .replaceAll('Yoni, Mabayani, community programs, advocacy campaigns, and future projects', 'Mabayani, community programs, advocacy campaigns, and future projects')
    .replace(/<a\b[^>]*href=["']https:\/\/yoni\.francinemariebautista\.com\/?[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<img\b[^>]*src=["']\/assets\/images\/yoni\/[^"']+["'][^>]*>/gi, '');
}

function ensureHeadAssets(html) {
  if (!html.includes('family=Manrope')) {
    html = html.replace('</head>', '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n</head>');
  }
  if (!html.includes(cssHref)) html = html.replace('</head>', `<link rel="stylesheet" href="${cssHref}">\n</head>`);
  if (!html.includes(jsSrc)) html = html.replace('</body>', `<script src="${jsSrc}" defer></script>\n</body>`);
  html = /<meta\s+name=["']theme-color["'][^>]*>/i.test(html)
    ? html.replace(/<meta\s+name=["']theme-color["'][^>]*>/i, '<meta name="theme-color" content="#100129">')
    : html.replace('</head>', '<meta name="theme-color" content="#100129">\n</head>');
  return html;
}

function ensureShell(html) {
  if (!html.includes('class="fmb-shell-header"')) html = html.replace(/<body[^>]*>/i, (body) => `${body}\n${shellHeader}`);
  if (!html.includes('class="fmb-shell-footer"')) html = html.replace('</body>', `${shellFooter}\n</body>`);
  return html;
}

const htmlFiles = (await walk(dist)).filter(isPublicHtml);
for (const relative of htmlFiles) {
  const file = path.join(dist, relative);
  const key = pageKey(relative);
  let html = await readFile(file, 'utf8');
  html = removeLegacyVisualPatches(html);
  html = applyContentConsistency(html);
  html = addBodyIdentity(html, key);
  html = ensureShell(html);
  html = ensureHeadAssets(html);
  await writeFile(file, html, 'utf8');
}

for (const relative of htmlFiles) {
  const html = await readFile(path.join(dist, relative), 'utf8');
  for (const required of ['fmb-unified-public', 'fmb-shell-header', 'fmb-shell-footer', cssHref, jsSrc]) {
    if (!html.includes(required)) throw new Error(`${relative}: unified public design requirement missing: ${required}`);
  }
  for (const legacy of ['/aboutfmb/#work-with-fmb', '/withlovefmb/#volunteer', '/music/', '/ebooks/', '/profile/', '/auth.html', 'yoni.francinemariebautista.com']) {
    if (html.includes(legacy)) throw new Error(`${relative}: retired route or dependency remains: ${legacy}`);
  }
}

const home = await readFile(path.join(dist, 'index.html'), 'utf8');
if ((home.match(/id="bulletin"/g) || []).length !== 1) throw new Error('Homepage must contain exactly one bulletin.');
if (/\/assets\/images\/yoni\//i.test(home)) throw new Error('Homepage still contains a parked Yoni asset dependency.');

console.log(`Applied the clean shared FMB shell to ${htmlFiles.length} public HTML pages without injecting retired homepage products or sections.`);
