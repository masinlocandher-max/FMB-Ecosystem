import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const script='/assets/js/az-assistant.js?v=20260722-pearly-lazy-v1';

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  html=html.replace(/<link\s+[^>]*href=["'][^"']*az-assistant\.css[^"']*["'][^>]*>\s*/gi,'');
  if(!html.includes('/assets/js/az-assistant.js'))html=html.replace('</body>',`<script src="${script}" defer></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

const siteScriptPath=path.join(root,'assets/js/site.js');
let siteScript=await readFile(siteScriptPath,'utf8');
siteScript=siteScript
  .replace("if(isPublicWebsiteHost)ensureStylesheet('/assets/css/az-assistant.css?v=20260720-az-website-only-v1');","/* Pearly CSS is loaded on first Reception interaction by az-assistant.js. */")
  .replace("if(isPublicWebsiteHost)loadScript('/assets/js/az-assistant.js?v=20260720-az-website-only-v1').catch(()=>{});","/* Pearly is injected once by the optimized network build. */");
await writeFile(siteScriptPath,siteScript,'utf8');

console.log(`Enabled lazy Pearly Reception Desk loading on ${pages.length} public pages and removed the duplicate eager loader.`);
