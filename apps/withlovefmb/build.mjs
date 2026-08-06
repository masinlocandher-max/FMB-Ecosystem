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

const newsPath = path.join(output, 'news', 'index.html');
let newsHtml = await readFile(newsPath, 'utf8');

// Remove the legacy newsroom visual systems while retaining the complete article markup,
// URLs, metadata, structured data, images, credits, and archive content.
newsHtml = newsHtml
  .replace(/<link[^>]+href=["'][^"']*\/assets\/css\/news-channel\.css[^"']*["'][^>]*>\s*/gi, '')
  .replace(/<link[^>]+href=["'][^"']*\/assets\/css\/fmb-news-luxury\.css[^"']*["'][^>]*>\s*/gi, '')
  .replace(/<link[^>]+href=["'][^"']*\/assets\/css\/fmb-news-headquarters\.css[^"']*["'][^>]*>\s*/gi, '')
  .replace(/<link[^>]+href=["'][^"']*\/assets\/css\/fmb-news-responsive\.css[^"']*["'][^>]*>\s*/gi, '')
  .replace(/<script[^>]+src=["'][^"']*\/assets\/js\/fmb-news-headquarters\.js[^"']*["'][^>]*><\/script>\s*/gi, '');

const newsroomTextReplacements = [
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
];
for (const [from, to] of newsroomTextReplacements) {
  newsHtml = newsHtml.split(from).join(to);
}

const headquartersCss = '<link rel="stylesheet" href="/assets/css/fmb-news-headquarters.css?v=20260806c">';
const responsiveCss = '<link rel="stylesheet" href="/assets/css/fmb-news-responsive.css?v=20260806c">';
const headquartersJs = '<script src="/assets/js/fmb-news-headquarters.js?v=20260806c" defer></script>';
newsHtml = newsHtml.replace('</head>', `${headquartersCss}\n${responsiveCss}\n${headquartersJs}\n</head>`);
await writeFile(newsPath, newsHtml, 'utf8');

const sitemapPath = path.join(output, 'sitemap.xml');
let sitemapXml = await readFile(sitemapPath, 'utf8');
const mediaArchiveUrl = 'https://www.francinemariebautista.com/media-archive/';
if (!sitemapXml.includes(mediaArchiveUrl)) {
  const mediaArchiveEntry = '  <url><loc>https://www.francinemariebautista.com/media-archive/</loc><lastmod>2026-08-02</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n';
  sitemapXml = sitemapXml.replace('</urlset>', `${mediaArchiveEntry}</urlset>`);
  await writeFile(sitemapPath, sitemapXml, 'utf8');
}

console.log('Built the FMB public website and Yoni application with the legacy FMB News designs removed, the complete article archive retained, and the new digital headquarters design active.');
