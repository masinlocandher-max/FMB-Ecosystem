import { readFile, stat } from 'node:fs/promises';
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

const requiredFiles = [
  'index.html',
  'news/index.html',
  'fmbnews/index.html',
  'sitemap.xml',
  'assets/css/fmb-unified-system.css',
  'assets/css/fmb-sitewide-visual-fixes.css',
  'assets/js/fmb-unified-system.js',
  'news/fmb-news-hourly-briefing-august-5-2026-noon/index.html',
  'news/measles-rubella-vaccination-august-2026-fmb-news-1pm/index.html',
  'news/world-bank-philippines-growth-forecast-2026/index.html',
];

for (const relative of requiredFiles) {
  const file = path.join(dist, relative);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile() || info.size < 1) fatal(`${relative} is missing or empty`);
}

const [home, newsIndex, fmbNewsIndex, sitemap, noon, onePm, threePm] = await Promise.all([
  readFile(path.join(dist, 'index.html'), 'utf8'),
  readFile(path.join(dist, 'news/index.html'), 'utf8'),
  readFile(path.join(dist, 'fmbnews/index.html'), 'utf8'),
  readFile(path.join(dist, 'sitemap.xml'), 'utf8'),
  readFile(path.join(dist, 'news/fmb-news-hourly-briefing-august-5-2026-noon/index.html'), 'utf8'),
  readFile(path.join(dist, 'news/measles-rubella-vaccination-august-2026-fmb-news-1pm/index.html'), 'utf8'),
  readFile(path.join(dist, 'news/world-bank-philippines-growth-forecast-2026/index.html'), 'utf8'),
]);

const releases = [
  {
    name: '3 PM World Bank report',
    href: '/news/world-bank-philippines-growth-forecast-2026/',
    canonical: 'https://www.francinemariebautista.com/news/world-bank-philippines-growth-forecast-2026/',
    timestamp: '2026-08-05T15:00:00+08:00',
    html: threePm,
  },
  {
    name: '1 PM vaccination report',
    href: '/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    canonical: 'https://www.francinemariebautista.com/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    timestamp: '2026-08-05T13:00:00+08:00',
    html: onePm,
  },
  {
    name: 'noon newsroom briefing',
    href: '/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    canonical: 'https://www.francinemariebautista.com/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    timestamp: '2026-08-05T12:00:00+08:00',
    html: noon,
  },
];

for (const release of releases) {
  if (!newsIndex.includes(release.href) && !fmbNewsIndex.includes(release.href)) {
    fatal(`${release.name} is not linked from either newsroom landing page`);
  }
  if (!release.html.includes(release.timestamp)) {
    fatal(`${release.name} is missing its intended publication timestamp ${release.timestamp}`);
  }
  if (!sitemap.includes(release.canonical)) {
    fatal(`${release.name} is missing from sitemap.xml`);
  }
}

const combinedLanding = `${fmbNewsIndex}\n${newsIndex}`;
const positions = releases.map((release) => ({ name: release.name, position: combinedLanding.indexOf(release.href) }));
if (positions.some(({ position }) => position < 0)) fatal('one or more August 5 releases are absent from the newsroom timeline');
if (!(positions[0].position < positions[1].position && positions[1].position < positions[2].position)) {
  fatal(`August 5 newsroom order is incorrect: ${positions.map(({ name, position }) => `${name}=${position}`).join(', ')}`);
}

if (!/Updated 5 August 2026, 3:00 p\.m\. PHT/i.test(combinedLanding)) {
  fatal('the newsroom updated timestamp does not reflect the 3 PM release');
}

for (const [name, html] of [['/news', newsIndex], ['/fmbnews', fmbNewsIndex]]) {
  for (const visualMarker of ['fmb-unified-public', 'fmb-approved-launch', 'fmb-announcement-track', 'fmb-sitewide-visual-fixes.css']) {
    if (!html.includes(visualMarker)) warn(`${name} is missing visual marker ${visualMarker}`);
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

console.log(`FMB publication integrity gate passed the August 5 noon, 1 PM and 3 PM release timeline with ${warnings.length} non-blocking visual warning(s).`);
