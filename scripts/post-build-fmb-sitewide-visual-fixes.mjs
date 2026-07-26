import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const cssRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css');
const outputStylesheet = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const sitewideHref = '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2';
const removableStylesheetPatterns = [
  /<link\b[^>]*href=["'][^"']*fmb-sitewide-visual-fixes\.css[^"']*["'][^>]*>\s*/gi,
  /<link\b[^>]*href=["'][^"']*fmb-contrast-polish\.css[^"']*["'][^>]*>\s*/gi,
  /<link\b[^>]*href=["'][^"']*fmb-cognita-artwork\.css[^"']*["'][^>]*>\s*/gi,
  /<link\b[^>]*href=["'][^"']*fmb-news-lead-contrast\.css[^"']*["'][^>]*>\s*/gi,
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

const [sitewideCss, contrastCss, cognitaArtworkCss, newsLeadContrastCss] = await Promise.all([
  readFile(path.join(cssRoot, 'fmb-sitewide-visual-fixes.css'), 'utf8'),
  readFile(path.join(cssRoot, 'fmb-contrast-polish.css'), 'utf8'),
  readFile(path.join(cssRoot, 'fmb-cognita-artwork.css'), 'utf8'),
  readFile(path.join(cssRoot, 'fmb-news-lead-contrast.css'), 'utf8'),
]);

await mkdir(path.dirname(outputStylesheet), { recursive: true });
await writeFile(
  outputStylesheet,
  `${sitewideCss.trim()}\n\n/* Final contrast contracts appended by the release build. */\n${contrastCss.trim()}\n\n/* Cognita HD artwork support appended by the release build. */\n${cognitaArtworkCss.trim()}\n\n/* FMB News lead-story contrast appended by the release build. */\n${newsLeadContrastCss.trim()}\n`,
  'utf8',
);

const publicHtml = (await walk(dist)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

let injectedPages = 0;
for (const file of publicHtml) {
  let html = await readFile(file, 'utf8');
  for (const pattern of removableStylesheetPatterns) {
    html = html.replace(pattern, '');
  }

  if (!/<\/head>/i.test(html)) {
    throw new Error(`Sitewide visual fixes: ${relative(file)} has no closing head element`);
  }

  html = html.replace(
    /<\/head>/i,
    `<link rel="stylesheet" href="${sitewideHref}">\n</head>`,
  );
  await writeFile(file, html, 'utf8');
  injectedPages += 1;
}

console.log(`Combined sitewide safeguards, contrast polish, Cognita artwork support, and FMB News lead contrast into the final stylesheet on ${injectedPages} public page(s).`);
