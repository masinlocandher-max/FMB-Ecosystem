(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);

  function ensureStylesheet(href){
    if(document.querySelector(`link[href="${href}"]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }
  ensureStylesheet('assets/css/icon-fix.css');
  ensureStylesheet('assets/css/repair.css');

  if(!document.querySelector('.skip-link')){
    const skip=document.createElement('a');
    skip.className='skip-link';
    skip.href='#main-content';
    skip.textContent='Skip to main content';
    document.body.prepend(skip);
    const main=document.querySelector('main');
    if(main&&!main.id)main.id='main-content';
  }

  const loader=$('#loader');
  if(loader){
    const hideLoader=()=>loader.classList.add('hide');
    window.addEventListener('load',()=>setTimeout(hideLoader,350),{once:true});
    setTimeout(hideLoader,2200);
  }

  const toggle=$('#navToggle');
  const links=$('#navLinks');
  if(toggle&&links){
    const closeMenu=()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false')};
    toggle.addEventListener('click',()=>{
      const open=links.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
    });
    links.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
    document.addEventListener('click',event=>{if(!event.target.closest('.nav-glass'))closeMenu()});
  }

  const topPromo=$('.support-glass');
  if(topPromo){
    topPromo.setAttribute('aria-label','Work with FMB and website support links');
    const group=`
      <div class="promo-group">
        <strong>Work with FMB</strong>
        <a class="support-chip light" href="mailto:withlovefmb@gmail.com?subject=Website%20Project%20with%20FMB">Start a website project</a>
        <a class="support-chip" href="https://senzpr.com" target="_blank" rel="noopener noreferrer">Branding and digital needs</a>
        <a class="support-chip" href="index.html#support">Need urgent help? Open support contacts</a>
      </div>`;
    topPromo.innerHTML=`<div class="promo-marquee">${group}<div class="promo-group" aria-hidden="true">${group.replace('<div class="promo-group">','').replace(/<\/div>$/,'')}</div></div>`;
  }

  const landingHero=$('.hero');
  if(landingHero){
    const bannerImage=landingHero.querySelector('.hero-banner img');
    if(bannerImage){
      bannerImage.src='assets/hero-banner.svg';
      bannerImage.alt='With love, FMB official banner featuring Francine Marie Bautista and the purple and gold brand emblem';
      bannerImage.removeAttribute('width');
      bannerImage.removeAttribute('height');
      bannerImage.setAttribute('fetchpriority','high');
    }
  }

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems=$$('.reveal');
  if(reduced||!('IntersectionObserver' in window)){
    revealItems.forEach(item=>item.classList.add('in'));
  }else{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target)}
    }),{threshold:.1,rootMargin:'0px 0px -24px 0px'});
    revealItems.forEach(item=>observer.observe(item));
  }

  $$('a[target="_blank"]').forEach(link=>{
    const rel=new Set((link.getAttribute('rel')||'').split(/\s+/).filter(Boolean));
    rel.add('noopener');rel.add('noreferrer');
    link.setAttribute('rel',[...rel].join(' '));
  });

  $$('img').forEach(image=>{
    if(!image.hasAttribute('decoding'))image.decoding='async';
    if(image.closest('.hero-banner')||image.classList.contains('loader-icon'))return;
    if(!image.hasAttribute('loading'))image.loading='lazy';
    image.addEventListener('error',()=>{
      image.classList.add('image-missing');
      image.setAttribute('aria-hidden','true');
      const parent=image.parentElement;
      if(parent&&!parent.querySelector('.image-fallback')){
        const fallback=document.createElement('span');
        fallback.className='image-fallback';
        fallback.textContent='Image temporarily unavailable';
        parent.appendChild(fallback);
      }
    },{once:true});
  });

  async function loadCommunityFeed(){
    const feed=$('#communityFeed');
    if(!feed)return;
    const status=$('#communityFeedStatus');
    if(!window.FMB?.configured){
      feed.innerHTML='<div class="empty">The public community feed will open after the secure member service is connected.</div>';
      if(status)status.textContent='No private information is shown while the service is offline.';
      return;
    }
    const client=window.FMB.createClient('local');
    const {data,error}=await client.from('freedom_wall_posts')
      .select('id,alias,content,published_at')
      .eq('status','published')
      .order('published_at',{ascending:false})
      .limit(9);
    if(error){
      feed.innerHTML='<div class="empty">The community feed could not be loaded right now.</div>';
      if(status)status.textContent='Please try again later.';
      return;
    }
    if(!data?.length){
      feed.innerHTML='<div class="empty">No approved community posts have been published yet.</div>';
      if(status)status.textContent='Posts appear only after review.';
      return;
    }
    feed.innerHTML=data.map(post=>`<article class="community-post"><p>${window.FMB.escapeHtml(post.content)}</p><footer><strong>${window.FMB.escapeHtml(post.alias)}</strong><time datetime="${window.FMB.escapeHtml(post.published_at||'')}">${post.published_at?new Date(post.published_at).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):''}</time></footer></article>`).join('');
    if(status)status.textContent='Only approved posts are shown publicly.';
  }
  loadCommunityFeed();

  const contact=$('#contactForm');
  if(contact){
    const button=contact.querySelector('button[type="submit"]');
    const status=$('#contactStatus');
    const setStatus=(message,type='')=>{
      if(!status)return;
      status.textContent=message;
      status.className=`inline-status${type?' '+type:''}`;
      status.hidden=false;
    };
    contact.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=window.FMB?.cleanText($('#contactName')?.value,80)||'';
      const email=String($('#contactEmail')?.value||'').trim().toLowerCase();
      const subject=window.FMB?.cleanText($('#contactSubject')?.value,120)||'';
      const message=window.FMB?.cleanText($('#contactMessage')?.value,4000)||'';
      if(!name||!email||!subject||!message){setStatus('Please complete every required field.','error');return}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setStatus('Please enter a valid email address.','error');return}
      if(!window.FMB?.configured){
        setStatus('The secure message service is not connected yet. Please email withlovefmb@gmail.com directly.','error');
        return;
      }
      button.disabled=true;button.classList.add('is-loading');button.textContent='Sending…';
      const client=window.FMB.createClient('local');
      const {error}=await client.rpc('submit_contact_message',{p_name:name,p_email:email,p_subject:subject,p_message:message,p_kind:'contact'});
      button.disabled=false;button.classList.remove('is-loading');button.textContent='Send message';
      if(error){setStatus('Your message could not be sent right now. Please try again later.','error');return}
      contact.reset();
      setStatus('Your message was sent successfully.','success');
    });
  }
})();
