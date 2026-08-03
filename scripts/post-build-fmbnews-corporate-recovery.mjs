import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fmbNewsRoot = path.join(distRoot, 'fmbnews');
const sourceCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-corporate-recovery.css');
const editorialCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-editorial-v5.css');
const editorialPolishCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-editorial-v5-polish.css');
const mobileCssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-mobile-v6.css');
const sitewideCssPath = path.join(distRoot, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const distMobileCssPath = path.join(distRoot, 'assets', 'css', 'fmbnews-mobile-v6.css');
const markerStart = '/* FMB_NEWS_CORPORATE_RECOVERY_START */';
const markerEnd = '/* FMB_NEWS_CORPORATE_RECOVERY_END */';
const sitewideVersion = '20260803-news-editorial-v6';
const mobileVersion = '20260803-mobile-v6';

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

const [corporateCss, editorialCss, editorialPolishCss, mobileCss, sitewideCss] = await Promise.all([
  readFile(sourceCssPath, 'utf8'),
  readFile(editorialCssPath, 'utf8'),
  readFile(editorialPolishCssPath, 'utf8'),
  readFile(mobileCssPath, 'utf8'),
  readFile(sitewideCssPath, 'utf8'),
]);

const cleanSitewideCss = sitewideCss.replace(
  new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'),
  '',
);

await mkdir(path.dirname(distMobileCssPath), { recursive: true });
await Promise.all([
  writeFile(
    sitewideCssPath,
    `${cleanSitewideCss.trimEnd()}\n\n${markerStart}\n${corporateCss.trim()}\n\n${editorialCss.trim()}\n\n${editorialPolishCss.trim()}\n${markerEnd}\n`,
    'utf8',
  ),
  writeFile(distMobileCssPath, `${mobileCss.trim()}\n`, 'utf8'),
]);

const newsFiles = [...new Set([
  ...await walkHtml(newsRoot),
  ...await walkHtml(fmbNewsRoot),
])];

const mobileLink = `<link rel="stylesheet" href="/assets/css/fmbnews-mobile-v6.css?v=${mobileVersion}" data-fmb-news-mobile-v6>`;
let verifiedCount = 0;
let updatedCount = 0;

for (const filePath of newsFiles) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:route|story-route)\b/.test(html) && !/\bnews-channel-v4\b/.test(html)) continue;
  if (!/fmb-sitewide-visual-fixes\.css/i.test(html)) {
    throw new Error(`FMB News corporate recovery requires the final sitewide stylesheet: ${filePath}`);
  }
  if (!/\bnews-editorial-v5\b/.test(html)) {
    throw new Error(`FMB News Editorial V5 class is missing from generated route: ${filePath}`);
  }

  const original = html;
  html = html
    .replace(
      /fmb-sitewide-visual-fixes\.css(?:\?v=[^"'<>\s]*)?/gi,
      `fmb-sitewide-visual-fixes.css?v=${sitewideVersion}`,
    )
    .replace(/<link\b[^>]*data-fmb-news-mobile-v6[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*src=(['"])\/assets\/js\/az-assistant\.js[^'"]*\1[^>]*>\s*<\/script>\s*/gi, '')
    .replace(/<\/head>/i, `${mobileLink}</head>`);

  if (!html.includes(`fmb-sitewide-visual-fixes.css?v=${sitewideVersion}`)) {
    throw new Error(`FMB News cache-busted sitewide stylesheet is missing: ${filePath}`);
  }
  if (!html.includes('data-fmb-news-mobile-v6')) {
    throw new Error(`FMB News mobile V6 stylesheet is missing: ${filePath}`);
  }
  if (!/\/assets\/js\/fmb-unified-system\.js/i.test(html)) {
    throw new Error(`FMB News must retain the unified public-site system: ${filePath}`);
  }
  if (/\/assets\/js\/az-assistant\.js/i.test(html)) {
    throw new Error(`FMB News must not directly load the Reception Desk bundle: ${filePath}`);
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updatedCount += 1;
  }
  verifiedCount += 1;
}

if (!verifiedCount) {
  throw new Error('FMB News corporate recovery could not find generated News pages.');
}

console.log(`Appended the corporate base, Editorial V5 design and final decluttering layer to the sitewide stylesheet for ${verifiedCount} generated page(s); cache-busted and mobile-hardened ${updatedCount} route(s).`);
