import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else if (/\.(?:html|js|css|xml)$/i.test(entry.name)) files.push(fullPath);
  }
}

await walk(root);
const output = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');
const required = [
  'Cognita is the knowledge and learning arm of FMB',
  'Registration',
  'Closed',
  'None published',
];
const prohibited = [
  'Certificate of Completion',
  'Student Dashboard',
  'Admissions',
  'Apply Now',
  'Register',
  'Tuition',
  'Program fee',
  'Accredited',
  'Facilitator',
  'Open Learning',
];

for (const marker of required) {
  if (!output.includes(marker)) throw new Error(`Cognita public build is missing: ${marker}`);
}

for (const marker of prohibited) {
  if (output.includes(marker)) throw new Error(`Cognita public build exposes an unverified claim or workflow: ${marker}`);
}

console.log(`Cognita public build verified across ${files.length} generated files.`);
