import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const worldRoot = path.join(dist, 'news', 'world');
const assetsCss = path.join(dist, 'assets', 'css');
const worldCssSource = path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-worldwide.css');
const worldCssTarget = path.join(assetsCss, 'fmb-worldwide.css');
const cleanLink = '<link rel="stylesheet" href="/assets/css/fmbnews-clean-v1.css?v=20260830-worldwide">';
const worldLink = '<link rel="stylesheet" href="/assets/css/fmb-worldwide.css?v=20260830-worldwide-v1">';

async function htmlFiles(directory) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (full, attrs = '') => {
    if (/\bclass=(['"])/i.test(full)) {
      return full.replace(/\bclass=(['"])(.*?)\1/i, (_match, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    }
    return `<body class="${className}"${attrs}>`;
  });
}

await mkdir(assetsCss, { recursive: true });
await writeFile(worldCssTarget, await readFile(worldCssSource, 'utf8'), 'utf8');

const files = await htmlFiles(worldRoot);
for (const file of files) {
  const relative = path.relative(worldRoot, file).replaceAll(path.sep, '/');
  let html = await readFile(file, 'utf8');
  html = addBodyClass(html, 'fmb-worldwide-route');
  if (relative !== 'index.html') html = addBodyClass(html, 'fmb-worldwide-edition');
  if (!html.includes('fmbnews-clean-v1.css')) html = html.replace('</head>', `${cleanLink}</head>`);
  if (!html.includes('fmb-worldwide.css')) html = html.replace('</head>', `${worldLink}</head>`);

  if (relative === 'index.html' && !html.includes('class="world-live"')) {
    html = html.replace(
      '<div class="world-kicker">FMB News · Global Desk</div>',
      '<div class="world-kicker-row"><div class="world-kicker">FMB News · Global Desk</div><span class="world-live"><i aria-hidden="true"></i>Live 24-hour desk</span></div>',
    );
  }

  await writeFile(file, html, 'utf8');
}

const sitemapPath = path.join(dist, 'sitemap.xml');
try {
  let sitemap = await readFile(sitemapPath, 'utf8');
  const urls = [
    ['https://www.francinemariebautista.com/news/world/', '2026-08-30', 'hourly', '0.9'],
    ['https://www.francinemariebautista.com/news/world/august-30-2026/', '2026-08-30', 'daily', '0.8'],
    ['https://www.francinemariebautista.com/news/world/august-29-2026/', '2026-08-29', 'monthly', '0.7'],
  ];
  for (const [loc, lastmod, changefreq, priority] of urls) {
    if (sitemap.includes(`<loc>${loc}</loc>`)) continue;
    const entry = `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>\n`;
    sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
  }
  await writeFile(sitemapPath, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log(`Prepared ${files.length} FMB Worldwide page(s) for the FMB News publication pipeline.`);
