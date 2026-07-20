(function(){
'use strict';
const version='20260721-live-fix-2';
const addStyle=(href,marker)=>{if(document.querySelector(`link[${marker}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=`${href}?v=${version}`;link.setAttribute(marker,'true');document.head.appendChild(link)};
addStyle('/assets/css/yoni-visual-final.css','data-yoni-visual-final');
addStyle('/assets/css/yoni-human-taglish.css','data-yoni-human-taglish');
const load=src=>new Promise(resolve=>{const existing=[...document.scripts].find(script=>script.src.includes(src));if(existing){resolve();return}const script=document.createElement('script');script.src=`${src}?v=${version}`;script.async=false;script.onload=resolve;script.onerror=resolve;document.body.appendChild(script)});
(async()=>{await load('/assets/js/yoni-reply-core.js');await load('/assets/js/yoni-human-taglish.js');await load('/assets/js/yoni-visual-final.js')})();
})();
