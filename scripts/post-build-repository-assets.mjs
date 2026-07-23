import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const textExtensions=new Set(['.html','.css','.js','.json','.webmanifest']);
const replacements=new Map([
  ['/assets/images/fmb-approved/fmb-master-purple-square.webp','/assets/images/home/fmb-home-logo.webp'],
  ['/assets/images/fmb-approved/fmb-master-transparent.webp','/assets/images/home/fmb-home-logo.webp'],
  ['/assets/images/fmb-approved/fmb-news-official-transparent.webp','/assets/images/news/fmb-news-official.svg'],
  ['/assets/images/fmb-approved/francine-standing-landscape.webp','/assets/images/home/francine-home-hero-hd.webp'],
  ['/assets/images/fmb-approved/francine-seated-landscape.webp','/assets/images/home/francine-home-founder-hd.webp'],
  ['/assets/images/fmb-approved/francine-portrait-angle-left.webp','/assets/images/home/francine-home-founder-hd.webp'],
  ['/assets/images/fmb-approved/francine-portrait-angle-right.webp','/assets/images/home/francine-home-founder-hd.webp'],
  ['/assets/images/fmb-approved/francine-portrait-front.webp','/assets/images/home/francine-home-founder-hd.webp'],
  ['/assets/images/fmb-official-2026/fmb-master-square.webp','/assets/images/home/fmb-home-logo.webp'],
]);
const localRequired=[
  'assets/images/home/fmb-home-logo.webp',
  'assets/images/home/francine-home-hero-hd.webp',
  'assets/images/home/francine-home-founder-hd.webp',
  'assets/images/news/fmb-news-official.svg',
  'assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
];

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(textExtensions.has(path.extname(entry.name).toLowerCase()))files.push(full);
  }
  return files;
}

for(const relative of localRequired){
  const file=path.join(root,relative);
  const info=await stat(file);
  if(!info.isFile()||info.size<100)throw new Error(`Required repository asset is missing or empty: ${relative}`);
}

let changedFiles=0;
let changedReferences=0;
for(const file of await walk(root)){
  let text=await readFile(file,'utf8');
  const before=text;
  for(const [oldPath,newPath] of replacements){
    const occurrences=text.split(oldPath).length-1;
    if(occurrences){
      text=text.replaceAll(oldPath,newPath);
      changedReferences+=occurrences;
    }
  }
  const genericFounderMatches=text.match(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi)||[];
  if(genericFounderMatches.length){
    text=text.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,'/assets/images/home/francine-home-founder-hd.webp');
    changedReferences+=genericFounderMatches.length;
  }
  if(file.endsWith('.html')){
    text=text.replace(/<img\b[^>]*src=["'](?:\/assets\/images\/home\/(?:fmb-home-logo|francine-home-(?:hero|founder)-hd)\.webp|\/assets\/images\/news\/fmb-news-official\.svg)["'][^>]*>/gi,tag=>tag
      .replace(/\swidth=["'][^"']*["']/i,'')
      .replace(/\sheight=["'][^"']*["']/i,''));
    text=text
      .replaceAll('fmb-identity-signature-portrait','fmb-identity-signature-landscape')
      .replaceAll('fmb-official-portrait','fmb-official-landscape')
      .replace(/data-fmb-portrait=["'](?:standing-landscape-exact|seated-landscape-exact|portrait-angle-left-exact|portrait-angle-right-exact|portrait-front-exact)["']/g,'data-fmb-portrait="repository-founder"');

    let highPriorityKept=false;
    text=text.replace(/<img\b[^>]*fetchpriority=["']high["'][^>]*>/gi,tag=>{
      if(!highPriorityKept){highPriorityKept=true;return tag;}
      return tag.replace(/\sfetchpriority=["']high["']/i,' fetchpriority="auto"');
    });
  }
  if(text!==before){await writeFile(file,text,'utf8');changedFiles++;}
}

const forbidden=[
  '/assets/images/fmb-approved/fmb-master-purple-square.webp',
  '/assets/images/fmb-approved/fmb-master-transparent.webp',
  '/assets/images/fmb-approved/francine-standing-landscape.webp',
  '/assets/images/fmb-approved/francine-seated-landscape.webp',
  '/assets/images/fmb-approved/francine-portrait-angle-left.webp',
  '/assets/images/fmb-approved/francine-portrait-angle-right.webp',
  '/assets/images/fmb-approved/francine-portrait-front.webp',
  'https://at.adobe.com/',
];
for(const file of await walk(root)){
  const text=await readFile(file,'utf8');
  for(const marker of forbidden){
    if(text.includes(marker))throw new Error(`${path.relative(root,file)} still depends on unavailable external or uncommitted asset ${marker}`);
  }
}

console.log(`Replaced ${changedReferences} expiring, generic, or uncommitted asset references across ${changedFiles} output files with repository-contained FMB assets.`);
