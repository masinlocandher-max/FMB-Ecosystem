import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsAssets = path.join(dist, 'assets', 'images', 'news');
const newsRoot = path.join(dist, 'news');
const canonicalOrigin = 'https://www.francinemariebautista.com';

const trustedLicensePattern = /\b(?:CC0|CC BY(?:-SA)?|public domain|Philippine News Agency|Presidential Communications Office|Philippine government work)\b/i;
const trustedImageHosts = new Set(['upload.wikimedia.org', 'commons.wikimedia.org']);
const contentTypeExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

async function walk(directory, predicate) {
  const output = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) {
    if (error?.code === 'ENOENT') return output;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full, predicate));
    else if (entry.isFile() && predicate(full)) output.push(full);
  }
  return output;
}

function extensionFor(response, sourceUrl) {
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentTypeExtensions.has(contentType)) return contentTypeExtensions.get(contentType);
  const ext = path.extname(new URL(sourceUrl).pathname).slice(1).toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  throw new Error(`Unsupported trusted image type: ${contentType || 'unknown'} (${sourceUrl})`);
}

async function download(sourceUrl, destinationBase) {
  const response = await fetch(sourceUrl, {
    redirect: 'follow',
    headers: {
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
      'user-agent': 'FMBNewsBuild/2.0 (+https://www.francinemariebautista.com/news/about/)',
    },
  });
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${sourceUrl}`);
  const ext = extensionFor(response, response.url || sourceUrl);
  const destination = `${destinationBase}.${ext}`;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 2048) throw new Error(`Trusted image is unexpectedly small (${bytes.length} bytes): ${sourceUrl}`);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  return destination;
}

const replacements = new Map();
for (const svgFile of await walk(newsAssets, file => file.endsWith('.svg'))) {
  const svg = await readFile(svgFile, 'utf8');
  const match = svg.match(/<image\b[^>]*\b(?:href|xlink:href)=["'](https?:\/\/[^"']+)["']/i);
  if (!match || !trustedLicensePattern.test(svg)) continue;
  const sourceUrl = match[1].replaceAll('&amp;', '&');
  let host;
  try { host = new URL(sourceUrl).hostname.toLowerCase(); } catch { continue; }
  if (!trustedImageHosts.has(host)) continue;
  const relativeSvg = path.relative(dist, svgFile).split(path.sep).join('/');
  const publicSvg = `/${relativeSvg}`;
  const rasterFile = await download(sourceUrl, svgFile.slice(0, -4));
  const publicRaster = `/${path.relative(dist, rasterFile).split(path.sep).join('/')}`;
  replacements.set(publicSvg, publicRaster);
  replacements.set(`${canonicalOrigin}${publicSvg}`, `${canonicalOrigin}${publicRaster}`);
}

const htmlFiles = await walk(newsRoot, file => file.endsWith('.html'));
let changedReferences = 0;
for (const htmlFile of htmlFiles) {
  const before = await readFile(htmlFile, 'utf8');
  let after = before;
  for (const [from, to] of replacements) {
    if (!after.includes(from)) continue;
    changedReferences += after.split(from).length - 1;
    after = after.split(from).join(to);
  }
  if (after !== before) await writeFile(htmlFile, after, 'utf8');
}

const remoteMatches = new Map();
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  for (const match of html.matchAll(/\b(?:src|content)=["'](https?:\/\/(?:upload|commons)\.wikimedia\.org\/[^"']+)["']/gi)) {
    const sourceUrl = match[1].replaceAll('&amp;', '&');
    if (remoteMatches.has(sourceUrl)) continue;
    const hash = createHash('sha1').update(sourceUrl).digest('hex').slice(0, 16);
    try {
      const rasterFile = await download(sourceUrl, path.join(newsAssets, 'localized', hash));
      remoteMatches.set(sourceUrl, `/${path.relative(dist, rasterFile).split(path.sep).join('/')}`);
    } catch (error) {
      console.warn(`[FMB News] kept remote Wikimedia image because localization failed: ${error.message}`);
    }
  }
}

for (const htmlFile of htmlFiles) {
  const before = await readFile(htmlFile, 'utf8');
  let after = before;
  for (const [from, to] of remoteMatches) {
    if (!after.includes(from)) continue;
    changedReferences += after.split(from).length - 1;
    after = after.split(from).join(to);
  }
  if (after !== before) await writeFile(htmlFile, after, 'utf8');
}

console.log(`FMB News image rasterization complete: ${replacements.size / 2} trusted SVG wrapper(s) converted, ${remoteMatches.size} Wikimedia URL(s) localized, ${changedReferences} generated reference(s) rewritten.`);

// This is deliberately the final newsroom mutation in the build. Legacy news
// publishers above may preserve historical routes, but this pass decides their
// final information architecture and keeps Morning Special out of Latest News.
await import('./post-build-fmbnews-newsroom-structure.mjs');
