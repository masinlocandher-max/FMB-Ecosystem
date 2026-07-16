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
    links.innerHTML=`<div class="nav-menu-intro"><strong>Where would you like to go?</strong><span>Reading, music, the Freedom Wall, and important help numbers are public. Personal tools stay inside the signed-in profile.</span></div>${items.map(item=>`<a class="nav-menu-link${item.help?' nav-help-link':''}" href="${item.href}"${item.current?' aria-current="page"':''}><span class="nav-link-label">${item.label}</span><small>${item.description}</small></a>`).join('')}<div class="nav-mobile-actions"><a class="pill secondary" href="/auth.html#signin">Sign in</a><a class="pill" href="/ebooks/">Start exploring</a></div>`;
    actions.innerHTML='<a class="nav-btn" href="/auth.html#signin">Sign in</a><button class="nav-toggle" id="navToggle" type="button" aria-expanded="false" aria-label="Open menu" aria-controls="navLinks"><span></span><span></span></button>';
    const menuToggle=actions.querySelector('#navToggle');
    if(menuToggle)menuToggle.setAttribute('aria-controls','navLinks');
    const mobileBar=$('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');
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
    document.addEventListener('click',event=>{if(!event.target.closest('.nav-glass'))close()});
  }

  let topPromo=$('.support-glass');
  const topShell=$('.top-shell');
  if(!topPromo&&topShell){topPromo=document.createElement('div');topPromo.className='support-glass';topShell.prepend(topPromo)}
  if(topPromo){
    topPromo.setAttribute('aria-label','Website maintenance notice and With Love, FMB partner brands');
    const logos=`<a class="partner-logo" href="https://www.senzpr.com" target="_blank" rel="noopener noreferrer" aria-label="Visit SENZ"><img src="assets/images/projects/senz-logo.png?v=20260716-full" alt="SENZ"></a><a class="partner-logo cognita" href="https://thecognitainstitute.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Cognita Institute of AI"><img src="assets/images/projects/cognita-logo.png?v=20260716-full" alt="Cognita Institute of AI"></a>`;
    topPromo.innerHTML=`<div class="care-banner"><div class="care-message"><span>Open access</span><strong>Reading, all 12 music tracks, news, the Freedom Wall, and verified help contacts are open.</strong></div><div class="partner-rail"><span class="partner-label">Brought to you by</span><div class="partner-window"><div class="partner-track">${logos}</div></div></div></div>`;
  }

  function setupFooterBrand(){
    $$('.footer').forEach(footer=>{
      const existing=footer.querySelector('.footer-brand-lockup');
      const logo=footer.querySelector('.footer-logo');
      if(!logo)return;
      logo.src='/assets/images/signature-transparent.png?v=20260716-footer-signature';
      logo.alt='With love, FMB';
      existing?.querySelector('.footer-icon')?.remove();
      if(existing)return;
      const lockup=document.createElement('div');lockup.className='footer-brand-lockup';
      logo.parentElement.insertBefore(lockup,logo);lockup.append(logo);
    });
  }
  setupFooterBrand();

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
    let kind='';
    let anchor=null;
    if(path.startsWith('/news/')){kind='news';anchor=$('.news-masthead')}
    else if(path.startsWith('/ebooks/')){kind='ebook';anchor=$('.route-hero')}
    else if(path.startsWith('/music/')||page==='music.html'){kind='music';anchor=$('.music-intro, .music-hero')}
    else if(readingPages.has(page)){kind='reading';anchor=$('.reading-hero, .reader-cover')}
    if(!kind||!anchor||document.querySelector('.content-action-panel'))return;

    const heading=anchor.querySelector('h1')||$('main h1');
    const title=heading?.textContent.trim()||document.title.split('|')[0].trim();
    const canonical=document.querySelector('link[rel="canonical"]')?.href||`${location.origin}${location.pathname}`;
    const isPublicNews=kind==='news';
    const panel=document.createElement('section');
    panel.className=`content-action-panel content-action-${kind}`;
    panel.dataset.futureAccess=isPublicNews?'public':'member';
    panel.setAttribute('aria-label','Save or share this content');
    panel.innerHTML=`<div class="content-action-copy"><span class="content-action-kicker">Save or share</span><strong>Keep this page or send it to someone.</strong><p>${isPublicNews?'FMB News is public and will remain open without an account.':'This content is temporarily open to everyone while member services are under maintenance. Shared links may require an account after member access launches.'}</p></div><div class="content-action-tools"><button class="content-action-button content-save-button" type="button" aria-pressed="false"><span>Save</span><small>On this device</small></button><a class="content-action-button" data-share="facebook" target="_blank" rel="noopener noreferrer"><span>Facebook</span><small>Share post</small></a><a class="content-action-button" data-share="twitter" target="_blank" rel="noopener noreferrer"><span>X / Twitter</span><small>Share post</small></a><button class="content-action-button" data-share="messenger" type="button"><span>Messenger</span><small>Open share menu</small></button><a class="content-action-button" data-share="text"><span>Text</span><small>Send by SMS</small></a><button class="content-action-button" data-share="copy" type="button"><span>Copy link</span><small>Paste anywhere</small></button></div><p class="content-action-status" role="status" aria-live="polite"></p>`;
    anchor.insertAdjacentElement('afterend',panel);

    const shareText=`${title} | With love, FMB`;
    const facebook=panel.querySelector('[data-share="facebook"]');
    const twitter=panel.querySelector('[data-share="twitter"]');
    const textLink=panel.querySelector('[data-share="text"]');
    facebook.href=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`;
    twitter.href=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(canonical)}`;
    textLink.href=`sms:?body=${encodeURIComponent(`${shareText} ${canonical}`)}`;

    const status=panel.querySelector('.content-action-status');
    const say=message=>{status.textContent=message;window.clearTimeout(status._timer);status._timer=window.setTimeout(()=>{status.textContent=''},6000)};
    const legacyCopy=()=>{
      try{const input=document.createElement('textarea');input.value=canonical;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const copied=document.execCommand('copy');input.remove();return copied}catch{return false}
    };
    const copyLink=async()=>{
      if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(canonical);return true}catch{return legacyCopy()}}
      return legacyCopy();
    };

    panel.querySelector('[data-share="copy"]').addEventListener('click',async()=>say(await copyLink()?'Link copied. You can paste it anywhere.':'Copy was blocked by this browser. Select the address from the browser bar instead.'));
    panel.querySelector('[data-share="messenger"]').addEventListener('click',async()=>{
      if(navigator.share){
        try{await navigator.share({title, text:shareText, url:canonical});say('Share menu opened. Choose Messenger or another app.')}catch(error){if(error?.name!=='AbortError')say('The share menu could not open. Try Copy link instead.')}
        return;
      }
      say(await copyLink()?'Link copied. Open Messenger and paste it into your conversation.':'Use Copy link, then paste the address into Messenger.');
    });

    const storageKey='fmb_saved_content_v1';
    const saveButton=panel.querySelector('.content-save-button');
    const saveLabel=saveButton.querySelector('span');
    const readSaved=()=>{try{const data=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(data)?data:[]}catch{return[]}};
    const renderSaved=()=>{const saved=readSaved().some(item=>item.url===canonical);saveButton.setAttribute('aria-pressed',String(saved));saveButton.classList.toggle('is-saved',saved);saveLabel.textContent=saved?'Saved':'Save';return saved};
    renderSaved();
    saveButton.addEventListener('click',()=>{
      try{
        const items=readSaved();
        const index=items.findIndex(item=>item.url===canonical);
        if(index>=0){items.splice(index,1);localStorage.setItem(storageKey,JSON.stringify(items));renderSaved();say('Removed from saved pages on this device.');return}
        items.unshift({url:canonical,title,kind,savedAt:new Date().toISOString()});
        localStorage.setItem(storageKey,JSON.stringify(items.slice(0,100)));
        renderSaved();say('Saved on this device. Account syncing will return when member services are ready.');
      }catch{say('This browser did not allow a device save. You can still copy the link.')}
    });
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
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=String($('#workName')?.value||'').trim().slice(0,80),email=String($('#workEmail')?.value||'').trim().toLowerCase(),phone=String($('#workPhone')?.value||'').trim().slice(0,80),service=String($('#workService')?.value||'').trim().slice(0,120),brief=String($('#workBrief')?.value||'').trim().slice(0,3000);
      if(!name||!email||!service||!brief||!selectedDate){setStatus('Please complete the form and choose a preferred date.','error');return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setStatus('Please enter a valid email address.','error');return}
      const ready=await ensureMemberServices();
      if(!ready||!window.FMB?.configured){setStatus('The secure inquiry service is temporarily unavailable. Please email withlovefmb@gmail.com.','error');return}
      button.disabled=true;button.textContent='Sending inquiry…';
      const client=window.FMB.createClient('local');
      const availability=availabilityFor(new Date(`${selectedDate}T12:00:00`));
      const message=[`Service: ${service}`,`Preferred date: ${readable(selectedDate)}`,`Calendar status: ${availability.long}`,phone?`Phone or Messenger: ${phone}`:'',`Project brief:\n${brief}`].filter(Boolean).join('\n\n');
      const {error}=await client.rpc('submit_contact_message',{p_name:name,p_email:email,p_subject:`Work with FMB: ${service}`.slice(0,120),p_message:message,p_kind:'contact'});
      button.disabled=false;button.textContent='Send work inquiry';
      if(error){setStatus('The inquiry could not be sent right now. Please try again or email withlovefmb@gmail.com.','error');return}
      form.reset();selectedDate='';selectedLabel.textContent='Choose a preferred date from the calendar.';delete selectedLabel.dataset.availability;render();setStatus('Your request was sent. FMB’s assistant will review the date and context, then reply by email.','success');
    });
  }
  setupWorkCalendar();

  if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js',{updateViaCache:'none'}).catch(()=>{}),{once:true});
})();
