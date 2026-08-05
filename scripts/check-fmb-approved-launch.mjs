import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const warnings = [];
const warn = (message) => {
  warnings.push(message);
  console.warn(`FMB approved launch visual audit: ${message}`);
};
const fatal = (message) => {
  throw new Error(`FMB publication integrity gate: ${message}`);
};
const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');
const rx = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const releases = [
  {
    key: '3pm-world-bank',
    name: '3 PM World Bank report',
    badge: '3PM',
    category: 'money',
    section: 'Economy · 5 August 2026',
    title: 'World Bank Holds Philippine Growth Forecast at 3.7% as Recovery Risks Persist',
    deck: 'The Philippine outlook remains positive, but weaker demand, fiscal pressure and external shocks still threaten the pace of recovery.',
    readTime: '7 min read',
    href: '/news/world-bank-philippines-growth-forecast-2026/',
    canonical: 'https://www.francinemariebautista.com/news/world-bank-philippines-growth-forecast-2026/',
    timestamp: '2026-08-05T15:00:00+08:00',
    file: 'news/world-bank-philippines-growth-forecast-2026/index.html',
    image: '/assets/images/news/fmb-news-world-bank-growth-2026.svg',
    width: 1080,
    height: 1350,
    alt: 'FMB News illustration for the World Bank Philippine growth outlook',
    credit: 'Original FMB News editorial illustration.',
  },
  {
    key: '1pm-vaccination',
    name: '1 PM vaccination report',
    badge: '1PM',
    category: 'health',
    section: 'Public Health · 5 August 2026',
    title: 'August Measles-Rubella Vaccination Drive Targets Young Children',
    deck: 'Health authorities are urging families to protect young children through the August vaccination campaign.',
    readTime: '8 min read',
    href: '/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    canonical: 'https://www.francinemariebautista.com/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    timestamp: '2026-08-05T13:00:00+08:00',
    file: 'news/measles-rubella-vaccination-august-2026-fmb-news-1pm/index.html',
    image: '/assets/images/news/fmb-news-measles-rubella-august-2026.svg',
    width: 1200,
    height: 675,
    alt: 'FMB News illustration for the measles-rubella vaccination campaign',
    credit: 'Original FMB News editorial illustration.',
  },
  {
    key: 'noon-briefing',
    name: 'noon newsroom briefing',
    badge: '12PM',
    category: 'world',
    section: 'Hourly Newsroom Cycle · 5 August 2026',
    title: 'FMB News Hourly Briefing: Space, Technology, Markets and Sport',
    deck: 'Four sourced developments selected for their relevance to Filipinos, with verified facts separated from analysis.',
    readTime: '8 min read',
    href: '/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    canonical: 'https://www.francinemariebautista.com/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    timestamp: '2026-08-05T12:00:00+08:00',
    file: 'news/fmb-news-hourly-briefing-august-5-2026-noon/index.html',
    image: '/assets/images/fmb-approved/fmb-news-official-transparent.webp',
    width: 909,
    height: 210,
    alt: 'FMB News official identity',
    credit: 'FMB News newsroom identity graphic.',
  },
  {
    key: 'noon-falcon',
    name: 'noon Falcon 9 report',
    badge: '12PM',
    category: 'tech',
    section: 'Technology and Science · 5 August 2026',
    title: 'Spent Falcon 9 Stage Expected to Strike the Moon',
    deck: 'Researchers are preparing to observe a rare predicted lunar impact involving a spent rocket stage.',
    readTime: '5 min read',
    href: '/news/spent-falcon-9-stage-lunar-impact-august-5-2026/',
    canonical: 'https://www.francinemariebautista.com/news/spent-falcon-9-stage-lunar-impact-august-5-2026/',
    timestamp: '2026-08-05T12:00:00+08:00',
    file: 'news/spent-falcon-9-stage-lunar-impact-august-5-2026/index.html',
    image: '/assets/images/fmb-approved/fmb-news-official-transparent.webp',
    width: 909,
    height: 210,
    alt: 'FMB News official identity',
    credit: 'FMB News newsroom identity graphic.',
  },
  {
    key: '11am-un-poll',
    name: '11 AM UN poll report',
    badge: '11AM',
    category: 'world',
    section: 'World · 5 August 2026',
    title: 'UN Security Council Targets August 21 for Second Secretary-General Poll',
    deck: 'The Security Council is preparing another informal vote as members narrow the field for the United Nations’ next leader.',
    readTime: '5 min read',
    href: '/news/un-security-council-second-secretary-general-poll-august-21/',
    canonical: 'https://www.francinemariebautista.com/news/un-security-council-second-secretary-general-poll-august-21/',
    timestamp: '2026-08-05T11:00:00+08:00',
    file: 'news/un-security-council-second-secretary-general-poll-august-21/index.html',
    image: '/assets/images/news/un-security-council-second-secretary-general-poll-august-21.svg',
    width: 1200,
    height: 630,
    alt: 'FMB News illustration for the United Nations secretary-general selection process',
    credit: 'Original FMB News editorial illustration.',
  },
  {
    key: '11am-italy-heat',
    name: '11 AM Italy heat report',
    badge: '11AM',
    category: 'environment',
    section: 'Environment · 5 August 2026',
    title: 'Italy’s 27-City Heat Alert System Puts Public Health at the Center',
    deck: 'Italy combines weather forecasts and health-risk data to trigger city-level prevention measures before extreme heat turns deadly.',
    readTime: '5 min read',
    href: '/news/italy-heat-alert-system-27-cities-public-health-august-2026/',
    canonical: 'https://www.francinemariebautista.com/news/italy-heat-alert-system-27-cities-public-health-august-2026/',
    timestamp: '2026-08-05T11:00:00+08:00',
    file: 'news/italy-heat-alert-system-27-cities-public-health-august-2026/index.html',
    image: '/assets/images/news/italy-heat-alert-system-27-cities-public-health-august-2026.svg',
    width: 1200,
    height: 630,
    alt: 'FMB News illustration for Italy’s city-level heat-health alert system',
    credit: 'Original FMB News editorial illustration.',
  },
  {
    key: '1055am-psa-inflation',
    name: '10:55 AM PSA inflation briefing',
    badge: '10:55',
    category: 'money',
    section: 'Business and Economy · 5 August 2026',
    title: 'PSA Holds Briefing on July 2026 Inflation',
    deck: 'The official release explains how consumer prices moved in July and which goods and services drove the change.',
    readTime: '4 min read',
    href: '/news/psa-july-2026-inflation-briefing-august-5/',
    canonical: 'https://www.francinemariebautista.com/news/psa-july-2026-inflation-briefing-august-5/',
    timestamp: '2026-08-05T10:55:00+08:00',
    file: 'news/psa-july-2026-inflation-briefing-august-5/index.html',
    image: '/assets/images/fmb-approved/fmb-news-official-transparent.webp',
    width: 909,
    height: 210,
    alt: 'FMB News official identity',
    credit: 'FMB News newsroom identity graphic.',
  },
];

