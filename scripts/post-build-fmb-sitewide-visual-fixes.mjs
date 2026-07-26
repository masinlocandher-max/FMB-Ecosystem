import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const sourceCss = path.join(
  repositoryRoot,
  'apps',
  'withlovefmb',
  'assets',
  'css',
  'fmb-sitewide-visual-fixes.css',
);
const homepageRepairSource = path.join(
  repositoryRoot,
  'apps',
  'withlovefmb',
  'assets',
  'css',
  'fmb-homepage-repair.css',
);
const distCss = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const homepageRepairTarget = path.join(dist, 'assets', 'css', 'fmb-homepage-repair.css');
const stylesheetHref = '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2';
const homepageRepairHref = '/assets/css/fmb-homepage-repair.css?v=20260726-landing-repair-v1';
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

await mkdir(path.dirname(distCss), { recursive: true });
await copyFile(sourceCss, distCss);
await copyFile(homepageRepairSource, homepageRepairTarget);

const publicHtml = (await walk(dist)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

let injectedPages = 0;
for (const file of publicHtml) {
  const name = relative(file);
  let html = await readFile(file, 'utf8');
  html = html.replace(
    /<link\b[^>]*href=["'][^"']*fmb-sitewide-visual-fixes\.css[^"']*["'][^>]*>\s*/gi,
    '',
  );
  html = html.replace(
    /<link\b[^>]*href=["'][^"']*fmb-homepage-repair\.css[^"']*["'][^>]*>\s*/gi,
    '',
  );

  if (!/<\/head>/i.test(html)) {
    throw new Error(`Sitewide visual fixes: ${name} has no closing head element`);
  }

  const links = name === 'index.html'
    ? `<link rel="stylesheet" href="${stylesheetHref}">\n<link rel="stylesheet" href="${homepageRepairHref}">`
    : `<link rel="stylesheet" href="${stylesheetHref}">`;

  html = html.replace(
    /<\/head>/i,
    `${links}\n</head>`,
  );
  await writeFile(file, html, 'utf8');
  injectedPages += 1;
}

console.log(`Sitewide visual safeguards loaded last on ${injectedPages} public page(s), with the homepage repair layer on index.html.`);
