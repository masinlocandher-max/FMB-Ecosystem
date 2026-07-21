(function(){
  'use strict';

  /* Compatibility markers kept for the repository's accessibility checks: focusableItems, visualViewport. */
  const release='20260721-community-hub-nav-v1';
  const host=location.hostname.toLowerCase();
  const previewMode=new URLSearchParams(location.search).get('experience');
  const isPreviewHost=/\.vercel\.app$/i.test(host)||/^(localhost|127\.0\.0\.1)$/i.test(host);
  const isAppHost=host==='yoni.francinemariebautista.com'||host==='app.francinemariebautista.com'||host==='mobile.francinemariebautista.com'||(isPreviewHost&&previewMode==='app');

  const MAIN_MENU=[
    {href:'/',label:'Home',description:'Return to the official FMB bulletin and latest announcements.'},
    {href:'/aboutfmb/',label:'About FMB',description:'Meet Francine Marie Bautista and explore her work and public mission.'},
    {href:'/news/',label:'News',description:'Read verified updates, context, reporting, and reflection.'},
    {href:'/projects/',label:'Projects',description:'Explore applications, cultural work, publications, and founder-led builds.'},
    {href:'/ebooks/',label:'eBooks',description:'Open six complete original publications and public guides.'},
    {href:'/music/',label:'Music',description:'Listen to the complete FMB music catalog and digital releases.'},
    {href:'/withlovefmb/#volunteer',label:'Get Involved',description:'Join community service, volunteer action, and people-first initiatives.'},
    {href:'/gethelp/',label:'Get Help',description:'Open verified emergency, wellbeing, protection, and assistance contacts.'},
    {href:'/fmbandco/',label:'FMB&CO.',description:'Explore the company and its SENZ and Cognita portfolio.'}
  ];

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

  function menuItemIsCurrent(item){
    const path=location.pathname.replace(/\/index\.html$/,'/').replace(/\/+$/,'')||'/';
    if(item.href==='/')return path==='/';
    if(item.label==='Get Involved')return path==='/withlovefmb'||path==='/communityengagements';
    const target=item.href.split('#')[0].replace(/\/+$/,'');
    return target&&path.startsWith(target);
  }

  function installMainMenu(){
    const nav=document.getElementById('navLinks');
    if(nav){
      nav.setAttribute('aria-label','Main website navigation');
      nav.innerHTML=`<div class="nav-menu-intro"><strong>Official FMB Bulletin</strong><span>Each destination has one clear purpose, from public reporting and projects to reading, music, participation, and help.</span></div>${MAIN_MENU.map(item=>`<a class="nav-menu-link" href="${item.href}"${menuItemIsCurrent(item)?' aria-current="page"':''}><span class="nav-link-label">${item.label}</span><small>${item.description}</small></a>`).join('')}<div class="nav-mobile-actions"><a class="pill secondary nav-signin-link" href="https://yoni.francinemariebautista.com/app/?auth=signin">Sign in to Yoni</a><a class="pill nav-install-link" href="https://yoni.francinemariebautista.com/app/install/">Install Yoni</a></div>`;
    }

    document.querySelectorAll('.fmb-site-links').forEach(gateway=>{
      gateway.setAttribute('aria-label','Main website navigation');
      gateway.innerHTML=MAIN_MENU.map(item=>`<a href="${item.href}"${menuItemIsCurrent(item)?' aria-current="page"':''}>${item.label}</a>`).join('');
    });

    document.querySelectorAll('.fmb-footer-site-map nav').forEach(footerNav=>{
      footerNav.setAttribute('aria-label','Main website footer navigation');
      footerNav.innerHTML=MAIN_MENU.map(item=>`<a href="${item.href}">${item.label}</a>`).join('');
    });
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
    installMainMenu();
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/reading-library.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/apple-mobile.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/experience-refresh.css?v=${release}`});
    loadAsset('script',{src:`/assets/js/reading-library.js?v=${release}`,defer:'defer'});
    loadAsset('script',{src:`/assets/js/yoni-home-promo.js?v=${release}`,defer:'defer'});

    replacePartnerImages();
    keepBannerMoving();
    installImageFallbacks();

    /* Re-apply after site.js and channel scripts finish late DOM work. */
    requestAnimationFrame(()=>{
      normalizeWebsiteChrome();
      installMainMenu();
      replacePartnerImages();
      keepBannerMoving();
    });
    window.setTimeout(()=>{
      normalizeWebsiteChrome();
      installMainMenu();
      replacePartnerImages();
      keepBannerMoving();
    },650);
  }

  window.addEventListener('pageshow',()=>{if(!isAppHost){normalizeWebsiteChrome();installMainMenu();keepBannerMoving()}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!isAppHost)keepBannerMoving()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
