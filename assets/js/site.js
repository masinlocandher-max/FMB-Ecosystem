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
    const page=location.pathname.split('/').pop()||'index.html';
    const protectedPages=new Set(['member.html','admin.html','admin-login.html','admin-activate.html','auth.html','reset-password.html']);
    if(protectedPages.has(page))return;
    const onHome=page==='index.html';
    const href=section=>onHome?`#${section}`:`index.html#${section}`;
    const items=[
      {label:'Home',description:'Start here and see what you receive',href:onHome?'#top':'index.html#top',current:onHome&&!location.hash},
      {label:'Explore',description:'Read, reflect, and find useful resources',href:href('safe-space'),current:['reading.html','womens-health.html','men-can-cry.html','coming-out-respect.html','skin-care-makeup.html'].includes(page)},
      {label:'Community',description:'Join a moderated, kinder space',href:href('community'),current:page==='community.html'},
      {label:'Our projects',description:'Discover SENZ and Cognita',href:href('work'),current:false},
      {label:'About',description:'Meet FMB and explore our work',href:'about.html',current:page==='about.html'},
      {label:'Get help',description:'Open public crisis and support contacts',href:href('support'),current:false,help:true}
    ];
    links.innerHTML=`<div class="nav-menu-intro"><strong>Where would you like to go?</strong><span>Choose what you need. You can always return home.</span></div>${items.map(item=>`<a class="nav-menu-link${item.help?' nav-help-link':''}" href="${item.href}"${item.current?' aria-current="page"':''}><span class="nav-link-label">${item.label}</span><small>${item.description}</small></a>`).join('')}<div class="nav-mobile-actions"><a class="pill secondary" href="auth.html#signin">Sign in</a><a class="pill" href="auth.html#signup">Join free</a></div>`;
    const signIn=actions.querySelector('a[href*="auth.html#signin"]');
    const join=actions.querySelector('a[href*="auth.html#signup"]');
    const menuToggle=actions.querySelector('#navToggle');
    if(signIn)signIn.textContent='Sign in';
    if(join)join.textContent='Join free';
    if(menuToggle)menuToggle.setAttribute('aria-controls','navLinks');
    const mobileBar=$('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');
    if(mobileBar){
      mobileBar.innerHTML=`<a class="active" href="${onHome?'#top':'index.html#top'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 11 8-7 8 7v9H4Z"/><path d="M9 20v-6h6v6"/></svg><span>Home</span></a><a href="${href('safe-space')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z"/><path d="M7 4v14a2 2 0 0 0 2 2"/></svg><span>Explore</span></a><a href="auth.html#signup"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/><path d="M19 5v5M16.5 7.5h5"/></svg><span>Join</span></a><a href="${href('support')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11Z"/></svg><span>Help</span></a>`;
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

  const topPromo=$('.support-glass');
  if(topPromo){
    topPromo.setAttribute('aria-label','With Love, FMB partner brands');
    const items=`<span class="brand-marquee-label">With Love, FMB is brought to you by:</span><a class="support-chip light brand-chip brand-chip-logo" href="https://www.senzpr.com" target="_blank" rel="noopener noreferrer" aria-label="Visit SENZ Strategic Communications"><img src="assets/images/projects/senz-transparent.png" alt="SENZ"><span class="sr-only">SENZ Strategic Communications</span></a><a class="support-chip light brand-chip brand-chip-logo cognita-chip" href="https://thecognitainstitute.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Cognita Institute of AI"><img src="assets/images/projects/cognita-transparent.png?v=20260714-approved" alt="Cognita Institute of AI"><span class="sr-only">Cognita Institute of AI</span></a>`;
    topPromo.innerHTML=`<div class="promo-marquee"><div class="promo-group">${items}</div><div class="promo-group" aria-hidden="true">${items}</div></div>`;
  }

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
      help.textContent='Install our member space for faster access from your home screen.';
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
    if(!ready||!window.FMB?.configured){button.disabled=false;button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='auth.html#signin');return}
    const client=await activeClient();
    if(!client){button.disabled=false;button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='auth.html#signin');return}
    const {data:{session}}=await client.auth.getSession();
    const user=session?.user;
    if(!user){button.disabled=false;button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='auth.html#signin');return}
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
  setupReadingSave();

  async function loadCommunityFeed(){
    const feed=$('#communityFeed');if(!feed)return;
    const status=$('#communityFeedStatus');
    if(!window.FMB?.configured){feed.innerHTML='<div class="empty">The public community feed will open after the secure member service is connected.</div>';if(status)status.textContent='No private information is shown while the service is offline.';return}
    const client=window.FMB.createClient('local');
    const {data,error}=await client.from('freedom_wall_posts').select('id,alias,content,published_at').eq('status','published').order('published_at',{ascending:false}).limit(9);
    if(error){feed.innerHTML='<div class="empty">The community feed could not be loaded right now.</div>';if(status)status.textContent='Please try again later.';return}
    if(!data?.length){feed.innerHTML='<div class="empty">No approved community posts have been published yet.</div>';if(status)status.textContent='Posts appear only after review.';return}
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
