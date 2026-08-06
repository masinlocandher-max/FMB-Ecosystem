import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cap, tag, walk, priority, priorityRecords, landingRecords, merge, logo } from './fmbnews-clean-lib.mjs';
import { shell, foot, shareBar, runtime, head, landingPage, aboutPage, redirectPage } from './fmbnews-clean-render.mjs';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(root,'dist');
const news=path.join(dist,'news');
const fmb=path.join(dist,'fmbnews');

function cleanArticle(html,route){
  const main=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
  if(!main)return html;
  const title=cap(html,/<title>([\s\S]*?)<\/title>/i)||cap(main,/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const description=tag(html,/<meta\b[^>]*name=(['"])description\1[^>]*>/i,'content')||cap(main,/<p\b[^>]*class=(['"])[^'"]*\bnc-article-deck\b[^'"]*\1[^>]*>([\s\S]*?)<\/p>/i);
  const canonical=tag(html,/<link\b[^>]*rel=(['"])canonical\1[^>]*>/i,'href')||`https://www.francinemariebautista.com${route}`;
  const image=tag(html,/<meta\b[^>]*property=(['"])og:image\1[^>]*>/i,'content')||tag(main,/<img\b[^>]*>/i,'src')||logo;
  const normalizedMain=main
    .replace(/<main\b([^>]*)\bid=(['"])[^'"]*\2([^>]*)>/i,'<main$1id="main"$3>')
    .replaceAll('href="/news/"','href="/fmbnews/"');
  return `<!doctype html><html lang="en-PH">${head(title,description,canonical,image,'article')}<body class="fmb-news-clean fmb-news-article news-story-route">${shell()}${normalizedMain}${shareBar(title,canonical)}${foot()}${runtime()}</body></html>`;
}

await mkdir(path.join(dist,'assets','css'),{recursive:true});
await writeFile(path.join(dist,'assets','css','fmbnews-clean-v1.css'),await readFile(path.join(root,'apps','withlovefmb','assets','css','fmbnews-clean-v1.css'),'utf8'),'utf8');
const old=await readFile(path.join(news,'index.html'),'utf8');
const records=merge(await priorityRecords(news),landingRecords(old));
if(records.length<6)throw new Error('FMB News recovery could not find the August 6 reports.');
await mkdir(fmb,{recursive:true});
const landing=landingPage(records);
await writeFile(path.join(fmb,'index.html'),landing,'utf8');
await mkdir(path.join(fmb,'about'),{recursive:true});
await writeFile(path.join(fmb,'about','index.html'),aboutPage(),'utf8');
const alias=landing.replace('content="index,follow,max-image-preview:large"','content="noindex,follow"').replace('<body class="fmb-news-clean fmb-news-landing">','<body class="fmb-news-clean fmb-news-landing"><script>location.replace("/fmbnews/");</script>');
await writeFile(path.join(news,'index.html'),alias,'utf8');
await mkdir(path.join(news,'about'),{recursive:true});
await writeFile(path.join(news,'about','index.html'),redirectPage('/fmbnews/about/'),'utf8');
let count=0;
for(const file of await walk(news)){
  if(file===path.join(news,'index.html')||file===path.join(news,'about','index.html'))continue;
  const rel=path.relative(news,file).split(path.sep).join('/');
  if(!rel.endsWith('/index.html'))continue;
  const route=`/news/${rel.replace(/index\.html$/,'')}`;
  const before=await readFile(file,'utf8');
  const after=cleanArticle(before,route);
  if(after!==before){await writeFile(file,after,'utf8');count++}
}
const final=await readFile(path.join(fmb,'index.html'),'utf8');
if((final.match(/class="fnc-header"/g)||[]).length!==1||(final.match(/class="fnc-footer"/g)||[]).length!==1||/fmb-shell-header|fmb-shell-footer|fmb-news-livebar|fmb-news-channel-command/.test(final)||!final.includes(priority[0]))throw new Error('FMB News clean recovery validation failed.');
console.log(`Recovered FMB News with one canonical newsroom, ${records.length} reports and ${count} clean article pages using the exact supplied logo pair and four article sharing controls.`);
