(function(){
'use strict';
const isYoni=/(^yoni\.francinemariebautista\.com$)|(^app\.francinemariebautista\.com$)/i.test(location.hostname)||/^\/app(?:\/|$)/.test(location.pathname);if(!isYoni)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ROOT='/app/assets/yoni/';
const A={master:ROOT+'yoni-master-static.png',dancing:ROOT+'yoni-dancing.png',happy:ROOT+'yoni-happy-wave.png',heart:ROOT+'yoni-heart-hug.png',sleepy:ROOT+'yoni-sleepy-rest.png',journal:ROOT+'yoni-journal.png',music:ROOT+'yoni-music.png',meditation:ROOT+'yoni-meditation.png'};
window.YONI_ASSETS={...(window.YONI_ASSETS||{}),mascot:A.master,motion:A.master,master:A.master,dancing:A.dancing,happy:A.happy,heart:A.heart,sleepy:A.sleepy,journal:A.journal,music:A.music,meditation:A.meditation};
const language=()=>{try{return JSON.parse(localStorage.getItem('yoni-language-v2'))||'taglish'}catch{return'taglish'}};
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||document.body.dataset.yoniMotion==='reduced';
const loading={taglish:['Sandali lang, getting your safe space ready.','Inaayos lang ni Yoni ang space mo.','Almost there. Stay with me.'],en:['Preparing your safe space.','Yoni is getting things ready.','Almost there.']};
function preloadMaster(){if(document.querySelector('link[data-yoni-master]'))return;const link=document.createElement('link');link.rel='preload';link.as='image';link.href=A.master;link.dataset.yoniMaster='true';document.head.appendChild(link)}
function imageSource(key){return A[key]||A.master}
function hydrate(root=document){
  [...(root.querySelectorAll?.('img')||[])].forEach(img=>{
    const current=img.getAttribute('src')||'',key=img.dataset.yoniAsset;
    if(key&&window.YONI_ASSETS[key])img.src=window.YONI_ASSETS[key];
    else if(/\/app\/(yoni-mascot|yoni-icon)\.svg(?:\?|$)/i.test(current))img.src=A.master;
    if(img.src.includes('/app/assets/yoni/')){img.decoding='async';img.style.objectFit='contain';if(!img.closest('.app-launch-card,.yoni-final-loader'))img.loading='lazy'}
  });
}
function launch(){
  const native=$('#appLaunch');if(native){const img=native.querySelector('img');if(img){img.src=A.master;img.alt='Yoni, the orange bear companion wearing a green beanie'}native.querySelector('.app-launch-icon')?.classList.add('yoni-master-launch')}
  if($('#yoniFinalLoader')||sessionStorage.getItem('yoni-final-loader-v1'))return;
  const pool=loading[language()]||loading.taglish,message=pool[Math.floor(Math.random()*pool.length)];
  document.body.insertAdjacentHTML('afterbegin',`<div class="yoni-final-loader" id="yoniFinalLoader" role="status" aria-live="polite" aria-busy="true"><section><img src="${A.master}" width="90" height="112" alt="Yoni, the orange bear companion wearing a green beanie"><strong>Yoni</strong><p>${message}</p><span aria-hidden="true"><i></i></span></section></div>`);
  const close=()=>{const node=$('#yoniFinalLoader');node?.classList.add('leaving');setTimeout(()=>node?.remove(),reduced()?10:360);sessionStorage.setItem('yoni-final-loader-v1','1')};
  if(document.readyState==='complete')setTimeout(close,500);else addEventListener('load',()=>setTimeout(close,350),{once:true});setTimeout(close,2300);
}
function activity(screenId,key,title,copy,className){const screen=$(screenId);if(!screen||screen.querySelector('.'+className))return;const anchor=screen.querySelector('.page-lede')||screen.firstElementChild;anchor?.insertAdjacentHTML('afterend',`<article class="yoni-activity-card ${className}"><img src="${imageSource(key)}" width="112" height="112" loading="lazy" decoding="async" alt="${title}"><div><strong>${title}</strong><p>${copy}</p></div></article>`)}
function activities(){
  activity('#screen-journal','journal','Yoni is here while you write.','No need to make the entry polished. One honest line is enough.','yoni-journal-moment');
  activity('#screen-listen','music','A softer sound for the moment.','Sound stays optional and begins only after you tap play.','yoni-music-moment');
  activity('#screen-tools','meditation','Let’s make the moment smaller.','A gentle breath or grounding step can be enough for now.','yoni-grounding-moment');
  activity('#screen-help','heart','Human help comes first.','Yoni can stay beside you while you reach a trusted person or support line.','yoni-support-moment');
  const hour=new Date().getHours();if(hour>=21||hour<5)activity('#screen-home','sleepy','You can slow down now.','The minimum version of tonight is allowed.','yoni-rest-moment');
  const welcome=$('.access-intro .access-mascot');if(welcome){welcome.src=A.happy;welcome.alt='Yoni waving hello'}
}
function productNotes(){
  const exact='Yoni is an FMB&CO. digital product.';
  const footer=$('.app-footer');if(footer&&!footer.querySelector('.yoni-product-footnote'))footer.insertAdjacentHTML('beforeend',`<p class="yoni-product-footnote"><a href="/fmbandco/">${exact}</a></p>`);
  const profile=$('#screen-profile');if(profile&&!$('#yoniProductCard'))profile.insertAdjacentHTML('beforeend',`<article class="card yoni-product-card" id="yoniProductCard"><img src="${A.master}" width="90" height="112" loading="lazy" alt="Yoni"><div><p class="kicker">About Yoni</p><h2>A gentle digital companion</h2><p>Yoni supports private reflection, check-ins, grounding, and access to human support. Yoni does not replace a therapist, doctor, or emergency service.</p><a href="/fmbandco/">${exact}</a></div></article>`);
  const privacy=$('#screen-privacy');if(privacy&&!privacy.querySelector('.yoni-legal-footnote'))privacy.insertAdjacentHTML('beforeend',`<aside class="yoni-legal-footnote"><a href="/fmbandco/">${exact}</a></aside>`);
  const settings=$('#yoniPreferencesCard');if(settings&&!settings.querySelector('.yoni-product-footnote'))settings.insertAdjacentHTML('beforeend',`<p class="yoni-product-footnote"><a href="/fmbandco/">${exact}</a></p>`);
}
function tuneOldComfort(){
  const dock=$('#yoniComfortDock img');if(dock)dock.src=A.master;
  const peek=$('#yoniPeek img');if(peek&&!peek.dataset.activityLocked)peek.src=A.master;
  const comfort=$('#yoniComfortLayer .yoni-comfort-hero img');if(comfort&&!comfort.dataset.activityLocked)comfort.src=A.heart;
}
function setTransient(selector,key,duration=1800){const img=$(selector);if(!img)return;img.dataset.activityLocked='1';img.src=imageSource(key);setTimeout(()=>{delete img.dataset.activityLocked;img.src=A.master},duration)}
function moments(){
  $$('.mood-option').forEach(button=>{if(button.dataset.yoniVisualBound)return;button.dataset.yoniVisualBound='1';button.addEventListener('click',()=>setTimeout(()=>setTransient('#yoniComfortLayer .yoni-comfort-hero img',Number(button.dataset.mood)<=2?'heart':'happy',3000),80),true)});
  const check=$('#saveCheckin');if(check&&!check.dataset.yoniVisualBound){check.dataset.yoniVisualBound='1';check.addEventListener('click',()=>setTimeout(()=>setTransient('#yoniPeek img','dancing',2400),130),true)}
  const journal=$('#saveJournal');if(journal&&!journal.dataset.yoniVisualBound){journal.dataset.yoniVisualBound='1';journal.addEventListener('click',()=>setTimeout(()=>setTransient('#yoniComfortLayer .yoni-comfort-hero img','journal',2800),130),true)}
  const breathe=$('#startBreathing');if(breathe&&!breathe.dataset.yoniVisualBound){breathe.dataset.yoniVisualBound='1';breathe.addEventListener('click',()=>setTimeout(()=>setTransient('#yoniPeek img','meditation',2400),80),true)}
}
function optimizeAds(){
  $$('.work-modal,.work-brand-card,[class*="ad-"],[class*="promo-"]').forEach(node=>node.classList.add('yoni-responsive-ad'));
  $$('.work-modal img,.work-brand-card img,[class*="ad-"] img,[class*="promo-"] img').forEach(img=>{img.decoding='async';img.loading='lazy';img.style.maxWidth='100%'});
}
function preferencesFace(){const card=$('#yoniPreferencesCard');if(!card||card.querySelector('.yoni-settings-face'))return;card.insertAdjacentHTML('afterbegin',`<img class="yoni-settings-face" src="${A.master}" width="58" height="72" loading="lazy" alt="Yoni">`)}
function install(){document.body.classList.add('yoni-final-visual-ready');preloadMaster();launch();hydrate();activities();productNotes();preferencesFace();tuneOldComfort();moments();optimizeAds();
  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node instanceof HTMLElement){hydrate(node);activities();productNotes();preferencesFace();tuneOldComfort();moments();optimizeAds()}})));observer.observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
