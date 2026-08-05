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

const releases = [
  {
    name: '3 PM World Bank report',
    href: '/news/world-bank-philippines-growth-forecast-2026/',
    canonical: 'https://www.francinemariebautista.com/news/world-bank-philippines-growth-forecast-2026/',
    timestamp: '2026-08-05T15:00:00+08:00',
    file: 'news/world-bank-philippines-growth-forecast-2026/index.html',
  },
  {
    name: '1 PM vaccination report',
    href: '/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    canonical: 'https://www.francinemariebautista.com/news/measles-rubella-vaccination-august-2026-fmb-news-1pm/',
    timestamp: '2026-08-05T13:00:00+08:00',
    file: 'news/measles-rubella-vaccination-august-2026-fmb-news-1pm/index.html',
  },
  {
    name: 'noon newsroom briefing',
    href: '/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    canonical: 'https://www.francinemariebautista.com/news/fmb-news-hourly-briefing-august-5-2026-noon/',
    timestamp: '2026-08-05T12:00:00+08:00',
    file: 'news/fmb-news-hourly-briefing-august-5-2026-noon/index.html',
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

function articleBlocks(html) {
  return [...html.matchAll(/<article\b[^>]*class=(['"])[^'"]*\bnc-rundown-story\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/gi)]
    .map((match) => match[0]);
}

function releaseForBlock(block) {
  return releases.find((release) => block.includes(`href="${release.href}"`) || block.includes(`href='${release.href}'`));
}

function repairTimeline(html, routeName) {
  const blocks = articleBlocks(html);
  const selected = releases.map((release) => ({
    ...release,
    block: blocks.find((block) => block.includes(`href="${release.href}"`) || block.includes(`href='${release.href}'`)),
  }));

  const missing = selected.filter(({ block }) => !block);
  if (missing.length) {
    fatal(`${routeName} is missing timeline card(s): ${missing.map(({ name }) => name).join(', ')}`);
  }

  let repaired = html;
  const backlogBlocks = blocks.filter((block) => releaseForBlock(block));
  for (const block of backlogBlocks) repaired = repaired.replace(block, '');

  const firstStory = repaired.search(/<article\b[^>]*class=(['"])[^'"]*\bnc-rundown-story\b[^'"]*\1/i);
  if (firstStory < 0) fatal(`${routeName} has no remaining newsroom insertion point`);

  repaired = `${repaired.slice(0, firstStory)}${selected.map(({ block }) => block).join('')}${repaired.slice(firstStory)}`;
  repaired = repaired.replace(
    /<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/i,
    '<time data-news-updated>Updated 5 August 2026, 3:00 p.m. PHT</time>',
  );
  return repaired;
}

for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, relative);
  const before = await readFile(file, 'utf8');
  const after = repairTimeline(before, `/${relative.replace('/index.html', '')}`);
  if (after !== before) {
    await writeFile(file, after, 'utf8');
    console.log(`Deduplicated and repaired the August 5 newsroom timeline in ${relative}.`);
  }
}

const [home, newsIndex, fmbNewsIndex, sitemap, ...releasePages] = await Promise.all([
  readFile(path.join(dist, 'index.html'), 'utf8'),
  readFile(path.join(dist, 'news/index.html'), 'utf8'),
  readFile(path.join(dist, 'fmbnews/index.html'), 'utf8'),
  readFile(path.join(dist, 'sitemap.xml'), 'utf8'),
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
  const timeline = articleBlocks(html).map(releaseForBlock).filter(Boolean);
  for (const release of releases) {
    const count = timeline.filter((item) => item.href === release.href).length;
    if (count !== 1) fatal(`${routeName} must contain exactly one timeline card for ${release.name}, found ${count}`);
  }

  const expectedOrder = releases.map((release) => release.href);
  const firstThree = timeline.slice(0, releases.length).map((release) => release.href);
  if (firstThree.join('|') !== expectedOrder.join('|')) {
    fatal(`${routeName} August 5 card order is incorrect: ${timeline.map((release) => release.name).join(' -> ')}`);
  }

  if (!/Updated 5 August 2026, 3:00 p\.m\. PHT/i.test(html)) {
    fatal(`${routeName} updated timestamp does not reflect the 3 PM release`);
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

console.log(`FMB publication integrity gate passed the August 5 3 PM, 1 PM and noon release timeline with ${warnings.length} non-blocking visual warning(s).`);
