import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(repositoryRoot, 'apps', 'withlovefmb');
const outputRoot = path.join(repositoryRoot, 'dist');
const assetOutput = path.join(outputRoot, 'assets');
const version = '20260723-unified-v1';

const stylesheetHref = `/assets/css/fmb-unified-redesign.css?v=${version}`;
const priorityHref = `/assets/css/fmb-unified-priority.css?v=${version}`;
const contentHref = `/assets/css/fmb-unified-content.css?v=${version}`;
const scriptSrc = `/assets/js/fmb-unified-shell.js?v=${version}`;
const fontHref = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Montserrat:wght@400;500;600;700;800&display=swap';

const excludedPrefixes = [
  '_sites/',
  'app/',
  'admin/',
  'data-center/',
  'auth/',
  'api/',
];

const readingFiles = new Set([
  'reading.html',
  'dress-with-intention.html',
  'womens-health.html',
  'skin-care-makeup.html',
  'coming-out-respect.html',
  'men-can-cry.html',
]);

function normalize(relativePath) {
  return relativePath.replaceAll(path.sep, '/');
}

function classify(relativePath) {
  const file = normalize(relativePath).toLowerCase();
  if (excludedPrefixes.some((prefix) => file.startsWith(prefix))) return null;
  if (file === 'index.html') return 'home';
  if (readingFiles.has(file)) return 'reading';
  if (file.startsWith('aboutfmb/')) return 'about';
  if (file.startsWith('news/')) return 'news';
  if (file.startsWith('projects/')) return 'projects';
  if (file.startsWith('ebooks/')) return 'ebooks';
  if (file.startsWith('music/')) return 'music';
  if (file.startsWith('withlovefmb/')) return 'withlove';
  if (file.startsWith('communityengagements/')) return 'community';
  if (file.startsWith('gethelp/')) return 'help';
  if (file.startsWith('fmbandco/')) return 'company';
  if (file.startsWith('mabayani/')) return 'mabayani';
  return null;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function setBodyPage(html, page) {
  return html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    const withoutOld = attributes.replace(/\sdata-fmb-page=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, '');
    return `<body${withoutOld} data-fmb-page="${page}">`;
  });
}

function addHeadAssets(html) {
  let next = html;
  const fontLinks = next.includes('fonts.googleapis.com/css2?family=Cinzel')
    ? ''
    : `\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="${fontHref}" rel="stylesheet">`;
  const designLinks = [stylesheetHref, priorityHref, contentHref]
    .filter((href) => !next.includes(href))
    .map((href) => `  <link rel="stylesheet" href="${href}">`)
    .join('\n');

  if (fontLinks || designLinks) {
    next = next.replace('</head>', `${fontLinks}${designLinks ? `\n${designLinks}` : ''}\n</head>`);
  }
  return next;
}

function addShellScript(html) {
  if (html.includes(scriptSrc)) return html;
  return html.replace('</body>', `  <script src="${scriptSrc}" defer></script>\n</body>`);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

await mkdir(path.join(assetOutput, 'css'), { recursive: true });
await mkdir(path.join(assetOutput, 'js'), { recursive: true });
for (const stylesheet of [
  'fmb-unified-redesign.css',
  'fmb-unified-priority.css',
  'fmb-unified-content.css',
]) {
  await copyFile(
    path.join(sourceRoot, 'assets', 'css', stylesheet),
    path.join(assetOutput, 'css', stylesheet),
  );
}
await copyFile(
  path.join(sourceRoot, 'assets', 'js', 'fmb-unified-shell.js'),
  path.join(assetOutput, 'js', 'fmb-unified-shell.js'),
);

const publicPages = [];
for (const file of await walk(outputRoot)) {
  if (path.extname(file).toLowerCase() !== '.html') continue;
  const relative = normalize(path.relative(outputRoot, file));
  const page = classify(relative);
  if (!page) continue;

  let html = await readFile(file, 'utf8');
  if (!/<head\b/i.test(html) || !/<body\b/i.test(html) || !/<\/body>/i.test(html)) {
    throw new Error(`${relative}: cannot apply the unified design because the HTML shell is incomplete`);
  }

  html = setBodyPage(html, page);
  html = addHeadAssets(html);
  html = addShellScript(html);
  await writeFile(file, html, 'utf8');
  publicPages.push({ file, relative, page });
}

if (!publicPages.some(({ relative }) => relative === 'index.html')) {
  throw new Error('Unified FMB redesign failed: the public homepage was not found');
}

const errors = [];
for (const { file, relative, page } of publicPages) {
  const html = await readFile(file, 'utf8');
  if (count(html, stylesheetHref) !== 1) errors.push(`${relative}: unified stylesheet must appear exactly once`);
  if (count(html, priorityHref) !== 1) errors.push(`${relative}: priority stylesheet must appear exactly once`);
  if (count(html, contentHref) !== 1) errors.push(`${relative}: content stylesheet must appear exactly once`);
  if (count(html, scriptSrc) !== 1) errors.push(`${relative}: unified shell script must appear exactly once`);
  if (!new RegExp(`<body\\b[^>]*data-fmb-page=["']${page}["']`, 'i').test(html)) {
    errors.push(`${relative}: missing route design marker ${page}`);
  }
}

if (errors.length) {
  throw new Error(`Unified FMB redesign validation failed:\n- ${errors.join('\n- ')}`);
}

console.log(`Applied the unified FMB public-site design system to ${publicPages.length} HTML pages without removing their original content.`);
