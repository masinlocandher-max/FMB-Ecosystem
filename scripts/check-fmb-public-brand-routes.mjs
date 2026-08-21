import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('../dist/', import.meta.url).pathname);
const protectedRoots = ['app/', '_sites/senz/', '_sites/cognita/'];
const retiredPublicRoutes = [
  'ebooks/index.html',
  'music/index.html',
  'music.html',
  'coming-out-respect.html',
  'dress-with-intention.html',
  'men-can-cry.html',
  'reading.html',
  'skin-care-makeup.html',
  'womens-health.html',
];
const suppliedPrimaryNewsLogo = '/assets/images/news/fmb-news-primary-logo-2026.webp';
const suppliedWhiteNewsLogo = '/assets/images/news/fmb-news-white-transparent-2026.webp';
const unifiedHomeLogo = '/assets/images/fmbandco/fmbandco-primary-reversed.png';
const warnings = [];
const fatal = (message) => { throw new Error(`FMB public-route integrity audit: ${message}`); };
const warn = (message) => { warnings.push(message); console.warn(`FMB public-route visual QA: ${message}`); };

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const relative = (file) => path.relative(root, file).replaceAll(path.sep, '/');
let publicPages = 0;
let newsPages = 0;
for (const file of await walk(root)) {
  const name = relative(file);
  if (protectedRoots.some((prefix) => name.startsWith(prefix))) continue;
  const html = await readFile(file, 'utf8');
  publicPages += 1;

  if (name.startsWith('news/')) {
    if (!/(?:FMB News Center|FMB(?:&amp;|&)CO\. News|FMB News|Francine Marie Bautista)/i.test(html)) {
      fatal(`${name} has no visible publisher identity`);
    }
    if (!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html) && name !== 'news/index.html') {
      fatal(`${name} is missing a canonical URL`);
    }
    newsPages += 1;
  }

  for (const marker of [
    'https://at.adobe.com/',
    '/assets/images/home/fmb-home-logo.webp',
    '/assets/images/news/fmb-news-official.svg',
    '/assets/images/channels/fmb-music-official.svg',
    '/assets/images/channels/fmb-ebook-official.svg',
  ]) {
    if (html.includes(marker)) warn(`${name} still contains retired visual identity ${marker}`);
  }
}

for (const retired of retiredPublicRoutes) {
  try {
    await access(path.join(root, retired));
    fatal(`${retired} was retired and must not be emitted as a public FMB route`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const homepage = await readFile(path.join(root, 'index.html'), 'utf8');
const unifiedHeaderTags = homepage.match(/<header\b[^>]*class=["'][^"']*(?:^|\s)fmb-shell-header(?:\s|["'])[^>]*>/gi) || [];
const unifiedFooterTags = homepage.match(/<footer\b[^>]*class=["'][^"']*(?:^|\s)fmb-shell-footer(?:\s|["'])[^>]*>/gi) || [];
if (!homepage.includes(unifiedHomeLogo) || unifiedHeaderTags.length !== 1) {
  fatal('index.html is missing the unified FMB&CO. public identity');
}
if (unifiedHeaderTags.length !== 1) {
  fatal('index.html must contain exactly one unified public header');
}
if (unifiedFooterTags.length !== 1) {
  fatal('index.html must contain exactly one unified public footer');
}

const newsIndex = await readFile(path.join(root, 'news/index.html'), 'utf8');
if (!/FMB News|Filipino ang Mismong Balita\./i.test(newsIndex)) {
  fatal('news/index.html is missing its publication identity');
}
const masthead = newsIndex.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
const footer = newsIndex.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] || '';
if (!masthead.includes(suppliedPrimaryNewsLogo)) warn('news/index.html is missing the supplied FMB News masthead logo');
if (!footer.includes(suppliedWhiteNewsLogo)) warn('news/index.html is missing the supplied white FMB News footer logo');

console.log(`FMB public-route integrity audit passed ${publicPages} public pages and ${newsPages} News routes; retired Reading/Music routes are absent and the homepage has one unified FMB&CO. shell, with ${warnings.length} non-blocking visual warning(s).`);
