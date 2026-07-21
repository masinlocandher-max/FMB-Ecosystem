import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory=path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot=path.resolve(scriptDirectory,'..');
const outputDirectory=path.join(repositoryRoot,'dist');
const VERSION='20260722-visual-system-v2';
const STYLE=`/assets/css/fmb-visual-refresh.css?v=${VERSION}`;
const BRAND_STYLE=`/assets/css/fmb-brand-lock.css?v=${VERSION}`;
const SCRIPT=`/assets/js/fmb-visual-refresh.js?v=${VERSION}`;
const HERO='/assets/images/home/francine-home-hero-hd.webp';
const OVERVIEW='/assets/images/home/francine-home-founder-hd.webp';
const HOME_MARK='/assets/images/brand/fmb-mark-purple-square-transparent.svg';
const CHANNEL_MARK='/assets/images/brand/fmb-mark-white-transparent.svg';

const requiredPages=[
  'index.html','news/index.html','music/index.html','ebooks/index.html','aboutfmb/index.html',
  'withlovefmb/index.html','fmb&co/index.html','projects/index.html','gethelp/index.html',
];
const excludedTopLevel=new Set(['app','senz','cognita','_next','node_modules']);

async function requireFile(relativePath){
  const details=await stat(path.join(outputDirectory,relativePath));
  if(!details.isFile())throw new Error(`Expected ${relativePath} after FMB visual refresh.`);
}

async function listPublicHtml(directory=outputDirectory,prefix=''){
  const entries=await readdir(directory,{withFileTypes:true});
  const result=[];
  for(const entry of entries){
    if(prefix===''&&entry.isDirectory()&&excludedTopLevel.has(entry.name))continue;
    const relative=prefix?`${prefix}/${entry.name}`:entry.name;
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())result.push(...await listPublicHtml(absolute,relative));
    else if(entry.isFile()&&entry.name.endsWith('.html'))result.push(relative);
  }
  return result;
}

function inject(html){
  if(!html.includes(STYLE))html=html.replace('</head>',`<link rel="stylesheet" href="${STYLE}">\n</head>`);
  if(!html.includes(BRAND_STYLE))html=html.replace('</head>',`<link rel="stylesheet" href="${BRAND_STYLE}">\n</head>`);
  if(!html.includes(SCRIPT))html=html.replace('</body>',`<script defer src="${SCRIPT}"></script>\n</body>`);
  return html;
}

