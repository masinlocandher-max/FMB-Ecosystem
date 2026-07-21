(function(){
  'use strict';

  const VERSION='20260722-visual-system-v2';
  const ASSET_ROOT='/assets/images';
  const HERO=`${ASSET_ROOT}/home/francine-home-hero-hd.webp?v=${VERSION}`;
  const OVERVIEW=`${ASSET_ROOT}/home/francine-home-founder-hd.webp?v=${VERSION}`;
  const HERO_FALLBACK=`${ASSET_ROOT}/fmbandco/francine-founder-hero-923.webp`;
  const OVERVIEW_FALLBACK=`${ASSET_ROOT}/fmb/francine-founder-front-cutout-900-v1.webp`;
  const HOME_MARK=`${ASSET_ROOT}/brand/fmb-mark-purple-square-transparent.svg`;
  const CHANNEL_MARK=`${ASSET_ROOT}/brand/fmb-mark-white-transparent.svg`;
  const RECEPTION=`${ASSET_ROOT}/fmbandco/fmbandco-ampersand-gold.png`;

  const route=decodeURIComponent(location.pathname.toLowerCase());

  function setMeta(selector,content){
    const node=document.querySelector(selector);
    if(node)node.setAttribute('content',content);
  }

  function setImage(image,src,alt,width=1364,height=768,fallback=''){
    if(!image)return;
    image.src=src;
    image.removeAttribute('srcset');
    image.width=width;
    image.height=height;
    image.alt=alt;
    image.decoding='async';
    image.classList.add('fmb-hd-photo');
    const picture=image.closest('picture');
    if(picture)picture.querySelectorAll('source').forEach(source=>source.remove());
    if(fallback&&!image.dataset.fmbFallbackReady){
      image.dataset.fmbFallbackReady='true';
      image.addEventListener('error',()=>{
        if(image.src.includes(fallback))return;
        image.src=fallback;
        image.removeAttribute('srcset');
      },{once:true});
    }
  }

  function setTheme(theme){
    document.body.classList.add('fmb-unified-page',`fmb-theme-${theme}`);
    document.body.dataset.fmbTheme=theme;
  }

  function detectTheme(){
    if(route==='/'||route==='/index.html')return 'bulletin';
    if(route.startsWith('/news/'))return 'news';
    if(route.startsWith('/music/'))return 'music';
    if(route.startsWith('/ebooks/')||['/reading.html','/womens-health.html','/men-can-cry.html','/skin-care-makeup.html','/coming-out-respect.html','/dress-with-intention.html'].includes(route))return 'reading';
    if(route.startsWith('/projects/')||route.startsWith('/mabayani/'))return 'projects';
    if(route.startsWith('/withlovefmb/')||route.startsWith('/communityengagements/')||route.includes('freedom-wall'))return 'care';
    if(route.startsWith('/gethelp/')||route.includes('get-help'))return 'support';
    if(route.startsWith('/aboutfmb/')||route.startsWith('/work-with-fmb/'))return 'founder';
    if(route.startsWith('/fmb&co/')||route.startsWith('/fmbandco/'))return 'corporate';
    return 'public';
  }

  function channelLockup(kind){
    const label=kind==='music'?'MUSIC':'EBOOK';
    const readable=kind==='music'?'FMB Music':'FMB eBook';
    const wrapper=document.createElement('span');
    wrapper.className='fmb-channel-brand-lockup';
    wrapper.setAttribute('role','img');
    wrapper.setAttribute('aria-label',readable);
    wrapper.innerHTML=`<img src="${CHANNEL_MARK}" width="597" height="257" alt="" aria-hidden="true"><i aria-hidden="true"></i><strong>${label}</strong>`;
    return wrapper;
  }

  function decorateMedia(kind){
    if(kind==='news'){
      document.body.classList.add('fmb-news-channel');
      return;
    }
    document.body.classList.add('fmb-media-channel',`fmb-${kind}-channel`,'fmb-logo-lockup');
    document.querySelectorAll('.nc-publication-brand,.nc-channel-lockup,.nc-footer-brand').forEach(container=>{
      if(container.querySelector('.fmb-channel-brand-lockup'))return;
      container.replaceChildren(channelLockup(kind));
    });
  }

  function decorateFounderPage(){
    document.body.classList.add('fmb-founder-page');
    const hero=document.querySelector('.fmb-about-hero,.fco-hero');
    if(hero)hero.style.setProperty('--fmb-hero-image',`url("${HERO}")`);
    const overview=document.querySelector('.fmb-about-profile-grid figure img');
    setImage(overview,OVERVIEW,'Francine Marie Bautista in the approved seated editorial overview portrait',1364,768,OVERVIEW_FALLBACK);
    overview?.closest('figure')?.classList.add('fmb-hd-photo-frame');
    setMeta('meta[property="og:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
    setMeta('meta[name="twitter:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
  }

  function decorateCompanyPage(){
    document.body.classList.add('fmb-company-page');
    const hero=document.querySelector('.fco-hero');
    if(hero)hero.style.setProperty('--fmb-hero-image',`url("${HERO}")`);
    const overview=document.querySelector('.fco-about-grid figure img');
    setImage(overview,OVERVIEW,'Francine Marie Bautista in the approved seated FMB overview portrait',1364,768,OVERVIEW_FALLBACK);
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
      figure.innerHTML=`<img src="${OVERVIEW}" width="1364" height="768" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved seated editorial overview portrait"><figcaption>Founder-led direction, community care, and people-first work within one connected initiative.</figcaption>`;
      const image=figure.querySelector('img');
      image.addEventListener('error',()=>{image.src=OVERVIEW_FALLBACK},{once:true});
      manifesto.appendChild(figure);
    }
    setMeta('meta[property="og:image"]',`https://www.francinemariebautista.com${HERO.split('?')[0]}`);
  }

  function refreshHomepage(){
    if(route!=='/'&&route!=='/index.html')return;
    const heroImage=document.querySelector('#homeHeroImage,.bulletin-hero .hero-photo img,.bulletin-hero .hero-visual img');
    setImage(heroImage,HERO,'Francine Marie Bautista in the approved standing white-shirt landing portrait',1364,768,HERO_FALLBACK);
    const overview=document.querySelector('#homeFounderImage,.founder-dispatch img');
    setImage(overview,OVERVIEW,'Francine Marie Bautista in the approved seated white-shirt overview portrait',1364,768,OVERVIEW_FALLBACK);
    document.querySelectorAll('.bulletin-brand img[src*="fmb-home-logo"],.bulletin-brand img[src*="fmb-mark-purple-square"]').forEach(image=>{
      image.src=HOME_MARK;
      image.width=512;
      image.height=512;
      image.alt='FMB';
      image.classList.add('fmb-transparent-logo','fmb-home-mark');
    });
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
    setTheme(detectTheme());
    if(route.startsWith('/music/'))decorateMedia('music');
    if(route.startsWith('/ebooks/'))decorateMedia('ebook');
    if(route.startsWith('/news/'))decorateMedia('news');
    if(route.startsWith('/aboutfmb/'))decorateFounderPage();
    if(route.startsWith('/withlovefmb/'))decorateWithLovePage();
    if(route.startsWith('/fmb&co/')||route.startsWith('/fmbandco/'))decorateCompanyPage();
    refreshHomepage();
    decorateReception();
  }

  function watchDynamicShell(){
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{
        scheduled=false;
        refreshHomepage();
        decorateReception();
      });
    });
    observer.observe(document.documentElement,{subtree:true,childList:true});
    setTimeout(()=>observer.disconnect(),12000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();watchDynamicShell()},{once:true});
  else{apply();watchDynamicShell()}
})();
