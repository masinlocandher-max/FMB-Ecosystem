import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb');
const outputRoot = path.join(repositoryRoot, 'dist');

await mkdir(path.join(outputRoot, 'assets', 'js'), { recursive: true });
const sourceHtml = await readFile(path.join(sourceRoot, 'index.html'), 'utf8');
let productionHtml = sourceHtml
  .replaceAll(
    '/assets/images/home/fmb-home-logo.webp',
    '/assets/images/fmb-approved/fmb-master-transparent.webp',
  )
  .replaceAll(
    '/assets/images/home/francine-home-hero-hd.webp',
    '/assets/images/fmb-approved/francine-standing-landscape.webp',
  )
  .replaceAll(
    '/assets/images/home/francine-home-founder-hd.webp',
    '/assets/images/fmb-approved/francine-seated-landscape.webp',
  )
  .replace(
    '<link rel="icon" href="/assets/images/fmb-approved/fmb-master-transparent.webp" type="image/webp">',
    '<link rel="icon" href="/assets/images/fmb-approved/fmb-master-purple-square.webp" type="image/webp">',
  )
  .replace(
    '<style>html{background:#05020a}body{visibility:hidden}</style>',
    '<style>html{background:#05020a}body{visibility:visible}</style>',
  );

const visualIntegrityStyles = `<style id="fmb-production-visual-integrity">
img[src*="/assets/images/fmb-approved/"]{background:transparent!important;border-color:transparent!important}
.site-brand,.site-brand img,.fmb-product-brand,.fmb-product-brand img,.fmb-product-footer img,.nc-publication-brand img,.nc-channel-lockup img{background:transparent!important}
</style>`;
productionHtml = productionHtml.replace('</head>', `${visualIntegrityStyles}</head>`);

await writeFile(path.join(outputRoot, 'index.html'), productionHtml, 'utf8');
await copyFile(
  path.join(sourceRoot, 'assets', 'js', 'fmb-home-approved.js'),
  path.join(outputRoot, 'assets', 'js', 'fmb-home-approved.js'),
);

console.log('Restored the approved transparent FMB homepage assets as visible, resilient production output.');
