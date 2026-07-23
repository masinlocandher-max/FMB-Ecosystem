import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const errors=[];
const warnings=[];
const pages=[];
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');

async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(full));else files.push(full);}return files;}
function siteRootFor(name){if(name.startsWith('_sites/cognita/'))return path.join(root,'_sites','cognita');if(name.startsWith('_sites/senz/'))return path.join(root,'_sites','senz');return root;}
function cleanReference(value){return value.replaceAll('&amp;','&').trim();}
function resolveReference(file,siteRoot,html,value){
  const href=cleanReference(value);
  if(!href||href.startsWith('#')||/^(?:https?:|mailto:|tel:|sms:|javascript:|data:|blob:|intent:)/i.test(href))return;
  const clean=decodeURIComponent(href.split('#')[0].split('?')[0]);
  if(!clean)return;
  if(clean.startsWith('/'))return path.join(siteRoot,clean.replace(/^\//,''));
  const baseHref=html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  if(baseHref&&!/^https?:/i.test(baseHref)){
    const base=baseHref.startsWith('/')?path.join(siteRoot,baseHref.replace(/^\//,'')):path.resolve(path.dirname(file),baseHref);
    return path.resolve(base,clean);
  }
  return path.resolve(path.dirname(file),clean);
}
async function routeExists(target){
  const candidates=[];
  if(target.endsWith(path.sep))candidates.push(path.join(target,'index.html'));
  else{
    candidates.push(target);
    if(!path.extname(target))candidates.push(`${target}.html`,path.join(target,'index.html'));
  }
  for(const candidate of candidates){try{const info=await stat(candidate);if(info.isFile())return true;}catch{}}
  return false;
}

const allFiles=await walk(root);
const htmlFiles=allFiles.filter(file=>file.endsWith('.html'));
const localAssetPattern=/(?:src|href)=["'](\/[^"'?#]+)(?:[?#][^"']*)?["']/gi;

for(const file of htmlFiles){
  const name=relative(file);const html=await readFile(file,'utf8');const issues=[];
  const add=(level,message)=>{issues.push({level,message});(level==='error'?errors:warnings).push(`${name}: ${message}`);};
  const redirect=/<meta\s+http-equiv=["']refresh["']/i.test(html)||/location\.(?:replace|href)\s*=/i.test(html);
  if(!/<title>[^<]{3,}<\/title>/i.test(html))add('error','missing or empty title');
  if(!/<meta\s+name=["']viewport["']/i.test(html))add('error','missing viewport');
  if(!/<html\b[^>]*lang=/i.test(html))add('warning','missing html language');
  if(!redirect&&!/<main\b/i.test(html)&&!name.startsWith('app/')&&!name.startsWith('_sites/'))add('warning','missing main landmark');
  const ids=[...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
  if(duplicates.length)add('error',`duplicate ids: ${duplicates.join(', ')}`);
  for(const match of html.matchAll(/<img\b[^>]*>/gi)){const tag=match[0];if(!/\salt=/i.test(tag))add('warning','image missing alt attribute');if(!/\swidth=/i.test(tag)||!/\sheight=/i.test(tag))add('warning','image missing intrinsic dimensions');}
  const siteRoot=siteRootFor(name);
  for(const match of html.matchAll(localAssetPattern)){const asset=decodeURIComponent(match[1]);if(asset.endsWith('/'))continue;const target=path.join(siteRoot,asset.replace(/^\//,''));try{if(!(await stat(target)).isFile())add('error',`missing local asset ${asset}`);}catch{add('error',`missing local asset ${asset}`);}}
  const checkedLinks=new Set();
  for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)){
    const href=cleanReference(match[1]);if(checkedLinks.has(href))continue;checkedLinks.add(href);
    const target=resolveReference(file,siteRoot,html,href);if(!target)continue;
    if(!(await routeExists(target)))add('error',`broken internal link ${href}`);
  }
  if(name==='index.html'||/^(aboutfmb|withlovefmb|news|music|ebooks|fmbandco)\//.test(name)){if(!/<meta\s+name=["']description["']/i.test(html))add('error','missing SEO description');if(!/<link\s+rel=["']canonical["']/i.test(html))add('error','missing canonical URL');}
  pages.push({file:name,bytes:Buffer.byteLength(html),issues});
}

const requiredRoutes=['index.html','aboutfmb/index.html','withlovefmb/index.html','communityengagements/index.html','news/index.html','music/index.html','ebooks/index.html','fmbandco/index.html','app/index.html','app/install/index.html'];
for(const route of requiredRoutes)if(!htmlFiles.some(file=>relative(file)===route))errors.push(`required route missing: ${route}`);
const report={standard:'FMB Network Fortune 500 release audit',generatedAt:new Date().toISOString(),pagesAudited:pages.length,summary:{errors:errors.length,warnings:warnings.length,passed:errors.length===0&&warnings.length===0},errors,warnings,pages};
await writeFile(path.join(root,'enterprise-audit.json'),JSON.stringify(report,null,2),'utf8');
console.log(`Enterprise audit reviewed ${pages.length} HTML routes: ${errors.length} errors, ${warnings.length} warnings.`);
if(errors.length||warnings.length){console.error([...errors,...warnings].slice(0,100).join('\n'));process.exitCode=1;}
