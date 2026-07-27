import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsLandingPath = path.join(distRoot, 'news', 'index.html');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const fmbNewsLandingPath = path.join(fmbNewsRoot, 'index.html');
const sitemapPath = path.join(distRoot, 'sitemap.xml');
const cssSourcePath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-futuristic-ph.css');
const canonicalUrl = 'https://www.francinemariebautista.com/fmbnews/';

const orbitMarkup = `
<div class="nc-ph-orbit" aria-hidden="true">
  <span class="nc-ph-sun"></span>
  <span class="nc-ph-star nc-ph-star-one"></span>
  <span class="nc-ph-star nc-ph-star-two"></span>
  <span class="nc-ph-star nc-ph-star-three"></span>
</div>`;

function addBodyClass(html, className) {
  const bodyWithClass = /<body\b([^>]*?)\bclass=(['"])([^'"]*)\2([^>]*)>/i;
  if (bodyWithClass.test(html)) {
    return html.replace(bodyWithClass, (match, before, quote, classes, after) => {
      const nextClasses = new Set(classes.split(/\s+/).filter(Boolean));
      nextClasses.add(className);
      return `<body${before}class=${quote}${[...nextClasses].join(' ')}${quote}${after}>`;
    });
  }
  return html.replace(/<body\b([^>]*)>/i, `<body$1 class="${className}">`);
}

function makeCanonicalLanding(html, futuristicCss) {
  let next = html
    .replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#eef1f5">')
    .replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonicalUrl}">`)
    .replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonicalUrl}">`)
    .replaceAll('https://www.francinemariebautista.com/news/#page', 'https://www.francinemariebautista.com/fmbnews/#page')
    .replaceAll('https://www.francinemariebautista.com/news/#stories', 'https://www.francinemariebautista.com/fmbnews/#stories')
    .replace('"url":"https://www.francinemariebautista.com/news/"', '"url":"https://www.francinemariebautista.com/fmbnews/"')
    .replaceAll('href="/news/"', 'href="/fmbnews/"')
    .replaceAll("href='/news/'", "href='/fmbnews/'")
    .replace(/<style\b[^>]*data-fmbnews-futuristic-ph[^>]*>[\s\S]*?<\/style>\s*/gi, '');

  if (!next.includes('data-fmbnews-futuristic-ph')) {
    next = next.replace('</head>', `<style data-fmbnews-futuristic-ph>\n${futuristicCss}\n</style>\n</head>`);
  }

  if (!next.includes('class="nc-ph-orbit"')) {
    const heroPattern = /(<section\b[^>]*class=(['"])[^'"]*\bnc-broadcast-identity\b[^'"]*\2[^>]*>)/i;
    if (!heroPattern.test(next)) throw new Error('FMB News futuristic layer could not find the newsroom identity section.');
    next = next.replace(heroPattern, `$1${orbitMarkup}`);
  }

  return addBodyClass(next, 'news-futuristic-ph');
}

async function walkPublicHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ['_sites', 'app', 'admin', 'assets', 'node_modules'].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkPublicHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

const futuristicCss = await readFile(cssSourcePath, 'utf8');
let landingHtml = await readFile(newsLandingPath, 'utf8');
landingHtml = makeCanonicalLanding(landingHtml, futuristicCss);

await mkdir(fmbNewsRoot, { recursive: true });
await writeFile(newsLandingPath, landingHtml, 'utf8');
await writeFile(fmbNewsLandingPath, landingHtml, 'utf8');

let linkedPages = 0;
for (const filePath of await walkPublicHtml(distRoot)) {
  let html = await readFile(filePath, 'utf8');
  const updated = html
    .replaceAll('href="/news/"', 'href="/fmbnews/"')
    .replaceAll("href='/news/'", "href='/fmbnews/'");
  if (updated !== html) {
    await writeFile(filePath, updated, 'utf8');
    linkedPages += 1;
  }
}

let sitemap = await readFile(sitemapPath, 'utf8');
const oldLandingLoc = '<loc>https://www.francinemariebautista.com/news/</loc>';
const newLandingLoc = '<loc>https://www.francinemariebautista.com/fmbnews/</loc>';
if (!sitemap.includes(oldLandingLoc) && !sitemap.includes(newLandingLoc)) {
  throw new Error('FMB News futuristic layer could not find the newsroom landing URL in sitemap.xml.');
}
sitemap = sitemap.replace(oldLandingLoc, newLandingLoc);
await writeFile(sitemapPath, sitemap, 'utf8');

console.log(`Published /fmbnews as the canonical futuristic Philippine newsroom, preserved the /news landing copy, and updated ${linkedPages} public navigation page(s).`);
