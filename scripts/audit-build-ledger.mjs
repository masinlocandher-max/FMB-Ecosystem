import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const build = String(pkg.scripts?.build || '');
const references = [...build.matchAll(/(?:node\s+)(scripts\/post-build-[^\s&]+\.mjs)/g)].map((match) => match[1]);
const counts = new Map();
for (const item of references) counts.set(item, (counts.get(item) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
const files = (await readdir(path.join(root, 'scripts'))).filter((name) => /^post-build-.*\.mjs$/.test(name)).sort();
const active = new Set(references.map((item) => path.basename(item)));
const inactive = files.filter((file) => !active.has(file));

console.log(`Active post-build invocations in package build: ${references.length}`);
console.log(`Unique active post-build scripts: ${counts.size}`);
console.log(`Post-build files present in scripts/: ${files.length}`);
console.log(`Inactive post-build files: ${inactive.length}`);
console.log(`Duplicate active invocations: ${duplicates.length}`);
for (const [file, count] of duplicates) console.log(`  ${file} x${count}`);
