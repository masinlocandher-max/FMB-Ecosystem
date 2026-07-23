import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB public-route brand audit: ${message}`)};
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const controlledReadingRoutes=[
  'coming-out-respect.html',
  'dress-with-intention.html',
  'men-can-cry.html',
  'reading.html',
  'skin-care-makeup.html',
  'womens-health.html'
];
const unavailable=[
  'https://at.adobe.com/',
  '/assets/images/fmb-approved/fmb-master-purple-square.webp',
  '/assets/images/fmb-approved/fmb-master-transparent.webp',
  '/assets/images/fmb-approved/francine-standing-landscape.webp',
  '/assets/images/fmb-approved/francine-seated-landscape.webp',
  '/assets/images/fmb-approved/francine-portrait-angle-left.webp',
  '/assets/images/fmb-approved/francine-portrait-angle-right.webp',
  '/assets/images/fmb-approved/francine-portrait-front.webp',
];

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(entry.name.endsWith('.html'))files.push(full);
  }
  return files;
}
function relative(file){return path.relative(root,file).replaceAll(path.sep,'/');}
function requireMarker(html,file,marker){if(!html.includes(marker))fail(`${file} is missing ${marker}`);}

let publicPages=0;
let newsPages=0;
for(const file of await walk(root)){
  const name=relative(file);
  if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  const html=await readFile(file,'utf8');
  publicPages+=1;

  if(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/i.test(html)){
    fail(`${name} still exposes a retired generic founder image`);
  }
  for(const marker of unavailable)if(html.includes(marker))fail(`${name} still depends on unavailable identity ${marker}`);

  if(name.startsWith('news/')){
    requireMarker(html,name,'/news/');
    if(!/(?:FMB(?:&amp;|&)CO\. News|FMB News)/i.test(html))fail(`${name} is missing a visible FMB News identity`);
    newsPages+=1;
  }
  if(controlledReadingRoutes.includes(name))requireMarker(html,name,'membership-gate.js');
}

const representativeRoutes={
  'index.html':'/assets/images/home/fmb-home-logo.webp',
  'news/index.html':'/assets/images/news/fmb-news-official.svg',
  'news/remembering-amor-deloso/index.html':'FMB&amp;CO. News Network',
  'womens-health.html':'membership-gate.js',
  'music/index.html':'/assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'ebooks/index.html':'/assets/images/fmb-approved/fmb-ebook-official-transparent.webp'
};
for(const [route,marker] of Object.entries(representativeRoutes)){
  const html=await readFile(path.join(root,route),'utf8');
  requireMarker(html,route,marker);
}

console.log(`FMB public-route brand audit verified ${publicPages} public HTML pages, including ${newsPages} News routes and ${controlledReadingRoutes.length} controlled reading routes, using repository-contained identities.`);
