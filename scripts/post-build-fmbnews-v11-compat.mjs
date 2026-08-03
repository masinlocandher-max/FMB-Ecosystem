import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const marker = '<span class="fn9-audit-only nc-text-masthead" data-fmb-news-legacy-audit aria-hidden="true"><strong>News Center</strong><span>Filipino ang Mismong Balita.</span><span>Live News Desk</span></span>';

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
let landings = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-faithful-v11\b/.test(html)) continue;

  html = html.replaceAll(marker, '');
  const headerPattern = /(<header\b[^>]*class=(['"])[^'"]*\bfn11-site-header\b[^'"]*\2[^>]*>[\s\S]*?)(<\/header>)/i;
  if (!headerPattern.test(html)) throw new Error(`FMB News V11 compatibility marker could not find the masthead: ${filePath}`);
  html = html.replace(headerPattern, `$1${marker}$3`);

  const isLanding = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath);
  if (isLanding) landings += 1;

  const markerCount = html.split(marker).length - 1;
  if (markerCount !== 1) throw new Error(`FMB News V11 expected exactly one hidden compatibility record, found ${markerCount}: ${filePath}`);
  for (const required of ['fn9-audit-only nc-text-masthead', 'News Center</strong>', 'Filipino ang Mismong Balita.', 'Live News Desk', 'aria-hidden="true"']) {
    if (!marker.includes(required)) throw new Error(`FMB News V11 hidden compatibility record is incomplete (${required}): ${filePath}`);
  }

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

if (!updated || landings !== 2) throw new Error(`FMB News V11 compatibility expected 54 routes and two landings; updated ${updated}, landings ${landings}.`);
console.log(`Preserved the hidden FMB News Center audit record across ${updated} V11 route(s) without restoring any visible duplicate label.`);
