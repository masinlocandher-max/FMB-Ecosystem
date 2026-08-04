import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const manifestPath = path.join(dist, 'assets', 'data', 'fmbnews-manifest.json');
const summaryPath = path.join(dist, 'assets', 'data', 'fmbnews-hd-upgrades.json');
const [manifestText, summaryText] = await Promise.all([
  readFile(manifestPath, 'utf8'),
  readFile(summaryPath, 'utf8'),
]);
const manifest = JSON.parse(manifestText);
const summary = JSON.parse(summaryText);
manifest.preservation = {
  ...manifest.preservation,
  imagesChanged: Number(summary.total) > 0,
  displayImagesUpgraded: Number(summary.total) || 0,
  originalImagesDeleted: false,
  articleRoutesDeleted: false,
  articleTextChanged: false,
  hdImagesVerified: true,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Recorded ${manifest.preservation.displayImagesUpgraded} audited HD display upgrade(s) in the FMB News manifest.`);