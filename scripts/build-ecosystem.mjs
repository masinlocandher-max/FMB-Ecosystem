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

const amorDelosoHdSource = 'https://at.adobe.com/QdMpFXIcRloBpGGK';
const aiFounderPortraitSource = 'https://at.adobe.com/QzoS1xWoJzEZPC00';

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

async function downloadImage(sourceUrl, relativeOutputPath, minimumBytes = 100000) {
  const response = await fetch(sourceUrl, {
    redirect: 'follow',
    headers: {
      Accept: 'image/png,image/jpeg,image/webp,image/*;q=0.8',
      'User-Agent': 'FMB-Ecosystem-Build/2.0',
    },
  });
  if (!response.ok) throw new Error(`Unable to download ${relativeOutputPath}: ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`Expected image for ${relativeOutputPath}, received ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength < minimumBytes) throw new Error(`${relativeOutputPath} is too small (${bytes.byteLength} bytes)`);
  const destination = path.join(outputDirectory, relativeOutputPath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

async function applyHdNewsImages() {
  const amorRelativePath = 'assets/images/news/amor-deloso-generated-hero-hd.png';
  await downloadImage(amorDelosoHdSource, amorRelativePath, 150000);

  const amorPublicPath = `/${amorRelativePath}`;
  const amorPublicUrl = `https://www.francinemariebautista.com/${amorRelativePath}`;
  const oldAmorUrl = 'https://www.francinemariebautista.com/assets/images/news/amor-deloso-share-1200x630.jpg';
  const oldGeneratedUrl = 'https://www.francinemariebautista.com/assets/images/news/amor-deloso-generated-hero.jpg';

  const amorArticlePath = path.join(outputDirectory, 'news', 'remembering-amor-deloso', 'index.html');
  let amorArticle = await readFile(amorArticlePath, 'utf8');
  amorArticle = amorArticle
    .replaceAll(oldAmorUrl, amorPublicUrl)
    .replaceAll(oldGeneratedUrl, amorPublicUrl)
    .replaceAll('/assets/images/news/amor-deloso-share-1200x630.jpg', amorPublicPath)
    .replaceAll('/assets/images/news/amor-deloso-generated-hero.jpg', amorPublicPath)
    .replaceAll('<meta property="og:image:width" content="1200">', '<meta property="og:image:width" content="1672">')
    .replaceAll('<meta property="og:image:height" content="630">', '<meta property="og:image:height" content="941">')
    .replaceAll('<meta property="og:image:width" content="640">', '<meta property="og:image:width" content="1672">')
    .replaceAll('<meta property="og:image:height" content="360">', '<meta property="og:image:height" content="941">')
    .replaceAll('width="1200" height="630"', 'width="1672" height="941"')
    .replaceAll('width="640" height="360"', 'width="1672" height="941"')
    .replaceAll('"width":1200,"height":630', '"width":1672,"height":941')
    .replaceAll('"width":640,"height":360', '"width":1672,"height":941')
    .replaceAll('2026-07-21T11:30:00+08:00', '2026-07-21T12:15:00+08:00');
  await writeFile(amorArticlePath, amorArticle, 'utf8');

  const aiRelativePath = 'assets/images/news/fmb-ai-water-founder-portrait.jpg';
  await downloadImage(aiFounderPortraitSource, aiRelativePath, 300000);
  const aiPublicPath = `/${aiRelativePath}`;
  const aiPublicUrl = `https://www.francinemariebautista.com/${aiRelativePath}`;
  const aiAlt = 'Francine Marie Bautista in the official FMB founder portrait';
  const aiModifiedTime = '2026-07-21T16:20:00+08:00';

  const newsIndexPath = path.join(outputDirectory, 'news', 'index.html');
  let newsIndex = await readFile(newsIndexPath, 'utf8');
  newsIndex = newsIndex
    .replaceAll(oldAmorUrl, amorPublicUrl)
    .replaceAll(oldGeneratedUrl, amorPublicUrl)
    .replaceAll('/assets/images/news/amor-deloso-share-1200x630.jpg', amorPublicPath)
    .replaceAll('/assets/images/news/amor-deloso-generated-hero.jpg', amorPublicPath)
    .replaceAll('width="1200" height="630"', 'width="1672" height="941"')
    .replaceAll('width="640" height="360"', 'width="1672" height="941"')
    .replaceAll('https://www.francinemariebautista.com/assets/images/news/fmbco-ai-water-founder-hero.svg', aiPublicUrl)
    .replaceAll('/assets/images/news/fmbco-ai-water-founder-hero.svg', aiPublicPath)
    .replaceAll('https://www.francinemariebautista.com/assets/images/hero.webp', aiPublicUrl)
    .replaceAll('/assets/images/hero.webp', aiPublicPath);
  await writeFile(newsIndexPath, newsIndex, 'utf8');

  const aiArticlePath = path.join(outputDirectory, 'news', 'ai-water-consumption-responsible-ai-philippines', 'index.html');
  let aiArticle = await readFile(aiArticlePath, 'utf8');
  aiArticle = aiArticle
    .replaceAll('https://www.francinemariebautista.com/assets/images/news/fmbco-ai-water-founder-hero.svg', aiPublicUrl)
    .replaceAll('/assets/images/news/fmbco-ai-water-founder-hero.svg', aiPublicPath)
    .replaceAll('https://www.francinemariebautista.com/assets/images/hero.webp', aiPublicUrl)
    .replaceAll('/assets/images/hero.webp', aiPublicPath)
    .replaceAll('<meta property="og:image:width" content="1000">', '<meta property="og:image:width" content="1364">')
    .replaceAll('<meta property="og:image:height" content="563">', '<meta property="og:image:height" content="768">')
    .replaceAll('width="1000" height="563"', 'width="1364" height="768" decoding="async"')
    .replaceAll('"dateModified":"2026-07-20T10:00:00+08:00"', `"dateModified":"${aiModifiedTime}"`)
    .replaceAll('<meta property="article:modified_time" content="2026-07-20T10:00:00+08:00">', `<meta property="article:modified_time" content="${aiModifiedTime}">`)
    .replaceAll('Francine Marie Bautista beside the headline AI Uses Water. That Is Not the Whole Story', aiAlt)
    .replaceAll('Portrait supplied by FMB. FMB&amp;CO. News graphic.', 'Official FMB founder portrait.')
    .replaceAll('Official high-resolution FMB founder portrait.', 'Official FMB founder portrait.');
  await writeFile(aiArticlePath, aiArticle, 'utf8');
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
await cp(personalWebsite, outputDirectory, { recursive: true });
run('npm', ['run', 'build'], senzWebsite);
await cp(senzOutput, path.join(privateSitesDirectory, 'senz'), { recursive: true });
await materializeHomeImages({ outputDirectory });

await Promise.all([
  injectStylesheet('news/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('music/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('ebooks/index.html', '/assets/css/fmb-sitewide-gateway.css?v=20260721-responsive-v2'),
  injectStylesheet('aboutfmb/index.html', '/assets/css/aboutfmb-seamless.css?v=20260721-responsive-v2'),
  lockYoniFirstPaintIdentity(),
  applyHdNewsImages(),
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
  requireFile(path.join(outputDirectory, 'assets', 'images', 'news', 'amor-deloso-generated-hero-hd.png')),
  requireFile(path.join(outputDirectory, 'assets', 'images', 'news', 'fmb-ai-water-founder-portrait.jpg')),
  requireFile(path.join(privateSitesDirectory, 'senz', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'cognita', 'index.html')),
]);

console.log('FMB ecosystem build completed successfully with unified entity authority and direct HD homepage images.');
