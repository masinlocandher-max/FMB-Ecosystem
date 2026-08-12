import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsAssets = path.join(dist, 'assets', 'images', 'news');
const newsRoot = path.join(dist, 'news');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const fallbackImage = '/assets/images/news/fmb-news-editorial-fallback.svg';
const fallbackAbsolute = path.join(dist, fallbackImage.slice(1));
const rasterExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

async function walk(directory, predicate) {
  const output = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
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

async function firstExistingRaster(svgFile) {
  const base = svgFile.slice(0, -4);
  for (const extension of rasterExtensions) {
    const candidate = `${base}.${extension}`;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next local format.
    }
  }
  return null;
}

function publicPath(file) {
  return `/${path.relative(dist, file).split(path.sep).join('/')}`;
}

await access(fallbackAbsolute);

const wrapperReplacements = new Map();
let wrapperCount = 0;
let wrapperFallbackCount = 0;

for (const svgFile of await walk(newsAssets, file => file.endsWith('.svg'))) {
  if (path.resolve(svgFile) === path.resolve(fallbackAbsolute)) continue;

  const svg = await readFile(svgFile, 'utf8');
  if (!/<image\b[^>]*\b(?:href|xlink:href)=["']https?:\/\//i.test(svg)) continue;

  const svgPublic = publicPath(svgFile);
  const rasterFile = await firstExistingRaster(svgFile);
  const replacement = rasterFile ? publicPath(rasterFile) : fallbackImage;

  wrapperReplacements.set(svgPublic, replacement);
  wrapperReplacements.set(`${canonicalOrigin}${svgPublic}`, `${canonicalOrigin}${replacement}`);
  wrapperCount += 1;
  if (!rasterFile) wrapperFallbackCount += 1;
}

const htmlFiles = await walk(newsRoot, file => file.endsWith('.html'));
let changedFiles = 0;
let changedReferences = 0;
let remoteReferenceCount = 0;

for (const htmlFile of htmlFiles) {
  const before = await readFile(htmlFile, 'utf8');
  let after = before;

  for (const [from, to] of wrapperReplacements) {
    if (!after.includes(from)) continue;
    const count = after.split(from).length - 1;
    changedReferences += count;
    after = after.split(from).join(to);
  }

  after = after.replace(/https?:\/\/(?:upload|commons)\.wikimedia\.org\/[^\s"'<>)]*/gi, match => {
    remoteReferenceCount += 1;
    changedReferences += 1;
    return match.startsWith(canonicalOrigin) ? `${canonicalOrigin}${fallbackImage}` : fallbackImage;
  });

  if (after !== before) {
    await writeFile(htmlFile, after, 'utf8');
    changedFiles += 1;
  }
}

const violations = [];
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, 'utf8');
  if (/https?:\/\/(?:upload|commons)\.wikimedia\.org\//i.test(html)) {
    violations.push(`${path.relative(dist, htmlFile)} still contains a remote Wikimedia image URL`);
  }

  for (const [wrapper] of wrapperReplacements) {
    if (!wrapper.startsWith('/')) continue;
    if (html.includes(wrapper)) {
      violations.push(`${path.relative(dist, htmlFile)} still references remote-backed wrapper ${wrapper}`);
    }
  }
}

if (violations.length) {
  throw new Error(`FMB News local-image audit failed:\n${violations.slice(0, 25).join('\n')}`);
}

console.log(
  `FMB News local-image enforcement complete: ${wrapperCount} remote-backed SVG wrapper(s) resolved ` +
  `(${wrapperFallbackCount} to editorial fallback), ${remoteReferenceCount} direct Wikimedia reference(s) removed, ` +
  `${changedReferences} generated reference(s) rewritten across ${changedFiles} page(s).`
);

// This is deliberately the final newsroom mutation in the build. Legacy news
// publishers above may preserve historical routes, but this pass decides their
// final information architecture and keeps Morning Special out of Latest News.
await import('./post-build-fmbnews-newsroom-structure.mjs');