const requiredFiles = [
  'index.html',
  'news/index.html',
  'fmbnews/index.html',
  'sitemap.xml',
  'assets/css/fmb-unified-system.css',
  'assets/css/fmb-sitewide-visual-fixes.css',
  'assets/js/fmb-unified-system.js',
  ...releases.map((release) => release.file),
];
for (const relative of requiredFiles) {
  const file = path.join(dist, relative);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile() || info.size < 1) fatal(`${relative} is missing or empty`);
}

function media(release) {
  return `<figure class="news-visual"><img src="${esc(release.image)}" width="${release.width}" height="${release.height}" loading="lazy" decoding="async" alt="${esc(release.alt)}"><figcaption>${esc(release.credit)}</figcaption></figure>`;
}
function reportCard(release) {
  return `<article class="nc-rundown-story fn9-report-card fmb-august-5-report" data-category="${esc(release.category)}" data-fn9-searchable data-fmb-release-card="${esc(release.key)}"><a href="${esc(release.href)}"><span class="nc-rundown-number">${esc(release.badge)}</span>${media(release)}<div><p>${esc(release.section)}</p><h3>${esc(release.title)}</h3><span>${esc(release.readTime)}</span></div></a></article>`;
}
function updateCard(release) {
  return `<article class="nc-rundown-story fn9-update-item fmb-august-5-update" data-category="${esc(release.category)}" data-fn9-searchable data-fmb-release-update="${esc(release.key)}"><a href="${esc(release.href)}"><span class="nc-rundown-number">${esc(release.badge)}</span>${media(release)}<div><p>${esc(release.section)}</p><h3>${esc(release.title)}</h3><span>${esc(release.readTime)}</span></div></a></article>`;
}
function leadStory(release) {
  return `<section class="fn9-hero" id="top-story" aria-label="Top story"><div class="fn9-shell"><article class="nc-lead-broadcast nc-reveal" data-fmb-release-hero="${esc(release.key)}"><a href="${esc(release.href)}">${media(release)}<div class="nc-lead-overlay"><span class="nc-signal-tag"><i></i> ${esc(release.section)}</span><p class="nc-lead-meta">Latest report <span>${esc(release.readTime)}</span></p><h2>${esc(release.title)}</h2><p class="nc-lead-deck">${esc(release.deck)}</p><span class="nc-broadcast-action">Read the full report <b>→</b></span></div></a></article></div></section>`;
}
function removeArticleForRoute(html, href) {
  const route = rx(href);
  const pattern = new RegExp(`<article\\b(?:(?!<article\\b)[\\s\\S])*?<a\\b[^>]*href=["']${route}["'][^>]*>(?:(?!<article\\b)[\\s\\S])*?<\\/article>\\s*`, 'gi');
  return html.replace(pattern, '');
}
function timelineSchema() {
  return `<script type="application/ld+json" data-fmb-news-august-5-timeline>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': 'https://www.francinemariebautista.com/fmbnews/#august-5-2026-timeline',
    name: 'FMB News reports published on August 5, 2026',
    numberOfItems: releases.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: releases.map((release, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: release.canonical,
      name: release.title,
    })),
  })}</script>`;
}

