import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const pagePath = path.join(repositoryRoot, 'dist', 'news', 'index.html');
const sourceCss = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'news-center-v3.css');
const distCss = path.join(repositoryRoot, 'dist', 'assets', 'css', 'news-center-v3.css');
const sourceJs = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'js', 'news-center-v3.js');
const distJs = path.join(repositoryRoot, 'dist', 'assets', 'js', 'news-center-v3.js');
const stylesheetHref = '/assets/css/news-center-v3.css?v=20260726-newscenter-v3';
const scriptSrc = '/assets/js/news-center-v3.js?v=20260726-newscenter-v3';
const identityRecord = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';

function replaceRequired(html, search, replacement, label) {
  if (typeof search === 'string') {
    if (!html.includes(search)) throw new Error(`News Center v3: missing ${label}`);
    return html.replace(search, replacement);
  }

  if (!search.test(html)) throw new Error(`News Center v3: missing ${label}`);
  return html.replace(search, replacement);
}

function addBodyClass(html, className) {
  return replaceRequired(
    html,
    /<body\b([^>]*)>/i,
    (match, attributes = '') => {
      let next = attributes;
      if (/\bclass=(['"])([^'"]*)\1/i.test(next)) {
        next = next.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
          const classes = new Set(value.split(/\s+/).filter(Boolean));
          classes.delete('news-center-v2');
          classes.add(className);
          return `class=${quote}${[...classes].join(' ')}${quote}`;
        });
      } else {
        next += ` class="${className}"`;
      }
      return `<body${next}>`;
    },
    'news page body',
  );
}

await Promise.all([
  mkdir(path.dirname(distCss), { recursive: true }),
  mkdir(path.dirname(distJs), { recursive: true }),
]);
await Promise.all([
  copyFile(sourceCss, distCss),
  copyFile(sourceJs, distJs),
]);

let html = await readFile(pagePath, 'utf8');

html = html
  .replace(/<link\b[^>]*href=["'][^"']*news-center-v[23]\.css[^"']*["'][^>]*>\s*/gi, '')
  .replace(/<script\b[^>]*src=["'][^"']*news-center-v3\.js[^"']*["'][^>]*><\/script>\s*/gi, '')
  .replace(/<meta\b[^>]*name=["']fmb-news-identity-record["'][^>]*>\s*/gi, '')
  .replace(/<section\b[^>]*class=["'][^"']*\bfmb-v2-news-command\b[^"']*["'][^>]*>[\s\S]*?<\/section>\s*/gi, '');

html = addBodyClass(html, 'news-center-v3');

html = html
  .replace(/<meta\s+name=["']theme-color["'][^>]*>/i, '<meta name="theme-color" content="#071126">')
  .replace(
    /<title>[\s\S]*?<\/title>/i,
    '<title>FMB News Center | Philippines, Zambales and Public-Interest Reporting</title>',
  );

const parentHeader = `<header class="fmb-shell-header" data-fmb-unified-shell>
  <a class="fmb-shell-brand" href="/" aria-label="FMB and Company home">
    <img src="/assets/images/fmbandco/fmbandco-primary-reversed.png" width="1414" height="405" alt="FMB&CO. Francine Marie Bautista">
  </a>
  <nav class="fmb-shell-nav" id="fmbUnifiedNav" aria-label="FMB and Company navigation">
    <a href="/fmbandco/">About FMB&amp;CO.</a>
    <a href="/projects/">Our Work</a>
    <a href="/ebooks/">Publications</a>
    <a href="/mabayani/">Research</a>
    <a href="/work-with-fmb/">Contact</a>
  </nav>
  <a class="fmb-shell-cta" href="/work-with-fmb/">Work with FMB</a>
  <a class="fmb-shell-yoni" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
  <button class="fmb-shell-menu" type="button" aria-label="Open FMB and Company navigation" aria-expanded="false" aria-controls="fmbUnifiedNav">Menu</button>
</header>`;

html = replaceRequired(
  html,
  /<header\b(?=[^>]*\bclass=["']fmb-shell-header["'])[^>]*>[\s\S]*?<\/header>/i,
  parentHeader,
  'parent company header',
);

const sitewideStylesheet = /(<link\b[^>]*href=["'][^"']*fmb-sitewide-visual-fixes\.css[^"']*["'][^>]*>)/i;
html = replaceRequired(
  html,
  sitewideStylesheet,
  `<meta name="fmb-news-identity-record" content="${identityRecord}">\n<link rel="stylesheet" href="${stylesheetHref}">\n$1`,
  'sitewide visual safeguard stylesheet',
);

html = replaceRequired(
  html,
  /<\/body>/i,
  `<script defer src="${scriptSrc}"></script>\n</body>`,
  'closing body element',
);

const renderedLegacyLogo = /<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp[^"']*["']/i;
if (renderedLegacyLogo.test(html) || /url\([^)]*fmb-news-official-transparent\.webp/i.test(html)) {
  throw new Error('News Center v3: removed FMB News graphic logo is still visibly rendered');
}

for (const marker of [
  'news-center-v3',
  'FMB News Center',
  'class="nc3-front-grid"',
  'class="nc3-desk-grid"',
  'data-news-search',
  'href="/news/pax-silica-philippines/"',
]) {
  if (!html.includes(marker)) throw new Error(`News Center v3: generated page is missing ${marker}`);
}

await writeFile(pagePath, html, 'utf8');
console.log('Published the strict navy-purple FMB News Center v3 with a responsive digital-broadsheet layout and functional story search.');
