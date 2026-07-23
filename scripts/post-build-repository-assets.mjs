import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const approvedRoot='assets/images/fmb-approved';
const approvedPublic='/assets/images/fmb-approved';
const textExtensions=new Set(['.html','.css','.js','.json','.webmanifest','.xml']);

const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
if(manifest.policy?.fallbacksAllowed!==false)throw new Error('Approved FMB asset manifest must prohibit fallbacks.');
const assetsByKey=new Map(manifest.assets.map(asset=>[asset.key,asset]));
const publicPath=key=>`${approvedPublic}/${assetsByKey.get(key).file}`;

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(textExtensions.has(path.extname(entry.name).toLowerCase()))files.push(full);
  }
  return files;
}

function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}

for(const asset of manifest.assets){
  const relative=path.join(approvedRoot,asset.file);
  const file=path.join(root,relative);
  const info=await stat(file);
  if(!info.isFile()||info.size<100)throw new Error(`Approved FMB master is missing or empty: ${relative}`);
  const received=sha256(await readFile(file));
  if(received!==asset.sha256)throw new Error(`Approved FMB master changed: ${relative}. Expected ${asset.sha256}, received ${received}`);
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
  ['/assets/images/fmb-official-2026/fmb-music-official.webp',publicPath('music')]
]);

const exactDimensions=new Map(manifest.assets.map(asset=>[`${approvedPublic}/${asset.file}`,{width:asset.width,height:asset.height}]));
const retiredPaths=[...replacements.keys()];
let changedFiles=0;
let changedReferences=0;

function normalizeExactImageDimensions(html){
  return html.replace(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi,(tag,src)=>{
    const pathname=src.includes('://')?new URL(src).pathname:src.split('?')[0];
    const dimensions=exactDimensions.get(pathname);
    if(!dimensions)return tag;
    let next=tag.replace(/\swidth=["'][^"']*["']/i,'').replace(/\sheight=["'][^"']*["']/i,'');
    return next.replace(/<img/i,`<img width="${dimensions.width}" height="${dimensions.height}"`);
  });
}

for(const file of await walk(root)){
  let text=await readFile(file,'utf8');
  const before=text;
  for(const [oldPath,newPath] of replacements){
    const occurrences=text.split(oldPath).length-1;
    if(occurrences){text=text.replaceAll(oldPath,newPath);changedReferences+=occurrences;}
  }

  const genericFounderMatches=text.match(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi)||[];
  if(genericFounderMatches.length){
    text=text.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,publicPath('portraitFront'));
    changedReferences+=genericFounderMatches.length;
  }

  if(file.endsWith('.html')){
    text=normalizeExactImageDimensions(text);
    text=text.replace(/(<link\b[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["'])[^"']+(["'][^>]*>)/gi,`$1${publicPath('masterSquare')}$2`);
    let highPriorityKept=false;
    text=text.replace(/<img\b[^>]*fetchpriority=["']high["'][^>]*>/gi,tag=>{
      if(!highPriorityKept){highPriorityKept=true;return tag;}
      return tag.replace(/\sfetchpriority=["']high["']/i,' fetchpriority="auto"');
    });
  }

  if(text!==before){await writeFile(file,text,'utf8');changedFiles+=1;}
}

const requiredAssignments={
  'index.html':[publicPath('masterTransparent'),publicPath('standingLandscape'),publicPath('seatedLandscape')],
  'news/index.html':[publicPath('news')],
  'music/index.html':[publicPath('music')],
  'ebooks/index.html':[publicPath('ebook')]
};
for(const [relative,markers] of Object.entries(requiredAssignments)){
  const html=await readFile(path.join(root,relative),'utf8');
  for(const marker of markers)if(!html.includes(marker))throw new Error(`${relative} is missing exact approved asset ${marker}`);
}

for(const protectedImage of [
  '/assets/images/volunteer/francine-leading-with-love-fmb.webp',
  '/assets/images/volunteer/francine-serving-with-volunteers.webp'
]){
  const withLove=await readFile(path.join(root,'withlovefmb/index.html'),'utf8');
  if(!withLove.includes(protectedImage))throw new Error(`Protected volunteer image is missing: ${protectedImage}`);
}

for(const file of await walk(root)){
  const text=await readFile(file,'utf8');
  for(const marker of retiredPaths){
    if(text.includes(marker))throw new Error(`${path.relative(root,file)} still references retired substitute asset ${marker}`);
  }
  if(text.includes('https://at.adobe.com/'))throw new Error(`${path.relative(root,file)} still depends on an external Adobe delivery URL.`);
}

console.log(`Verified ${manifest.assets.length} exact GitHub-owned FMB masters and replaced ${changedReferences} retired references across ${changedFiles} final output files.`);
