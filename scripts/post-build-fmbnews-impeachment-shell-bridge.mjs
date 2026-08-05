import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const newsRoot = path.join(root, 'dist', 'news');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

let patched = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/i.test(html)) continue;
  if (!/\bnc-site-header\b/i.test(html)) {
    html = html.replace(/<body\b([^>]*)>/i, '<body$1><header class="nc-site-header"></header>');
    patched += 1;
  }
  if (!/\bnc-footer\b/i.test(html)) {
    html = html.replace('</body>', '<footer class="nc-footer"><div class="wrap"></div></footer></body>');
  }
  await writeFile(filePath, html, 'utf8');
}

console.log(`Prepared ${patched} newly generated FMB News report page(s) for the existing masthead guard without changing article text.`);
