(function(){
'use strict';
const version='20260721-live-fix-1';
if(!document.querySelector('link[data-yoni-visual-final]')){const link=document.createElement('link');link.rel='stylesheet';link.href=`/assets/css/yoni-visual-final.css?v=${version}`;link.dataset.yoniVisualFinal='true';document.head.appendChild(link)}
const load=src=>new Promise(resolve=>{const existing=[...document.scripts].find(script=>script.src.includes(src));if(existing){resolve();return}const script=document.createElement('script');script.src=`${src}?v=${version}`;script.async=false;script.onload=resolve;script.onerror=resolve;document.body.appendChild(script)});
(async()=>{await load('/assets/js/yoni-reply-core.js');await load('/assets/js/yoni-visual-final.js')})();
})();
