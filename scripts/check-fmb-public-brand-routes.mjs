import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('../dist/', import.meta.url).pathname);
const protectedRoots = ['_sites/senz/', '_sites/cognita/'];
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
    '/assets/images/fmb-approved/fmb-music-official-transparent.webp',
    '/assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
  ]) {
    if (html.includes(marker)) warn(`${name} still contains retired visual or product identity ${marker}`);
  }
}

const home = await readFile(path.join(root, 'index.html'), 'utf8');
if (!home.includes('/assets/images/fmb-approved/fmb-master-transparent.webp')) {
  fatal('index.html is missing the approved FMB master identity');
}
if (/yoni\.francinemariebautista\.com/i.test(home)) {
  fatal('index.html still contains the retired Yoni destination');
}
if (/href=["']\/app\//i.test(home)) {
  fatal('index.html still links to an embedded local Yoni application');
}

for (const retired of [
  'app/index.html',
  'music/index.html',
  'ebooks/index.html',
  'reading.html',
  'music.html',
  'profile/index.html',
  'daily.html',
  'data-rights.html',
]) {
  try {
    await access(path.join(root, retired));
    fatal(`${retired} is retired but still appears in the release output`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const newsIndex = await readFile(path.join(root, 'news/index.html'), 'utf8');
if (!/FMB News|Filipino ang Mismong Balita\./i.test(newsIndex)) {
  fatal('news/index.html is missing its publication identity');
}
const masthead = newsIndex.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
const footer = newsIndex.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] || '';
if (!masthead.includes(suppliedPrimaryNewsLogo)) warn('news/index.html is missing the supplied FMB News masthead logo');
if (!footer.includes(suppliedWhiteNewsLogo)) warn('news/index.html is missing the supplied white FMB News footer logo');

console.log(`FMB public-route integrity audit passed ${publicPages} active public pages and ${newsPages} News routes with retired eBook, Music, public member, and Yoni routes absent; ${warnings.length} non-blocking visual warning(s).`);
