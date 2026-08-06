import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
const excluded = new Set([
  'build.mjs',
  'dist',
  'node_modules',
  'package-lock.json',
  'package.json',
  'vercel.json',
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name) || entry.name.startsWith('.env')) continue;
  await cp(path.join(root, entry.name), path.join(output, entry.name), {
    recursive: true,
    force: true,
  });
}

const homePath = path.join(output, 'index.html');
let homeHtml = await readFile(homePath, 'utf8');
if (!/rel=["']manifest["']/i.test(homeHtml)) {
  homeHtml = homeHtml.replace('</head>', '<link rel="manifest" href="/manifest.webmanifest">\n</head>');
  await writeFile(homePath, homeHtml, 'utf8');
}

async function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

const newsRoot = path.join(output, 'news');
const newsHtmlFiles = await collectHtmlFiles(newsRoot);
const legacyNewsCss = /<link[^>]+href=["'][^"']*\/assets\/css\/(?:site|fmb-polish|fmb-content(?:-final)?|fmb-footer(?:-final|-v2)?|news-channel|fmb-news-luxury|fmb-news-headquarters|fmb-news-responsive|fmb-news-articles)\.css[^"']*["'][^>]*>\s*/gi;
const legacyNewsScripts = /<script[^>]+src=["'][^"']*\/assets\/js\/(?:news-channel|fmb-news-headquarters)\.js[^"']*["'][^>]*><\/script>\s*/gi;
const headquartersCss = '<link rel="stylesheet" href="/assets/css/fmb-news-headquarters.css?v=20260806f">';
const responsiveCss = '<link rel="stylesheet" href="/assets/css/fmb-news-responsive.css?v=20260806f">';
const articlesCss = '<link rel="stylesheet" href="/assets/css/fmb-news-articles.css?v=20260806f">';
const headquartersJs = '<script src="/assets/js/fmb-news-headquarters.js?v=20260806f" defer></script>';

const newsroomTextReplacements = [
  ['FMB&amp;CO. News Network', 'FMB News Network'],
  ['FMB&amp;CO. News Desk', 'FMB News Desk'],
  ['FMB&amp;CO. News', 'FMB News'],
  ['FMB&CO. News Network', 'FMB News Network'],
  ['FMB&CO. News Desk', 'FMB News Desk'],
  ['FMB&CO. News', 'FMB News'],
  ['FMB and Company News', 'FMB News'],
  ['The official newsroom of the FMB ecosystem', 'News explained for Filipinos'],
  ['Context before noise.<br>Reporting before reaction.', 'What happened.<br>Why it matters to Filipinos.'],
  ['Independent Philippine reporting, clear context, and perspective with responsibility.', 'News for Filipinos, with context that explains why every story matters.'],
  ['Public-interest reporting, source-backed context and clearly labeled perspective.', 'News, context, and clear explanations of why today’s events matter to Filipinos.'],
  ['<b>Live</b>', '<b>Newsroom</b>'],
  ['aria-label="Live newsroom wire"', 'aria-label="Newsroom wire"'],
  ['<span>Live desk</span>', '<span>News desk</span>'],
  ['>Watch live<', '>Explore news<'],
  ['>Live TV<', '>FMB News<'],
  ['>On air<', '>Newsroom<'],
  ['>Broadcast status<', '>Editorial standards<'],
  ['>Live feed<', '>Latest coverage<'],
  ['>Streaming<', '>Publishing<'],
  ['>Uplink<', '>Verification<'],
  ['/assets/images/fmbandco/fmbandco-primary-reversed.png', '/assets/images/fmb-approved/fmb-news-official-transparent.webp'],
  ['/assets/images/fmbandco/fmbandco-ampersand-gold.png', '/assets/images/fmb-approved/fmb-master-purple-square.webp'],
  ['content="#120b20"', 'content="#ffffff"'],
  ['content="#171218"', 'content="#ffffff"'],
];

for (const newsFile of newsHtmlFiles) {
  let newsHtml = await readFile(newsFile, 'utf8');
  newsHtml = newsHtml.replace(legacyNewsCss, '').replace(legacyNewsScripts, '');

  for (const [from, to] of newsroomTextReplacements) {
    newsHtml = newsHtml.split(from).join(to);
  }

  if (!newsHtml.includes('fmb-news-headquarters.css')) {
    newsHtml = newsHtml.replace(
      '</head>',
      `${headquartersCss}\n${responsiveCss}\n${articlesCss}\n${headquartersJs}\n</head>`,
    );
  }

  await writeFile(newsFile, newsHtml, 'utf8');
}

const forbiddenLegacyPatterns = [
  { label: 'old broadcast stylesheet', pattern: /news-channel\.css/i },
  { label: 'old luxury newsroom stylesheet', pattern: /fmb-news-luxury\.css/i },
  { label: 'old broadcast script', pattern: /news-channel\.js/i },
  { label: 'old FMB&CO. News identity', pattern: /FMB(?:&|&amp;)CO\. News/i },
  { label: 'old corporate newsroom logo', pattern: /fmbandco-primary-reversed\.png/i },
];

const requiredRebrandPatterns = [
  { label: 'headquarters stylesheet', pattern: /fmb-news-headquarters\.css/i },
  { label: 'responsive stylesheet', pattern: /fmb-news-responsive\.css/i },
  { label: 'article stylesheet', pattern: /fmb-news-articles\.css/i },
  { label: 'official FMB News identity', pattern: /FMB News/i },
];

const auditFailures = [];
for (const newsFile of newsHtmlFiles) {
  const newsHtml = await readFile(newsFile, 'utf8');
  const relativePath = path.relative(output, newsFile);

  for (const check of forbiddenLegacyPatterns) {
    if (check.pattern.test(newsHtml)) {
      auditFailures.push(`${relativePath}: contains ${check.label}`);
    }
  }

  for (const check of requiredRebrandPatterns) {
    if (!check.pattern.test(newsHtml)) {
      auditFailures.push(`${relativePath}: missing ${check.label}`);
    }
  }
}

if (auditFailures.length) {
  throw new Error(`FMB News rebrand audit failed:\n${auditFailures.join('\n')}`);
}

const sitemapPath = path.join(output, 'sitemap.xml');
let sitemapXml = await readFile(sitemapPath, 'utf8');
const mediaArchiveUrl = 'https://www.francinemariebautista.com/media-archive/';
if (!sitemapXml.includes(mediaArchiveUrl)) {
  const mediaArchiveEntry = '  <url><loc>https://www.francinemariebautista.com/media-archive/</loc><lastmod>2026-08-02</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n';
  sitemapXml = sitemapXml.replace('</urlset>', `${mediaArchiveEntry}</urlset>`);
  await writeFile(sitemapPath, sitemapXml, 'utf8');
}

console.log(`Built and audited ${newsHtmlFiles.length} FMB News pages with the unified Filipino-first identity, no legacy newsroom footprint, and the complete article archive retained.`);
