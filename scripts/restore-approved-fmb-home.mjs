import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb');
const outputRoot = path.join(repositoryRoot, 'dist');

await mkdir(path.join(outputRoot, 'assets', 'js'), { recursive: true });
const sourceHtml = await readFile(path.join(sourceRoot, 'index.html'), 'utf8');
let productionHtml = sourceHtml.replaceAll(
  '/assets/images/home/fmb-home-logo.webp',
  '/assets/images/fmb-approved/fmb-master-transparent.webp',
);
if (!/rel=["']manifest["']/i.test(productionHtml)) {
  productionHtml = productionHtml.replace('</head>', '<link rel="manifest" href="/manifest.webmanifest">\n</head>');
}
await writeFile(path.join(outputRoot, 'index.html'), productionHtml, 'utf8');
await copyFile(
  path.join(sourceRoot, 'assets', 'js', 'fmb-home-approved.js'),
  path.join(outputRoot, 'assets', 'js', 'fmb-home-approved.js'),
);

console.log('Restored the approved FMB homepage, visual bundle, and public web app manifest as the final production output.');
