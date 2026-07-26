import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const assetsRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css');
const distCssRoot = path.join(repositoryRoot, 'dist', 'assets', 'css');
const identityRecord = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const leadImageUrl = 'https://www.francinemariebautista.com/assets/images/news/subic-aeta-dumpsite-iwitness.jpg';
const stylesheets = [
  {
    source: path.join(assetsRoot, 'news-center-v2.css'),
    destination: path.join(distCssRoot, 'news-center-v2.css'),
  },
  {
    source: path.join(assetsRoot, 'fmb-news-polish-v3.css'),
    destination: path.join(distCssRoot, 'fmb-news-polish-v3.css'),
  },
];

function replaceRequired(html, search, replacement, label) {
  if (typeof search === 'string') {
    if (!html.includes(search)) throw new Error(`Newsroom polish: missing ${label}`);
    return html.replace(search, replacement);
  }
  if (!search.test(html)) throw new Error(`Newsroom polish: missing ${label}`);
  return html.replace(search, replacement);
}

function addBodyClass(html, className) {
  return replaceRequired(
    html,
    /<body\b([^>]*)>/i,
    (match, attrs = '') => {
      if (/\bclass=(["'])([^"']*)\1/i.test(attrs)) {
        attrs = attrs.replace(/\bclass=(["'])([^"']*)\1/i, (whole, quote, value) => {
          const classes = new Set(value.split(/\s+/).filter(Boolean));
          classes.add(className);
          return `class=${quote}${[...classes].join(' ')}${quote}`;
        });
      } else {
        attrs += ` class="${className}"`;
      }
      return `<body${attrs}>`;
    },
    'page body',
  );
}

function textMasthead(label = 'Newsroom home') {
  return `<a class="nc-publication-brand nc-text-masthead" href="/news/" aria-label="${label}">
      <span class="nc-masthead-kicker">Francine Marie Bautista</span>
      <strong class="nc-masthead-title">THE NEWSROOM</strong>
      <span class="nc-masthead-edition">Philippines · Zambales · World</span>
    </a>`;
}

async function walkHtml(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(absolute);
  }
  return output;
}

await mkdir(distCssRoot, { recursive: true });
for (const stylesheet of stylesheets) await copyFile(stylesheet.source, stylesheet.destination);

let landing = await readFile(landingPath, 'utf8');
landing = landing.replace(/<meta\b[^>]*name=["']fmb-news-identity-record["'][^>]*>\s*/gi, '');
landing = addBodyClass(landing, 'news-center-v2');
landing = addBodyClass(landing, 'newsroom-polish-v3');

landing = landing
  .replace('<title>FMB News | Public-Interest Reporting and Analysis</title>', '<title>FMB Newsroom | Philippines, Zambales and Public-Interest Reporting</title>')
  .replace(
    '<meta name="description" content="FMB News publishes public-interest reporting, source-backed context, constructive reporting and clearly labeled perspective from Francine Marie Bautista and the FMB ecosystem.">',
    '<meta name="description" content="The FMB Newsroom publishes public-interest reporting, verified context, constructive journalism and clearly labeled analysis from the Philippines and Zambales.">',
  )
  .replace('<meta property="og:title" content="FMB News | Public-Interest Reporting and Analysis">', '<meta property="og:title" content="FMB Newsroom | Public-Interest Reporting and Analysis">')
  .replace(
    '<meta property="og:description" content="The official newsroom of the FMB ecosystem, built around sourced reporting, context, constructive journalism and clearly labeled perspective.">',
    '<meta property="og:description" content="A public-interest news center for Philippine, Zambales, culture, environment, technology and community reporting.">',
  )
  .replaceAll('https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp', leadImageUrl)
  .replace('<meta property="og:site_name" content="FMB News">', '<meta property="og:site_name" content="FMB Newsroom">')
  .replace('<meta name="twitter:title" content="FMB News">', '<meta name="twitter:title" content="FMB Newsroom">')
  .replace(
    '<meta name="twitter:description" content="Public-interest reporting, source-backed context and clearly labeled perspective.">',
    '<meta name="twitter:description" content="Philippine public-interest reporting, verified context and clearly labeled perspective.">',
  )
  .replace('FMB News Network', 'Public Interest News Center')
  .replace('Original FMB News conceptual illustration.', 'Original newsroom conceptual illustration.')
  .replace('FMB News is designed to slow down', 'The newsroom is designed to slow down')
  .replace('<time>Updated 26 July 2026</time>', '<time data-news-updated>Updated today</time>');

if (!landing.includes('<meta property="og:image:width"')) {
  landing = replaceRequired(
    landing,
    `<meta property="og:image" content="${leadImageUrl}">`,
    `<meta property="og:image" content="${leadImageUrl}">\n<meta property="og:image:width" content="800">\n<meta property="og:image:height" content="533">\n<meta property="og:image:alt" content="The current lead report from the FMB Newsroom">`,
    'Newsroom Open Graph image',
  );
}

landing = replaceRequired(
  landing,
  /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-publication-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
  textMasthead(),
  'landing header masthead',
);

landing = replaceRequired(
  landing,
  /<div\b(?=[^>]*\bclass=["'][^"']*\bnc-channel-lockup\b[^"']*["'])[^>]*>[\s\S]*?<\/div>/i,
  `<div class="nc-channel-lockup nc-newsroom-title">
        <span class="nc-hero-kicker" data-news-edition>Current edition</span>
        <h1 id="newsroomTitle">The News Center</h1>
        <p class="nc-hero-summary">Public-interest reporting, verified context and analysis on the Philippines, Zambales, culture, environment, technology and community life.</p>
        <div class="nc-hero-dateline"><span>Masinloc, Zambales</span><span data-news-date>Philippine Standard Time</span></div>
      </div>`,
  'landing hero',
);

landing = replaceRequired(
  landing,
  /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-footer-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
  '<a class="nc-footer-brand nc-footer-masthead" href="/news/" aria-label="Newsroom home"><span class="nc-footer-kicker">Francine Marie Bautista</span><strong>THE NEWSROOM</strong><span>Public interest · Clear sources · Visible perspective</span></a>',
  'landing footer masthead',
);

landing = replaceRequired(
  landing,
  '</head>',
  `<meta name="fmb-news-identity-record" content="${identityRecord}">\n</head>`,
  'landing closing head',
);

const renderedLegacyLogo = new RegExp(`<(?:img|source)\\b[^>]*(?:src|srcset)=["'][^"']*${identityRecord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["']`, 'i');
if (renderedLegacyLogo.test(landing) || /url\([^)]*fmb-news-official-transparent\.webp/i.test(landing)) {
  throw new Error('Newsroom polish: legacy FMB News logo remains visibly rendered on the landing page');
}
await writeFile(landingPath, landing, 'utf8');

const allNewsPages = await walkHtml(newsRoot);
let articleCount = 0;
for (const filePath of allNewsPages) {
  if (filePath === landingPath) continue;
  let article = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(article)) continue;

  article = addBodyClass(article, 'newsroom-polish-v3');
  article = article.replace(
    /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-publication-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
    textMasthead('Newsroom front page'),
  );

  if (filePath.includes('filipino-centered-training-institution-cognita-vision')) {
    article = article
      .replaceAll('content="1200"', 'content="1536"')
      .replaceAll('content="675"', 'content="864"')
      .replaceAll('width="1200" height="675"', 'width="1536" height="864"');
  }

  await writeFile(filePath, article, 'utf8');
  articleCount += 1;
}

console.log(`Finished the text-led Newsroom landing page and polished ${articleCount} article pages without rendering the retired News logo.`);
