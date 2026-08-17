import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssHref = '/assets/css/fmb-unified-system.css?v=20260724-total-makeover-v1';
const jsSrc = '/assets/js/fmb-unified-system.js?v=20260724-total-makeover-v1';
const logoSrc = '/assets/images/fmbandco/fmbandco-primary-reversed.png';
const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/', 'news/', 'fmbnews/'];
const excludedFiles = new Set(['admin.html', 'login.html', 'signup.html', 'reset-password.html', 'confirm-email.html']);

const publicNavigation = [
  ['/', 'Home'],
  ['/aboutfmb/', 'About FMB'],
  ['/news/', 'Bulletin'],
  ['/projects/', 'Projects'],
  ['/ebooks/', 'Reading'],
  ['/music/', 'Music'],
  ['/get-involved/', 'Get Involved'],
  ['/gethelp/', 'Get Help'],
  ['/fmbandco/', 'FMB&CO.'],
  ['/work-with-fmb/', 'Work with FMB'],
];

const shellHeader = `
<div class="fmb-shell-rail" data-fmb-unified-shell>
  <strong>FMB&amp;CO.</strong>
  <span>The official digital headquarters of Francine Marie Bautista</span>
  <a href="/news/">Open the bulletin</a>
</div>
<header class="fmb-shell-header" data-fmb-unified-shell>
  <a class="fmb-shell-brand" href="/" aria-label="Francine Marie Bautista and FMB&CO. home">
    <img src="${logoSrc}" width="1414" height="405" alt="FMB&CO. Francine Marie Bautista">
  </a>
  <nav class="fmb-shell-nav" id="fmbUnifiedNav" aria-label="Primary navigation">
    ${publicNavigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n    ')}
  </nav>
  <a class="fmb-shell-cta" href="/work-with-fmb/">Work with FMB</a>
  <a class="fmb-shell-yoni" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
  <button class="fmb-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav"><span></span></button>
</header>`;

const shellFooter = `
<footer class="fmb-shell-footer" data-fmb-unified-shell>
  <div class="fmb-shell-footer-grid">
    <div class="fmb-shell-footer-brand">
      <img src="${logoSrc}" width="1414" height="405" loading="lazy" decoding="async" alt="FMB&CO. Francine Marie Bautista">
      <p>The official digital home, bulletin, authority platform, and ecosystem gateway of Francine Marie Bautista.</p>
    </div>
    <nav aria-label="Official site links">
      <strong>Official Site</strong>
      <a href="/">Home</a><a href="/aboutfmb/">About FMB</a><a href="/news/">Bulletin</a><a href="/projects/">Projects</a><a href="/work-with-fmb/">Work with FMB</a>
    </nav>
    <nav aria-label="Public resources">
      <strong>Public Resources</strong>
      <a href="/ebooks/">Reading</a><a href="/music/">Music</a><a href="/withlovefmb/">With Love, FMB</a><a href="/get-involved/">Get Involved</a><a href="/gethelp/">Get Help</a>
    </nav>
    <nav aria-label="FMB ecosystem links">
      <strong>Ecosystem</strong>
      <a href="/fmbandco/">FMB&amp;CO.</a><a href="https://senzpr.com/">SENZ</a><a href="https://thecognitainstitute.com/">Cognita</a><a href="https://yoni.francinemariebautista.com/">Yoni</a><a href="/mabayani/">Mabayani</a>
    </nav>
  </div>
  <div class="fmb-shell-footer-bottom">
    <span>© 2026 Francine Marie Bautista. All rights reserved.</span>
    <div class="fmb-shell-footer-socials"><a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener">Instagram @bb.fmb</a><a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener">Facebook</a><a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a></div>
  </div>
</footer>`;

async function walk(directory, relative = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, entry.name);
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(child, childRelative));
    else if (entry.isFile()) files.push(childRelative);
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
  if (route.startsWith('projects')) return 'projects';
  if (route === 'ebooks') return 'reading';
  if (route.startsWith('ebooks/')) return 'reading-article';
  if (route.startsWith('music')) return 'music';
  if (route.startsWith('withlovefmb')) return 'withlove';
  if (route === 'fmbandco') return 'fmbandco';
  if (route.startsWith('fmbandco/')) return 'company-gateway';
  if (route.startsWith('mabayani')) return 'mabayani';
  if (route.startsWith('gethelp')) return 'help';
  if (route.startsWith('work-with-fmb')) return 'work';
  if (route.startsWith('get-involved')) return 'participate';
  if (route.startsWith('communityengagements')) return 'community';
  if (/^(privacy|terms|data-deletion)/.test(route)) return 'policy';
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
    } else next += ` class="fmb-unified-public fmb-unified-${key}"`;
    if (!/data-fmb-page=/i.test(next)) next += ` data-fmb-page="${key}"`;
    return `<body${next}>`;
  });
}

function ensureHeadAssets(html) {
  if (!html.includes('family=Manrope')) html = html.replace('</head>', '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n</head>');
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

export async function applyPersonalSharedShell({ distRoot = path.join(appRoot, 'dist') } = {}) {
  const htmlFiles = (await walk(distRoot)).filter(isPublicHtml);
  for (const relative of htmlFiles) {
    const file = path.join(distRoot, relative);
    let html = await readFile(file, 'utf8');
    html = addBodyIdentity(html, pageKey(relative));
    html = ensureShell(html);
    html = ensureHeadAssets(html);
    await writeFile(file, html, 'utf8');
  }

  for (const relative of htmlFiles) {
    const html = await readFile(path.join(distRoot, relative), 'utf8');
    for (const required of ['fmb-unified-public', 'fmb-shell-header', 'fmb-shell-footer', cssHref, jsSrc]) {
      if (!html.includes(required)) throw new Error(`${relative}: source-generated personal shell is missing ${required}`);
    }
  }
  console.log(`Applied the source-generated FMB personal-site shell to ${htmlFiles.length} public HTML pages.`);
}
