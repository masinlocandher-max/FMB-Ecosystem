import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const targets = [
  path.join(root, 'dist', 'news', 'index.html'),
  path.join(root, 'dist', 'fmbnews', 'index.html')
];

for (const file of targets) {
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }

  const compact = html
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  await writeFile(file, compact, 'utf8');
}

console.log('Compacted FMB News landing HTML without changing visible editorial content.');
