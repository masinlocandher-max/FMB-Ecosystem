import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const manifestPath = path.join(dist, 'assets', 'data', 'fmbnews-editorial-manifest.json');
const logo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!Array.isArray(manifest.articles) || !manifest.articles.length) throw new Error('FMB News manifest has no preserved articles.');
if (manifest.total !== manifest.articles.length) throw new Error('FMB News manifest total does not match its article list.');
if (!manifest.preservation?.routesPreserved || !manifest.preservation?.articleTextPreserved) throw new Error('FMB News preservation flags are incomplete.');
const routes = manifest.articles.map((article) => article.route);
if (new Set(routes).size !== routes.length) throw new Error('FMB News manifest contains duplicate article routes.');

for (const landing of ['fmbnews/index.html', 'news/index.html']) {
  const html = await readFile(path.join(dist, landing), 'utf8');
  const required = ['fmbn-editorial-app', logo, 'data-fmbn-time', 'data-fmbn-wire', 'data-fmbn-menu-open', 'Alam Mo Ba?', 'Lotto', 'Horoscope', 'FMB Message', 'Submit Your Story'];
  for (const marker of required) if (!html.includes(marker)) throw new Error(`${landing} is missing ${marker}.`);
  if (/bottom-nav|tab-bar|mobile-dock/i.test(html)) throw new Error(`${landing} contains a prohibited bottom navigation.`);
  if ((html.match(new RegExp(logo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length < 3) throw new Error(`${landing} does not use the approved FMB News logo consistently.`);
}

for (const article of manifest.articles) {
  const filePath = path.join(dist, article.route.replace(/^\//, ''), 'index.html');
  const html = await readFile(filePath, 'utf8');
  if ((html.match(/data-fmbnews-editorial-shell/g) || []).length !== 1) throw new Error(`${article.route} does not contain exactly one FMB News article shell.`);
  if ((html.match(/data-fmbnews-editorial-footer/g) || []).length !== 1) throw new Error(`${article.route} does not contain exactly one FMB News article footer.`);
  if (!html.includes(logo) || !html.includes('data-fmbn-article-time') || !html.includes('data-fmbn-article-wire')) throw new Error(`${article.route} is missing consistent logo, time, or moving headlines.`);
  const vector = /\.svg(?:\?|$)/i.test(article.image || '');
  if (!vector && (Number(article.imageWidth) < 1200 || Number(article.imageHeight) < 600)) throw new Error(`${article.route} does not have an HD display image: ${article.imageWidth}x${article.imageHeight}.`);
}

async function countArticleFiles(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) count += await countArticleFiles(absolute);
    else if (entry.isFile() && entry.name === 'index.html' && absolute !== path.join(newsRoot, 'index.html')) {
      const html = await readFile(absolute, 'utf8');
      if (/\bnews-story-route\b/i.test(html)) count += 1;
    }
  }
  return count;
}

const articleFileCount = await countArticleFiles(newsRoot);
if (articleFileCount !== manifest.total) throw new Error(`FMB News route count mismatch: manifest=${manifest.total}, files=${articleFileCount}.`);
console.log(`Verified the FMB News editorial rebuild: ${manifest.total} article routes preserved, approved logo used consistently, PHT and headline wire present, no bottom navigation, and all display images pass the HD gate.`);
