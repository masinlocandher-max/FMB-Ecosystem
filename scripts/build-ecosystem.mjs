import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const applicationsDirectory = path.join(repositoryRoot, 'apps');
const outputDirectory = path.join(repositoryRoot, 'dist');
const privateSitesDirectory = path.join(outputDirectory, '_sites');

const personalWebsite = path.join(applicationsDirectory, 'withlovefmb');
const senzWebsite = path.join(applicationsDirectory, 'senz');
const cognitaWebsite = path.join(applicationsDirectory, 'cognita');
const cognitaOutput = path.join(cognitaWebsite, 'dist');

async function requireFile(filePath) {
  const details = await stat(filePath);
  if (!details.isFile()) {
    throw new Error(`Expected a file at ${filePath}`);
  }
}

async function injectStylesheet(relativePagePath, stylesheetHref) {
  const pagePath = path.join(outputDirectory, relativePagePath);
  const html = await readFile(pagePath, 'utf8');
  if (html.includes(`href="${stylesheetHref}"`)) return;
  if (!html.includes('</head>')) {
    throw new Error(`Expected </head> in ${relativePagePath}`);
  }

  const stylesheet = `<link rel="stylesheet" href="${stylesheetHref}">`;
  await writeFile(pagePath, html.replace('</head>', `${stylesheet}\n</head>`), 'utf8');
}

async function lockYoniFirstPaintIdentity() {
  const pagePath = path.join(outputDirectory, 'app', 'index.html');
  let html = await readFile(pagePath, 'utf8');
  html = html
    .replaceAll('/app/yoni-icon.svg', '/app/assets/yoni/yoni-app-icon-192.png');
  await writeFile(pagePath, html, 'utf8');
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

await Promise.all([
  requireFile(path.join(personalWebsite, 'index.html')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-hero.webp')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-theme-background.webp')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-app-icon-512.png')),
  requireFile(path.join(personalWebsite, 'assets', 'images', 'news', 'amor-deloso-share-1200x630.jpg')),
  requireFile(path.join(senzWebsite, 'index.html')),
  requireFile(path.join(cognitaWebsite, 'index.html')),
  requireFile(path.join(cognitaWebsite, 'package.json')),
]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(privateSitesDirectory, { recursive: true });

await cp(personalWebsite, outputDirectory, { recursive: true });
await cp(senzWebsite, path.join(privateSitesDirectory, 'senz'), { recursive: true });

await Promise.all([
  injectStylesheet('news/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('music/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('ebooks/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('aboutfmb/index.html', '/assets/css/aboutfmb-seamless.css?v=20260721-responsive-v2'),
  lockYoniFirstPaintIdentity(),
]);

run('npm', ['ci'], cognitaWebsite);
run('npm', ['run', 'build'], cognitaWebsite);

await cp(cognitaOutput, path.join(privateSitesDirectory, 'cognita'), {
  recursive: true,
});

await Promise.all([
  requireFile(path.join(outputDirectory, 'index.html')),
  requireFile(path.join(outputDirectory, 'app', 'index.html')),
  requireFile(
    path.join(
      outputDirectory,
      'assets',
      'images',
      'news',
      'amor-deloso-share-1200x630.jpg',
    ),
  ),
  requireFile(path.join(privateSitesDirectory, 'senz', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'cognita', 'index.html')),
]);

console.log('FMB ecosystem build completed successfully.');
