import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyEntityAuthority } from './entity-authority.mjs';
import { materializeHomeImages } from './home-image-assets.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const applicationsDirectory = path.join(repositoryRoot, 'apps');
const outputDirectory = path.join(repositoryRoot, 'dist');
const privateSitesDirectory = path.join(outputDirectory, '_sites');

const personalWebsite = path.join(applicationsDirectory, 'withlovefmb');
const senzWebsite = path.join(applicationsDirectory, 'senz');
const senzOutput = path.join(senzWebsite, 'dist');
const cognitaWebsite = path.join(applicationsDirectory, 'cognita');
const cognitaOutput = path.join(cognitaWebsite, 'dist');

async function requireFile(filePath) {
  const details = await stat(filePath);
  if (!details.isFile()) throw new Error(`Expected a file at ${filePath}`);
}

async function injectStylesheet(relativePagePath, stylesheetHref) {
  const pagePath = path.join(outputDirectory, relativePagePath);
  const html = await readFile(pagePath, 'utf8');
  if (html.includes(`href="${stylesheetHref}"`)) return;
  if (!html.includes('</head>')) throw new Error(`Expected </head> in ${relativePagePath}`);
  const stylesheet = `<link rel="stylesheet" href="${stylesheetHref}">`;
  await writeFile(pagePath, html.replace('</head>', `${stylesheet}\n</head>`), 'utf8');
}

async function lockYoniFirstPaintIdentity() {
  const pagePath = path.join(outputDirectory, 'app', 'index.html');
  const stylesheetHref = '/assets/css/yoni-trust-access-v1.css?v=20260722-trust-v1';
  const scriptSrc = '/assets/js/yoni-trust-access-v1.js?v=20260722-trust-v1';
  let html = await readFile(pagePath, 'utf8');
  html = html
    .replaceAll('/app/yoni-icon.svg', '/app/assets/yoni/yoni-app-icon-192.png')
    .replaceAll('/app/yoni-mascot.svg', '/app/assets/yoni/yoni-app-icon-512.png')
    .replace(
      '<title>Yoni | Private Mental Health Companion by FMB</title>',
      '<title>Yoni | Private Digital Wellbeing Companion by FMB</title>',
    );
  if (!html.includes(`href="${stylesheetHref}"`)) {
    html = html.replace('</head>', `<link rel="stylesheet" href="${stylesheetHref}">\n</head>`);
  }
  if (!html.includes(`src="${scriptSrc}"`)) {
    html = html.replace('</body>', `<script src="${scriptSrc}"></script>\n</body>`);
  }
  await writeFile(pagePath, html, 'utf8');
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
}

await Promise.all([
  requireFile(path.join(personalWebsite, 'index.html')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-hero.webp')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-theme-background.webp')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-app-icon-192.png')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-app-icon-512.png')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-apple-touch-icon-180.png')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-social-1200.jpg')),
  requireFile(path.join(personalWebsite, 'app', 'assets', 'yoni', 'yoni-wordmark.png')),
  requireFile(path.join(personalWebsite, 'assets', 'css', 'yoni-trust-access-v1.css')),
  requireFile(path.join(personalWebsite, 'assets', 'js', 'yoni-trust-access-v1.js')),
  requireFile(path.join(senzWebsite, 'index.html')),
  requireFile(path.join(senzWebsite, 'package.json')),
  requireFile(path.join(cognitaWebsite, 'index.html')),
  requireFile(path.join(cognitaWebsite, 'package.json')),
]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(privateSitesDirectory, { recursive: true });

// FMB News now lives exclusively in masinlocandher-max/FMBNews. Excluding the
// legacy news and content trees here prevents the old monorepo from emitting
// or rebuilding any /news surface.
const personalWebsiteBuildExclusions = new Set(['content', 'dist', 'news', 'node_modules']);
await cp(personalWebsite, outputDirectory, {
  recursive: true,
  filter: (source) => {
    const relativeSource = path.relative(personalWebsite, source);
    const topLevelName = relativeSource.split(path.sep)[0];
    return !personalWebsiteBuildExclusions.has(topLevelName)
      && !['.rsync-tmp', '.DS_Store'].includes(path.basename(source));
  },
});
await rm(path.join(outputDirectory, 'news'), { recursive: true, force: true });

run('npm', ['run', 'build'], senzWebsite);
await cp(senzOutput, path.join(privateSitesDirectory, 'senz'), { recursive: true });
await materializeHomeImages({ outputDirectory });

await Promise.all([
  injectStylesheet('aboutfmb/index.html', '/assets/css/aboutfmb-seamless.css?v=20260721-responsive-v2'),
  lockYoniFirstPaintIdentity(),
]);

run('npm', ['ci', '--workspaces=false'], cognitaWebsite);
run('npm', ['run', 'build'], cognitaWebsite);
await cp(cognitaOutput, path.join(privateSitesDirectory, 'cognita'), { recursive: true });
await applyEntityAuthority({ outputDirectory, privateSitesDirectory });

await Promise.all([
  requireFile(path.join(outputDirectory, 'index.html')),
  requireFile(path.join(outputDirectory, 'projects', 'index.html')),
  requireFile(path.join(outputDirectory, 'app', 'index.html')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'home', 'francine-home-hero-hd.webp')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'home', 'francine-home-founder-hd.webp')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'home', 'home-image-manifest.json')),
  requireFile(path.join(privateSitesDirectory, 'senz', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'cognita', 'index.html')),
]);

try {
  await stat(path.join(outputDirectory, 'news'));
  throw new Error('Legacy FMB News build guard failed: dist/news must not exist.');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log('FMB ecosystem build completed without an FMB News surface. FMB News is owned by masinlocandher-max/FMBNews.');
