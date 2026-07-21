(function(){
  'use strict';

  const VERSION='20260722-visual-system-v1';
  const ASSET_ROOT='/assets/images';
  const HERO=`${ASSET_ROOT}/home/francine-home-hero-hd.webp?v=${VERSION}`;
  const OVERVIEW=`${ASSET_ROOT}/home/francine-home-founder-hd.webp?v=${VERSION}`;
  const RECEPTION=`${ASSET_ROOT}/fmbandco/fmbandco-ampersand-gold.png`;

  function setMeta(selector,content){
    const node=document.querySelector(selector);
    if(node)node.setAttribute('content',content);
  }

  function setImage(image,src,alt,width=1364,height=768){
    if(!image)return;
    image.src=src;
    image.removeAttribute('srcset');
    image.width=width;
    image.height=height;
    image.alt=alt;
    image.classList.add('fmb-hd-photo');
    const picture=image.closest('picture');
    if(picture)picture.querySelectorAll('source').forEach(source=>source.remove());
  }

  function decorateMedia(kind){
    if(kind==='news'){document.body.classList.add('fmb-news-channel');return}
    document.body.classList.add('fmb-media-channel');
    if(kind==='music')document.body.classList.add('fmb-music-channel','fmb-logo-lockup');
    if(kind==='ebook')document.body.classList.add('fmb-ebook-channel','fmb-logo-lockup');
  }

  function decorateFounderPage(){
    document.body.classList.add('fmb-founder-page');
    const hero=document.querySelector('.fmb-about-hero,.fco-hero');
    if(hero)hero.style.setProperty('--fmb-hero-image',`url("${HERO}")`);
    const overview=document.querySelector('.fmb-about-profile-grid figure img');
    setImage(overview,OVERVIEW,'Francine Marie Bautista in the approved editorial overview portrait');
    overview?.closest('figure')?.classList.add('fmb-hd-photo-frame');
    setMeta('meta[property="og:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
    setMeta('meta[name="twitter:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
  }

  function decorateCompanyPage(){
    document.body.classList.add('fmb-company-page');
    const hero=document.querySelector('.fco-hero');
    if(hero)hero.style.setProperty('--fmb-hero-image',`url("${HERO}")`);
    const overview=document.querySelector('.fco-about-grid figure img');
    setImage(overview,OVERVIEW,'Francine Marie Bautista in the approved FMB overview portrait');
    overview?.closest('figure')?.classList.add('fmb-hd-photo-frame');
    setMeta('meta[property="og:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
  }

  function decorateWithLovePage(){
    document.body.classList.add('fmb-with-love-page');
    const hero=document.querySelector('.wlf-hero');
    if(hero)hero.style.setProperty('--fmb-hero-image',`url("${HERO}")`);
    const manifesto=document.querySelector('.wlf-manifesto-grid');
    if(manifesto&&!manifesto.querySelector('.fmb-with-love-overview')){
      const figure=document.createElement('figure');
      figure.className='fmb-with-love-overview';
      figure.innerHTML=`<img src="${OVERVIEW}" width="1364" height="768" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved editorial overview portrait"><figcaption>Founder-led direction, community care, and people-first work within one connected initiative.</figcaption>`;
      manifesto.appendChild(figure);
    }
    setMeta('meta[property="og:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
  }

  function refreshFallbackHomepage(){
    const path=location.pathname.replace(/\/+$/,'')||'/';
    if(path!=='/')return;
    const heroImage=document.querySelector('.bulletin-hero .hero-visual img');
    setImage(heroImage,HERO,'Francine Marie Bautista, founder, strategist, and creative director');
    const overview=document.querySelector('.founder-dispatch img');
    setImage(overview,OVERVIEW,'Francine Marie Bautista in the approved editorial overview portrait');
  }

  function decorateReception(root=document){
    const icon=root.querySelector?.('.az-help-trigger-icon');
    if(icon&&!icon.dataset.fmbIconReady){
      icon.dataset.fmbIconReady='true';
      icon.innerHTML=`<img src="${RECEPTION}" width="257" height="282" alt="" aria-hidden="true">`;
    }
    const trigger=root.querySelector?.('.az-help-trigger');
    if(trigger)trigger.setAttribute('aria-label','Open Pearly Reception Desk');
  }

  function apply(){
    document.body.classList.add('fmb-visual-refresh');
    const path=decodeURIComponent(location.pathname.toLowerCase());
    if(path.startsWith('/music/'))decorateMedia('music');
    if(path.startsWith('/ebooks/'))decorateMedia('ebook');
    if(path.startsWith('/news/'))decorateMedia('news');
    if(path.startsWith('/aboutfmb/'))decorateFounderPage();
    if(path.startsWith('/withlovefmb/'))decorateWithLovePage();
    if(path.startsWith('/fmb&co/')||path.startsWith('/fmbandco/'))decorateCompanyPage();
    refreshFallbackHomepage();
    decorateReception();
  }

  function watchDynamicShell(){
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{
        scheduled=false;
        refreshFallbackHomepage();
        decorateReception();
      });
    });
    observer.observe(document.documentElement,{subtree:true,childList:true});
    setTimeout(()=>observer.disconnect(),12000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();watchDynamicShell()},{once:true});
  else{apply();watchDynamicShell()}
})();