function integrateTimeline(html, routeName) {
  let repaired = html
    .replace(/<section\b[^>]*\bid=(["'])fmb-august-5-timeline\1[^>]*>[\s\S]*?<\/section>\s*/gi, '')
    .replace(/<section\s+class=(["'])nc-rundown\1>[\s\S]*?<\/section>\s*/gi, '')
    .replace(/<script\b[^>]*data-fmb-news-august-5-timeline[^>]*>[\s\S]*?<\/script>\s*/gi, '');

  for (const release of releases) repaired = removeArticleForRoute(repaired, release.href);

  const heroPattern = /<section\b[^>]*class=(["'])[^"']*\bfn9-hero\b[^"']*\1[^>]*\bid=(["'])top-story\2[^>]*>[\s\S]*?<\/section>/i;
  if (!heroPattern.test(repaired)) fatal(`${routeName} has no replaceable top-story hero`);
  repaired = repaired.replace(heroPattern, leadStory(releases[0]));

  const reportGridPattern = /(<div\b[^>]*class=(["'])[^"']*\bfn9-report-grid\b[^"']*\2[^>]*>)/i;
  if (!reportGridPattern.test(repaired)) fatal(`${routeName} has no Latest reports grid`);
  repaired = repaired.replace(reportGridPattern, `$1\n${releases.map(reportCard).join('\n')}`);

  const updateListPattern = /(<div\b[^>]*class=(["'])[^"']*\bfn9-update-list\b[^"']*\2[^>]*>)[\s\S]*?(?=<\/div>\s*<\/aside>)/i;
  if (!updateListPattern.test(repaired)) fatal(`${routeName} has no replaceable Latest updates list`);
  repaired = repaired.replace(updateListPattern, `$1\n${releases.map(updateCard).join('\n')}`);

  repaired = repaired.replace(/View all\s+\d+\s+published reports\s*→/gi, 'View all published reports →');
  if (!/<\/head>/i.test(repaired)) fatal(`${routeName} has no closing head element`);
  repaired = repaired.replace(/<\/head>/i, `${timelineSchema()}</head>`);
  return repaired;
}

for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, relative);
  const before = await readFile(file, 'utf8');
  const after = integrateTimeline(before, `/${relative.replace('/index.html', '')}`);
  await writeFile(file, after, 'utf8');
  console.log(`Integrated the August 5 reports into the real newsroom feed in ${relative}.`);
}

const sitemapPath = path.join(dist, 'sitemap.xml');
let sitemapRepair = await readFile(sitemapPath, 'utf8');
let sitemapAdded = 0;
for (const release of releases) {
  if (sitemapRepair.includes(`<loc>${release.canonical}</loc>`)) continue;
  sitemapRepair = sitemapRepair.replace(
    '</urlset>',
    `  <url><loc>${release.canonical}</loc><lastmod>2026-08-05</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>\n</urlset>`,
  );
  sitemapAdded += 1;
}
if (sitemapAdded > 0) await writeFile(sitemapPath, sitemapRepair, 'utf8');
console.log(`Verified August 5 sitemap coverage; added ${sitemapAdded} missing URL(s).`);

const [home, newsIndex, fmbNewsIndex, sitemap, ...releasePages] = await Promise.all([
  readFile(path.join(dist, 'index.html'), 'utf8'),
  readFile(path.join(dist, 'news/index.html'), 'utf8'),
  readFile(path.join(dist, 'fmbnews/index.html'), 'utf8'),
  readFile(sitemapPath, 'utf8'),
  ...releases.map((release) => readFile(path.join(dist, release.file), 'utf8')),
]);

for (let index = 0; index < releases.length; index += 1) {
  const release = releases[index];
  const html = releasePages[index];
  if (!newsIndex.includes(release.href) || !fmbNewsIndex.includes(release.href)) {
    fatal(`${release.name} is not linked from both newsroom landing pages`);
  }
  if (!html.includes(release.timestamp)) fatal(`${release.name} is missing timestamp ${release.timestamp}`);
  if (!sitemap.includes(release.canonical)) fatal(`${release.name} is missing from sitemap.xml`);
}

for (const [routeName, html] of [['/news', newsIndex], ['/fmbnews', fmbNewsIndex]]) {
  if (/id=(["'])fmb-august-5-timeline\1/i.test(html)) fatal(`${routeName} still contains the temporary recovery block`);
  if (/<section\s+class=(["'])nc-rundown\1>/i.test(html)) fatal(`${routeName} still contains the malformed legacy rundown`);

  const hero = html.match(/<section\b[^>]*class=(["'])[^"']*\bfn9-hero\b[^"']*\1[^>]*\bid=(["'])top-story\2[^>]*>[\s\S]*?<\/section>/i)?.[0] || '';
  if (!hero.includes(`data-fmb-release-hero="${releases[0].key}"`) || !hero.includes(`href="${releases[0].href}"`)) {
    fatal(`${routeName} top story is not the 3 PM World Bank report`);
  }

  const gridStart = html.search(/<div\b[^>]*class=(["'])[^"']*\bfn9-report-grid\b[^"']*\1[^>]*>/i);
  const updatesStart = html.search(/<aside\b[^>]*class=(["'])[^"']*\bfn9-updates\b[^"']*\1[^>]*>/i);
  if (gridStart < 0 || updatesStart <= gridStart) fatal(`${routeName} Latest reports grid boundaries are invalid`);
  const grid = html.slice(gridStart, updatesStart);
  const gridPositions = releases.map((release) => {
    const marker = `data-fmb-release-card="${release.key}"`;
    const count = grid.split(marker).length - 1;
    if (count !== 1) fatal(`${routeName} Latest reports must contain one ${release.name}, found ${count}`);
    return grid.indexOf(marker);
  });
  for (let index = 1; index < gridPositions.length; index += 1) {
    if (gridPositions[index] <= gridPositions[index - 1]) fatal(`${routeName} Latest reports are out of order at ${releases[index].name}`);
  }

  const updates = html.match(/<aside\b[^>]*class=(["'])[^"']*\bfn9-updates\b[^"']*\1[^>]*>[\s\S]*?<\/aside>/i)?.[0] || '';
  const updatePositions = releases.map((release) => {
    const marker = `data-fmb-release-update="${release.key}"`;
    const count = updates.split(marker).length - 1;
    if (count !== 1) fatal(`${routeName} Latest updates must contain one ${release.name}, found ${count}`);
    return updates.indexOf(marker);
  });
  for (let index = 1; index < updatePositions.length; index += 1) {
    if (updatePositions[index] <= updatePositions[index - 1]) fatal(`${routeName} Latest updates are out of order at ${releases[index].name}`);
  }

  if (!html.includes('data-fmb-news-august-5-timeline')) fatal(`${routeName} is missing the August 5 structured timeline`);
  for (const visualMarker of ['fmb-unified-public', 'fmb-approved-launch', 'fmb-announcement-track', 'fmb-sitewide-visual-fixes.css']) {
    if (!html.includes(visualMarker)) warn(`${routeName} is missing visual marker ${visualMarker}`);
  }
}

for (const [route, html] of [
  ['index.html', home],
  ['withlovefmb/index.html', await readFile(path.join(dist, 'withlovefmb/index.html'), 'utf8')],
  ['get-involved/index.html', await readFile(path.join(dist, 'get-involved/index.html'), 'utf8')],
]) {
  if (/\baccept(?:s|ing)? donations?\b/i.test(html) || /sponsorship, donations/i.test(html)) {
    fatal(`${route} conflicts with the no-donation policy`);
  }
}

console.log(`FMB publication integrity gate passed the real seven-story August 5 newsroom feed with ${warnings.length} non-blocking visual warning(s).`);
