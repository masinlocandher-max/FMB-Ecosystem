import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

let changed = 0;
let removed = 0;
for (const file of await walk(dist)) {
  let html = await readFile(file, 'utf8');
  const before = html;
  html = html.replace(/<a\b[^>]*href=(['"])\/(?:ebooks|music)\/\1[^>]*>[\s\S]*?<\/a>\s*/gi, () => {
    removed += 1;
    return '';
  });
  if (html !== before) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Removed ${removed} retired Reading/Music navigation link(s) across ${changed} public page(s).`);
