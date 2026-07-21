(function(){
'use strict';
const version='20260721-complete-app-v1';
const addStyle=(href,marker)=>{if(document.querySelector(`link[${marker}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=`${href}?v=${version}`;link.setAttribute(marker,'true');document.head.appendChild(link)};
addStyle('/assets/css/yoni-app-refresh.css','data-yoni-app-refresh');
addStyle('/assets/css/yoni-native-libraries.css','data-yoni-native-libraries');
addStyle('/assets/css/yoni-native-reader-compat.css','data-yoni-native-reader-compat');
const load=src=>new Promise(resolve=>{const existing=[...document.scripts].find(script=>script.src.includes(src));if(existing){resolve();return}const script=document.createElement('script');script.src=`${src}?v=${version}`;script.async=false;script.onload=resolve;script.onerror=resolve;document.body.appendChild(script)});
(async()=>{
  await load('/assets/js/yoni-native-libraries.js');
  await load('/assets/js/yoni-native-music.js');
  await load('/assets/js/yoni-native-ebooks.js');
})();
})();
