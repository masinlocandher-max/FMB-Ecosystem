import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const stylesheets = [
  {
    source: path.join(
      repositoryRoot,
      'apps',
      'withlovefmb',
      'assets',
      'css',
      'fmb-sitewide-visual-fixes.css',
    ),
    output: path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css'),
    href: '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v3',
    pattern: /<link\b[^>]*href=["'][^"']*fmb-sitewide-visual-fixes\.css[^"']*["'][^>]*>\s*/gi,
  },
  {
    source: path.join(
      repositoryRoot,
      'apps',
      'withlovefmb',
      'assets',
      'css',
      'fmb-contrast-polish.css',
    ),
    output: path.join(dist, 'assets', 'css', 'fmb-contrast-polish.css'),
    href: '/assets/css/fmb-contrast-polish.css?v=20260726-contrast-polish-v1',
    pattern: /<link\b[^>]*href=["'][^"']*fmb-contrast-polish\.css[^"']*["'][^>]*>\s*/gi,
  },
  {
    source: path.join(
      repositoryRoot,
      'apps',
      'withlovefmb',
      'assets',
      'css',
      'fmb-cognita-artwork.css',
    ),
    output: path.join(dist, 'assets', 'css', 'fmb-cognita-artwork.css'),
    href: '/assets/css/fmb-cognita-artwork.css?v=20260726-cognita-hd-v1',
    pattern: /<link\b[^>]*href=["'][^"']*fmb-cognita-artwork\.css[^"']*["'][^>]*>\s*/gi,
  },
];
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

const relative = (file) => path.relative(dist, file).replaceAll(path.sep, '/');

for (const stylesheet of stylesheets) {
  await mkdir(path.dirname(stylesheet.output), { recursive: true });
  await copyFile(stylesheet.source, stylesheet.output);
}

const publicHtml = (await walk(dist)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

const injectedLinks = stylesheets
  .map(({ href }) => `<link rel="stylesheet" href="${href}">`)
  .join('\n');

let injectedPages = 0;
for (const file of publicHtml) {
  let html = await readFile(file, 'utf8');
  for (const stylesheet of stylesheets) {
    html = html.replace(stylesheet.pattern, '');
  }

  if (!/<\/head>/i.test(html)) {
    throw new Error(`Sitewide visual fixes: ${relative(file)} has no closing head element`);
  }

  html = html.replace(
    /<\/head>/i,
    `${injectedLinks}\n</head>`,
  );
  await writeFile(file, html, 'utf8');
  injectedPages += 1;
}

console.log(`Sitewide visual safeguards, contrast polish, and Cognita artwork support loaded last on ${injectedPages} public page(s).`);
