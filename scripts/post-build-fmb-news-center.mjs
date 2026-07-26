import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const pagePath = path.join(repositoryRoot, 'dist', 'news', 'index.html');
const sourceCss = path.join(
  repositoryRoot,
  'apps',
  'withlovefmb',
  'assets',
  'css',
  'news-center-v2.css',
);
const distCss = path.join(repositoryRoot, 'dist', 'assets', 'css', 'news-center-v2.css');
const stylesheetHref = '/assets/css/news-center-v2.css?v=20260726a';

function replaceRequired(html, search, replacement, label) {
  if (typeof search === 'string') {
    if (!html.includes(search)) throw new Error(`News center redesign: missing ${label}`);
    return html.replace(search, replacement);
  }

  if (!search.test(html)) throw new Error(`News center redesign: missing ${label}`);
  return html.replace(search, replacement);
}

function addBodyClass(html, className) {
  return replaceRequired(
    html,
    /<body\b([^>]*)>/i,
    (match, attrs = '') => {
      if (/\bclass=(['"])([^'"]*)\1/i.test(attrs)) {
        attrs = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
          const classes = new Set(value.split(/\s+/).filter(Boolean));
          classes.add(className);
          return `class=${quote}${[...classes].join(' ')}${quote}`;
        });
      } else {
        attrs += ` class="${className}"`;
      }
      return `<body${attrs}>`;
    },
    'news page body',
  );
}

await mkdir(path.dirname(distCss), { recursive: true });
await copyFile(sourceCss, distCss);

let html = await readFile(pagePath, 'utf8');

html = html.replace(
  /<link\b[^>]*href=["'][^"']*news-center-v2\.css[^"']*["'][^>]*>\s*/gi,
  '',
);

html = addBodyClass(html, 'news-center-v2');

html = html
  .replace(
    '<title>FMB News | Public-Interest Reporting and Analysis</title>',
    '<title>FMB Newsroom | Philippines, Zambales and Public-Interest Reporting</title>',
  )
  .replace(
    '<meta name="description" content="FMB News publishes public-interest reporting, source-backed context, constructive reporting and clearly labeled perspective from Francine Marie Bautista and the FMB ecosystem.">',
    '<meta name="description" content="The FMB Newsroom publishes public-interest reporting, verified context, constructive journalism and clearly labeled analysis from the Philippines and Zambales.">',
  )
  .replace(
    '<meta property="og:title" content="FMB News | Public-Interest Reporting and Analysis">',
    '<meta property="og:title" content="FMB Newsroom | Public-Interest Reporting and Analysis">',
  )
  .replace(
    '<meta property="og:description" content="The official newsroom of the FMB ecosystem, built around sourced reporting, context, constructive journalism and clearly labeled perspective.">',
    '<meta property="og:description" content="A public-interest news center for Philippine, Zambales, culture, environment, technology and community reporting.">',
  )
  .replaceAll(
    'https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp',
    'https://www.francinemariebautista.com/assets/images/news/subic-aeta-dumpsite-iwitness.jpg',
  )
  .replace('<meta property="og:site_name" content="FMB News">', '<meta property="og:site_name" content="FMB Newsroom">')
  .replace('<meta name="twitter:title" content="FMB News">', '<meta name="twitter:title" content="FMB Newsroom">')
  .replace(
    '<meta name="twitter:description" content="Public-interest reporting, source-backed context and clearly labeled perspective.">',
    '<meta name="twitter:description" content="Philippine public-interest reporting, verified context and clearly labeled perspective.">',
  )
  .replace('FMB News Network', 'Public Interest News Center')
  .replace('Original FMB News conceptual illustration.', 'Original newsroom conceptual illustration.')
  .replace('FMB News is designed to slow down', 'The newsroom is designed to slow down');

html = replaceRequired(
  html,
  /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-publication-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
  `<a class="nc-publication-brand nc-text-masthead" href="/news/" aria-label="Newsroom home">
      <span class="nc-masthead-kicker">Francine Marie Bautista</span>
      <strong class="nc-masthead-title">THE NEWSROOM</strong>
      <span class="nc-masthead-edition">Philippines · Zambales · World</span>
    </a>`,
  'header masthead',
);

html = replaceRequired(
  html,
  /<div\b(?=[^>]*\bclass=["'][^"']*\bnc-channel-lockup\b[^"']*["'])[^>]*>[\s\S]*?<\/div>/i,
  `<div class="nc-channel-lockup nc-newsroom-title">
        <span class="nc-hero-kicker">Sunday edition · 26 July 2026</span>
        <h1 id="newsroomTitle">The News Center</h1>
        <p class="nc-hero-summary">Public-interest reporting, verified context and analysis on the Philippines, Zambales, culture, environment, technology and community life.</p>
        <div class="nc-hero-dateline"><span>Masinloc, Zambales</span><span>Philippine Standard Time</span></div>
      </div>`,
  'newsroom hero',
);

html = replaceRequired(
  html,
  /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-footer-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
  `<a class="nc-footer-brand nc-footer-masthead" href="/news/" aria-label="Newsroom home"><span class="nc-footer-kicker">Francine Marie Bautista</span><strong>THE NEWSROOM</strong><span>Public interest · Clear sources · Visible perspective</span></a>`,
  'footer masthead',
);

if (!/<\/head>/i.test(html)) {
  throw new Error('News center redesign: news page has no closing head element');
}

html = html.replace(
  /<\/head>/i,
  `<link rel="stylesheet" href="${stylesheetHref}">\n</head>`,
);

if (/fmb-news-official-transparent\.webp|\/assets\/images\/news\/fmb-news-official\.svg/i.test(html)) {
  throw new Error('News center redesign: legacy FMB News logo remains in the generated page');
}

await writeFile(pagePath, html, 'utf8');
console.log('Rebuilt the news landing page as a text-led editorial news center and removed the legacy FMB News logo.');
