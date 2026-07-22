import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const fail=message=>{throw new Error(`FMB public-route brand audit: ${message}`)};
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const readingRoutes=[
  'coming-out-respect.html',
  'dress-with-intention.html',
  'men-can-cry.html',
  'reading.html',
  'skin-care-makeup.html',
  'womens-health.html',
  'herra.html'
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
  for(const retired of [
    '/assets/images/home/fmb-home-logo.webp',
    '/assets/images/fmb-official-2026/fmb-master-square.webp',
    '/assets/images/news/fmb-news-official.svg',
    '/assets/images/channels/fmb-music-official.svg',
    '/assets/images/channels/fmb-ebook-official.svg'
  ]){
    if(html.includes(retired))fail(`${name} still exposes retired identity ${retired}`);
  }

  if(name.startsWith('news/')){
    requireMarker(html,name,`${approved}/fmb-news-official-transparent.webp`);
    newsPages+=1;
  }
  if(readingRoutes.includes(name))requireMarker(html,name,`${approved}/fmb-ebook-official-transparent.webp`);
}

const representativeRoutes={
  'index.html':`${approved}/francine-standing-landscape.webp`,
  'news/remembering-amor-deloso/index.html':`${approved}/fmb-news-official-transparent.webp`,
  'womens-health.html':`${approved}/fmb-ebook-official-transparent.webp`,
  'music/index.html':`${approved}/fmb-music-official-transparent.webp`,
  'ebooks/index.html':`${approved}/fmb-ebook-official-transparent.webp`
};
for(const [route,marker] of Object.entries(representativeRoutes)){
  const html=await readFile(path.join(root,route),'utf8');
  requireMarker(html,route,marker);
}

console.log(`FMB public-route brand audit verified ${publicPages} public HTML pages, including ${newsPages} News routes and ${readingRoutes.length} reading routes, with no retired founder or channel assets.`);
