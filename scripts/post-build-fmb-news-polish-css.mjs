import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const source = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-polish.css');
const out = path.join(root,'dist','assets','css','fmb-news-reference-polish.css');
const newsRoot = path.join(root,'dist','news');
await cp(source,out,{force:true});

async function walk(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walk(p));
    else if(entry.isFile()&&entry.name==='index.html') files.push(p);
  }
  return files;
}

for(const file of await walk(newsRoot)){
  let html=await readFile(file,'utf8');
  if(!html.includes('/assets/css/fmb-news-reference-polish.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-polish.css?v=20260830b"></head>');
    await writeFile(file,html);
  }
}
console.log('FMB News polish stylesheet applied across newsroom routes.');
