import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const script='/assets/js/az-assistant.js?v=20260723-product-design-mobile-v1';

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
  .replaceAll('/assets/images/fmbandco/fmbandco-ampersand-gold.png','/assets/images/fmb-approved/fmb-master-purple-square.webp')
  .replaceAll('/assets/images/fmb-official-2026/fmb-master-square.webp','/assets/images/fmb-approved/fmb-master-purple-square.webp')
  .replace('width="257" height="282"','width="1254" height="1254"')
  .replace('.pearly-lazy-trigger img{width:25px;height:28px;', '.pearly-lazy-trigger img{width:30px;height:30px;border-radius:9px;')
  .replace('.az-help-trigger-icon img{width:27px!important;height:30px!important;', '.az-help-trigger-icon img{width:30px!important;height:30px!important;border-radius:9px!important;')
  .replace('@media(max-width:800px){.pearly-lazy-trigger,.az-help-trigger{right:12px!important;bottom:calc(86px + env(safe-area-inset-bottom,0px))!important;min-width:164px!important;min-height:54px!important}}', '@media(max-width:800px){.pearly-lazy-trigger,.az-help-trigger{right:14px!important;bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;width:54px!important;min-width:54px!important;max-width:54px!important;height:54px!important;min-height:54px!important;padding:6px!important;gap:0!important;overflow:hidden!important;border-radius:18px!important}.pearly-lazy-trigger>span:last-child,.az-help-trigger-label{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.pearly-lazy-trigger span:first-child,.az-help-trigger-icon{width:42px!important;height:42px!important;flex:0 0 42px!important}}');
await writeFile(receptionScriptPath,receptionScript,'utf8');

const siteScriptPath=path.join(root,'assets/js/site.js');
let siteScript=await readFile(siteScriptPath,'utf8');
siteScript=siteScript
  .replace("if(isPublicWebsiteHost)ensureStylesheet('/assets/css/az-assistant.css?v=20260720-az-website-only-v1');","/* Pearly CSS is loaded on first Reception interaction by az-assistant.js. */")
  .replace("if(isPublicWebsiteHost)loadScript('/assets/js/az-assistant.js?v=20260720-az-website-only-v1').catch(()=>{});","/* Pearly is injected once by the verified network build. */")
  .replace("let mobileBar=$('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');","const hasDedicatedDock=Boolean(document.querySelector('.fco-mobile-dock'));let mobileBar=$('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');if(hasDedicatedDock&&mobileBar){mobileBar.remove();mobileBar=null}")
  .replace('if(!mobileBar){','if(!mobileBar&&!hasDedicatedDock){');
await writeFile(siteScriptPath,siteScript,'utf8');

console.log(`Enabled a compact, collision-safe FMB Reception Desk on ${pages.length} public pages and removed duplicate mobile navigation when a page already owns its dock.`);