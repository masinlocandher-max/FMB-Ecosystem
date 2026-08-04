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

const requiredViews = ['home', 'alam-mo-ba', 'lotto', 'horoscope', 'about', 'fmb-message', 'submit'];
for (const view of requiredViews) {
  if (!html.includes(`data-view-link="${view}"`)) throw new Error(`Protected preview is missing primary menu view: ${view}`);
}
for (const forbidden of ['Watch Live', 'bottom-nav', 'bottom navigation', 'tab-bar']) {
  if (html.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`Protected preview contains forbidden navigation/content marker: ${forbidden}`);
}
const primaryNav = html.match(/<nav\b[^>]*data-primary-nav[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? '';
for (const category of ['Philippines', 'World', 'Business', 'Lifestyle']) {
  if (new RegExp(`>${category}<`, 'i').test(primaryNav)) throw new Error(`${category} must remain an archive category, not a primary menu item.`);
}
if (!/name="robots"\s+content="noindex,nofollow,noarchive"/i.test(html)) throw new Error('Protected preview must remain noindex.');
if (!html.includes('data-sidebar') || !html.includes('data-drawer-open')) throw new Error('Protected preview sidebar or mobile drawer trigger is missing.');
if (!css.includes('linear-gradient(180deg,#0a0d2f') || !css.includes('@media(max-width:860px)')) throw new Error('Protected preview ombré sidebar or responsive breakpoint is missing.');
if (!js.includes("const MANIFEST_URL = '/assets/data/fmbnews-manifest.json'")) throw new Error('Protected preview manifest loader is missing.');
if (!js.includes('timeZone: MANILA') || !js.includes('12:00 a.m. to 11:59 p.m.')) throw new Error('Protected preview Philippine-day behavior is missing.');
if (!Array.isArray(manifest.articles) || !manifest.articles.length) throw new Error('Protected preview manifest has no articles.');

const manifestRoutes = new Set(manifest.articles.map(({ route }) => route));
if (manifestRoutes.size !== manifest.articles.length) throw new Error('Protected preview manifest contains duplicate routes.');

let sourceArticleCount = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  const articleHtml = await readFile(filePath, 'utf8');
  if (/\bnews-story-route\b/i.test(articleHtml)) sourceArticleCount += 1;
}
if (sourceArticleCount !== manifest.articles.length) {
  throw new Error(`Protected preview manifest count ${manifest.articles.length} does not match ${sourceArticleCount} published source article route(s).`);
}
for (const article of manifest.articles) {
  if (!article.route?.startsWith('/news/') || !article.title || !article.image) {
    throw new Error(`Protected preview contains an incomplete preserved article record: ${JSON.stringify(article)}`);
  }
}

console.log(`Protected FMB News preview passed: ${manifest.articles.length} article routes preserved; Apple-style ombré sidebar installed; primary menu and archives separated; production newsroom untouched.`);
