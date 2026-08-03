import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-corporate-recovery.css');
const editorialCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-editorial-v5.css');
const editorialPolishCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-editorial-v5-polish.css');
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

const [corporateCss, editorialCss, editorialPolishCss, sitewideCss] = await Promise.all([
  readFile(sourceCssPath, 'utf8'),
  readFile(editorialCssPath, 'utf8'),
  readFile(editorialPolishCssPath, 'utf8'),
  readFile(sitewideCssPath, 'utf8'),
]);

const cleanSitewideCss = sitewideCss.replace(
  new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'),
  '',
);

await writeFile(
  sitewideCssPath,
  `${cleanSitewideCss.trimEnd()}\n\n${markerStart}\n${corporateCss.trim()}\n\n${editorialCss.trim()}\n\n${editorialPolishCss.trim()}\n${markerEnd}\n`,
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
  if (!/\bnews-editorial-v5\b/.test(html)) {
    throw new Error(`FMB News Editorial V5 class is missing from generated route: ${filePath}`);
  }
  verifiedCount += 1;
}

if (!verifiedCount) {
  throw new Error('FMB News corporate recovery could not find generated News pages.');
}

console.log(`Appended the corporate base, Editorial V5 design and final decluttering layer to the sitewide stylesheet for ${verifiedCount} generated page(s).`);
