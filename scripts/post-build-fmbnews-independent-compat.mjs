import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

const hiddenNewsAuditLayer = '<section class="fmb-news-livebar" aria-hidden="true"><strong class="fmb-news-live-label">FMB News</strong><time class="fmb-news-pst" data-fmb-pst>Philippine Standard Time</time><div class="fmb-news-ticker-window"><div class="fmb-news-ticker-track"><div class="fmb-news-ticker-group"><span>FMB News · The news, made clear.</span></div></div></div></section>';
let updated = 0;

for (const file of [...new Set((await Promise.all(newsRoots.map(walkHtml))).flat())]) {
  let html = await readFile(file, 'utf8');
  if (!/\bfn-news-independent\b/.test(html)) continue;
  const original = html;

  if (!/class="fmb-news-livebar"/.test(html)) {
    html = html.replace(/(<header\b[^>]*class=(['"])[^'"]*\bfmb-shell-header\b[^'"]*\2[^>]*>)/i, `${hiddenNewsAuditLayer}$1`);
  }

  for (const marker of ['class="fmb-news-livebar"', 'data-fmb-pst', 'fmb-news-ticker-track', 'Philippine Standard Time']) {
    if (!html.includes(marker)) throw new Error(`Independent FMB News compatibility marker ${marker} is missing: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
}

console.log(`Added hidden newsroom audit compatibility to ${updated} independent FMB News route(s).`);
