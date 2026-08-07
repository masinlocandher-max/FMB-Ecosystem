import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('../dist/', import.meta.url).pathname);
const protectedRoots = ['app/', '_sites/senz/', '_sites/cognita/'];
const controlledReadingRoutes = ['coming-out-respect.html', 'dress-with-intention.html', 'men-can-cry.html', 'reading.html', 'skin-care-makeup.html', 'womens-health.html'];
const suppliedPrimaryNewsLogo = '/assets/images/news/fmb-news-primary-logo-2026.webp';
const suppliedWhiteNewsLogo = '/assets/images/news/fmb-news-white-transparent-2026.webp';
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

  if (controlledReadingRoutes.includes(name) && !html.includes('membership-gate.js')) {
    fatal(`${name} is missing its controlled reading gate`);
  }
}

const required = {
  'index.html': '/assets/images/fmb-approved/fmb-master-transparent.webp',
  'music/index.html': '/assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'ebooks/index.html': '/assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
  'womens-health.html': 'membership-gate.js',
};
for (const [fileName, marker] of Object.entries(required)) {
  const html = await readFile(path.join(root, fileName), 'utf8');
  if (!html.includes(marker)) fatal(`${fileName} is missing required functional marker ${marker}`);
}

const newsIndex = await readFile(path.join(root, 'news/index.html'), 'utf8');
if (!/FMB News|Filipino ang Mismong Balita\./i.test(newsIndex)) {
  fatal('news/index.html is missing its publication identity');
}
const masthead = newsIndex.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
const footer = newsIndex.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] || '';
if (!masthead.includes(suppliedPrimaryNewsLogo)) warn('news/index.html is missing the supplied FMB News masthead logo');
if (!footer.includes(suppliedWhiteNewsLogo)) warn('news/index.html is missing the supplied white FMB News footer logo');

console.log(`FMB public-route integrity audit passed ${publicPages} public pages, ${newsPages} News routes and ${controlledReadingRoutes.length} controlled reading routes with ${warnings.length} non-blocking visual warning(s).`);
