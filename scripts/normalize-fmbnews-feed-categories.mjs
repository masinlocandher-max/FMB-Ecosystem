import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const categoryAliases = new Map([
  ['Nation', 'National'],
]);

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

export async function normalizeFmbNewsFeedCategories(contentRoot) {
  let changed = 0;
  for (const file of await walk(contentRoot)) {
    let raw;
    try {
      raw = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      continue;
    }
    const normalized = categoryAliases.get(raw?.category);
    if (!normalized) continue;
    raw.category = normalized;
    await writeFile(file, JSON.stringify(raw, null, 2) + '\n', 'utf8');
    changed += 1;
  }
  console.log(`Normalized ${changed} FMB News legacy feed categor${changed === 1 ? 'y' : 'ies'}.`);
}
