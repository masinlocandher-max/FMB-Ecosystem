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
  'Cognita Institute is currently',
  'Join the waitlist',
  'No automatic enrollment or payment is being processed',
  'Cognita Open Learning',
  'Professional Programs',
  'Admissions and Registrar',
  'Official portraits are now assigned',
  'Student and staff access is temporarily closed',
];

const prohibited = [
  'Enrollment is now open',
  'Enroll now and pay',
  'Guaranteed certification',
  'Government-accredited degree',
  'CHED-accredited',
  'TESDA-accredited',
  'Automatic credential issuance',
];

for (const marker of required) {
  if (!output.includes(marker)) {
    throw new Error(`Cognita public build is missing an expected page or safety marker: ${marker}`);
  }
}

for (const marker of prohibited) {
  if (output.includes(marker)) {
    throw new Error(`Cognita public build exposes an unapproved claim or workflow: ${marker}`);
  }
}

console.log(`Cognita public pages and publication safeguards verified across ${files.length} generated files.`);
