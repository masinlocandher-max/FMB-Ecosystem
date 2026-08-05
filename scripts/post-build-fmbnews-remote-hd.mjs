import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const manifestPath = path.join(dist, 'assets', 'data', 'fmbnews-editorial-manifest.json');
const outputDirectory = path.join(dist, 'assets', 'images', 'news', 'editorial-hd');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
await mkdir(outputDirectory, { recursive: true });

const escapeXml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const wrapTitle = (title) => {
  const words = String(title || 'FMB News').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 34 && line) { lines.push(line); line = word; }
    else line = next;
    if (lines.length === 3) break;
  }
  if (line && lines.length < 4) lines.push(line);
  return lines.slice(0, 4);
};
const brandedCover = (article) => {
  const lines = wrapTitle(article.title);
  const title = lines.map((line, index) => `<text x="104" y="${305 + index * 92}" fill="#ffffff" font-family="Georgia,serif" font-size="76" font-weight="700">${escapeXml(line)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#090e2d"/><stop offset="0.58" stop-color="#251047"/><stop offset="1" stop-color="#651f5a"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1480" cy="90" r="260" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="2"/><circle cx="1480" cy="90" r="340" fill="none" stroke="rgba(201,155,47,.18)" stroke-width="70"/><circle cx="1480" cy="90" r="430" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="70"/><text x="104" y="150" fill="#e2b84d" font-family="Arial,sans-serif" font-size="30" font-weight="800" letter-spacing="8">FMB NEWS</text>${title}<text x="104" y="795" fill="rgba(255,255,255,.68)" font-family="Arial,sans-serif" font-size="27">Clearer. Sharper. Made for Filipinos.</text></svg>`);
};
const localPath = (image) => image.startsWith('/assets/') ? path.join(dist, image.replace(/^\//, '').split('?')[0]) : null;
const replaceFirstImage = async (article, replacement) => {
  const articlePath = path.join(dist, article.route.replace(/^\//, ''), 'index.html');
  let html = await readFile(articlePath, 'utf8');
  const escaped = String(article.image).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`src=(["'])${escaped}\\1`, 'i'), `src="${replacement}"`);
  await writeFile(articlePath, html, 'utf8');
};

let upgraded = 0;
let brandedFallbacks = 0;
for (const article of manifest.articles) {
  if (/\.svg(?:\?|$)/i.test(article.image || '')) continue;
  if (Number(article.imageWidth) >= 1200 && Number(article.imageHeight) >= 600) continue;
  const output = path.join(outputDirectory, `${article.slug}-remote.webp`);
  const publicPath = `/assets/images/news/editorial-hd/${article.slug}-remote.webp`;
  let input = null;
  let sourceAvailable = false;
  try {
    const local = localPath(article.image || '');
    if (local) {
      input = local;
      sourceAvailable = true;
    } else if (/^https?:\/\//i.test(article.image || '')) {
      const response = await fetch(article.image, { headers: { 'user-agent': 'FMBNews/1.0 (+https://www.francinemariebautista.com/fmbnews/)' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Image returned ${response.status}`);
      input = Buffer.from(await response.arrayBuffer());
      sourceAvailable = true;
    }
  } catch {
    sourceAvailable = false;
  }
  if (sourceAvailable) {
    try {
      await sharp(input).rotate().resize(1600, 900, { fit: 'cover', position: 'attention', withoutEnlargement: false }).webp({ quality: 88 }).toFile(output);
      await replaceFirstImage(article, publicPath);
    } catch {
      sourceAvailable = false;
    }
  }
  if (!sourceAvailable) {
    await sharp(brandedCover(article)).webp({ quality: 90 }).toFile(output);
    brandedFallbacks += 1;
  }
  article.originalImage = article.originalImage || article.image;
  article.image = publicPath;
  article.imageWidth = 1600;
  article.imageHeight = 900;
  article.hdSource = sourceAvailable ? 'upscaled-source' : 'branded-editorial-cover';
  upgraded += 1;
}
manifest.preservation.remoteImagesUpgraded = upgraded;
manifest.preservation.brandedHdFallbacks = brandedFallbacks;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Upgraded ${upgraded} remaining FMB News display image(s) to 1600x900, with ${brandedFallbacks} branded fallback cover(s).`);
