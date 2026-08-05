import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const source = path.join(dist, 'news', 'index.html');
const aliasDir = path.join(dist, 'fmbnews');
const alias = path.join(aliasDir, 'index.html');

await mkdir(aliasDir, { recursive: true });
const html = await readFile(source, 'utf8');
await writeFile(alias, html, 'utf8');
console.log('Restored /fmbnews/ as an alias of /news/.');
