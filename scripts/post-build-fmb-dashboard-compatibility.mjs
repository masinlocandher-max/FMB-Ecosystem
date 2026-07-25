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

let bulletinSeen = false;
html = html.replace(/\sid=(['"])bulletin\1/gi, (match) => {
  if (!bulletinSeen) {
    bulletinSeen = true;
    return match;
  }
  return ' data-fmb-legacy-bulletin="true"';
});

if (!bulletinSeen) {
  html = html.replace(
    /<section class="fmb-approved-library-panel fmb-approved-glass"([^>]*)aria-labelledby="approvedNewsTitle"/i,
    '<section class="fmb-approved-library-panel fmb-approved-glass" id="bulletin"$1aria-labelledby="approvedNewsTitle"'
  );
}

for (const marker of ['fmb-bulletin-consolidated', 'id="how-fmb-can-help"', 'id="fmb-authority"', authorityStatement]) {
  if (!html.includes(marker)) throw new Error(`Corporate dashboard compatibility marker is missing: ${marker}`);
}

if ((html.match(/id="bulletin"/g) || []).length !== 1) {
  throw new Error('Corporate dashboard must contain exactly one bulletin landmark.');
}

await writeFile(homeFile, html, 'utf8');
console.log('Preserved required homepage release markers and one bulletin landmark in the corporate dashboard.');
