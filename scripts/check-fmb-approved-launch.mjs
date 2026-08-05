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

const releases = [
  {
    key: '3pm-world-bank',
    name: '3 PM World Bank report',
    badge: '3PM',
    section: 'Economy · 5 August 2026',
    title: 'World Bank Holds Philippine Growth Forecast at 3.7% as Recovery Risks Persist',
    readTime: '7 min read',
    href: '/news/world-bank-philippines-growth-forecast-2026/',
    canonical: 'https://www.francinemariebautista.com/news/world-bank-philippines-growth-forecast-2026/',
    timestamp: '2026-08-05T15:00:00+08:00',
    file: 'news/world-bank-philippines-growth-forecast-2026/index.html',
  },
  {
    key: '1pm-vaccination',
    name: '1 PM vaccination report',
    badge: '1PM',
    section: 'Public Health · 5 August 2026',
    title: 'August Measles-Rubella Vaccination Drive Targets Young Children',
    readTime: '8 min read',
    href: '/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    canonical: 'https://www.francinemariebautista.com/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    timestamp: '2026-08-05T13:00:00+08:00',
    file: 'news/measles-rubella-vaccination-august-2026-fmb-news-1pm/index.html',
  },
  {
    key: 'noon-briefing',
    name: 'noon newsroom briefing',
    badge: '12PM',
    section: 'Hourly Newsroom Cycle · 5 August 2026',
    title: 'FMB News Hourly Briefing: Space, Technology, Markets and Sport',
    readTime: '8 min read',
    href: '/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    canonical: 'https://www.francinemariebautista.com/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    timestamp: '2026-08-05T12:00:00+08:00',
    file: 'news/fmb-news-hourly-briefing-august-5-2026-noon/index.html',
  },
  {
    key: 'noon-falcon',
    name: 'noon Falcon 9 report',
    badge: '12PM',
    section: 'Technology and Science · 5 August 2026',
    title: 'Spent Falcon 9 Stage Expected to Strike the Moon',
    readTime: '5 min read',
    href: '/news/spent-falcon-9-stage-lunar-impact-august-5-2026/',
    canonical: 'https://www.francinemariebautista.com/news/spent-falcon-9-stage-lunar-impact-august-5-2026/',
    timestamp: '2026-08-05T12:00:00+08:00',
    file: 'news/spent-falcon-9-stage-lunar-impact-august-5-2026/index.html',
  },
  {
    key: '11am-un-poll',
    name: '11 AM UN poll report',
    badge: '11AM',
    section: 'World · 5 August 2026',
    title: 'UN Security Council Targets August 21 for Second Secretary-General Poll',
    readTime: '5 min read',
    href: '/news/un-security-council-second-secretary-general-poll-august-21/',
    canonical: 'https://www.francinemariebautista.com/news/un-security-council-second-secretary-general-poll-august-21/',
    timestamp: '2026-08-05T11:00:00+08:00',
    file: 'news/un-security-council-second-secretary-general-poll-august-21/index.html',
  },
  {
    key: '11am-italy-heat',
    name: '11 AM Italy heat report',
    badge: '11AM',
    section: 'Environment · 5 August 2026',
    title: 'Italy’s 27-City Heat Alert System Puts Public Health at the Center',
    readTime: '5 min read',
    href: '/news/italy-heat-alert-system-27-cities-public-health-august-2026/',
    canonical: 'https://www.francinemariebautista.com/news/italy-heat-alert-system-27-cities-public-health-august-2026/',
    timestamp: '2026-08-05T11:00:00+08:00',
    file: 'news/italy-heat-alert-system-27-cities-public-health-august-2026/index.html',
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

function releaseCard(release) {
  return `<article class="nc-rundown-story fmb-recovered-release" data-fmb-release="${esc(release.key)}"><a href="${esc(release.href)}"><span class="nc-rundown-number">${esc(release.badge)}</span><div><p>${esc(release.section)}</p><h3>${esc(release.title)}</h3><span>${esc(release.readTime)}</span></div></a></article>`;
}

function buildRecoveryTimeline(html, routeName) {
  const timeline = `<section class="wrap nc-rundown-panel fmb-recovered-news-timeline" id="fmb-august-5-timeline" aria-labelledby="fmbAugust5TimelineTitle">
    <div class="nc-rundown-head"><div><span>Publication recovery</span><h2 id="fmbAugust5TimelineTitle">Latest reports</h2></div><time data-news-updated>Updated 5 August 2026, 3:00 p.m. PHT</time></div>
    ${releases.map(releaseCard).join('\n    ')}
  </section>`;

  let repaired = html.replace(/<section\b[^>]*\bid=(['"])fmb-august-5-timeline\1[^>]*>[\s\S]*?<\/section>\s*/gi, '');
  if (!/<main\b[^>]*>/i.test(repaired)) fatal(`${routeName} is missing a main content element`);
  repaired = repaired.replace(/(<main\b[^>]*>)/i, `$1\n${timeline}`);
  return repaired;
}

for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, relative);
  const before = await readFile(file, 'utf8');
  const after = buildRecoveryTimeline(before, `/${relative.replace('/index.html', '')}`);
  await writeFile(file, after, 'utf8');
  console.log(`Published the restored August 5 timeline in ${relative}.`);
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
console.log(`Verified August 5 sitemap coverage; added ${sitemapAdded} missing recovery URL(s).`);

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
  if (!html.includes(release.timestamp)) {
    fatal(`${release.name} is missing its intended publication timestamp ${release.timestamp}`);
  }
  if (!sitemap.includes(release.canonical)) {
    fatal(`${release.name} is missing from sitemap.xml`);
  }
}

for (const [routeName, html] of [['/news', newsIndex], ['/fmbnews', fmbNewsIndex]]) {
  const section = html.match(/<section\b[^>]*\bid=(['"])fmb-august-5-timeline\1[^>]*>[\s\S]*?<\/section>/i)?.[0];
  if (!section) fatal(`${routeName} is missing the restored August 5 timeline`);

  const positions = releases.map((release) => {
    const marker = `data-fmb-release="${release.key}"`;
    const count = section.split(marker).length - 1;
    if (count !== 1) fatal(`${routeName} restored timeline must contain exactly one ${release.name} card, found ${count}`);
    if (!section.includes(`href="${release.href}"`)) fatal(`${routeName} ${release.name} card has the wrong link`);
    return section.indexOf(marker);
  });
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] <= positions[index - 1]) {
      fatal(`${routeName} restored timeline is not newest-first at ${releases[index].name}`);
    }
  }
  if (!/Updated 5 August 2026, 3:00 p\.m\. PHT/i.test(section)) {
    fatal(`${routeName} restored timeline timestamp does not reflect the 3 PM release`);
  }

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

console.log(`FMB publication integrity gate passed the restored six-story August 5 timeline with ${warnings.length} non-blocking visual warning(s).`);
