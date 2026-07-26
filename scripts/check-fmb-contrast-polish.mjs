import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const sitewideHref = '/assets/css/fmb-sitewide-visual-fixes.css';
const cognitaArtwork = '/assets/images/news/cognita-filipino-centered-education.svg';
const approvedPortrait = '/assets/images/fmb-approved/francine-portrait-front.webp';
const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const excludedFiles = new Set([
  'admin.html',
  'login.html',
  'signup.html',
  'reset-password.html',
  'confirm-email.html',
]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function readSvgDimensions(svg) {
  const viewBox = svg.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
  const width = Number(svg.match(/\bwidth=["']([\d.]+)/i)?.[1]);
  const height = Number(svg.match(/\bheight=["']([\d.]+)/i)?.[1]);
  return { width, height };
}

const relative = (file) => path.relative(dist, file).replaceAll(path.sep, '/');
const publicHtml = (await walk(dist)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

if (publicHtml.length === 0) {
  throw new Error('Contrast audit found no generated public HTML pages.');
}

const failures = [];
for (const file of publicHtml) {
  const name = relative(file);
  const html = await readFile(file, 'utf8');
  const sitewideIndex = html.lastIndexOf(sitewideHref);
  const lastStylesheetIndex = html.lastIndexOf('<link rel="stylesheet"');

  if (sitewideIndex < 0) failures.push(`${name}: missing final sitewide visual safeguards`);
  if (sitewideIndex >= 0 && lastStylesheetIndex >= 0 && sitewideIndex < lastStylesheetIndex) {
    failures.push(`${name}: final sitewide visual safeguards are not the last stylesheet`);
  }
  if (html.includes('/assets/css/fmb-contrast-polish.css')) {
    failures.push(`${name}: contrast polish was linked separately instead of bundled into the approved final stylesheet`);
  }
  if (html.includes('/assets/css/fmb-cognita-artwork.css')) {
    failures.push(`${name}: Cognita artwork support was linked separately instead of bundled into the approved final stylesheet`);
  }
  if (html.includes('/assets/css/fmb-news-lead-contrast.css')) {
    failures.push(`${name}: FMB News lead contrast was linked separately instead of bundled into the approved final stylesheet`);
  }
}

const requiredRoutes = [
  'index.html',
  'aboutfmb/index.html',
  'news/index.html',
  'news/filipino-centered-training-institution-cognita-vision/index.html',
  'projects/index.html',
  'withlovefmb/index.html',
  'fmbandco/index.html',
  'music/index.html',
  'ebooks/index.html',
];

for (const route of requiredRoutes) {
  try {
    await stat(path.join(dist, route));
  } catch {
    failures.push(`${route}: required public route is missing from the build`);
  }
}

for (const route of [
  'news/index.html',
  'news/filipino-centered-training-institution-cognita-vision/index.html',
]) {
  try {
    const html = await readFile(path.join(dist, route), 'utf8');
    if (!html.includes(cognitaArtwork)) {
      failures.push(`${route}: does not reference the rebuilt Cognita lead visual`);
    }
  } catch {
    // The missing route is already reported above.
  }
}

const finalCssPath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const finalCss = await readFile(finalCssPath, 'utf8');
for (const contract of [
  'Final contrast contracts appended by the release build',
  '.fmb-about-work',
  '.wlf-hero',
  '.fco-section.purple',
  '.projects-hero',
  '.nc-index',
  '.music-section',
  '.ebook-reading-principles',
  'form :is(label, legend)',
  'Cognita HD artwork support appended by the release build',
  '.nc-cognita-visual::after',
  approvedPortrait,
  'FMB News lead-story contrast appended by the release build',
  '.nc-lead-overlay h2',
  '.nc-lead-broadcast .news-visual::after',
]) {
  if (!finalCss.includes(contract)) {
    failures.push(`fmb-sitewide-visual-fixes.css: missing final contract for ${contract}`);
  }
}

const artworkPath = path.join(dist, cognitaArtwork);
const artwork = await readFile(artworkPath, 'utf8');
const dimensions = readSvgDimensions(artwork);
if (dimensions.width < 1536 || dimensions.height < 864) {
  failures.push(`Cognita lead visual is only ${dimensions.width || 0}×${dimensions.height || 0}; expected at least 1536×864`);
}
if (!artwork.includes(approvedPortrait)) {
  failures.push('Cognita lead visual does not reference the approved high-resolution Francine portrait.');
}
if (/data:image\//i.test(artwork)) {
  failures.push('Cognita lead visual still embeds a low-resolution raster data URI.');
}
if (!artwork.includes('COGNITA') || !artwork.includes('INSTITUTE OF AI')) {
  failures.push('Cognita lead visual is missing its code-native institutional identity.');
}

if (failures.length > 0) {
  console.error('FMB contrast and HD artwork audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `FMB contrast and HD artwork audit passed for ${publicHtml.length} public page(s); the final stylesheet owns all contrast contracts and the Cognita visual is ${dimensions.width}×${dimensions.height}.`,
);
