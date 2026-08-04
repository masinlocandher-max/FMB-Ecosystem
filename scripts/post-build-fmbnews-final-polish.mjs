import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const cssHref = '/assets/css/fmbnews-final-polish.css?v=20260805a';
const jsSrc = '/assets/js/fmbnews-final-polish.js?v=20260805a';
const landingFiles = [
  path.join(dist, 'fmbnews-preview', 'index.html'),
  path.join(dist, 'fmbnews', 'index.html'),
  path.join(dist, 'news', 'index.html'),
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

function inject(html) {
  let next = html;
  next = next.replace(/<link\b[^>]*href=(["'])\/assets\/css\/fmbnews-final-polish\.css(?:\?[^"']*)?\1[^>]*>\s*/gi, '');
  next = next.replace(/<script\b[^>]*src=(["'])\/assets\/js\/fmbnews-final-polish\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>\s*/gi, '');
  next = next.replace('</head>', `<link rel="stylesheet" href="${cssHref}">\n</head>`);
  next = next.replace('</body>', `<script src="${jsSrc}" defer></script>\n</body>`);
  return next;
}

let updated = 0;
for (const filePath of landingFiles) {
  let html;
  try {
    html = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }
  await writeFile(filePath, inject(html), 'utf8');
  updated += 1;
}

for (const filePath of await walk(path.join(dist, 'news'))) {
  if (filePath === path.join(dist, 'news', 'index.html')) continue;
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/i.test(html)) continue;
  await writeFile(filePath, inject(html), 'utf8');
  updated += 1;
}

console.log(`Applied final browser-reviewed FMB News polish to ${updated} landing and report page(s).`);