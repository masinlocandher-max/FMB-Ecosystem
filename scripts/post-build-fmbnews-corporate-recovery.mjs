import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-corporate-recovery.css');
const distCssDirectory = path.join(distRoot, 'assets', 'css');
const distCssPath = path.join(distCssDirectory, 'fmbnews-corporate-recovery.css');
const stylesheetHref = '/assets/css/fmbnews-corporate-recovery.css?v=20260803-corporate-recovery-v1';
const markerStart = '<!-- FMB_NEWS_CORPORATE_RECOVERY_START -->';
const markerEnd = '<!-- FMB_NEWS_CORPORATE_RECOVERY_END -->';

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

function injectCorporateStylesheet(html) {
  const clean = html
    .replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}\\s*`, 'g'), '')
    .replace(/<link\b[^>]*href=(['"])[^'"]*fmbnews-corporate-recovery\.css[^'"]*\1[^>]*>\s*/gi, '');

  const link = `${markerStart}\n<link rel="stylesheet" href="${stylesheetHref}">\n${markerEnd}`;
  if (!clean.includes('</head>')) {
    throw new Error('FMB News corporate recovery could not find a closing head tag.');
  }
  return clean.replace('</head>', `${link}\n</head>`);
}

await mkdir(distCssDirectory, { recursive: true });
await copyFile(sourceCssPath, distCssPath);

const files = [
  ...await walkHtml(newsRoot),
  ...await walkHtml(fmbNewsRoot),
];

const uniqueFiles = [...new Set(files)];
let updatedCount = 0;
for (const filePath of uniqueFiles) {
  const html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  const updated = injectCorporateStylesheet(html);
  await writeFile(filePath, updated, 'utf8');
  updatedCount += 1;
}

if (!updatedCount) {
  throw new Error('FMB News corporate recovery did not update any generated News pages.');
}

console.log(`Applied the final corporate FMB News channel layer to ${updatedCount} generated page(s).`);
