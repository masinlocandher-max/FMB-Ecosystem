(function(){
'use strict';
const version='20260820-parked-yoni-v1';
const addStyle=(href,marker)=>{if(document.querySelector(`link[${marker}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=`${href}?v=${version}`;link.setAttribute(marker,'true');document.head.appendChild(link)};
addStyle('/assets/css/yoni-app-refresh.css','data-yoni-app-refresh');
const load=src=>new Promise(resolve=>{const existing=[...document.scripts].find(script=>script.src.includes(src));if(existing){resolve();return}const script=document.createElement('script');script.src=`${src}?v=${version}`;script.async=false;script.onload=resolve;script.onerror=resolve;document.body.appendChild(script)});
(async()=>{
  await load('/assets/js/yoni-native-libraries.js');
})();
})();
