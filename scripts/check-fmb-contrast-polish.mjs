import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const contrastHref = '/assets/css/fmb-contrast-polish.css';
const sitewideHref = '/assets/css/fmb-sitewide-visual-fixes.css';
const oldCognitaArtwork = '/assets/images/news/cognita-filipino-centered-education.svg';
const hdCognitaArtwork = '/assets/images/news/cognita-filipino-centered-education-hd.webp';
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

function readWebpDimensions(buffer) {
  if (
    buffer.length < 30
    || buffer.toString('ascii', 0, 4) !== 'RIFF'
    || buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new Error('HD Cognita artwork is not a valid WebP container.');
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;

    if (type === 'VP8X' && data + 10 <= buffer.length) {
      return {
        width: 1 + buffer.readUIntLE(data + 4, 3),
        height: 1 + buffer.readUIntLE(data + 7, 3),
      };
    }

    if (type === 'VP8 ' && data + 10 <= buffer.length) {
      if (buffer[data + 3] !== 0x9d || buffer[data + 4] !== 0x01 || buffer[data + 5] !== 0x2a) {
        throw new Error('HD Cognita artwork has an invalid VP8 frame header.');
      }
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff,
      };
    }

    offset = data + size + (size % 2);
  }

  throw new Error('Unable to read dimensions from the HD Cognita artwork.');
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

  if (sitewideIndex < 0) failures.push(`${name}: missing sitewide visual safeguards`);
  if (contrastIndex < 0) failures.push(`${name}: missing final contrast polish`);
  if (contrastIndex >= 0 && sitewideIndex >= 0 && contrastIndex < sitewideIndex) {
    failures.push(`${name}: contrast polish is not loaded after the legacy safeguards`);
  }
  if (html.includes(oldCognitaArtwork)) {
    failures.push(`${name}: still references the low-resolution Cognita wrapper`);
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

const hdImagePath = path.join(dist, hdCognitaArtwork);
const hdImage = await readFile(hdImagePath);
const dimensions = readWebpDimensions(hdImage);
if (dimensions.width < 1536 || dimensions.height < 864) {
  failures.push(`HD Cognita artwork is only ${dimensions.width}×${dimensions.height}; expected at least 1536×864`);
}
if (hdImage.length < 50_000) {
  failures.push(`HD Cognita artwork is unexpectedly small at ${hdImage.length} bytes`);
}

if (failures.length > 0) {
  console.error('FMB contrast and HD artwork audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `FMB contrast and HD artwork audit passed for ${publicHtml.length} public page(s); Cognita artwork is ${dimensions.width}×${dimensions.height}.`,
);
