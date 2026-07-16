(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);

  function ensureStylesheet(href){
    if(document.querySelector(`link[href="${href}"]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
  function ensureAppMetadata(){
    if(!document.querySelector('link[rel="manifest"]')){
      const manifest=document.createElement('link');manifest.rel='manifest';manifest.href='manifest.webmanifest';document.head.appendChild(manifest);
    }
    if(!document.querySelector('meta[name="theme-color"]')){
      const theme=document.createElement('meta');theme.name='theme-color';theme.content='#510b77';document.head.appendChild(theme);
    }
    if(!document.querySelector('meta[name="apple-mobile-web-app-capable"]')){
      const capable=document.createElement('meta');capable.name='apple-mobile-web-app-capable';capable.content='yes';document.head.appendChild(capable);
    }
    if(!document.querySelector('meta[name="mobile-web-app-capable"]')){
      const capable=document.createElement('meta');capable.name='mobile-web-app-capable';capable.content='yes';document.head.appendChild(capable);
    }
    if(!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')){
      const statusBar=document.createElement('meta');statusBar.name='apple-mobile-web-app-status-bar-style';statusBar.content='default';document.head.appendChild(statusBar);
    }
    if(!document.querySelector('meta[name="apple-mobile-web-app-title"]')){
      const title=document.createElement('meta');title.name='apple-mobile-web-app-title';title.content='With love, FMB';document.head.appendChild(title);
    }
    if(!document.querySelector('link[rel="apple-touch-icon"]')){
      const icon=document.createElement('link');icon.rel='apple-touch-icon';icon.sizes='180x180';icon.href='assets/images/apple-touch-icon.png';document.head.appendChild(icon);
    }
  }
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${src}"]`);
      if(existing){if(existing.dataset.loaded==='true'||(src.includes('supabase')&&window.supabase)||(src.includes('supabase-client')&&window.FMB)){resolve();return}existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
      const script=document.createElement('script');script.src=src;script.defer=false;script.addEventListener('load',()=>{script.dataset.loaded='true';resolve()},{once:true});script.addEventListener('error',reject,{once:true});document.head.appendChild(script);
    });
  }
  async function ensureMemberServices(){
    if(window.FMB)return true;
    try{
      if(!window.supabase)await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
      await loadScript('assets/js/config.js?v=20260715-member-launch');
      await loadScript('assets/js/supabase-client.js');
      return Boolean(window.FMB);
    }catch{return false}
  }

  ensureStylesheet('assets/css/icon-fix.css');
  ensureStylesheet('assets/css/repair.css');
  ensureStylesheet('assets/css/fmb-polish.css?v=20260716-polish');
  ensureStylesheet('assets/css/fmb-content.css?v=20260716-content');
  const mobileStyles='assets/css/fmb-mobile-clean.css?v=20260716-mobile-plan';
  ensureStylesheet(mobileStyles);
  requestAnimationFrame(()=>{
    const link=document.querySelector(`link[href="${mobileStyles}"]`);
    if(link)document.head.appendChild(link);
  });
  ensureAppMetadata();

  if(!document.querySelector('.skip-link')){
    const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
    const skip=document.createElement('a');skip.className='skip-link';skip.href=main?.id?`#${main.id}`:'#main-content';skip.textContent='Skip to main content';document.body.prepend(skip);
  }

  const loader=$('#loader');
  if(loader){const hide=()=>loader.classList.add('hide');window.addEventListener('load',()=>setTimeout(hide,350),{once:true});setTimeout(hide,2200)}

  function setupFriendlyNavigation(){
    const nav=$('.nav-glass'),links=$('#navLinks'),actions=nav?.querySelector('.nav-actions');
    if(!nav||!links||!actions)return;
    const normalizedPath=location.pathname.replace(/\/index\.html$/,'/').replace(/\/+$/,'')||'/';
    const route=normalizedPath==='/'?'home':normalizedPath.split('/').pop();
    const page=location.pathname.split('/').pop()||'index.html';
    const protectedRoutes=new Set(['profile','member.html','admin.html','admin-login.html','admin-activate.html','auth.html','reset-password.html']);
    if(protectedRoutes.has(route)||protectedRoutes.has(page))return;
    const onHome=route==='home';
    const items=[
      {label:'Home',description:'Understand the project and find the right starting point',href:onHome?'#top':'/',current:onHome&&!location.hash},
      {label:'Ebooks',description:'Open the complete FMB reading library',href:'/ebooks/',current:route==='ebooks'||['reading.html','womens-health.html','men-can-cry.html','coming-out-respect.html','skin-care-makeup.html','dress-with-intention.html'].includes(page)},
      {label:'Music',description:'Open our app-like original music library',href:'/music/',current:route==='music'||page==='music.html'},
      {label:'News',description:'Read the latest verified FMB briefing and reflection',href:'/news/',current:route==='news'},
      {label:'Freedom Wall',description:'Read positive reflections selected with care',href:'/freedom-wall.html',current:page==='freedom-wall.html'},
      {label:'Community',description:'Discover Community Engagements - AMDG and ways to take part',href:'/communityengagements/',current:route==='communityengagements'||page==='volunteer.html'},
      {label:'FMB & Co.',description:'Explore the three founder-led brands',href:'/fmbandco/',current:route==='fmbandco'},
      {label:'About FMB',description:'Meet Francine and understand her authority',href:'/aboutfmb/',current:route==='aboutfmb'||page==='about.html'},
      {label:'Get help',description:'Open verified crisis, health, safety, and assistance contacts',href:'/gethelp/',current:route==='gethelp',help:true}
    ];
    links.innerHTML=`<div class="nav-menu-intro"><strong>More from FMB</strong><span>Reading, music, news, and help stay in the quick menu below. Open the menu for our other spaces.</span></div>${items.map(item=>`<a class="nav-menu-link${item.help?' nav-help-link':''}" href="${item.href}"${item.current?' aria-current="page"':''}><span class="nav-link-label">${item.label}</span><small>${item.description}</small></a>`).join('')}<div class="nav-mobile-actions"><a class="pill secondary" href="/auth.html#signin">Sign in</a><a class="pill" href="/ebooks/">Start exploring</a></div>`;
    actions.innerHTML='<a class="nav-btn" href="/auth.html#signin">Sign in</a><button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-label="Open menu" aria-controls="navLinks"><span></span><span></span></button>';
    const menuToggle=actions.querySelector('#navToggle');
    if(menuToggle)menuToggle.setAttribute('aria-controls','navLinks');
    let mobileBar=$('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');
    if(!mobileBar){
      mobileBar=document.createElement('nav');
      mobileBar.className='mobile-bar';
      mobileBar.setAttribute('aria-label','Mobile navigation');
      document.body.appendChild(mobileBar);
    }
    if(mobileBar){
      const readingCurrent=route==='ebooks'||['reading.html','womens-health.html','men-can-cry.html','coming-out-respect.html','skin-care-makeup.html','dress-with-intention.html'].includes(page);
      const musicCurrent=route==='music'||page==='music.html';
      const newsCurrent=route==='news';
      const helpCurrent=route==='gethelp';
      mobileBar.innerHTML=`<a class="${onHome?'active':''}" href="/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 11 8-7 8 7v9H4Z"/><path d="M9 20v-6h6v6"/></svg><span>Home</span></a><a class="${readingCurrent?'active':''}" href="/ebooks/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z"/><path d="M7 4v14a2 2 0 0 0 2 2"/></svg><span>Read</span></a><a class="${musicCurrent?'active':''}" href="/music/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg><span>Music</span></a><a class="${newsCurrent?'active':''}" href="/news/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v16H5Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>News</span></a><a class="${helpCurrent?'active':''}" href="/gethelp/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-3.7 7-10V5l-7-2-7 2v6c0 6.3 7 10 7 10Z"/><path d="M9 12h6M12 9v6"/></svg><span>Help</span></a>`;
    }
  }
  setupFriendlyNavigation();

  const toggle=$('#navToggle'),links=$('#navLinks');
  if(toggle&&links){
    const close=()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu')};
    toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu')});
    links.addEventListener('click',event=>{if(event.target.closest('a'))close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
    document.addEventListener('click',event=>{if(!event.target.closest('.nav-glass,.nav-links,.mobile-menu-fab'))close()});
  }

  function setupMobileChrome(){
    const media=window.matchMedia('(max-width: 800px)');
    const menu=$('#navLinks');
    const menuToggle=$('#navToggle');
    const mobileBar=$('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');
    if(!menu||!menuToggle)return;
    const menuAnchor=document.createComment('fmb-mobile-menu-anchor');
    menu.parentNode.insertBefore(menuAnchor,menu);
    const placeMenu=()=>{
      if(media.matches){
        if(menu.parentElement!==document.body)document.body.appendChild(menu);
      }else if(menuAnchor.parentNode&&menu.parentNode!==menuAnchor.parentNode){
        menuAnchor.parentNode.insertBefore(menu,menuAnchor.nextSibling);
      }
    };
    document.body.classList.add('fmb-mobile-menu-ready');
    const menuIconFor=href=>{
      const icons={
        home:'<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
        read:'<path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v13H7.5A2.5 2.5 0 0 1 5 17.5Z"/><path d="M7.5 4.5v13A2.5 2.5 0 0 0 10 20"/>',
        music:'<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
        news:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
        heart:'<path d="M20.5 9.5c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.5Z"/>',
        serve:'<path d="M4 13.5 8.2 11l3.8 2 3.8-2 4.2 2.5"/><path d="M5.5 14.5V19h13v-4.5M8 10V6.5M12 10V4M16 10V6.5"/>',
        brands:'<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
        person:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6"/>',
        help:'<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.8 2.1c-1 .6-1.5 1.2-1.5 2.4M12 17h.01"/>'
      };
      const value=String(href||'');
      const key=value.includes('ebooks')?'read':value.includes('music')?'music':value.includes('news')?'news':value.includes('freedom-wall')?'heart':value.includes('community')||value.includes('volunteer')?'serve':value.includes('fmbandco')?'brands':value.includes('about')?'person':value.includes('gethelp')||value.includes('support')?'help':'home';
      return `<span class="mobile-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[key]}</svg></span>`;
    };
    const prepareMobileMenuItems=()=>{
      if(!media.matches)return;
      menu.querySelectorAll(':scope>a').forEach(link=>{
        link.classList.add('nav-menu-link');
        if(!link.querySelector('.nav-link-label')){
          const label=document.createElement('span');
          label.className='nav-link-label';
          while(link.firstChild)label.appendChild(link.firstChild);
          link.appendChild(label);
        }
        if(!link.querySelector('.mobile-menu-icon'))link.insertAdjacentHTML('afterbegin',menuIconFor(link.getAttribute('href')));
      });
    };
    prepareMobileMenuItems();
    menu.dataset.mobileMenu='dialog';
    const introTitle=menu.querySelector('.nav-menu-intro strong');
    if(introTitle){introTitle.id='mobileMenuTitle';menu.setAttribute('aria-labelledby',introTitle.id)}
    let backdrop=$('.nav-backdrop');
    if(!backdrop){backdrop=document.createElement('div');backdrop.className='nav-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop)}
    let floatingMenu=$('.mobile-menu-fab');
    if(!floatingMenu){
      floatingMenu=document.createElement('button');
      floatingMenu.type='button';
      floatingMenu.className='mobile-menu-fab';
      floatingMenu.setAttribute('aria-controls','navLinks');
      floatingMenu.setAttribute('aria-expanded','false');
      floatingMenu.setAttribute('aria-label','Open website menu');
      floatingMenu.innerHTML='<span class="mobile-menu-fab-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="mobile-menu-fab-label">Menu</span>';
      document.body.appendChild(floatingMenu);
    }
    floatingMenu.dataset.coreMenuBound='true';
    const updateVisibleHeight=()=>{
      const height=window.visualViewport?.height||window.innerHeight;
      document.documentElement.style.setProperty('--fmb-visible-height',`${Math.round(height)}px`);
    };
    const focusableItems=()=>[...menu.querySelectorAll('a[href],button:not([disabled])')].filter(item=>getComputedStyle(item).display!=='none'&&getComputedStyle(item).visibility!=='hidden');
    const syncMenu=()=>{
      const open=media.matches&&menu.classList.contains('open');
      if(media.matches){
        menu.setAttribute('role','dialog');
        menu.setAttribute('aria-modal','true');
        menu.setAttribute('aria-hidden',String(!open));
        menu.toggleAttribute('inert',!open);
        floatingMenu.style.setProperty('display','flex','important');
      }else{
        menu.removeAttribute('role');
        menu.removeAttribute('aria-modal');
        menu.removeAttribute('aria-hidden');
        menu.removeAttribute('inert');
        floatingMenu.style.setProperty('display','none','important');
      }
      menuToggle.setAttribute('aria-expanded',String(open));
      menuToggle.setAttribute('aria-label',open?'Close menu':'Open menu');
      floatingMenu.setAttribute('aria-expanded',String(open));
      floatingMenu.setAttribute('aria-label',open?'Close website menu':'Open website menu');
      const label=floatingMenu.querySelector('.mobile-menu-fab-label');
      if(label)label.textContent=open?'Close':'Menu';
      document.body.classList.toggle('mobile-menu-open',open);
      document.body.classList.toggle('modal-open',open);
      backdrop.classList.toggle('open',open);
      mobileBar?.classList.toggle('is-hidden',open);
    };
    const setMenu=(open,{returnFocus=true}={})=>{
      if(open&&!media.matches)return;
      const wasOpen=menu.classList.contains('open');
      menu.classList.toggle('open',Boolean(open));
      syncMenu();
      if(open){
        updateVisibleHeight();
        requestAnimationFrame(()=>focusableItems()[0]?.focus({preventScroll:true}));
      }else if(returnFocus&&wasOpen){floatingMenu.focus({preventScroll:true})}
    };
    const observer=new MutationObserver(syncMenu);
    observer.observe(menu,{attributes:true,attributeFilter:['class']});
    floatingMenu.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setMenu(!menu.classList.contains('open'))});
    backdrop.addEventListener('click',()=>setMenu(false));
    document.addEventListener('keydown',event=>{
      if(!media.matches||!menu.classList.contains('open'))return;
      if(event.key==='Escape'){event.preventDefault();setMenu(false);return}
      if(event.key!=='Tab')return;
      const items=focusableItems();
      if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });
    let lastY=window.scrollY;
    let ticking=false;
    const updateChrome=()=>{
      if(!media.matches){document.body.classList.remove('fmb-mobile-ui','mobile-chrome-compact');mobileBar?.classList.remove('is-hidden');ticking=false;return}
      document.body.classList.add('fmb-mobile-ui');
      const currentY=window.scrollY;
      const movingDown=currentY>lastY+7;
      const movingUp=currentY<lastY-7;
      if(currentY<90||movingUp){document.body.classList.remove('mobile-chrome-compact');mobileBar?.classList.remove('is-hidden')}
      else if(movingDown&&currentY>120){document.body.classList.add('mobile-chrome-compact');if(currentY>180&&!document.body.classList.contains('mobile-menu-open'))mobileBar?.classList.add('is-hidden')}
      lastY=currentY;
      ticking=false;
    };
    const schedule=()=>{if(!ticking){ticking=true;requestAnimationFrame(updateChrome)}};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('pageshow',()=>{lastY=window.scrollY;placeMenu();updateVisibleHeight();syncMenu();updateChrome()});
    mobileBar?.addEventListener('focusin',()=>mobileBar.classList.remove('is-hidden'));
    mobileBar?.addEventListener('pointerdown',()=>mobileBar.classList.remove('is-hidden'),{passive:true});
    media.addEventListener?.('change',event=>{if(!event.matches)setMenu(false,{returnFocus:false});prepareMobileMenuItems();placeMenu();updateVisibleHeight();syncMenu();updateChrome()});
    window.visualViewport?.addEventListener('resize',updateVisibleHeight,{passive:true});
    window.addEventListener('orientationchange',updateVisibleHeight,{passive:true});
    placeMenu();
    updateVisibleHeight();
    syncMenu();
    updateChrome();
  }
  setupMobileChrome();

  let topPromo=$('.support-glass');
  const topShell=$('.top-shell');
  if(!topPromo&&topShell){topPromo=document.createElement('div');topPromo.className='support-glass';topShell.prepend(topPromo)}
  if(topPromo){
    topPromo.setAttribute('aria-label','With love, FMB partner brands and advertising announcement');
    const advertisingHref='/aboutfmb/?category=advertise-with-us#work-with-fmb';
    const promoGroup=({duplicate=false}={})=>`<div class="promo-group"${duplicate?' aria-hidden="true"':''}><span class="brand-marquee-label">With love, FMB is brought to you by:</span><a class="brand-chip-logo" href="https://www.senzpr.com" target="_blank" rel="noopener noreferrer" aria-label="Visit SENZ"${duplicate?' tabindex="-1"':''}><img src="/assets/images/projects/senz-mobile.webp?v=20260716-mobile-first-v6" alt="${duplicate?'':'SENZ'}" width="480" height="185" decoding="async"></a><a class="brand-chip-logo cognita-chip" href="https://thecognitainstitute.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Cognita Institute of AI"${duplicate?' tabindex="-1"':''}><img src="/assets/images/projects/cognita-mobile.webp?v=20260716-mobile-first-v6" alt="${duplicate?'':'Cognita Institute of AI'}" width="520" height="188" decoding="async"></a><span class="banner-divider" aria-hidden="true"></span><span class="advertise-marquee-label">Advertise your brand or business across the website</span><a class="banner-advertise-button" href="${advertisingHref}"${duplicate?' tabindex="-1"':''}>Advertise with us</a></div>`;
    topPromo.innerHTML=`<div class="promo-marquee">${promoGroup()}${promoGroup({duplicate:true})}</div>`;
  }

  function setupImagePerformance(){
    const images=[...document.images];
    const priorityImage=document.querySelector('main :is(.hero-banner,.hero-image,.authority-portrait,.home-welcome) img, main>section img');
    images.forEach(image=>{
      image.decoding='async';
      if(image===priorityImage){
        image.loading='eager';
        image.fetchPriority='high';
      }else if(!image.closest('.top-shell')){
        image.loading='lazy';
      }
    });
  }
  setupImagePerformance();

  function setupFooterBrand(){
    $$('.footer').forEach(footer=>{
      const existing=footer.querySelector('.footer-brand-lockup');
      const logo=footer.querySelector('.footer-logo');
      if(!logo)return;
      logo.src='/assets/images/signature-transparent.png?v=20260716-signature-v5';
      logo.alt='With love, FMB';
      logo.width=981;
      logo.height=441;
      logo.decoding='async';
      existing?.querySelector('.footer-icon')?.remove();
      if(existing)return;
      const lockup=document.createElement('div');lockup.className='footer-brand-lockup';
      logo.parentElement.insertBefore(lockup,logo);lockup.append(logo);
    });
  }
  setupFooterBrand();

  function setupArticleSignatures(){
    const signature='/assets/images/signature-transparent.png?v=20260716-signature-v5';
    const signatureMarkup='<img src="'+signature+'" width="981" height="441" alt="With love, FMB" loading="lazy" decoding="async">';
    $$('.reader-signoff').forEach(signoff=>{
      signoff.classList.add('article-signature');
      signoff.setAttribute('aria-label','With love, FMB');
      signoff.innerHTML=signatureMarkup;
    });
    const legacyReader=$('main.reader');
    if(legacyReader&&!legacyReader.querySelector('.reader-signoff')){
      const signoff=document.createElement('section');
      signoff.className='reader-signoff article-signature';
      signoff.setAttribute('aria-label','With love, FMB');
      signoff.innerHTML=signatureMarkup;
      legacyReader.appendChild(signoff);
    }
    $$('.news-article .news-body').forEach(article=>{
      let signoff=article.querySelector('.news-signoff');
      if(!signoff){
        signoff=document.createElement('div');
        signoff.className='news-signoff article-signature';
        const sources=article.querySelector('.news-sources');
        article.insertBefore(signoff,sources||null);
      }
      signoff.classList.add('article-signature');
      signoff.setAttribute('aria-label','With love, FMB');
      signoff.innerHTML=signatureMarkup;
    });
  }
  setupArticleSignatures();

  function setupFooterNavigation(){
    $$('.footer').forEach(footer=>{
      const columns=footer.querySelectorAll('.footer-grid>div');
      const explore=columns[1]?.querySelector('.footer-links');
      const contact=columns[2]?.querySelector('.footer-links');
      if(explore&&!explore.querySelector('a[href="/news/"]'))explore.insertAdjacentHTML('beforeend','<a href="/news/">News</a>');
      if(contact&&!contact.querySelector('a[href="/gethelp/"]'))contact.insertAdjacentHTML('afterbegin','<a href="/gethelp/">Get help</a>');
      if(contact){
        contact.querySelectorAll('span').forEach(item=>{if(item.textContent.toLowerCase().includes('masinloc'))item.remove()});
        if(!contact.querySelector('a[href="mailto:withlovefmb@gmail.com"]'))contact.insertAdjacentHTML('beforeend','<a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>');
        if(!contact.querySelector('.footer-contact-address'))contact.insertAdjacentHTML('beforeend','<span class="footer-contact-address">Masinloc, Zambales 2211<br>Republic of the Philippines</span>');
      }
    });
  }
  setupFooterNavigation();

  function setupContentActions(){
    const path=location.pathname.replace(/\/index\.html$/,'/');
    const page=path.split('/').pop()||'index.html';
    const readingPages=new Set(['reading.html','womens-health.html','men-can-cry.html','coming-out-respect.html','skin-care-makeup.html','dress-with-intention.html']);
    const storageKey='fmb_saved_content_v1';
    const readSaved=()=>{try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(data)?data:[]}catch{return[]}};
    const bookmarkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.5 6.5 21Z"/></svg>';
    const shareIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>';
    const copyWithFallback=async value=>{
      if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(value);return true}catch{}}
      try{const input=document.createElement('textarea');input.value=value;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const copied=document.execCommand('copy');input.remove();return copied}catch{return false}
    };
    const createActions=({title,url,kind,compact=false})=>{
      const row=document.createElement('div');
      row.className=`item-action-row item-action-${kind}${compact?' is-compact':''}`;
      row.dataset.itemUrl=url;
      row.setAttribute('aria-label',`Save or share ${title}`);
      const shareText=`${title} | With love, FMB`;
      row.innerHTML=`<button class="item-action-button item-bookmark" type="button" aria-pressed="false" title="Save ${title}">${bookmarkIcon}<span>Save</span></button><div class="item-share-wrap"><button class="item-action-button item-share-toggle" type="button" aria-expanded="false" title="Share ${title}">${shareIcon}<span>Share</span></button><div class="item-share-menu" hidden><a data-share="facebook" target="_blank" rel="noopener noreferrer">Facebook</a><a data-share="twitter" target="_blank" rel="noopener noreferrer">X / Twitter</a><button data-share="messenger" type="button">Messenger</button><a data-share="text">Text message</a><button data-share="copy" type="button">Copy link</button></div></div><span class="item-action-status" role="status" aria-live="polite"></span>`;
      const status=row.querySelector('.item-action-status');
      const say=message=>{status.textContent=message;window.clearTimeout(status._timer);status._timer=window.setTimeout(()=>{status.textContent=''},4500)};
      const saveButton=row.querySelector('.item-bookmark');
      const saveLabel=saveButton.querySelector('span');
      const renderSaved=()=>{const saved=readSaved().some(item=>item.url===url);saveButton.setAttribute('aria-pressed',String(saved));saveButton.classList.toggle('is-saved',saved);saveLabel.textContent=saved?'Saved':'Save';saveButton.title=saved?`Remove ${title} from saved items`:`Save ${title}`};
      renderSaved();
      saveButton.addEventListener('click',()=>{
        try{
          const items=readSaved();
          const index=items.findIndex(item=>item.url===url);
          if(index>=0){items.splice(index,1);localStorage.setItem(storageKey,JSON.stringify(items));renderSaved();say('Removed.');return}
          items.unshift({url,title,kind,savedAt:new Date().toISOString()});
          localStorage.setItem(storageKey,JSON.stringify(items.slice(0,100)));
          renderSaved();say('Saved on this device.');
        }catch{say('Save is unavailable in this browser.')}
      });
      const menu=row.querySelector('.item-share-menu');
      const shareToggle=row.querySelector('.item-share-toggle');
      const closeShare=()=>{menu.hidden=true;shareToggle.setAttribute('aria-expanded','false')};
      shareToggle.addEventListener('click',async()=>{
        if(window.matchMedia('(max-width: 800px)').matches&&navigator.share){
          try{await navigator.share({title,text:shareText,url});say('Shared.')}catch(error){if(error?.name!=='AbortError')say('Share could not open.')}
          return;
        }
        const open=menu.hidden;
        document.querySelectorAll('.item-share-menu:not([hidden])').forEach(other=>{if(other!==menu){other.hidden=true;other.previousElementSibling?.setAttribute('aria-expanded','false')}});
        menu.hidden=!open;shareToggle.setAttribute('aria-expanded',String(open));
      });
      row.querySelector('[data-share="facebook"]').href=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      row.querySelector('[data-share="twitter"]').href=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
      row.querySelector('[data-share="text"]').href=`sms:?body=${encodeURIComponent(`${shareText} ${url}`)}`;
      row.querySelector('[data-share="copy"]').addEventListener('click',async()=>{closeShare();say(await copyWithFallback(url)?'Link copied.':'Copy was blocked.')});
      row.querySelector('[data-share="messenger"]').addEventListener('click',async()=>{
        closeShare();
        if(navigator.share){try{await navigator.share({title,text:shareText,url});return}catch(error){if(error?.name==='AbortError')return}}
        say(await copyWithFallback(url)?'Link copied. Paste it in Messenger.':'Copy was blocked.');
      });
      return row;
    };

    if(path.startsWith('/news/')){
      $$('.news-article[id]').forEach(article=>{
        const body=article.querySelector('.news-body');
        const title=body?.querySelector('h2')?.textContent.trim();
        if(!body||!title)return;
        const url=`${location.origin}/news/${article.id}/`;
        const actions=createActions({title,url,kind:'news'});
        const visual=body.querySelector('.news-visual');
        (visual||body.querySelector('h2')).insertAdjacentElement('afterend',actions);
      });
    }else if(path.startsWith('/ebooks/')){
      $$('.ebook-card').forEach(card=>{
        if(card.closest('.ebook-card-shell'))return;
        const title=card.querySelector('h3')?.textContent.trim();
        const href=card.getAttribute('href');
        if(!title||!href)return;
        const shell=document.createElement('article');shell.className='ebook-card-shell';
        card.parentElement.insertBefore(shell,card);shell.appendChild(card);
        shell.appendChild(createActions({title,url:new URL(href,location.origin).href,kind:'ebook',compact:true}));
      });
    }else if(path.startsWith('/music/')||page==='music.html'){
      const anchor=$('.music-intro, .music-hero');
      if(anchor){const title=anchor.querySelector('h1')?.textContent.trim()||'With love, FMB Music';anchor.insertAdjacentElement('afterend',createActions({title,url:`${location.origin}/music/`,kind:'music'}))}
    }else if(readingPages.has(page)){
      const anchor=$('.reading-hero, .reader-cover');
      if(anchor){const title=anchor.querySelector('h1')?.textContent.trim()||document.title.split('|')[0].trim();anchor.insertAdjacentElement('afterend',createActions({title,url:`${location.origin}${location.pathname}`,kind:'reading'}))}
    }

    document.addEventListener('click',event=>{
      if(event.target.closest('.item-share-wrap'))return;
      $$('.item-share-menu:not([hidden])').forEach(menu=>{menu.hidden=true;menu.previousElementSibling?.setAttribute('aria-expanded','false')});
    });
    document.addEventListener('keydown',event=>{if(event.key==='Escape')$$('.item-share-menu:not([hidden])').forEach(menu=>{menu.hidden=true;menu.previousElementSibling?.setAttribute('aria-expanded','false')})});
  }
  setupContentActions();

  const landingHero=$('.hero');
  if(landingHero){
    const image=landingHero.querySelector('.hero-banner img');
    if(image){image.src='assets/images/hero.webp';image.alt='With love, FMB official banner featuring Francine Marie Bautista and the purple and gold brand emblem';image.width=1600;image.height=900;image.setAttribute('fetchpriority','high');image.decoding='async'}
  }

  function setupInstallExperience(){
    const card=$('#appInstallCard');
    const button=$('#installAppButton');
    const help=$('#installAppHelp');
    if(!card||!button||!help)return;
    const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
    const mobile=window.matchMedia('(max-width: 800px)').matches;
    if(standalone||!mobile)return;
    let promptEvent=null;
    const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    const show=()=>{card.hidden=false};
    if(isiOS){
      help.textContent='In Safari, tap Share, then choose Add to Home Screen.';
      button.textContent='Show install steps';
      button.addEventListener('click',()=>{
        help.textContent='Tap the Share button in Safari, scroll down, choose Add to Home Screen, then tap Add.';
        help.focus?.();
      });
      show();
    }
    window.addEventListener('beforeinstallprompt',event=>{
      event.preventDefault();
      promptEvent=event;
      button.textContent='Install app';
      help.textContent='Install our reading and music space for faster access from your home screen.';
      show();
    });
    button.addEventListener('click',async()=>{
      if(!promptEvent)return;
      button.disabled=true;
      await promptEvent.prompt();
      const choice=await promptEvent.userChoice;
      button.disabled=false;
      if(choice.outcome==='accepted')card.hidden=true;
      promptEvent=null;
    });
    window.addEventListener('appinstalled',()=>{card.hidden=true;promptEvent=null});
  }
  setupInstallExperience();

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems=$$('.reveal');
  if(reduced||!('IntersectionObserver' in window))revealItems.forEach(item=>item.classList.add('in'));
  else{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target)}}),{threshold:.1,rootMargin:'0px 0px -24px 0px'});
    revealItems.forEach(item=>observer.observe(item));
  }

  $$('a[target="_blank"]').forEach(link=>{const rel=new Set((link.getAttribute('rel')||'').split(/\s+/).filter(Boolean));rel.add('noopener');rel.add('noreferrer');link.setAttribute('rel',[...rel].join(' '))});
  $$('img').forEach(image=>{
    if(!image.hasAttribute('decoding'))image.decoding='async';
    if(!image.closest('.hero-banner')&&!image.classList.contains('loader-icon')&&!image.hasAttribute('loading'))image.loading='lazy';
    image.addEventListener('error',()=>{
      const src=(image.getAttribute('src')||'').split('?')[0];
      const fixes={
        'assets/icon.svg':'assets/images/icon-transparent.png',
        'assets/founder.svg':'assets/images/founder.webp',
        'assets/signature.svg':'assets/images/signature-transparent.png'
      };
      if(image.dataset.retry!=='1'&&fixes[src]){
        image.dataset.retry='1';
        image.src=fixes[src];
        return;
      }
      image.classList.add('image-missing');image.setAttribute('aria-hidden','true');
      const parent=image.parentElement;
      if(parent&&!parent.querySelector('.image-fallback')){const fallback=document.createElement('span');fallback.className='image-fallback';fallback.textContent='Image temporarily unavailable';parent.appendChild(fallback)}
    },{once:true});
  });

  async function activeClient(){
    if(!window.FMB?.configured)return null;
    for(const mode of ['local','session']){
      const client=window.FMB.createClient(mode);
      const {data}=await client.auth.getSession();
      if(data.session)return client;
    }
    return null;
  }

  async function setupReadingSave(){
    const hero=$('.reading-page .reading-hero, .reader .reader-cover');
    if(!hero)return;
    const title=hero.querySelector('h1')?.textContent.trim()||document.title.split('|')[0].trim();
    const category=hero.querySelector('.eyebrow')?.textContent.trim()||'Reading';
    const itemKey=location.pathname.split('/').pop()||'reading.html';
    const wrapper=document.createElement('div');wrapper.className='actions';
    const button=document.createElement('button');button.type='button';button.className='pill secondary';button.textContent='Preparing save option…';button.disabled=true;
    wrapper.appendChild(button);hero.appendChild(wrapper);
    const ready=await ensureMemberServices();
    if(!ready||!window.FMB?.configured){button.disabled=false;button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='/auth.html#signin');return}
    const client=await activeClient();
    if(!client){button.disabled=false;button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='/auth.html#signin');return}
    const {data:{session}}=await client.auth.getSession();
    const user=session?.user;
    if(!user){button.disabled=false;button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='/auth.html#signin');return}
    const {data:saved}=await client.from('saved_content').select('id').eq('user_id',user.id).eq('item_key',itemKey).maybeSingle();
    button.disabled=false;
    if(saved){button.textContent='Saved';button.dataset.savedId=saved.id}else button.textContent='Save to profile';
    button.addEventListener('click',async()=>{
      button.disabled=true;
      if(button.dataset.savedId){
        const {error}=await client.from('saved_content').delete().eq('id',button.dataset.savedId);
        button.disabled=false;
        if(error){window.FMB.showToast('The saved item could not be removed.');return}
        delete button.dataset.savedId;button.textContent='Save to profile';window.FMB.showToast('Removed from saved content.');return;
      }
      const {data,error}=await client.from('saved_content').insert({user_id:user.id,item_key:itemKey,title,url:itemKey,category}).select('id').single();
      button.disabled=false;
      if(error){window.FMB.showToast('The reading could not be saved.');return}
      button.dataset.savedId=data.id;button.textContent='Saved';window.FMB.showToast('Saved to your profile.');
    });
  }
  // Saved-content controls stay hidden while the member space is under maintenance.

  async function loadCommunityFeed(){
    const feed=$('#communityFeed');if(!feed)return;
    const status=$('#communityFeedStatus');
    const editorial=[
      'Rest is not a reward. It is part of staying whole.',
      'Changing direction does not erase how far you have already come.',
      'There is courage in asking for help before everything becomes too heavy.'
    ];
    const showEditorial=()=>{feed.innerHTML=editorial.map(message=>`<article class="community-post editorial"><p>${message}</p><footer><strong>With love, FMB reflection</strong></footer></article>`).join('');if(status)status.textContent='Positive reflections from our space. Visitor submissions are still under maintenance.'};
    if(!window.FMB?.configured){showEditorial();return}
    const client=window.FMB.createClient('local');
    const {data,error}=await client.from('freedom_wall_posts').select('id,alias,content,published_at').eq('status','published').order('published_at',{ascending:false}).limit(9);
    if(error||!data?.length){showEditorial();return}
    feed.innerHTML=data.map(post=>`<article class="community-post"><p>${window.FMB.escapeHtml(post.content)}</p><footer><strong>${window.FMB.escapeHtml(post.alias)}</strong><time datetime="${window.FMB.escapeHtml(post.published_at||'')}">${post.published_at?new Date(post.published_at).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):''}</time></footer></article>`).join('');
    if(status)status.textContent='Only approved posts are shown publicly.';
  }
  loadCommunityFeed();

  const contact=$('#contactForm');
  if(contact){
    const button=contact.querySelector('button[type="submit"]'),status=$('#contactStatus');
    const setStatus=(message,type='')=>{if(!status)return;status.textContent=message;status.className=`inline-status${type?' '+type:''}`;status.hidden=false};
    contact.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=window.FMB?.cleanText($('#contactName')?.value,80)||'',email=String($('#contactEmail')?.value||'').trim().toLowerCase(),subject=window.FMB?.cleanText($('#contactSubject')?.value,120)||'',message=window.FMB?.cleanText($('#contactMessage')?.value,4000)||'';
      if(!name||!email||!subject||!message){setStatus('Please complete every required field.','error');return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setStatus('Please enter a valid email address.','error');return}
      if(!window.FMB?.configured){setStatus('The secure message service is not connected yet. Please email withlovefmb@gmail.com directly.','error');return}
      button.disabled=true;button.classList.add('is-loading');button.textContent='Sending…';
      const client=window.FMB.createClient('local');
      const {error}=await client.rpc('submit_contact_message',{p_name:name,p_email:email,p_subject:subject,p_message:message,p_kind:'contact'});
      button.disabled=false;button.classList.remove('is-loading');button.textContent='Send message';
      if(error){setStatus('Your message could not be sent right now. Please try again later.','error');return}
      contact.reset();setStatus('Your message was sent successfully.','success');
    });
  }

  function setupWorkCalendar(){
    const calendar=$('#calendarDays'),monthLabel=$('#calendarMonth'),form=$('#workWithFmbForm');
    if(!calendar||!monthLabel||!form)return;
    const today=new Date();today.setHours(0,0,0,0);
    const firstAllowedMonth=new Date(today.getFullYear(),today.getMonth(),1);
    const lastAllowedMonth=new Date(today.getFullYear(),today.getMonth()+2,1);
    let visibleMonth=new Date(firstAllowedMonth),selectedDate='';
    const prev=$('#calendarPrev'),next=$('#calendarNext'),dateInput=$('#workDate'),availabilityInput=$('#workAvailability'),selectedLabel=$('#selectedWorkDate');
    const section=$('#work-with-fmb'),calendarCard=$('#workCalendarCard'),serviceInput=$('#workService'),businessField=$('#workBusinessField'),businessInput=$('#workBusiness'),advertisePrefill=$('#advertisePrefill'),formNote=$('#workFormNote'),routeNote=$('#advertiseRouteNote');
    const standardFields=[...form.querySelectorAll('.work-standard-field')];
    const requestedCategory=new URLSearchParams(location.search).get('category');
    const tierRequest='Please send us the current advertising tier packages and available placement options across the With love, FMB website.';
    const formStartedAt=Date.now();
    const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const readable=value=>new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const sameMonth=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth();
    const dayDistance=date=>Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000);
    const availabilityFor=date=>{
      const distance=dayDistance(date),weekday=date.getDay();
      if(distance<0)return{key:'past',short:'Unavailable',long:'Unavailable'};
      if(distance<=2)return{key:'full',short:'Full',long:'Full, priority review'};
      if(distance<=21&&(weekday===0||weekday===1||weekday===3||weekday===5))return{key:'full',short:'Full',long:'Full, priority review'};
      if(distance<=21)return{key:'limited',short:'Limited',long:'Limited availability'};
      if(weekday===0)return{key:'full',short:'Full',long:'Full, priority review'};
      if(weekday===1||weekday===5)return{key:'limited',short:'Limited',long:'Limited availability'};
      return{key:'open',short:'Open',long:'Open availability'};
    };
    const selectedCopy=(value,availability)=>availability.key==='full'
      ?`Priority review: ${readable(value)}. This date is currently full, but FMB’s assistant will review the context.`
      :`Preferred date: ${readable(value)}. ${availability.long}.`;
    function render(){
      const year=visibleMonth.getFullYear(),month=visibleMonth.getMonth(),firstDay=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
      monthLabel.textContent=new Date(year,month,1,12).toLocaleDateString(undefined,{month:'long',year:'numeric'});
      calendar.innerHTML='';
      for(let i=0;i<firstDay;i++){const blank=document.createElement('span');blank.className='calendar-blank';calendar.appendChild(blank)}
      for(let day=1;day<=days;day++){
        const date=new Date(year,month,day),value=iso(date),button=document.createElement('button');
        const availability=availabilityFor(date);
        button.type='button';button.className=`calendar-day ${availability.key}`;button.dataset.date=value;
        button.innerHTML=`<span class="calendar-date-number">${day}</span>${date>=today?`<span class="calendar-status">${availability.short}</span>`:''}`;
        button.setAttribute('aria-label',`${readable(value)}. ${availability.long}${availability.key==='full'?'. Select to request priority review':''}`);
        if(date<today)button.disabled=true;
        if(value===iso(today))button.classList.add('today');
        if(value===selectedDate){button.classList.add('selected');button.setAttribute('aria-pressed','true')}else button.setAttribute('aria-pressed','false');
        button.addEventListener('click',()=>{selectedDate=value;dateInput.value=value;availabilityInput.value=availability.long;selectedLabel.textContent=selectedCopy(value,availability);selectedLabel.dataset.availability=availability.key;render()});
        calendar.appendChild(button);
      }
      prev.disabled=sameMonth(visibleMonth,firstAllowedMonth);
      next.disabled=sameMonth(visibleMonth,lastAllowedMonth);
    }
    prev.addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1);render()});
    next.addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);render()});
    render();

    const button=form.querySelector('button[type="submit"]'),status=$('#workFormStatus');
    const setStatus=(message,type='')=>{status.textContent=message;status.className=`inline-status${type?' '+type:''}`;status.hidden=false};
    const isValidEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isAdvertising=()=>serviceInput?.value==='Advertise with us';
    const updateAdvertisingButton=()=>{
      if(!isAdvertising()){button.disabled=false;return}
      const name=String($('#workName')?.value||'').trim();
      const business=String(businessInput?.value||'').trim();
      const email=String($('#workEmail')?.value||'').trim().toLowerCase();
      button.disabled=!(name&&business&&isValidEmail(email));
    };
    const syncInquiryMode=()=>{
      const advertising=isAdvertising();
      section?.classList.toggle('advertising-inquiry-mode',advertising);
      if(calendarCard)calendarCard.hidden=advertising;
      standardFields.forEach(field=>field.hidden=advertising);
      if(businessField)businessField.hidden=!advertising;
      if(advertisePrefill)advertisePrefill.hidden=!advertising;
      if(routeNote)routeNote.hidden=!advertising;
      if(businessInput)businessInput.required=advertising;
      if(advertising){
        selectedDate='';dateInput.value='';availabilityInput.value='';
        button.textContent='Request advertising tiers';
        if(formNote)formNote.textContent='Only your name, business name, and email are required. A detailed copy of this inquiry will be emailed to you automatically.';
      }else{
        button.textContent='Send work inquiry';
        if(formNote)formNote.textContent='Every request is reviewed with care. Please share enough context for FMB’s assistant to understand the timing and priority. This request does not confirm a meeting, price, or service agreement.';
      }
      updateAdvertisingButton();
    };
    serviceInput?.addEventListener('change',syncInquiryMode);
    form.addEventListener('input',updateAdvertisingButton);
    if(requestedCategory==='advertise-with-us'&&serviceInput){serviceInput.value='Advertise with us'}
    syncInquiryMode();
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=String($('#workName')?.value||'').trim().slice(0,80),email=String($('#workEmail')?.value||'').trim().toLowerCase(),business=String(businessInput?.value||'').trim().slice(0,120),phone=String($('#workPhone')?.value||'').trim().slice(0,80),service=String(serviceInput?.value||'').trim().slice(0,120),brief=String($('#workBrief')?.value||'').trim().slice(0,3000),advertising=isAdvertising();
      if(advertising&&!name){setStatus('Please enter your name.','error');return}
      if(advertising&&!business){setStatus('Please enter your business name.','error');return}
      if(advertising&&!email){setStatus('Please enter your email address.','error');return}
      if(!advertising&&(!name||!email||!service||!brief||!selectedDate)){setStatus('Please complete the form and choose a preferred date.','error');return}
      if(!isValidEmail(email)){setStatus('Please enter a valid email address.','error');return}
      const ready=await ensureMemberServices();
      if(!ready||!window.FMB?.configured){setStatus('The secure inquiry service is temporarily unavailable. Please email withlovefmb@gmail.com.','error');return}
      button.disabled=true;button.textContent=advertising?'Sending request…':'Sending inquiry…';
      const client=window.FMB.createClient('local');
      if(advertising){
        const {data,error}=await client.functions.invoke('advertising-inquiry',{body:{name,businessName:business,email,category:'advertise-with-us',request:tierRequest,website:String($('#workWebsite')?.value||''),formStartedAt}});
        button.textContent='Request advertising tiers';
        if(error||!data?.ok){updateAdvertisingButton();setStatus('The advertising inquiry could not be sent right now. Please try again or email withlovefmb@gmail.com.','error');return}
        form.reset();
        if(serviceInput)serviceInput.value='Advertise with us';
        syncInquiryMode();
        setStatus('Your advertising inquiry was sent. Please check your email for the detailed automated acknowledgment.','success');
        return;
      }
      const availability=availabilityFor(new Date(`${selectedDate}T12:00:00`));
      const message=[`Service: ${service}`,`Preferred date: ${readable(selectedDate)}`,`Calendar status: ${availability.long}`,phone?`Phone or Messenger: ${phone}`:'',`Project brief:\n${brief}`].filter(Boolean).join('\n\n');
      const {error}=await client.rpc('submit_contact_message',{p_name:name,p_email:email,p_subject:`Work with FMB: ${service}`.slice(0,120),p_message:message,p_kind:'contact'});
      button.disabled=false;button.textContent='Send work inquiry';
      if(error){setStatus('The inquiry could not be sent right now. Please try again or email withlovefmb@gmail.com.','error');return}
      form.reset();selectedDate='';selectedLabel.textContent='Choose a preferred date from the calendar.';delete selectedLabel.dataset.availability;render();setStatus('Your request was sent. FMB’s assistant will review the date and context, then reply by email.','success');
    });
  }
  setupWorkCalendar();

  if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js',{updateViaCache:'none'}).catch(()=>{}),{once:true});
})();
