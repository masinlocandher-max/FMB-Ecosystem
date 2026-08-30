import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const polishSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-polish.css');
const polishOut = path.join(root,'dist','assets','css','fmb-news-reference-polish.css');
const hardfixSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-hardfix.css');
const hardfixOut = path.join(root,'dist','assets','css','fmb-news-reference-hardfix.css');
const newsRoot = path.join(root,'dist','news');
await cp(polishSource,polishOut,{force:true});
await cp(hardfixSource,hardfixOut,{force:true});

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
  }
  if(!html.includes('/assets/css/fmb-news-reference-hardfix.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-hardfix.css?v=20260830a"></head>');
  }
  await writeFile(file,html);
}
console.log('FMB News polish and hard visual lock stylesheets applied across newsroom routes.');
