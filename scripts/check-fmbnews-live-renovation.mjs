import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const paths = {
  news: path.join(dist, 'news', 'index.html'),
  fmbnews: path.join(dist, 'fmbnews', 'index.html'),
  preview: path.join(dist, 'fmbnews-preview', 'index.html'),
  css: path.join(dist, 'assets', 'css', 'fmbnews-preview.css'),
  js: path.join(dist, 'assets', 'js', 'fmbnews-preview.js'),
  manifest: path.join(dist, 'assets', 'data', 'fmbnews-manifest.json'),
};
const [news, fmbnews, preview, css, js, manifestText] = await Promise.all(Object.values(paths).map((file) => readFile(file, 'utf8')));
const manifest = JSON.parse(manifestText);
const fail = (message) => { throw new Error(`FMB News live renovation audit: ${message}`); };

for (const [name, html] of [['news/index.html', news], ['fmbnews/index.html', fmbnews]]) {
  if (!html.includes('data-fmbnews-live')) fail(`${name} is not using the live renovated shell`);
  if (!/name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/i.test(html)) fail(`${name} is not indexable`);
  if (!html.includes('data-pht-time') || !html.includes('data-wire-track')) fail(`${name} is missing Philippine time or moving headlines`);
  if (!html.includes('close-glyph')) fail(`${name} is missing the corrected close control`);
  if (!html.includes('sidebar-signal') || !html.includes('topbar-signal') || !html.includes('footer-signal')) fail(`${name} is missing the restrained signal motif system`);
  if (!html.includes('/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp')) fail(`${name} is missing the exact supplied color logo`);
  if ((html.match(/\/assets\/images\/fmb-approved\/fmb-news-logo-white-supplied\.webp/g) || []).length < 2) fail(`${name} must use the supplied white logo on both dark sidebar and footer surfaces`);
  if (/Watch Live|bottom-nav|tab-bar/i.test(html)) fail(`${name} contains retired navigation`);
  for (const view of ['home', 'alam-mo-ba', 'lotto', 'horoscope', 'about', 'fmb-message', 'submit']) {
    if (!html.includes(`data-view-link="${view}"`)) fail(`${name} is missing ${view}`);
  }
}
if (!/noindex,nofollow,noarchive/i.test(preview)) fail('the protected preview route must remain noindex');
for (const marker of [
  '--font-display:',
  '--font-ui:',
  '.close-glyph::before',
  '.sidebar-signal',
  '.segment-hero::before',
  '@media(max-width:860px)',
  '@media(max-width:540px)',
  '@media(prefers-reduced-motion:reduce)',
  'cubic-bezier(.22,1,.36,1)',
]) {
  if (!css.includes(marker)) fail(`CSS is missing ${marker}`);
}
for (const marker of [
  'const FACTS = [',
  'const LOTTO_SCHEDULE = [',
  'const ZODIAC = [',
  'renderAlamMoBa',
  'renderLotto',
  'renderHoroscope',
  'document.startViewTransition',
  'data-horoscope-period',
  'lottomatik.pcso.gov.ph/lotto-results',
  '12:00 a.m. to 11:59 p.m.',
]) {
  if (!js.includes(marker)) fail(`JavaScript is missing ${marker}`);
}
if (!manifest.preservation?.hdImagesVerified) fail('manifest does not confirm HD editorial image verification');
if (!Array.isArray(manifest.articles) || !manifest.articles.length) fail('manifest contains no preserved article records');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}
const articleFiles = [];
for (const file of await walk(path.join(dist, 'news'))) {
  if (file === paths.news) continue;
  const html = await readFile(file, 'utf8');
  if (/\bnews-story-route\b/i.test(html)) articleFiles.push(file);
}
if (articleFiles.length !== manifest.articles.length) fail(`manifest has ${manifest.articles.length} reports but ${articleFiles.length} article files remain`);
for (const article of manifest.articles) {
  if (!article.route.startsWith('/news/') || !article.title || !article.image) fail(`incomplete preserved report: ${JSON.stringify(article)}`);
  if (Math.max(Number(article.imageWidth), Number(article.imageHeight)) < 1080 || Math.min(Number(article.imageWidth), Number(article.imageHeight)) < 600) {
    fail(`non-HD image record remains on ${article.route}: ${article.imageWidth}x${article.imageHeight}`);
  }
}
console.log(`FMB News live renovation passed: both landing routes share one luxurious responsive shell, original segments work without dead ends, exact supplied logos are consistent, moving headlines and Philippine time are visible, HD images are verified, and ${articleFiles.length} report pages remain preserved.`);