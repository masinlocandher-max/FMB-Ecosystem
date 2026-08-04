import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const outputRoot = path.join(dist, 'assets', 'images', 'news', 'hd');
const summaryPath = path.join(dist, 'assets', 'data', 'fmbnews-hd-upgrades.json');
const origin = 'https://www.francinemariebautista.com';

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] ?? '';
}
function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = attr(tag, 'property') || attr(tag, 'name');
    if (name.toLowerCase() === key.toLowerCase()) return attr(tag, 'content');
  }
  return '';
}
function setAttribute(tag, name, value) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(["'])[^"']*\\1`, 'i');
  if (pattern.test(tag)) return tag.replace(pattern, ` ${name}="${value}"`);
  return tag.replace(/\s*\/?>(\s*)$/, ` ${name}="${value}">$1`);
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}
async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.log('[FMB News HD] Preparing the declared sharp image runtime.');
  }
  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['install', '--no-save', '--workspaces=false', '--no-audit', '--no-fund', 'sharp@0.35.3'],
    { cwd: root, stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error('FMB News HD could not prepare sharp@0.35.3.');
  return (await import('sharp')).default;
}
function localImagePath(imageUrl) {
  let parsed;
  try { parsed = new URL(imageUrl, origin); } catch { return null; }
  if (parsed.origin !== origin || !parsed.pathname.startsWith('/assets/')) return null;
  return { pathname: parsed.pathname, absolute: path.join(dist, parsed.pathname.replace(/^\/+/, '')) };
}
function isHd(width, height) {
  return Number(width) >= 1 && Number(height) >= 1 && Math.max(width, height) >= 1080 && Math.min(width, height) >= 600;
}
function updateMetadata(html, oldImage, newPath, width, height) {
  const newAbsolute = `${origin}${newPath}`;
  let next = html.replaceAll(oldImage, newAbsolute);
  const oldPath = new URL(oldImage, origin).pathname;
  next = next.replaceAll(oldPath, newPath);
  next = next.replace(/(<meta\b[^>]*(?:property|name)=["']og:image:width["'][^>]*content=["'])[^"']*(["'][^>]*>)/gi, `$1${width}$2`);
  next = next.replace(/(<meta\b[^>]*(?:property|name)=["']og:image:height["'][^>]*content=["'])[^"']*(["'][^>]*>)/gi, `$1${height}$2`);
  next = next.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = attr(tag, 'src');
    if (!src || !new URL(src, origin).pathname.includes(newPath)) return tag;
    return setAttribute(setAttribute(tag, 'width', width), 'height', height);
  });
  const absolutePattern = escapeRegExp(newAbsolute);
  next = next.replace(new RegExp(`("url"\\s*:\\s*"${absolutePattern}"[\\s\\S]{0,260}?"width"\\s*:\\s*)\\d+`, 'g'), `$1${width}`);
  next = next.replace(new RegExp(`("url"\\s*:\\s*"${absolutePattern}"[\\s\\S]{0,320}?"height"\\s*:\\s*)\\d+`, 'g'), `$1${height}`);
  return next;
}

let sharp;
const upgrades = [];
await mkdir(outputRoot, { recursive: true });
for (const filePath of await walk(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/i.test(html)) continue;
  const firstImageTag = html.match(/<img\b[^>]*>/i)?.[0] ?? '';
  const imageUrl = meta(html, 'og:image') || attr(firstImageTag, 'src');
  if (!imageUrl) continue;
  const local = localImagePath(imageUrl);
  if (!local) continue;
  if (/\/assets\/images\/news\/hd\//.test(local.pathname)) continue;
  if (/\.svg$/i.test(local.pathname)) continue;

  sharp ||= await loadSharp();
  let metadata;
  try {
    metadata = await sharp(local.absolute, { failOn: 'error' }).metadata();
  } catch (error) {
    throw new Error(`FMB News HD could not read ${local.pathname}: ${error.message}`);
  }
  const width = Number(metadata.width) || 0;
  const height = Number(metadata.height) || 0;
  if (isHd(width, height)) continue;
  if (!width || !height) throw new Error(`FMB News HD found unreadable dimensions for ${local.pathname}.`);

  const scale = Math.max(1600 / Math.max(width, height), 900 / Math.min(width, height), 1);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);
  const fingerprint = createHash('sha256').update(local.pathname).digest('hex').slice(0, 8);
  const base = path.basename(local.pathname, path.extname(local.pathname)).replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  const fileName = `${base}-${fingerprint}-hd.webp`;
  const destination = path.join(outputRoot, fileName);
  const publicPath = `/assets/images/news/hd/${fileName}`;

  await sharp(local.absolute, { failOn: 'error' })
    .resize(targetWidth, targetHeight, { fit: 'fill', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.8, m1: 0.7, m2: 1.5 })
    .webp({ quality: 92, smartSubsample: true, effort: 5 })
    .toFile(destination);

  html = updateMetadata(html, imageUrl, publicPath, targetWidth, targetHeight);
  await writeFile(filePath, html, 'utf8');
  upgrades.push({
    route: `/${path.relative(dist, path.dirname(filePath)).replaceAll(path.sep, '/')}/`,
    original: local.pathname,
    originalWidth: width,
    originalHeight: height,
    displayImage: publicPath,
    displayWidth: targetWidth,
    displayHeight: targetHeight,
    method: 'Lanczos upscale with restrained sharpening; original asset retained',
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  total: upgrades.length,
  originalFilesDeleted: false,
  articleRoutesDeleted: false,
  articleTextRewritten: false,
  upgrades,
};
await mkdir(path.dirname(summaryPath), { recursive: true });
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`FMB News HD prepared ${upgrades.length} display derivative(s); every original image and article route remains preserved.`);
export const hdImageUpgradeSummary = summary;