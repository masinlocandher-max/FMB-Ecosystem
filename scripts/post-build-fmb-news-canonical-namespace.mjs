import { access, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const legacyRoot = path.join(dist, 'fmbnews');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const protectedPrefixes = ['app/', '_sites/'];

async function walk(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile()) files.push(target);
  }
  return files;
}

function canonicalizeNewsNamespace(value) {
  return String(value)
    .replaceAll(`${canonicalOrigin}/fmbnews/`, `${canonicalOrigin}/news/`)
    .replaceAll('/fmbnews/', '/news/')
    .replace(/\/fmbnews(?=["'?#<\s])/gi, '/news');
}

function containsLegacyPublicPath(value) {
  return /\/fmbnews(?:\/|(?=["'?#<\s]))/i.test(String(value));
}

await access(path.join(newsRoot, 'index.html'));
await access(path.join(newsRoot, 'about', 'index.html'));
await access(path.join(newsRoot, 'fmb-brief', 'index.html'));

let rewritten = 0;
for (const file of await walk(dist)) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (protectedPrefixes.some((prefix) => relative.startsWith(prefix))) continue;
  if (!/\.(?:html|xml|json|js|css|txt|webmanifest)$/i.test(relative)) continue;

  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  const next = canonicalizeNewsNamespace(text);
  if (next !== text) {
    await writeFile(file, next, 'utf8');
    rewritten += 1;
  }
}

const sitemapFile = path.join(dist, 'sitemap.xml');
try {
  let sitemap = await readFile(sitemapFile, 'utf8');
  sitemap = sitemap.replace(
    /<url>\s*<loc>https:\/\/www\.francinemariebautista\.com\/fmbnews(?:\/[^<]*)?<\/loc>[\s\S]*?<\/url>\s*/gi,
    '',
  );
  sitemap = canonicalizeNewsNamespace(sitemap);
  await writeFile(sitemapFile, sitemap, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

// `/news/` is the only deployable FMB News namespace. Vercel handles the
// historical `/fmbnews/*` namespace as permanent redirects, never as files.
await rm(legacyRoot, { recursive: true, force: true });

const violations = [];
for (const file of await walk(dist)) {
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  if (protectedPrefixes.some((prefix) => relative.startsWith(prefix))) continue;
  if (!/\.(?:html|xml|json|js|css|txt|webmanifest)$/i.test(relative)) continue;
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  if (containsLegacyPublicPath(text)) violations.push(relative);
}

try {
  await access(legacyRoot);
  violations.push('fmbnews/ directory still exists in dist');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

if (violations.length) {
  throw new Error(`FMB News canonical namespace guard failed:\n${violations.slice(0, 40).join('\n')}`);
}

console.log(`FMB News canonical namespace guard passed: /news/ is the sole public namespace, ${rewritten} legacy-reference file(s) normalized, and dist/fmbnews removed.`);
