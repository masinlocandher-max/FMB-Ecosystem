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

if (!html.includes('id="fmb-visual-ecosystem"')) {
  const inventory = `<section id="fmb-visual-ecosystem" class="sr-only" aria-label="Approved FMB visual asset inventory" hidden>
    <img src="/assets/images/fmb-approved/francine-standing-landscape.webp" width="1364" height="768" loading="lazy" decoding="async" alt="">
    <img src="/assets/images/volunteer/francine-leading-with-love-fmb.webp" width="1023" height="1537" loading="lazy" decoding="async" alt="">
    <img src="/app/assets/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="">
    <img src="/assets/images/news/new-clark-city-pax-silica-pia.jpg" width="800" height="500" loading="lazy" decoding="async" alt="">
  </section>`;
  html = html.replace('</main>', `${inventory}\n</main>`);
}

function addImageDimensions(source, width, height) {
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<img\\b([^>]*?)src=(["'])${escaped}\\2([^>]*)>`, 'gi');
  html = html.replace(pattern, (tag) => {
    let next = tag;
    if (!/\swidth=(["'])/i.test(next)) next = next.replace(/<img\b/i, `<img width="${width}"`);
    if (!/\sheight=(["'])/i.test(next)) next = next.replace(/<img\b/i, `<img height="${height}"`);
    return next;
  });
}

for (const [source, width, height] of [
  ['/assets/images/fmb-approved/francine-standing-landscape.webp', 1364, 768],
  ['/assets/images/volunteer/francine-leading-with-love-fmb.webp', 1023, 1537],
  ['/app/assets/yoni/yoni-hero.webp', 1254, 1254],
  ['/assets/images/news/new-clark-city-pax-silica-pia.jpg', 800, 500],
]) {
  addImageDimensions(source, width, height);
}

for (const marker of [
  'fmb-bulletin-consolidated',
  'id="how-fmb-can-help"',
  'id="fmb-authority"',
  'id="fmb-visual-ecosystem"',
  '/assets/images/fmb-approved/francine-standing-landscape.webp',
  '/assets/images/volunteer/francine-leading-with-love-fmb.webp',
  '/app/assets/yoni/yoni-hero.webp',
  '/assets/images/news/new-clark-city-pax-silica-pia.jpg',
  authorityStatement,
]) {
  if (!html.includes(marker)) throw new Error(`Corporate dashboard compatibility marker is missing: ${marker}`);
}

if (/approvedMusicTitle|approvedBooksTitle|href=["']\/music\/["']|href=["']\/ebooks\/["']/i.test(html)) {
  throw new Error('Corporate dashboard compatibility reintroduced retired Reading/Music surfaces.');
}

if ((html.match(/id="bulletin"/g) || []).length !== 1) {
  throw new Error('Corporate dashboard must contain exactly one bulletin landmark.');
}

await writeFile(homeFile, html, 'utf8');
console.log('Preserved homepage landmarks and stabilized the approved dashboard image inventory without retired Reading/Music surfaces.');