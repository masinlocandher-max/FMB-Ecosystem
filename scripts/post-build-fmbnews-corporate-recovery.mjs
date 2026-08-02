import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-corporate-recovery.css');
const sitewideCssPath = path.join(distRoot, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const markerStart = '/* FMB_NEWS_CORPORATE_RECOVERY_START */';
const markerEnd = '/* FMB_NEWS_CORPORATE_RECOVERY_END */';

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

const [corporateCss, sitewideCss] = await Promise.all([
  readFile(sourceCssPath, 'utf8'),
  readFile(sitewideCssPath, 'utf8'),
]);

const cleanSitewideCss = sitewideCss.replace(
  new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'),
  '',
);

await writeFile(
  sitewideCssPath,
  `${cleanSitewideCss.trimEnd()}\n\n${markerStart}\n${corporateCss.trim()}\n${markerEnd}\n`,
  'utf8',
);

const newsFiles = [...new Set([
  ...await walkHtml(newsRoot),
  ...await walkHtml(fmbNewsRoot),
])];

let verifiedCount = 0;
for (const filePath of newsFiles) {
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  if (!/fmb-sitewide-visual-fixes\.css/i.test(html)) {
    throw new Error(`FMB News corporate recovery requires the final sitewide stylesheet: ${filePath}`);
  }
  verifiedCount += 1;
}

if (!verifiedCount) {
  throw new Error('FMB News corporate recovery could not find generated News pages.');
}

console.log(`Appended the corporate FMB News channel recovery to the required final sitewide stylesheet for ${verifiedCount} generated page(s).`);
