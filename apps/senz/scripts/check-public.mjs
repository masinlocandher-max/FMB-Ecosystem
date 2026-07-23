import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (/\.(?:html|css|xml)$/i.test(entry.name)) files.push(fullPath);
  }
}

await walk(root);
const output = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');
const required = [
  'SENZ is the marketing and digital solutions business of FMB',
  'Public service menu',
  'Not published',
];
const prohibited = [
  'Visibility Launch System',
  'SENZ Music',
  'SENZ FotoLab',
  'Six Specialist Divisions',
  'Pageant PR',
  'Request a Consultation',
  'Typical deliverables',
  'Core Services',
  'Client portal',
];

for (const marker of required) {
  if (!output.includes(marker)) throw new Error(`SENZ public build is missing: ${marker}`);
}

for (const marker of prohibited) {
  if (output.includes(marker)) throw new Error(`SENZ public build exposes an unverified claim or workflow: ${marker}`);
}

console.log(`SENZ public build verified across ${files.length} generated files.`);
