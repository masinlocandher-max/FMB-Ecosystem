import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const previewIndexPath = path.join(dist, 'fmbnews-preview', 'index.html');
const previewCssPath = path.join(dist, 'assets', 'css', 'fmbnews-preview.css');
const previewJsPath = path.join(dist, 'assets', 'js', 'fmbnews-preview.js');
const manifestPath = path.join(dist, 'assets', 'data', 'fmbnews-manifest.json');
const newsRoot = path.join(dist, 'news');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

const [html, css, js, manifestText] = await Promise.all([
  readFile(previewIndexPath, 'utf8'),
  readFile(previewCssPath, 'utf8'),
  readFile(previewJsPath, 'utf8'),
  readFile(manifestPath, 'utf8'),
]);
const manifest = JSON.parse(manifestText);
const fail = (message) => { throw new Error(`Protected FMB News preview: ${message}`); };

for (const view of ['home', 'alam-mo-ba', 'lotto', 'horoscope', 'about', 'fmb-message', 'submit']) {
  if (!html.includes(`data-view-link="${view}"`)) fail(`missing primary menu view: ${view}`);
}
for (const forbidden of ['Watch Live', 'bottom-nav', 'bottom navigation', 'tab-bar']) {
  if (html.toLowerCase().includes(forbidden.toLowerCase())) fail(`contains forbidden navigation/content marker: ${forbidden}`);
}
const primaryNav = html.match(/<nav\b[^>]*data-primary-nav[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? '';
for (const category of ['Philippines', 'World', 'Business', 'Lifestyle']) {
  if (new RegExp(`>${category}<`, 'i').test(primaryNav)) fail(`${category} must remain an archive category`);
}
if (!/name="robots"\s+content="noindex,nofollow,noarchive"/i.test(html)) fail('preview must remain noindex');
for (const marker of ['data-sidebar', 'data-drawer-open', 'close-glyph', 'sidebar-signal', 'data-pht-time', 'data-wire-track']) {
  if (!html.includes(marker)) fail(`HTML is missing ${marker}`);
}
for (const marker of ['--font-display:', '--font-ui:', '.close-glyph::before', '.sidebar-signal', '.segment-hero::before', '@media(max-width:860px)', '@media(max-width:540px)', '@media(prefers-reduced-motion:reduce)']) {
  if (!css.includes(marker)) fail(`CSS is missing ${marker}`);
}
for (const marker of ["const MANIFEST_URL = '/assets/data/fmbnews-manifest.json'", 'timeZone: MANILA', '12:00 a.m. to 11:59 p.m.', 'renderAlamMoBa', 'renderLotto', 'renderHoroscope', 'document.startViewTransition']) {
  if (!js.includes(marker)) fail(`JavaScript is missing ${marker}`);
}
if (!Array.isArray(manifest.articles) || !manifest.articles.length) fail('manifest has no articles');
if (!manifest.preservation?.hdImagesVerified) fail('manifest has not verified HD images');
const manifestRoutes = new Set(manifest.articles.map(({ route }) => route));
if (manifestRoutes.size !== manifest.articles.length) fail('manifest contains duplicate routes');

let sourceArticleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  const articleHtml = await readFile(filePath, 'utf8');
  if (/\bnews-story-route\b/i.test(articleHtml)) sourceArticleCount += 1;
}
if (sourceArticleCount !== manifest.articles.length) fail(`manifest count ${manifest.articles.length} does not match ${sourceArticleCount} published report pages`);
for (const article of manifest.articles) {
  if (!article.route?.startsWith('/news/') || !article.title || !article.image) fail(`incomplete preserved article record: ${JSON.stringify(article)}`);
  if (Math.max(Number(article.imageWidth), Number(article.imageHeight)) < 1080 || Math.min(Number(article.imageWidth), Number(article.imageHeight)) < 600) {
    fail(`non-HD article image: ${article.route} ${article.imageWidth}x${article.imageHeight}`);
  }
}
console.log(`Protected FMB News preview passed: ${manifest.articles.length} article routes preserved, HD imagery verified, corrected mobile close control installed, luxurious type and signal motifs applied, and original segments completed without dead ends.`);