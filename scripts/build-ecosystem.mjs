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
  requireFile(path.join(senzWebsite, 'index.html')),
  requireFile(path.join(senzWebsite, 'package.json')),
  requireFile(path.join(cognitaWebsite, 'index.html')),
  requireFile(path.join(cognitaWebsite, 'package.json')),
]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(privateSitesDirectory, { recursive: true });
const personalWebsiteBuildExclusions = new Set(['content', 'dist', 'node_modules']);
await cp(personalWebsite, outputDirectory, {
  recursive: true,
  filter: (source) => {
    const relativeSource = path.relative(personalWebsite, source);
    const topLevelName = relativeSource.split(path.sep)[0];
    return !personalWebsiteBuildExclusions.has(topLevelName)
      && !['.rsync-tmp', '.DS_Store'].includes(path.basename(source));
  },
});
run('npm', ['run', 'build'], senzWebsite);
await cp(senzOutput, path.join(privateSitesDirectory, 'senz'), { recursive: true });
await materializeHomeImages({ outputDirectory });

await Promise.all([
  injectStylesheet('news/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('aboutfmb/index.html', '/assets/css/aboutfmb-seamless.css?v=20260721-responsive-v2'),
]);

run('npm', ['ci', '--workspaces=false'], cognitaWebsite);
run('npm', ['run', 'build'], cognitaWebsite);
await cp(cognitaOutput, path.join(privateSitesDirectory, 'cognita'), { recursive: true });
await applyEntityAuthority({ outputDirectory, privateSitesDirectory });

await Promise.all([
  requireFile(path.join(outputDirectory, 'index.html')),
  requireFile(path.join(outputDirectory, 'projects', 'index.html')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'home', 'francine-home-hero-hd.webp')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'home', 'francine-home-founder-hd.webp')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'home', 'home-image-manifest.json')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'news', 'amor-deloso-share-1200x630.jpg')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'news', 'fmbco-ai-water-founder-hero.svg')),
  requireFile(path.join(privateSitesDirectory, 'senz', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'cognita', 'index.html')),
]);

console.log('FMB ecosystem build completed successfully with unified entity authority, repository-backed news images, and direct HD homepage images.');