function addBodyClasses(html,classes,theme){
  return html.replace(/<body\b([^>]*)>/i,(match,attributes)=>{
    let next=attributes;
    const classMatch=next.match(/\bclass=(['"])(.*?)\1/i);
    if(classMatch){
      const merged=[...new Set(`${classMatch[2]} ${classes}`.trim().split(/\s+/))].join(' ');
      next=next.replace(classMatch[0],`class=${classMatch[1]}${merged}${classMatch[1]}`);
    }else next+=` class="${classes}"`;
    if(/\bdata-fmb-theme=/i.test(next))next=next.replace(/\bdata-fmb-theme=(['"]).*?\1/i,`data-fmb-theme="${theme}"`);
    else next+=` data-fmb-theme="${theme}"`;
    return `<body${next}>`;
  });
}

function themeFor(relativePath){
  const route=`/${relativePath.replace(/index\.html$/,'').replace(/^\/+|\/+$/g,'')}/`.replace('//','/');
  if(relativePath==='index.html')return 'bulletin';
  if(route.startsWith('/news/'))return 'news';
  if(route.startsWith('/music/'))return 'music';
  if(route.startsWith('/ebooks/')||/^(reading|womens-health|men-can-cry|skin-care-makeup|coming-out-respect|dress-with-intention)\.html$/.test(relativePath))return 'reading';
  if(route.startsWith('/projects/')||route.startsWith('/mabayani/'))return 'projects';
  if(route.startsWith('/withlovefmb/')||route.startsWith('/communityengagements/')||relativePath.includes('freedom-wall'))return 'care';
  if(route.startsWith('/gethelp/')||relativePath.includes('get-help'))return 'support';
  if(route.startsWith('/aboutfmb/')||route.startsWith('/work-with-fmb/'))return 'founder';
  if(route.startsWith('/fmb&co/')||route.startsWith('/fmbandco/'))return 'corporate';
  return 'public';
}

function patchLogoDimensions(html,src,width,height,alt){
  const escaped=src.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return html.replace(new RegExp(`<img([^>]*?)src=["']${escaped}["']([^>]*?)>`,`g`),(tag,before,after)=>{
    let attrs=`${before}src="${src}"${after}`;
    attrs=attrs.replace(/\swidth=["'][^"']*["']/gi,'').replace(/\sheight=["'][^"']*["']/gi,'').replace(/\salt=["'][^"']*["']/gi,'');
    return `<img${attrs} width="${width}" height="${height}" alt="${alt}">`;
  });
}

function channelLockup(kind){
  const isMusic=kind==='music';
  const label=isMusic?'MUSIC':'EBOOK';
  const readable=isMusic?'FMB Music':'FMB eBook';
  return `<span class="fmb-channel-brand-lockup" role="img" aria-label="${readable}"><img src="${CHANNEL_MARK}" width="597" height="257" alt="" aria-hidden="true"><i aria-hidden="true"></i><strong>${label}</strong></span>`;
}

function replaceChannelBrand(html,kind){
  const lockup=channelLockup(kind);
  const label=kind==='music'?'Music':'eBooks';
  const imagePattern=/<img\b[^>]*(?:fmbandco-primary-reversed\.png|fmb-(?:music|ebook)-horizontal(?:-transparent)?\.(?:webp|svg))[^>]*>\s*(?:<span>[^<]*<\/span>|<h1>[^<]*<\/h1>)?/gi;
  html=html.replace(imagePattern,lockup);
  const selectors=kind==='music'
    ? ['FMB&amp;CO. Music','FMB&CO. Music','FMB&amp;CO. Digital Music Channel','FMB and Company Music']
    : ['FMB&amp;CO. eBooks','FMB&CO. eBooks','FMB&amp;CO. Digital Publication Channel','FMB and Company eBooks'];
  const replacements=kind==='music'
    ? ['FMB Music','FMB Music','FMB Music Channel','FMB Music']
    : ['FMB eBook','FMB eBook','FMB eBook Channel','FMB eBook'];
  for(let index=0;index<selectors.length;index+=1)html=html.replaceAll(selectors[index],replacements[index]);
  html=html.replaceAll('FMB&amp;CO. Digital Products','FMB Media · An FMB&amp;CO. channel');
  if(!html.includes('fmb-channel-brand-lockup'))throw new Error(`${label} channel lockup was not materialized.`);
  return html;
}

function patchMusic(html){return replaceChannelBrand(html,'music')}
function patchEbooks(html){return replaceChannelBrand(html,'ebook')}

function patchHomepage(html){
  html=html
    .replaceAll('/assets/images/fmb/francine-founder-side-cutout-900-v1.webp',HERO)
    .replaceAll('/assets/images/fmb/francine-founder-front-cutout-900-v1.webp',OVERVIEW)
    .replace('<link rel="icon" href="/assets/images/home/fmb-home-logo.webp" type="image/webp">',`<link rel="icon" href="${HOME_MARK}" type="image/svg+xml">`)
    .replaceAll('/assets/images/home/fmb-home-logo.webp',HOME_MARK)
    .replaceAll('FMB&amp;CO. News','FMB News');
  return patchLogoDimensions(html,HOME_MARK,512,512,'FMB');
}

function patchFounderImages(html){
  return html
    .replaceAll('/assets/images/fmbandco/francine-founder-hero-640.webp 640w, /assets/images/fmbandco/francine-founder-hero-923.webp 923w',`${HERO} 1364w`)
    .replaceAll('/assets/images/fmbandco/francine-founder-hero-923.webp',HERO)
    .replaceAll('/assets/images/fmb/francine-founder-front-cutout-640-v1.webp 640w, /assets/images/fmb/francine-founder-front-cutout-900-v1.webp 900w',`${OVERVIEW} 1364w`)
    .replaceAll('/assets/images/fmb/francine-founder-front-cutout-900-v1.webp',OVERVIEW);
}

const publicPages=await listPublicHtml();
for(const relativePath of publicPages){
  const pagePath=path.join(outputDirectory,relativePath);
  let html=await readFile(pagePath,'utf8');
  const theme=themeFor(relativePath);
  html=addBodyClasses(html,'fmb-visual-refresh fmb-unified-page',theme);
  if(relativePath==='music/index.html'){
    html=patchMusic(html);
    html=addBodyClasses(html,'fmb-media-channel fmb-music-channel fmb-logo-lockup','music');
  }
  if(relativePath==='ebooks/index.html'){
    html=patchEbooks(html);
    html=addBodyClasses(html,'fmb-media-channel fmb-ebook-channel fmb-logo-lockup','reading');
  }
  if(relativePath==='news/index.html')html=addBodyClasses(html,'fmb-news-channel','news');
  if(relativePath==='index.html')html=patchHomepage(html);
  if(relativePath==='aboutfmb/index.html'){
    html=patchFounderImages(html);
    html=addBodyClasses(html,'fmb-founder-page','founder');
    html=html.replace('<section class="fco-hero fmb-about-hero"','<section class="fco-hero fmb-about-hero" style="--fmb-hero-image:url(\'/assets/images/home/francine-home-hero-hd.webp\')"');
  }
  if(relativePath==='withlovefmb/index.html'){
    html=addBodyClasses(html,'fmb-with-love-page','care');
    html=html.replace('<section class="wlf-hero"','<section class="wlf-hero" style="--fmb-hero-image:url(\'/assets/images/home/francine-home-hero-hd.webp\')"');
  }
  if(relativePath==='fmb&co/index.html'){
    html=patchFounderImages(html);
    html=addBodyClasses(html,'fmb-company-page','corporate');
    html=html.replace('<section class="fco-hero"','<section class="fco-hero" style="--fmb-hero-image:url(\'/assets/images/home/francine-home-hero-hd.webp\')"');
  }
  html=inject(html);
  await writeFile(pagePath,html,'utf8');
}

await Promise.all([
  requireFile('assets/css/fmb-visual-refresh.css'),requireFile('assets/css/fmb-brand-lock.css'),requireFile('assets/js/fmb-visual-refresh.js'),
  requireFile('assets/images/brand/fmb-mark-purple-square-transparent.svg'),requireFile('assets/images/brand/fmb-mark-purple-transparent.svg'),requireFile('assets/images/brand/fmb-mark-white-transparent.svg'),
  requireFile('assets/images/home/francine-home-hero-hd.webp'),requireFile('assets/images/home/francine-home-founder-hd.webp'),
  ...requiredPages.map(requireFile),
]);

for(const relativePath of publicPages){
  const html=await readFile(path.join(outputDirectory,relativePath),'utf8');
  if(!html.includes(BRAND_STYLE)||!html.includes(SCRIPT)||!html.includes('fmb-unified-page'))throw new Error(`${relativePath} is outside the unified FMB design layer.`);
  if((relativePath==='music/index.html'||relativePath==='ebooks/index.html')&&(!html.includes('fmb-channel-brand-lockup')||!html.includes(CHANNEL_MARK)))throw new Error(`${relativePath} is missing its transparent composed FMB channel lockup.`);
  if(html.includes('fmb-music-horizontal.webp')||html.includes('fmb-ebook-horizontal.webp'))throw new Error(`${relativePath} still references a flattened channel logo.`);
}

console.log(`FMB visual refresh applied to ${publicPages.length} public pages without removing page content or product functionality.`);
