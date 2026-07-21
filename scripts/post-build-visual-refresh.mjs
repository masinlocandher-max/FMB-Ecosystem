import { readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory=path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot=path.resolve(scriptDirectory,'..');
const outputDirectory=path.join(repositoryRoot,'dist');
const STYLE='/assets/css/fmb-visual-refresh.css?v=20260722-visual-system-v1';
const SCRIPT='/assets/js/fmb-visual-refresh.js?v=20260722-visual-system-v1';

const pages=[
  'index.html',
  'news/index.html',
  'music/index.html',
  'ebooks/index.html',
  'aboutfmb/index.html',
  'withlovefmb/index.html',
  'fmb&co/index.html',
];

async function requireFile(relativePath){
  const details=await stat(path.join(outputDirectory,relativePath));
  if(!details.isFile())throw new Error(`Expected ${relativePath} after FMB visual refresh.`);
}

function inject(html){
  if(!html.includes(STYLE))html=html.replace('</head>',`<link rel="stylesheet" href="${STYLE}">\n</head>`);
  if(!html.includes(SCRIPT))html=html.replace('</body>',`<script defer src="${SCRIPT}"></script>\n</body>`);
  return html;
}

function addBodyClasses(html,classes){
  return html.replace(/<body class="([^"]*)"/,(_,current)=>`<body class="${current} ${classes}"`);
}

function patchMusic(html){
  return html
    .replaceAll('/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-music-horizontal.webp')
    .replaceAll('FMB&amp;CO. Music','FMB Music')
    .replaceAll('FMB&CO. Music','FMB Music')
    .replaceAll('FMB&amp;CO. Digital Music Channel','FMB Music Channel')
    .replaceAll('FMB&amp;CO. Digital Products','FMB Media · An FMB&amp;CO. channel')
    .replaceAll('FMB and Company Music','FMB Music');
}

function patchEbooks(html){
  return html
    .replaceAll('/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-ebook-horizontal.webp')
    .replaceAll('FMB&amp;CO. eBooks','FMB eBook')
    .replaceAll('FMB&CO. eBooks','FMB eBook')
    .replaceAll('FMB&amp;CO. Digital Publication Channel','FMB eBook Channel')
    .replaceAll('FMB&amp;CO. Digital Products','FMB Media · An FMB&amp;CO. channel')
    .replaceAll('FMB and Company eBooks','FMB eBook');
}

function patchHomepage(html){
  return html
    .replaceAll('/assets/images/fmb/francine-founder-side-cutout-900-v1.webp','/assets/images/home/francine-home-hero-hd.webp')
    .replaceAll('/assets/images/fmb/francine-founder-front-cutout-900-v1.webp','/assets/images/home/francine-home-founder-hd.webp')
    .replaceAll('FMB&amp;CO. News','FMB News');
}

function patchFounderImages(html){
  return html
    .replaceAll('/assets/images/fmbandco/francine-founder-hero-640.webp 640w, /assets/images/fmbandco/francine-founder-hero-923.webp 923w','/assets/images/home/francine-home-hero-hd.webp 1364w')
    .replaceAll('/assets/images/fmbandco/francine-founder-hero-923.webp','/assets/images/home/francine-home-hero-hd.webp')
    .replaceAll('/assets/images/fmb/francine-founder-front-cutout-640-v1.webp 640w, /assets/images/fmb/francine-founder-front-cutout-900-v1.webp 900w','/assets/images/home/francine-home-founder-hd.webp 1364w')
    .replaceAll('/assets/images/fmb/francine-founder-front-cutout-900-v1.webp','/assets/images/home/francine-home-founder-hd.webp');
}

for(const relativePath of pages){
  const pagePath=path.join(outputDirectory,relativePath);
  let html=await readFile(pagePath,'utf8');
  if(relativePath==='music/index.html'){
    html=patchMusic(html);
    html=addBodyClasses(html,'fmb-visual-refresh fmb-media-channel fmb-music-channel fmb-logo-lockup');
  }
  if(relativePath==='ebooks/index.html'){
    html=patchEbooks(html);
    html=addBodyClasses(html,'fmb-visual-refresh fmb-media-channel fmb-ebook-channel fmb-logo-lockup');
  }
  if(relativePath==='news/index.html')html=addBodyClasses(html,'fmb-visual-refresh fmb-news-channel');
  if(relativePath==='index.html')html=patchHomepage(html);
  if(relativePath==='aboutfmb/index.html'){
    html=patchFounderImages(html);
    html=addBodyClasses(html,'fmb-visual-refresh fmb-founder-page');
    html=html.replace('<section class="fco-hero fmb-about-hero"','<section class="fco-hero fmb-about-hero" style="--fmb-hero-image:url(\'/assets/images/home/francine-home-hero-hd.webp\')"');
  }
  if(relativePath==='withlovefmb/index.html'){
    html=addBodyClasses(html,'fmb-visual-refresh fmb-with-love-page');
    html=html.replace('<section class="wlf-hero"','<section class="wlf-hero" style="--fmb-hero-image:url(\'/assets/images/home/francine-home-hero-hd.webp\')"');
  }
  if(relativePath==='fmb&co/index.html'){
    html=patchFounderImages(html);
    html=addBodyClasses(html,'fmb-visual-refresh fmb-company-page');
    html=html.replace('<section class="fco-hero"','<section class="fco-hero" style="--fmb-hero-image:url(\'/assets/images/home/francine-home-hero-hd.webp\')"');
  }
  html=inject(html);
  await writeFile(pagePath,html,'utf8');
}

await Promise.all([
  requireFile('assets/css/fmb-visual-refresh.css'),
  requireFile('assets/js/fmb-visual-refresh.js'),
  requireFile('assets/images/channels/fmb-music-horizontal.webp'),
  requireFile('assets/images/channels/fmb-ebook-horizontal.webp'),
  ...pages.map(requireFile),
]);

console.log('FMB visual refresh applied without removing page content or product functionality.');
