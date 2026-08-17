import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const newsPath = path.join(newsRoot, 'index.html');
const fmbNewsPath = path.join(distRoot, 'fmbnews', 'index.html');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-clean-v1.css');
const builtCssPath = path.join(distRoot, 'assets', 'css', 'fmbnews-clean-v1.css');
const warnings = [];

function warn(message) {
  warnings.push(message);
  console.warn(`FMBNEWS CORPORATE CHECK: ${message}`);
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

await stat(fmbNewsPath).catch(() => warn('dist/fmbnews/index.html was not generated'));
const [newsHtml, fmbNewsHtml, sourceCss, builtCss] = await Promise.all([
  readFile(newsPath, 'utf8'),
  readFile(fmbNewsPath, 'utf8'),
  readFile(sourceCssPath, 'utf8'),
  readFile(builtCssPath, 'utf8'),
]);

// The clean fnc-* newsroom is the source-owned production system introduced
// after the retired futuristic/corporate recovery layers. Audit the current
// generator contract rather than rewarding obsolete post-build markers.
const landingMarkers = [
  'fmb-news-clean',
  'fmb-news-landing',
  'fnc-livebar',
  'fnc-header',
  'fnc-footer',
  'data-pht-time',
  'fmbnews-clean-v1.css',
];
for (const [html, label] of [[newsHtml, '/news'], [fmbNewsHtml, '/fmbnews']]) {
  for (const marker of landingMarkers) if (!html.includes(marker)) warn(`${label} is missing ${marker}`);
}

const cssMarkers = [
  'body.fmb-news-clean',
  '.fnc-livebar',
  '.fnc-header',
  '.fnc-ticker-track',
  '.fnc-footer',
  '.news-story-route .wrap',
  '.nc-article-layout',
  '@media(max-width:1080px)',
  '@media(max-width:700px)',
];
for (const marker of cssMarkers) {
  if (!sourceCss.includes(marker)) warn(`source newsroom CSS is missing ${marker}`);
  if (!builtCss.includes(marker)) warn(`built newsroom CSS is missing ${marker}`);
}

const retiredMarkers = [
  'data-fmb-news-final-styles',
  'data-fmbnews-futuristic-ph',
];
for (const [html, label] of [[newsHtml, '/news'], [fmbNewsHtml, '/fmbnews']]) {
  for (const marker of retiredMarkers) if (html.includes(marker)) warn(`${label} still contains retired inline layer ${marker}`);
}

let articleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === newsPath) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  articleCount += 1;
  const relative = path.relative(distRoot, filePath).replaceAll('\\', '/');
  for (const marker of ['fmb-news-clean', 'fnc-livebar', 'fnc-header', 'fnc-footer', 'data-pht-time', 'fmbnews-clean-v1.css', 'nc-article-layout']) {
    if (!html.includes(marker)) warn(`${relative} is missing current newsroom marker ${marker}`);
  }
  for (const marker of retiredMarkers) if (html.includes(marker)) warn(`${relative} still contains retired inline layer ${marker}`);
}

if (articleCount < 1) warn('no News report pages received the clean newsroom design');
console.log(`Completed the FMB News corporate design audit against the source-owned clean newsroom across ${articleCount} report pages with ${warnings.length} non-blocking warning(s).`);
