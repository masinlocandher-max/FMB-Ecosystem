import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB public-route brand audit: ${message}`)};
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const controlledReadingRoutes=['coming-out-respect.html','dress-with-intention.html','men-can-cry.html','reading.html','skin-care-makeup.html','womens-health.html'];
const retired=['https://at.adobe.com/','/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','/assets/images/news/fmb-news-official.svg','/assets/images/channels/fmb-music-official.svg','/assets/images/channels/fmb-ebook-official.svg'];

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(entry.name.endsWith('.html'))files.push(full);
  }
  return files;
}
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');
let publicPages=0;
let newsPages=0;
for(const file of await walk(root)){
  const name=relative(file);
  if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  const html=await readFile(file,'utf8');
  publicPages+=1;
  for(const marker of retired)if(html.includes(marker))fail(`${name} still renders retired identity ${marker}`);
  if(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/i.test(html))fail(`${name} still renders a generic founder cutout`);
  if(name.startsWith('news/')){
    if(!/(?:FMB(?:&amp;|&)CO\. News|FMB News)/i.test(html))fail(`${name} has no visible FMB News identity`);
    newsPages+=1;
  }
  if(controlledReadingRoutes.includes(name)&&!html.includes('membership-gate.js'))fail(`${name} is missing its controlled reading gate`);
}
const required={
  'index.html':'/assets/images/fmb-approved/fmb-master-transparent.webp',
  'news/index.html':'/assets/images/fmb-approved/fmb-news-official-transparent.webp',
  'music/index.html':'/assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'ebooks/index.html':'/assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
  'womens-health.html':'membership-gate.js'
};
for(const [relative,marker] of Object.entries(required)){
  const html=await readFile(path.join(root,relative),'utf8');
  if(!html.includes(marker))fail(`${relative} is missing ${marker}`);
}
console.log(`FMB public-route audit verified ${publicPages} public pages, ${newsPages} News routes, and ${controlledReadingRoutes.length} controlled reading routes with exact GitHub-owned identities.`);
