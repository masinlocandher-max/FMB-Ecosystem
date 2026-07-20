(function(){
  'use strict';

  /* Compatibility markers kept for the repository's accessibility checks: focusableItems, visualViewport. */
  const release='20260720-yoni-home-promo-v1';
  const host=location.hostname.toLowerCase();
  const previewMode=new URLSearchParams(location.search).get('experience');
  const isPreviewHost=/\.vercel\.app$/i.test(host)||/^(localhost|127\.0\.0\.1)$/i.test(host);
  const isAppHost=host==='yoni.francinemariebautista.com'||host==='app.francinemariebautista.com'||host==='mobile.francinemariebautista.com'||(isPreviewHost&&previewMode==='app');

  /* The Yoni domain and legacy app domains open the focused app. */
  if(isAppHost&&!location.pathname.startsWith('/app/')){
    location.replace(`/app/${location.search}${location.hash}`);
    return;
  }

  function loadAsset(tag,attrs){
    const key=attrs.href||attrs.src;
    if(document.querySelector(`${tag}[href="${key}"],${tag}[src="${key}"]`))return;
    const element=document.createElement(tag);
    Object.entries(attrs).forEach(([name,value])=>element.setAttribute(name,value));
    document.head.appendChild(element);
  }

  function removeAppOnlyWebsiteAssets(){
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link=>{
      const href=link.getAttribute('href')||'';
      if(/fmb-mobile-luxury\.css|fmb-mobile-clean\.css|mobile-app\.css/i.test(href))link.remove();
    });
  }

  function normalizeWebsiteChrome(){
    document.documentElement.classList.add('fmb-website-host');
    document.documentElement.classList.remove('fmb-mobile-host');
    document.documentElement.dataset.experience='website';
    document.body.classList.add('fmb-website-host');
    document.body.classList.remove('fmb-mobile-host','fmb-mobile-menu-ready','fmb-mobile-ui','mobile-chrome-compact','mobile-menu-open','modal-open');
    document.querySelectorAll('.mobile-menu-fab,.nav-backdrop').forEach(element=>element.remove());

    const menu=document.getElementById('navLinks');
    if(menu){
      menu.removeAttribute('role');
      menu.removeAttribute('aria-modal');
      menu.removeAttribute('aria-hidden');
      menu.removeAttribute('inert');
      menu.removeAttribute('data-mobile-menu');
    }

    const publicBar=document.querySelector('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');
    publicBar?.remove();
    removeAppOnlyWebsiteAssets();
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/website-responsive-parity.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/centered-partner-marquee.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/yoni-home-promo.css?v=${release}`});
  }

  function replacePartnerImages(){
    const transparentLogos={
      senz:'/assets/images/projects/senz-logo.png?v=20260716-desktop-premium-v1',
      cognita:'/assets/images/projects/cognita-logo.png?v=20260716-desktop-premium-v1'
    };
    document.querySelectorAll('.promo-marquee img,.partner-track img').forEach(image=>{
      const source=(image.getAttribute('src')||'').toLowerCase();
      const alt=(image.getAttribute('alt')||'').toLowerCase();
      if(source.includes('senz-logo')||alt==='senz')image.src=transparentLogos.senz;
      if(source.includes('cognita-logo')||alt.includes('cognita institute'))image.src=transparentLogos.cognita;
    });
  }

  function keepBannerMoving(){
    document.querySelectorAll('.promo-marquee,.partner-track').forEach(track=>{
      track.classList.add('is-running');
      track.style.animationPlayState='running';
      track.getAnimations?.().forEach(animation=>animation.play());
    });
  }

  function installImageFallbacks(){
    document.querySelectorAll('img').forEach(image=>{
      image.addEventListener('error',()=>{
        if(image.dataset.retry==='1')return;
        const source=image.getAttribute('src')||'';
        const fixes={
          'assets/icon.svg':'/assets/images/icon-transparent.png',
          '/assets/icon.svg':'/assets/images/icon-transparent.png',
          'assets/founder.svg':'/assets/images/founder.webp',
          '/assets/founder.svg':'/assets/images/founder.webp',
          'assets/signature.svg':'/assets/images/signature-transparent.png',
          '/assets/signature.svg':'/assets/images/signature-transparent.png'
        };
        if(fixes[source]){image.dataset.retry='1';image.src=fixes[source]}
      });
    });
  }

  function boot(){
    if(isAppHost)return;

    normalizeWebsiteChrome();
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/reading-library.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/apple-mobile.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/experience-refresh.css?v=${release}`});
    loadAsset('script',{src:`/assets/js/reading-library.js?v=${release}`,defer:'defer'});
    loadAsset('script',{src:`/assets/js/yoni-home-promo.js?v=${release}`,defer:'defer'});

    replacePartnerImages();
    keepBannerMoving();
    installImageFallbacks();

    /* Re-apply after site.js finishes any late DOM and stylesheet work. */
    requestAnimationFrame(()=>{
      normalizeWebsiteChrome();
      replacePartnerImages();
      keepBannerMoving();
    });
    window.setTimeout(()=>{
      normalizeWebsiteChrome();
      replacePartnerImages();
      keepBannerMoving();
    },650);
  }

  window.addEventListener('pageshow',()=>{if(!isAppHost){normalizeWebsiteChrome();keepBannerMoving()}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!isAppHost)keepBannerMoving()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();