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

const amorDelosoShareSource =
  'https://images.weserv.nl/?url=https%3A%2F%2Fregion3.dilg.gov.ph%2Fzambales%2Fimages%2Fppoc_1.jpg&w=1200&h=630&fit=cover&a=attention&output=jpg&q=90';

async function requireFile(filePath) {
  const details = await stat(filePath);
  if (!details.isFile()) {
    throw new Error(`Expected a file at ${filePath}`);
  }
}

async function downloadImage(sourceUrl, relativeOutputPath) {
  const response = await fetch(sourceUrl, {
    headers: {
      Accept: 'image/jpeg,image/*;q=0.8',
      'User-Agent': 'FMB-Ecosystem-Build/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download ${relativeOutputPath}: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(
      `Expected an image for ${relativeOutputPath}, received ${contentType || 'unknown content type'}`,
    );
  }

  const imageBytes = Buffer.from(await response.arrayBuffer());
  if (imageBytes.byteLength < 20_000) {
    throw new Error(
      `Downloaded image for ${relativeOutputPath} is unexpectedly small (${imageBytes.byteLength} bytes)`,
    );
  }

  const destination = path.join(outputDirectory, relativeOutputPath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, imageBytes);
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
    .replaceAll('/app/yoni-icon.svg', '/app/assets/yoni/yoni-app-icon-192.jpg')
    .replaceAll('/app/yoni-mascot.svg', '/app/assets/yoni/yoni-master-static.png');
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
  downloadImage(
    amorDelosoShareSource,
    'assets/images/news/amor-deloso-share-1200x630.jpg',
  ),
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
