import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let removedLinks = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-faithful-v11\b/.test(html)) continue;
  const before = html;

  const retiredLinks = html.match(/<link\b[^>]*href=(["'])[^"']*fmb-news-channel-v4\.css[^"']*\1[^>]*>\s*/gi) ?? [];
  removedLinks += retiredLinks.length;
  html = html.replace(/<link\b[^>]*href=(["'])[^"']*fmb-news-channel-v4\.css[^"']*\1[^>]*>\s*/gi, '');

  const v11Style = html.match(/<style\b[^>]*data-fmb-news-faithful-v11[^>]*>[\s\S]*?<\/style>/i)?.[0];
  if (!v11Style) throw new Error(`FMB News V11 final style is missing: ${filePath}`);
  html = html.replace(/<style\b[^>]*data-fmb-news-faithful-v11[^>]*>[\s\S]*?<\/style>\s*/gi, '');
  html = html.replace(/<\/head>/i, `${v11Style}</head>`);

  if (/fmb-news-channel-v4\.css/i.test(html)) throw new Error(`Retired FMB News channel stylesheet remains: ${filePath}`);
  const stylePosition = html.lastIndexOf('data-fmb-news-faithful-v11');
  const headClose = html.indexOf('</head>');
  if (stylePosition < 0 || headClose < 0 || stylePosition > headClose) throw new Error(`FMB News V11 final style order is invalid: ${filePath}`);

  if (html !== before) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (!updated || removedLinks !== updated) {
  throw new Error(`FMB News V11 finalizer expected one retired stylesheet per route; updated ${updated}, removed ${removedLinks}.`);
}

console.log(`Removed the retired FMB News Channel V4 stylesheet from ${updated} V11 route(s) and restored the faithful V11 layer as the final head style.`);
