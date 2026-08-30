import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const newsRoot=path.join(root,'dist','news');
const mapping=JSON.parse(await readFile(path.join(root,'apps','withlovefmb','content','news','rights-cleared-image-overrides.json'),'utf8'));
const fallback='/assets/images/news/fmb-news-editorial-fallback.svg';

async function walk(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walk(p));
    else if(entry.isFile()&&entry.name==='index.html') files.push(p);
  }
  return files;
}

function patchCards(html,slug,url){
  const href=`href="/news/${slug}/"`;
  let cursor=0;
  while(true){
    const start=html.indexOf(href,cursor);
    if(start<0) break;
    const src=html.indexOf(`src="${fallback}"`,start);
    if(src>=0&&src-start<1500){
      html=html.slice(0,src)+`src="${url}"`+html.slice(src+(`src="${fallback}"`).length);
      cursor=src+url.length;
    }else cursor=start+href.length;
  }
  return html;
}

for(const file of await walk(newsRoot)){
  let html=await readFile(file,'utf8');
  const before=html;
  for(const [slug,image] of Object.entries(mapping)) html=patchCards(html,slug,image.url);
  if(html!==before) await writeFile(file,html);
}
console.log(`Applied rights-cleared story imagery to related cards across the newsroom.`);
