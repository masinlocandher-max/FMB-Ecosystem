import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const contrastHref = '/assets/css/fmb-contrast-polish.css';
const sitewideHref = '/assets/css/fmb-sitewide-visual-fixes.css';
const artworkCssHref = '/assets/css/fmb-cognita-artwork.css';
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
  const contrastIndex = html.lastIndexOf(contrastHref);
  const artworkCssIndex = html.lastIndexOf(artworkCssHref);

  if (sitewideIndex < 0) failures.push(`${name}: missing sitewide visual safeguards`);
  if (contrastIndex < 0) failures.push(`${name}: missing final contrast polish`);
  if (artworkCssIndex < 0) failures.push(`${name}: missing Cognita HD artwork support`);
  if (contrastIndex >= 0 && sitewideIndex >= 0 && contrastIndex < sitewideIndex) {
    failures.push(`${name}: contrast polish is not loaded after the legacy safeguards`);
  }
  if (artworkCssIndex >= 0 && contrastIndex >= 0 && artworkCssIndex < contrastIndex) {
    failures.push(`${name}: Cognita artwork support is not loaded after contrast polish`);
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

const contrastCssPath = path.join(dist, 'assets', 'css', 'fmb-contrast-polish.css');
const contrastCss = await readFile(contrastCssPath, 'utf8');
for (const contract of [
  '.fmb-about-work',
  '.wlf-hero',
  '.fco-section.purple',
  '.projects-hero',
  '.nc-index',
  '.music-section',
  '.ebook-reading-principles',
  'form :is(label, legend)',
]) {
  if (!contrastCss.includes(contract)) {
    failures.push(`fmb-contrast-polish.css: missing contrast contract for ${contract}`);
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

const artworkCss = await readFile(path.join(dist, 'assets', 'css', 'fmb-cognita-artwork.css'), 'utf8');
if (!artworkCss.includes(approvedPortrait)) {
  failures.push('Cognita artwork support does not reinforce the approved portrait in the browser layer.');
}
if (!artworkCss.includes('.nc-cognita-visual::after')) {
  failures.push('Cognita artwork support is missing the newsroom founder-portrait layer.');
}

if (failures.length > 0) {
  console.error('FMB contrast and HD artwork audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `FMB contrast and HD artwork audit passed for ${publicHtml.length} public page(s); Cognita visual is ${dimensions.width}×${dimensions.height} and uses the approved portrait.`,
);
