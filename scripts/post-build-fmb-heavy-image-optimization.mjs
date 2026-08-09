import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');

const targets = [
  'assets/images/reading/B4DDDB01-C125-4E08-8908-09A5FE5157E7.png',
  'assets/images/reading/07883274-1340-48DC-A112-C4AD44B5ABD1.png',
  'assets/images/reading/E9562EB3-F505-4736-B5E8-E4D54C769059.png',
  'assets/images/music/fmb-ost-with-love-fmb-cover.png',
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const replacements = new Map();
for (const relativePath of targets) {
  const input = path.join(dist, relativePath);
  try {
    const outputRelative = relativePath.replace(/\.png$/i, '.webp');
    const output = path.join(dist, outputRelative);
    await sharp(input).webp({ quality: 84, effort: 6, smartSubsample: true }).toFile(output);
    const [before, after] = await Promise.all([stat(input), stat(output)]);
    if (after.size >= before.size) continue;
    replacements.set('/' + relativePath, '/' + outputRelative);
    console.log(`Optimized ${relativePath}: ${before.size} -> ${after.size} bytes`);
  } catch (error) {
    console.warn(`Skipped image optimization for ${relativePath}: ${error.message}`);
  }
}

if (replacements.size) {
  const textFiles = (await walk(dist)).filter((file) => /\.(?:html|css|js|json|xml)$/i.test(file));
  for (const file of textFiles) {
    let content = await readFile(file, 'utf8');
    const original = content;
    for (const [from, to] of replacements) content = content.replaceAll(from, to);
    if (content !== original) await writeFile(file, content, 'utf8');
  }
}

console.log(`Image optimization applied to ${replacements.size} asset(s).`);
