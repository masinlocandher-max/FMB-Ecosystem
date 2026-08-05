import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const assetsRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css');
const distCssRoot = path.join(repositoryRoot, 'dist', 'assets', 'css');
const identityRecord = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const leadImageUrl = 'https://www.francinemariebautista.com/assets/images/news/todays-headlines-august-2-2026.svg';
const stylesheets = [
  {
    source: path.join(assetsRoot, 'news-center-v2.css'),
    destination: path.join(distCssRoot, 'news-center-v2.css'),
  },
  {
    source: path.join(assetsRoot, 'fmb-news-polish-v3.css'),
    destination: path.join(distCssRoot, 'fmb-news-polish-v3.css'),
  },
  {
    source: path.join(assetsRoot, 'fmb-news-channel-v4.css'),
    destination: path.join(distCssRoot, 'fmb-news-channel-v4.css'),
  },
];

function replaceRequired(html, search, replacement, label) {
  if (typeof search === 'string') {
    if (!html.includes(search)) throw new Error(`Newsroom redesign: missing ${label}`);
    return html.replace(search, replacement);
  }
  if (!search.test(html)) throw new Error(`Newsroom redesign: missing ${label}`);
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

function stripRetiredFont(html) {
  return html.replace(/<link\b[^>]*href=["'][^"']*fonts\.googleapis\.com\/css2\?family=Cormorant\+Garamond[^"']*["'][^>]*>\s*/gi, '');
}

function textMasthead(label = 'FMB News Center home', footer = false) {
  const className = footer
    ? 'nc-footer-brand nc-text-masthead nc-footer-masthead'
    : 'nc-publication-brand nc-text-masthead';
  return `<a class="${className}" href="/news/" aria-label="${label}">
      <span class="nc-masthead-monogram" aria-hidden="true">FMB</span>
      <span class="nc-masthead-copy"><strong class="nc-masthead-title">News Center</strong><span class="nc-masthead-tagline">Filipino ang Mismong Balita.</span></span>
    </a>`;
}

function channelHero() {
  return `<section class="nc-broadcast-identity nc-channel-hero" aria-labelledby="newsroomTitle">
    <div class="wrap nc-channel-id">
      <div class="nc-channel-lockup nc-newsroom-title">
        <span class="nc-hero-kicker" data-news-edition>Current edition</span>
        <h1 id="newsroomTitle"><span class="nc-hero-title-lead">Filipino ang</span><span class="nc-hero-title-accent">Mismong Balita.</span></h1>
        <p class="nc-hero-summary">The Filipino is not merely the audience. The Filipino experience, voice and public interest are at the center of every report.</p>
        <div class="nc-hero-dateline"><span>Masinloc, Zambales</span><span data-news-date>Philippine Standard Time</span></div>
      </div>
      <div class="nc-channel-promise nc-reveal">
        <div class="nc-live-status"><i aria-hidden="true"></i><span>Live News Desk</span></div>
        <p><span>Headlines<b>.</b></span><span>Context<b>.</b></span><span>Accountability<b>.</b></span></p>
        <span>Reporting for Filipinos, wherever they are</span>
        <div class="nc-channel-service" aria-label="Newsroom coverage areas"><span>Philippines</span><span>Zambales</span><span>Public affairs</span><span>Culture</span></div>
      </div>
    </div>
  </section>`;
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

let landing = stripRetiredFont(await readFile(landingPath, 'utf8'));
landing = landing.replace(/<meta\b[^>]*name=["']fmb-news-identity-record["'][^>]*>\s*/gi, '');
landing = addBodyClass(landing, 'news-center-v2');
landing = addBodyClass(landing, 'newsroom-polish-v3');
landing = addBodyClass(landing, 'news-channel-v4');

landing = landing
  .replace('<title>FMB News | Public-Interest Reporting and Analysis</title>', '<title>FMB News Center | Filipino ang Mismong Balita</title>')
  .replace(
    '<meta name="description" content="FMB News publishes public-interest reporting, source-backed context, constructive reporting and clearly labeled perspective from Francine Marie Bautista and the FMB ecosystem.">',
    '<meta name="description" content="FMB News Center publishes Philippine public-interest reporting, verified context and clearly labeled perspective. Filipino ang Mismong Balita.">',
  )
  .replace('<meta property="og:title" content="FMB News | Public-Interest Reporting and Analysis">', '<meta property="og:title" content="FMB News Center | Filipino ang Mismong Balita">')
  .replace(
    '<meta property="og:description" content="The official newsroom of the FMB ecosystem, built around sourced reporting, context, constructive journalism and clearly labeled perspective.">',
    '<meta property="og:description" content="A Philippine news center where the Filipino voice, experience and public interest remain at the center of every report.">',
  )
  .replaceAll('https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp', leadImageUrl)
  .replace('<meta property="og:site_name" content="FMB News">', '<meta property="og:site_name" content="FMB News Center">')
  .replace('<meta name="twitter:title" content="FMB News">', '<meta name="twitter:title" content="FMB News Center">')
  .replace(
    '<meta name="twitter:description" content="Public-interest reporting, source-backed context and clearly labeled perspective.">',
    '<meta name="twitter:description" content="Filipino ang Mismong Balita. Philippine reporting, verified context and visible perspective.">',
  )
  .replaceAll('FMB News Network', 'FMB News Center')
  .replaceAll('FMB Newsroom', 'FMB News Center')
  .replaceAll('FMB News is designed to slow down', 'FMB News Center is designed to slow down')
  .replace('Original FMB News conceptual illustration.', 'Original FMB News Center conceptual illustration.')
  .replace('<time>Updated 26 July 2026</time>', '<time data-news-updated>Updated today</time>');

if (!landing.includes('<meta property="og:image:width"')) {
  landing = replaceRequired(
    landing,
    `<meta property="og:image" content="${leadImageUrl}">`,
    `<meta property="og:image" content="${leadImageUrl}">\n<meta property="og:image:width" content="1536">\n<meta property="og:image:height" content="864">\n<meta property="og:image:alt" content="The current lead report from FMB News Center">`,
    'News Center Open Graph image',
  );
}

landing = replaceRequired(
  landing,
  /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-publication-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
  textMasthead(),
  'landing masthead',
);

landing = replaceRequired(
  landing,
  /<section\b(?=[^>]*\bclass=["'][^"']*\bnc-broadcast-identity\b[^"']*["'])[^>]*>[\s\S]*?<\/section>/i,
  channelHero(),
  'landing channel hero',
);

landing = replaceRequired(
  landing,
  /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-footer-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
  textMasthead('FMB News Center home', true),
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
  throw new Error('Newsroom redesign: retired FMB News logo remains visibly rendered on the landing page');
}
await writeFile(landingPath, landing, 'utf8');

const allNewsPages = await walkHtml(newsRoot);
let articleCount = 0;
let mastheadCompatibilityWarnings = 0;
for (const filePath of allNewsPages) {
  if (filePath === landingPath) continue;
  let article = stripRetiredFont(await readFile(filePath, 'utf8'));
  if (!/\bnews-story-route\b/.test(article)) continue;

  article = addBodyClass(article, 'newsroom-polish-v3');
  article = addBodyClass(article, 'news-channel-v4');
  article = article
    .replaceAll('FMB&amp;CO. News Network', 'FMB News Center')
    .replaceAll('FMB&amp;CO. News Desk', 'FMB News Desk')
    .replaceAll('FMB&amp;CO. News', 'FMB News Center')
    .replaceAll('FMB&CO. News', 'FMB News Center')
    .replaceAll('FMB and Company News', 'FMB News Center');

  const articleMastheadPattern = /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-publication-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i;
  if (articleMastheadPattern.test(article)) {
    article = article.replace(articleMastheadPattern, textMasthead('FMB News Center front page'));
  } else {
    mastheadCompatibilityWarnings += 1;
    console.warn(`Newsroom visual compatibility: ${path.basename(path.dirname(filePath))} has no legacy nc-publication-brand masthead; later unified masthead stages will supply the current identity.`);
  }

  article = article.replace(
    /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-footer-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
    textMasthead('FMB News Center home', true),
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

console.log(`Applied the approved red-white FMB News Center identity and Filipino ang Mismong Balita tagline to the landing page and ${articleCount} report pages with ${mastheadCompatibilityWarnings} non-blocking legacy-masthead warning(s).`);
