import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const errors=[];
const warnings=[];
const pages=[];
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}
function siteRootFor(name){
  if(name.startsWith('_sites/cognita/'))return path.join(root,'_sites','cognita');
  if(name.startsWith('_sites/senz/'))return path.join(root,'_sites','senz');
  return root;
}

const allFiles=await walk(root);
const htmlFiles=allFiles.filter(file=>file.endsWith('.html'));
const localAssetPattern=/(?:src|href)=["'](\/[^"'?#]+)(?:[?#][^"']*)?["']/gi;

for(const file of htmlFiles){
  const name=relative(file);
  const html=await readFile(file,'utf8');
  const issues=[];
  const add=(level,message)=>{issues.push({level,message});(level==='error'?errors:warnings).push(`${name}: ${message}`);};
  if(!/<title>[^<]{3,}<\/title>/i.test(html))add('error','missing or empty title');
  if(!/<meta\s+name=["']viewport["']/i.test(html))add('error','missing viewport');
  if(!/<html\b[^>]*lang=/i.test(html))add('warning','missing html language');
  if(!/<main\b/i.test(html)&&!name.startsWith('app/')&&!name.startsWith('_sites/'))add('warning','missing main landmark');
  const ids=[...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
  if(duplicates.length)add('error',`duplicate ids: ${duplicates.join(', ')}`);
  for(const match of html.matchAll(/<img\b[^>]*>/gi)){
    const tag=match[0];
    if(!/\salt=/i.test(tag))add('warning','image missing alt attribute');
    if(!/\swidth=/i.test(tag)||!/\sheight=/i.test(tag))add('warning','image missing intrinsic dimensions');
  }
  const siteRoot=siteRootFor(name);
  for(const match of html.matchAll(localAssetPattern)){
    const asset=decodeURIComponent(match[1]);
    if(asset.endsWith('/'))continue;
    const target=path.join(siteRoot,asset.replace(/^\//,''));
    try{if(!(await stat(target)).isFile())add('error',`missing local asset ${asset}`);}catch{add('error',`missing local asset ${asset}`);}
  }
  if(name==='index.html'||/^(aboutfmb|withlovefmb|news|music|ebooks|fmb&co)\//.test(name)){
    if(!/<meta\s+name=["']description["']/i.test(html))add('error','missing SEO description');
    if(!/<link\s+rel=["']canonical["']/i.test(html))add('error','missing canonical URL');
  }
  pages.push({file:name,bytes:Buffer.byteLength(html),issues});
}

const requiredRoutes=['index.html','aboutfmb/index.html','withlovefmb/index.html','communityengagements/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','app/index.html','app/install/index.html'];
for(const route of requiredRoutes)if(!htmlFiles.some(file=>relative(file)===route))errors.push(`required route missing: ${route}`);

const report={standard:'FMB Network Fortune 500 release audit',generatedAt:new Date().toISOString(),pagesAudited:pages.length,summary:{errors:errors.length,warnings:warnings.length,passed:errors.length===0},errors,warnings,pages};
await writeFile(path.join(root,'enterprise-audit.json'),JSON.stringify(report,null,2),'utf8');
console.log(`Enterprise audit reviewed ${pages.length} HTML routes: ${errors.length} errors, ${warnings.length} warnings.`);
if(errors.length){console.error(errors.slice(0,60).join('\n'));process.exitCode=1;}
