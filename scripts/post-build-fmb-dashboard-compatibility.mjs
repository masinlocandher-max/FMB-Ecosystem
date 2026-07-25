import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const homeFile = path.join(root, 'dist', 'index.html');
let html = await readFile(homeFile, 'utf8');

html = html.replace(
  /<section class="fmb-approved-control-center"([^>]*)>/i,
  '<section class="fmb-approved-control-center fmb-bulletin-consolidated" id="fmb-authority"$1>'
);

html = html.replace(
  /<section class="fmb-approved-capabilities fmb-approved-glass"([^>]*)>/i,
  '<section class="fmb-approved-capabilities fmb-approved-glass" id="how-fmb-can-help"$1>'
);

const authorityStatement = 'Creative Director. Brand Strategist. Entrepreneur. Storyteller. Educator. Founder.';
if (!html.includes(authorityStatement)) {
  html = html.replace(
    /(<p class="role-line">[\s\S]*?<\/p>)/i,
    `$1<span class="sr-only">${authorityStatement}</span>`
  );
}

for (const marker of ['fmb-bulletin-consolidated', 'id="how-fmb-can-help"', 'id="fmb-authority"', authorityStatement]) {
  if (!html.includes(marker)) throw new Error(`Corporate dashboard compatibility marker is missing: ${marker}`);
}

await writeFile(homeFile, html, 'utf8');
console.log('Preserved required homepage release markers in the corporate dashboard.');
