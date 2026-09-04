import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(new URL('../../dist/', import.meta.url).pathname);
const root = path.join(dist, 'news', 'morning-special');

let updated = 0;
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
  const file = path.join(root, entry.name, 'index.html');
  let html = await readFile(file, 'utf8');
  const chapters = (html.match(/class="chapter"/g) || []).length;
  if (!chapters) throw new Error(`Morning Special ${entry.name} has no chapters to frame.`);
  const label = `${chapters} chapter${chapters === 1 ? '' : 's'} · One complete edition`;
  const next = html.replace(/\d+\s+chapters?\s+·\s+One complete edition/g, label);
  if (next !== html) {
    await writeFile(file, next, 'utf8');
    updated += 1;
  }
}

console.log(`Aligned Morning Special chapter framing across ${updated} edition page(s).`);
