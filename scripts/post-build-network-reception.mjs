import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const script='/assets/js/az-assistant.js?v=20260723-repository-fmb-v1';

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  html=html.replace(/<link\s+[^>]*href=["'][^"']*az-assistant\.css[^"']*["'][^>]*>\s*/gi,'');
  if(!html.includes('/assets/js/az-assistant.js'))html=html.replace('</body>',`<script src="${script}" defer></script>\n</body>`);
  await writeFile(file,html,'utf8');
}

const receptionScriptPath=path.join(root,'assets/js/az-assistant.js');
let receptionScript=await readFile(receptionScriptPath,'utf8');
receptionScript=receptionScript
  .replaceAll('/assets/images/fmbandco/fmbandco-ampersand-gold.png','/assets/images/home/fmb-home-logo.webp')
  .replaceAll('/assets/images/fmb-official-2026/fmb-master-square.webp','/assets/images/home/fmb-home-logo.webp')
  .replaceAll('/assets/images/fmb-approved/fmb-master-purple-square.webp','/assets/images/home/fmb-home-logo.webp')
  .replace(/width="(?:257|1254)" height="(?:282|1254)"/g,'width="512" height="512"')
  .replace('.pearly-lazy-trigger img{width:25px;height:28px;', '.pearly-lazy-trigger img{width:30px;height:30px;border-radius:9px;')
  .replace('.az-help-trigger-icon img{width:27px!important;height:30px!important;', '.az-help-trigger-icon img{width:30px!important;height:30px!important;border-radius:9px!important;');
await writeFile(receptionScriptPath,receptionScript,'utf8');

const siteScriptPath=path.join(root,'assets/js/site.js');
let siteScript=await readFile(siteScriptPath,'utf8');
siteScript=siteScript
  .replace("if(isPublicWebsiteHost)ensureStylesheet('/assets/css/az-assistant.css?v=20260720-az-website-only-v1');","/* Pearly CSS is loaded on first Reception interaction by az-assistant.js. */")
  .replace("if(isPublicWebsiteHost)loadScript('/assets/js/az-assistant.js?v=20260720-az-website-only-v1').catch(()=>{});","/* Pearly is injected once by the verified network build. */");
await writeFile(siteScriptPath,siteScript,'utf8');

console.log(`Enabled the repository-contained FMB Reception Desk identity on ${pages.length} public pages without adding it to the critical rendering path.`);
