import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const globalReplacements=new Map([
  ['/assets/images/home/francine-home-hero-hd.webp',`${approved}/francine-standing-landscape.webp`],
  ['/assets/images/home/francine-home-founder-hd.webp',`${approved}/francine-seated-landscape.webp`],
  ['/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`],
  ['/assets/images/fmb-official-2026/fmb-news-official.webp',`${approved}/fmb-news-official-transparent.webp`],
  ['/assets/images/fmb-official-2026/fmb-music-official.webp',`${approved}/fmb-music-official-transparent.webp`]
]);

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  for(const [oldPath,newPath] of globalReplacements)html=html.replaceAll(oldPath,newPath);
  if(relative==='index.html'){
    html=html.replaceAll('/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`);
    html=html.replace(/<link\s+rel="icon"\s+href="[^"]+"[^>]*>/i,`<link rel="icon" href="${approved}/fmb-master-purple-square.webp" type="image/webp">`);
  }
  if(relative==='news/index.html')html=html.replaceAll('/assets/images/news/fmb-news-official.svg',`${approved}/fmb-news-official-transparent.webp`);
  if(relative==='music/index.html')html=html.replaceAll('/assets/images/channels/fmb-music-official.svg',`${approved}/fmb-music-official-transparent.webp`);
  if(relative==='ebooks/index.html')html=html.replaceAll('/assets/images/channels/fmb-ebook-official.svg',`${approved}/fmb-ebook-official-transparent.webp`);
  await writeFile(file,html,'utf8');
}
console.log(`Removed retired FMB logo and portrait paths from ${pages.length} rendered pages.`);
