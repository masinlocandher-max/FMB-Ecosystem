(function(){
'use strict';
const isYoni=/(^yoni\.francinemariebautista\.com$)|(^app\.francinemariebautista\.com$)/i.test(location.hostname)||/^\/app(?:\/|$)/.test(location.pathname);
if(!isYoni)return;
const APP_ICON='/app/assets/yoni/yoni-app-icon-192.jpg';
const MASTER='/app/assets/yoni/yoni-master-static.png';
function repair(){
  document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(link=>{link.href=APP_ICON;link.type='image/jpeg';if(link.rel==='apple-touch-icon')link.sizes='192x192'});
  document.querySelectorAll('img').forEach(image=>{
    const source=image.getAttribute('src')||'';
    if(/\/app\/yoni-icon\.svg(?:\?|$)/i.test(source))image.src=APP_ICON;
    if(/\/app\/yoni-mascot\.svg(?:\?|$)/i.test(source))image.src=MASTER;
  });
}
document.addEventListener('error',event=>{
  const image=event.target;
  if(!(image instanceof HTMLImageElement)||image.dataset.yoniFallback==='1')return;
  const source=image.currentSrc||image.src||'';
  if(!source.includes('/app/')&&!source.includes('/assets/images/'))return;
  image.dataset.yoniFallback='1';
  if(/yoni-app-icon|yoni-icon\.svg/i.test(source))image.src=APP_ICON;
  else if(image.dataset.yoniAsset==='senz'||image.dataset.yoniAsset==='cognita')image.hidden=true;
  else image.src=MASTER;
},true);
function install(){repair();new MutationObserver(repair).observe(document.documentElement,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
