import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoots = [path.join(root, 'dist', 'news'), path.join(root, 'dist', 'fmbnews')];
const officialLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const visibleOfficialLogo = /<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*fmb-news-official-transparent\.webp/i;

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
let verified = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-reference-v13\b/.test(html)) continue;
  const original = html;

  html = html
    .replace(/<img\b[^>]*data-fmb-news-footer-logo[^>]*>\s*/gi, '')
    .replace(/html body\.news-reference-v13 \.fn13-footer-logo\{[^}]*\}\n?/g, '')
    .replace(/html body\.news-reference-v13 \.fn11-footer-brand>\.fn11-signal-mark,html body\.news-reference-v13 \.fn11-footer-brand>div>\.fn11-wordmark\{[^}]*\}\n?/g, '');

  const header = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn13-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (!header.includes(officialLogo) || !visibleOfficialLogo.test(header)) {
    throw new Error(`FMB News official masthead logo missing after compatibility cleanup: ${file}`);
  }

  const outsideHeader = html.replace(header, '');
  if (visibleOfficialLogo.test(outsideHeader)) {
    throw new Error(`FMB News official logo visibly renders outside the masthead: ${file}`);
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
  verified += 1;
}

if (!verified) throw new Error('FMB News reference compatibility could not find generated News routes.');
console.log(`Kept the official FMB News logo in the approved masthead-only lockup across ${verified} generated page(s); cleaned ${updated} visible footer duplicate(s).`);
