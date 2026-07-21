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
    .replaceAll('/app/yoni-icon.svg', '/app/assets/yoni/yoni-app-icon-192.jpg')
    .replaceAll('/app/yoni-mascot.svg', '/app/assets/yoni/yoni-master-static.png');
  await writeFile(pagePath, html, 'utf8');
}

async function applyAmorDelosoGeneratedHero() {
  const encodedSourcePath = path.join(
    personalWebsite,
    'assets',
    'images',
    'news',
    'amor-deloso-generated-hero.b64',
  );
  const encodedImage = (await readFile(encodedSourcePath, 'utf8')).trim();
  const imageBytes = Buffer.from(encodedImage, 'base64');

  if (imageBytes.byteLength < 10_000) {
    throw new Error(
      `Generated Amor Deloso hero is unexpectedly small (${imageBytes.byteLength} bytes)`,
    );
  }

  const relativeImagePath = 'assets/images/news/amor-deloso-generated-hero.jpg';
  const destination = path.join(outputDirectory, relativeImagePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, imageBytes);

  const publicImagePath = `/${relativeImagePath}`;
  const publicImageUrl = `https://www.francinemariebautista.com/${relativeImagePath}`;

  const articlePath = path.join(
    outputDirectory,
    'news',
    'remembering-amor-deloso',
    'index.html',
  );
  let article = await readFile(articlePath, 'utf8');
  article = article
    .replaceAll(
      'https://www.francinemariebautista.com/assets/images/news/amor-deloso-share-1200x630.jpg',
      publicImageUrl,
    )
    .replaceAll('<meta property="og:image:width" content="1200">', '<meta property="og:image:width" content="640">')
    .replaceAll('<meta property="og:image:height" content="630">', '<meta property="og:image:height" content="360">')
    .replaceAll(
      'Former Zambales governor Amor Deloso during a provincial peace and order meeting in Iba, Zambales',
      'Amor Deloso in a dignified black-and-white memorial portrait before classical civic architecture',
    )
    .replaceAll(
      'Former Zambales governor Amor Deloso during a provincial peace and order meeting',
      'Amor Deloso in a dignified black-and-white memorial portrait',
    )
    .replace(
      '"dateModified":"2026-07-21T09:15:00+08:00"',
      '"dateModified":"2026-07-21T11:30:00+08:00"',
    )
    .replace(
      '<meta property="article:modified_time" content="2026-07-21T09:15:00+08:00">',
      '<meta property="article:modified_time" content="2026-07-21T11:30:00+08:00">',
    )
    .replace(
      '"image":{"@type":"ImageObject","url":"https://www.francinemariebautista.com/assets/images/news/amor-deloso-share-1200x630.jpg","width":1200,"height":630,"caption":"Governor Amor D. Deloso during a Provincial Peace and Order Council and Provincial Anti-Drug Abuse Council meeting in Iba, Zambales. Photo: DILG Zambales."}',
      `"image":{"@type":"ImageObject","url":"${publicImageUrl}","width":640,"height":360,"caption":"Amor Deloso in a dignified black-and-white memorial portrait prepared for FMB&CO. News."}`,
    )
    .replace(
      '<section class="nc-story-media nc-story-media--portrait" aria-label="Historical photograph of Amor Deloso">',
      '<section class="nc-story-media nc-story-media--portrait" aria-label="Memorial portrait of Amor Deloso">',
    )
    .replace(
      '<div class="wrap"><figure class="news-visual"><img src="/assets/images/news/amor-deloso-share-1200x630.jpg" width="1200" height="630" alt="Governor Amor Deloso during a provincial peace and order meeting in Iba, Zambales" fetchpriority="high" decoding="async"><figcaption>Governor Amor D. Deloso during a Provincial Peace and Order Council and Provincial Anti-Drug Abuse Council meeting in Iba, Zambales. Photo: DILG Zambales, 2018.</figcaption></figure></div>',
      `<div class="wrap"><figure class="news-visual"><img src="${publicImagePath}" width="640" height="360" alt="Amor Deloso in a dignified black-and-white memorial portrait before classical civic architecture" fetchpriority="high" decoding="async"><figcaption>Amor D. Deloso. Memorial portrait prepared for FMB&CO. News.</figcaption></figure></div>`,
    )
    .replace(
      'The historical photograph is from a 2018 DILG Zambales public record. ',
      '',
    );
  await writeFile(articlePath, article, 'utf8');

  const newsIndexPath = path.join(outputDirectory, 'news', 'index.html');
  let newsIndex = await readFile(newsIndexPath, 'utf8');
  newsIndex = newsIndex
    .replaceAll(
      'https://www.francinemariebautista.com/assets/images/news/amor-deloso-share-1200x630.jpg',
      publicImageUrl,
    )
    .replaceAll('<meta property="og:image:width" content="1200">', '<meta property="og:image:width" content="640">')
    .replaceAll('<meta property="og:image:height" content="630">', '<meta property="og:image:height" content="360">')
    .replaceAll(
      'Former Zambales governor Amor Deloso during a provincial peace and order meeting in Iba, Zambales',
      'Amor Deloso in a dignified black-and-white memorial portrait before classical civic architecture',
    )
    .replaceAll(
      'Former Zambales governor Amor Deloso during a provincial peace and order meeting',
      'Amor Deloso in a dignified black-and-white memorial portrait',
    )
    .replace(
      '<img src="/assets/images/news/amor-deloso-share-1200x630.jpg" width="1200" height="630" alt="Former Zambales governor Amor Deloso during a provincial peace and order meeting" loading="lazy"><figcaption>Photo: DILG Zambales, 2018. Full source and credit appear in the article.</figcaption>',
      `<img src="${publicImagePath}" width="640" height="360" alt="Amor Deloso in a dignified black-and-white memorial portrait" loading="lazy"><figcaption>Memorial portrait prepared for FMB&CO. News.</figcaption>`,
    );
  await writeFile(newsIndexPath, newsIndex, 'utf8');
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
  applyAmorDelosoGeneratedHero(),
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
      'amor-deloso-generated-hero.jpg',
    ),
  ),
  requireFile(path.join(privateSitesDirectory, 'senz', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'cognita', 'index.html')),
]);

console.log('FMB ecosystem build completed successfully.');