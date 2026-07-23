import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const approvedPublic='/assets/images/fmb-approved';
const textExtensions=new Set(['.html','.css','.js','.json','.webmanifest','.xml']);
const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
if(manifest.policy?.fallbacksAllowed!==false)throw new Error('Approved FMB assets must prohibit fallbacks.');
const byKey=new Map(manifest.assets.map(asset=>[asset.key,asset]));
const publicPath=key=>`${approvedPublic}/${byKey.get(key).file}`;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(textExtensions.has(path.extname(entry.name).toLowerCase()))files.push(full);
  }
  return files;
}

for(const asset of manifest.assets){
  const relative=`assets/images/fmb-approved/${asset.file}`;
  const file=path.join(root,relative);
  const info=await stat(file);
  if(!info.isFile()||info.size<100)throw new Error(`Approved master is missing: ${relative}`);
  const received=sha256(await readFile(file));
  if(received!==asset.sha256)throw new Error(`Approved master changed: ${relative}`);
}

const replacements=new Map([
  ['/assets/images/home/fmb-home-logo.webp',publicPath('masterTransparent')],
  ['/assets/images/home/francine-home-hero-hd.webp',publicPath('standingLandscape')],
  ['/assets/images/home/francine-home-founder-hd.webp',publicPath('seatedLandscape')],
  ['/assets/images/news/fmb-news-official.svg',publicPath('news')],
  ['/assets/images/channels/fmb-music-official.svg',publicPath('music')],
  ['/assets/images/channels/fmb-ebook-official.svg',publicPath('ebook')],
  ['/assets/images/fmb-official-2026/fmb-master-square.webp',publicPath('masterSquare')],
  ['/assets/images/fmb-official-2026/fmb-news-official.webp',publicPath('news')],
  ['/assets/images/fmb-official-2026/fmb-music-official.webp',publicPath('music')],
  ['/assets/images/fmbandco/francine-founder-hero-640.webp',publicPath('portraitFront')],
  ['/assets/images/founder.webp',publicPath('portraitFront')],
  ['assets/images/founder.webp',publicPath('portraitFront')],
  ['/assets/images/home/cognita-wordmark-transparent.svg','/assets/images/projects/cognita-logo-clean.png'],
  ['assets/images/home/cognita-wordmark-transparent.svg','/assets/images/projects/cognita-logo-clean.png'],
  ['cognita-wordmark-transparent.svg','../projects/cognita-logo-clean.png'],
  ['https://www.francinemariebautista.com/assets/images/news/amor-deloso-generated-hero-hd.png','https://www.francinemariebautista.com/assets/images/news/amor-deloso-share-1200x630.jpg'],
  ['/assets/images/news/amor-deloso-generated-hero-hd.png','/assets/images/news/amor-deloso-share-1200x630.jpg']
]);
const dimensions=new Map(manifest.assets.map(asset=>[`${approvedPublic}/${asset.file}`,asset]));
const files=await walk(root);
let changedFiles=0;
let changedReferences=0;

function normalizeDimensions(html){
  return html.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi,(tag,raw)=>{
    let pathname=raw.split('?')[0];
    try{if(pathname.includes('://'))pathname=new URL(pathname).pathname;}catch{}
    const asset=dimensions.get(pathname);
    if(!asset)return tag;
    const cleaned=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');
    return cleaned.replace(/<img/i,`<img width="${asset.width}" height="${asset.height}"`);
  });
}

function normalizeRoutePaths(text,relative){
  if(relative==='_sites/cognita/index.html'){
    return text.replace(/(\b(?:src|href|poster)=["'])\/assets\//gi,'$1./assets/');
  }
  if(relative.endsWith('.html')&&relative!=='index.html'&&!relative.startsWith('app/')&&!relative.startsWith('_sites/')){
    text=text.replace(/(\b(?:src|href|poster)=["'])assets\//gi,'$1/assets/');
  }
  if(relative.startsWith('assets/js/')){
    text=text.replace(/(["'])assets\/(css|js|images)\//g,'$1/assets/$2/');
  }
  return text;
}

for(const file of files){
  let text=await readFile(file,'utf8');
  const before=text;
  const relative=path.relative(root,file).replaceAll(path.sep,'/');
  for(const [oldPath,newPath] of replacements){
    const count=text.split(oldPath).length-1;
    if(count){text=text.replaceAll(oldPath,newPath);changedReferences+=count;}
  }
  const generic=text.match(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi)||[];
  if(generic.length){text=text.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,publicPath('portraitFront'));changedReferences+=generic.length;}
  text=normalizeRoutePaths(text,relative);
  if(file.endsWith('.html')){
    text=normalizeDimensions(text);
    let highPriority=false;
    text=text.replace(/<img\b[^>]*fetchpriority=["']high["'][^>]*>/gi,tag=>{
      if(!highPriority){highPriority=true;return tag;}
      return tag.replace(/\sfetchpriority=["']high["']/i,' fetchpriority="auto"');
    });
  }
  if(text!==before){await writeFile(file,text,'utf8');changedFiles+=1;}
}

const cognitaLogo='assets/images/projects/cognita-logo-clean.png';
const cognitaLogoInfo=await stat(path.join(root,cognitaLogo));
if(!cognitaLogoInfo.isFile()||cognitaLogoInfo.size<100)throw new Error(`Official Cognita logo is missing: ${cognitaLogo}`);
const cognitaAliasPath=path.join(root,'assets/images/home/cognita-wordmark-transparent.svg');
await mkdir(path.dirname(cognitaAliasPath),{recursive:true});
await writeFile(cognitaAliasPath,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" role="img" aria-label="Cognita Institute of Artificial Intelligence"><image href="/assets/images/projects/cognita-logo-clean.png" width="1600" height="600" preserveAspectRatio="xMidYMid meet"/></svg>`,'utf8');

const assignments={
  'index.html':[publicPath('masterTransparent'),publicPath('standingLandscape'),publicPath('seatedLandscape')],
  'news/index.html':[publicPath('news')],
  'music/index.html':[publicPath('music')],
  'ebooks/index.html':[publicPath('ebook')]
};
for(const [relative,markers] of Object.entries(assignments)){
  const html=await readFile(path.join(root,relative),'utf8');
  for(const marker of markers)if(!html.includes(marker))throw new Error(`${relative} is missing ${marker}`);
}

const withLove=await readFile(path.join(root,'withlovefmb/index.html'),'utf8');
for(const image of ['/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp']){
  if(!withLove.includes(image))throw new Error(`Protected volunteer image is missing: ${image}`);
}

const retired=[...replacements.keys().filter(marker=>marker!=='cognita-wordmark-transparent.svg'),'https://at.adobe.com/'];
for(const file of files){
  const text=await readFile(file,'utf8');
  for(const marker of retired)if(text.includes(marker))throw new Error(`${path.relative(root,file)} still renders retired asset ${marker}`);
}

console.log(`Verified ${manifest.assets.length} exact uploaded masters, normalized nested route paths, added the official Cognita compatibility alias, and replaced ${changedReferences} retired references across ${changedFiles} final files.`);
