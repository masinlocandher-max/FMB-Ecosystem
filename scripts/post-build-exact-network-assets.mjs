import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const ebookRoutes=new Set([
  'coming-out-respect.html',
  'dress-with-intention.html',
  'men-can-cry.html',
  'reading.html',
  'skin-care-makeup.html',
  'womens-health.html',
  'herra.html'
]);

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
function exactFavicon(html){
  const tag=`<link rel="icon" href="${approved}/fmb-master-purple-square.webp" type="image/webp">`;
  return /<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i,tag)
    : html.replace('</head>',`${tag}\n</head>`);
}
function replaceImagePath(html,oldPath,newPath){return html.replaceAll(oldPath,newPath);}

let changed=0;
for(const file of await walk(root)){
  const name=relative(file);
  if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  let html=await readFile(file,'utf8');
  const before=html;

  html=html.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,`${approved}/francine-portrait-front.webp`);
  html=replaceImagePath(html,'/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`);
  html=replaceImagePath(html,'/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`);
  html=exactFavicon(html);

  if(name.startsWith('news/')){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/news/fmb-news-official.svg','/assets/images/fmb-official-2026/fmb-news-official.webp']){
      html=replaceImagePath(html,oldPath,`${approved}/fmb-news-official-transparent.webp`);
    }
  }
  if(ebookRoutes.has(name)){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-ebook-official.svg']){
      html=replaceImagePath(html,oldPath,`${approved}/fmb-ebook-official-transparent.webp`);
    }
  }

  if(html!==before){await writeFile(file,html,'utf8');changed+=1;}
}
console.log(`Extended exact FMB portraits and channel identities through ${changed} public content routes while preserving SENZ, Cognita, Yoni and volunteer assets.`);
