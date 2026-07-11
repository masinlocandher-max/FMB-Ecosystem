(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);

  function ensureStylesheet(href){
    if(document.querySelector(`link[href="${href}"]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
  ensureStylesheet('assets/css/icon-fix.css');
  ensureStylesheet('assets/css/repair.css');

  if(!document.querySelector('.skip-link')){
    const skip=document.createElement('a');skip.className='skip-link';skip.href='#main-content';skip.textContent='Skip to main content';document.body.prepend(skip);
    const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
  }

  const loader=$('#loader');
  if(loader){const hide=()=>loader.classList.add('hide');window.addEventListener('load',()=>setTimeout(hide,350),{once:true});setTimeout(hide,2200)}

  const toggle=$('#navToggle'),links=$('#navLinks');
  if(toggle&&links){
    const close=()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false')};
    toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});
    links.addEventListener('click',event=>{if(event.target.closest('a'))close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
    document.addEventListener('click',event=>{if(!event.target.closest('.nav-glass'))close()});
  }

  const topPromo=$('.support-glass');
  if(topPromo){
    topPromo.setAttribute('aria-label','Work with FMB and website support links');
    const items=`<strong>Work with FMB</strong><a class="support-chip light" href="mailto:withlovefmb@gmail.com?subject=Website%20Project%20with%20FMB">Start a website project</a><a class="support-chip" href="https://senzpr.com" target="_blank" rel="noopener noreferrer">Branding and digital needs</a><a class="support-chip" href="index.html#support">Need urgent help? Open support contacts</a>`;
    topPromo.innerHTML=`<div class="promo-marquee"><div class="promo-group">${items}</div><div class="promo-group" aria-hidden="true">${items}</div></div>`;
  }

  const landingHero=$('.hero');
  if(landingHero){
    const image=landingHero.querySelector('.hero-banner img');
    if(image){image.src='assets/hero-banner.svg';image.alt='With love, FMB official banner featuring Francine Marie Bautista and the purple and gold brand emblem';image.removeAttribute('width');image.removeAttribute('height');image.setAttribute('fetchpriority','high')}
  }

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
    const hero=$('.reading-page .reading-hero');
    if(!hero)return;
    const title=hero.querySelector('h1')?.textContent.trim()||document.title.split('|')[0].trim();
    const category=hero.querySelector('.eyebrow')?.textContent.trim()||'Reading';
    const itemKey=location.pathname.split('/').pop()||'reading';
    const wrapper=document.createElement('div');wrapper.className='actions';
    const button=document.createElement('button');button.type='button';button.className='pill secondary';button.textContent='Save to profile';
    wrapper.appendChild(button);hero.appendChild(wrapper);
    if(!window.FMB?.configured){button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='auth.html#signin');return}
    const client=await activeClient();
    if(!client){button.textContent='Sign in to save';button.addEventListener('click',()=>location.href='auth.html#signin');return}
    const {data:{session}}=await client.auth.getSession();
    const user=session?.user;
    if(!user)return;
    const {data:saved}=await client.from('saved_content').select('id').eq('user_id',user.id).eq('item_key',itemKey).maybeSingle();
    if(saved){button.textContent='Saved';button.dataset.savedId=saved.id}
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
})();
