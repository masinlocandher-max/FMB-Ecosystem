(()=>{
  'use strict';
  const body=document.body;
  const root=document.documentElement;
  const menu=document.querySelector('[data-news-menu]');
  const nav=document.getElementById('newsNav');
  const header=document.querySelector('.nc-site-header');
  const dock=document.querySelector('.nc-mobile-dock');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(!document.querySelector('link[href*="fmb-news-luxury.css"]')){
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href='/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3';
    document.head.appendChild(stylesheet);
  }

  const supportStyle=document.createElement('style');
  supportStyle.textContent=`
    body.news-channel-route .nc-channel-lockup>h1{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important;display:block!important}
    body.news-channel-route .nc-context-feature{padding:clamp(88px,9vw,136px) 0;background:#f5f1e9;color:#171218}
    body.news-channel-route .nc-context-feature-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(370px,.92fr);gap:clamp(44px,8vw,110px);align-items:center}
    body.news-channel-route .nc-text-visual{position:relative;min-height:480px;margin:0;overflow:hidden;border-radius:30px;background:radial-gradient(circle at 20% 18%,rgba(197,164,93,.18),transparent 24rem),linear-gradient(145deg,#171218,#3d1724);box-shadow:0 28px 76px rgba(23,18,24,.18);color:#fff}
    body.news-channel-route .nc-text-visual>div{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(32px,5vw,64px)}
    body.news-channel-route .nc-text-visual span{color:#e1c783;font-size:9px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}
    body.news-channel-route .nc-text-visual strong{max-width:650px;margin-top:20px;font-family:var(--fmb-font-display);font-size:clamp(42px,5vw,66px);font-weight:500;line-height:.92;letter-spacing:-.035em}
    body.news-channel-route .nc-text-credit{position:absolute;left:clamp(32px,5vw,64px);right:32px;bottom:18px;margin:0;color:rgba(255,255,255,.42);font-size:7px;line-height:1.45}
    body.news-channel-route .nc-context-copy .nc-kicker{color:#7d243b}
    body.news-channel-route .nc-context-copy h2{margin:14px 0 0;font-family:var(--fmb-font-display);font-size:clamp(48px,5.3vw,70px);font-weight:500;line-height:.94;letter-spacing:-.04em}
    body.news-channel-route .nc-context-copy>p:not(.nc-kicker){margin:24px 0 0;color:#675d62;font-size:14px;line-height:1.8}
    body.news-channel-route .nc-context-copy a{display:inline-flex;margin-top:28px;color:#7d243b;font-size:9px;font-weight:850;letter-spacing:.08em;text-decoration:none;text-transform:uppercase}
    body.news-channel-route .news-visual.media-unavailable{background:linear-gradient(145deg,#ddd4cb,#c8beb5)}
    body.news-channel-route .news-visual.media-unavailable img{visibility:hidden}
    @media(max-width:820px){body.news-channel-route .nc-context-feature-grid{grid-template-columns:1fr}body.news-channel-route .nc-text-visual{min-height:420px}}
    @media(max-width:430px){body.news-channel-route .nc-text-visual{min-height:390px;border-radius:24px}body.news-channel-route .nc-text-visual>div{padding:28px 24px 55px}body.news-channel-route .nc-text-credit{left:24px;right:24px}}
  `;
  document.head.appendChild(supportStyle);

  body.classList.toggle('js-news-motion',!reduced);

  const progress=document.createElement('div');
  progress.className='nc-luxury-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML='<span></span>';
  Object.assign(progress.style,{position:'fixed',inset:'0 0 auto',height:'3px',zIndex:'999',pointerEvents:'none'});
  Object.assign(progress.firstElementChild.style,{display:'block',width:'0',height:'100%',background:'linear-gradient(90deg,#7d243b,#c5a45d,#f5e4ba)',boxShadow:'0 0 14px rgba(197,164,93,.45)'});
  document.body.appendChild(progress);

  const updateClock=()=>{
    const value=new Intl.DateTimeFormat('en-PH',{
      timeZone:'Asia/Manila',
      hour:'2-digit',
      minute:'2-digit',
      hour12:true
    }).format(new Date());
    document.querySelectorAll('[data-news-clock]').forEach(clock=>clock.textContent=`${value} Philippine Standard Time`);
  };
  updateClock();
  setInterval(updateClock,30000);

  const closeMenu=()=>{
    if(!menu||!nav)return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open news menu');
  };
  if(menu&&nav){
    menu.addEventListener('click',()=>{
      const open=!nav.classList.contains('open');
      nav.classList.toggle('open',open);
      menu.setAttribute('aria-expanded',String(open));
      menu.setAttribute('aria-label',open?'Close news menu':'Open news menu');
    });
    nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
    document.addEventListener('click',event=>{
      if(nav.classList.contains('open')&&!event.target.closest('#newsNav,[data-news-menu]'))closeMenu();
    });
    addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
  }

  const reveals=[...document.querySelectorAll('.nc-reveal')];
  if(reduced||!('IntersectionObserver' in window)){
    reveals.forEach(item=>item.classList.add('in-view'));
  }else{
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:'0px 0px -8% 0px'});
    reveals.forEach(item=>revealObserver.observe(item));
  }

  const sections=[...document.querySelectorAll('#top-story,#rundown,#philippines,#world,#culture,#good-news,#editorial-standard')];
  const railLinks=[...document.querySelectorAll('.nc-topic-rail a[href^="#"]')];
  if(sections.length&&railLinks.length&&'IntersectionObserver' in window){
    const sectionObserver=new IntersectionObserver(entries=>{
      const active=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!active)return;
      railLinks.forEach(link=>link.setAttribute('aria-current',String(link.getAttribute('href')===`#${active.target.id}`)));
    },{rootMargin:'-25% 0px -66% 0px',threshold:[0,.08,.3]});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  let ticking=false;
  const updateScroll=()=>{
    ticking=false;
    const y=scrollY;
    const max=Math.max(1,root.scrollHeight-innerHeight);
    progress.firstElementChild.style.width=`${Math.min(100,y/max*100)}%`;
    header?.classList.toggle('is-condensed',y>70);
    dock?.classList.toggle('visible',y>420);
    document.querySelectorAll('.news-visual img').forEach(image=>image.style.removeProperty('transform'));
  };
  const requestUpdate=()=>{if(ticking)return;ticking=true;requestAnimationFrame(updateScroll)};
  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',()=>{closeMenu();requestUpdate()},{passive:true});
  requestUpdate();

  document.querySelectorAll('.news-visual img').forEach(image=>{
    image.decoding='async';
    image.style.removeProperty('transform');
    image.addEventListener('error',()=>image.closest('.news-visual')?.classList.add('media-unavailable'),{once:true});
  });

  const share=async button=>{
    const title=button.dataset.shareTitle||document.title;
    const url=button.dataset.shareUrl||location.href;
    const text=button.dataset.shareText||document.querySelector('meta[name="description"]')?.content||title;
    try{
      if(navigator.share){await navigator.share({title,text,url});return}
      await navigator.clipboard.writeText(url);
      const original=button.textContent;
      button.textContent='Link copied';
      setTimeout(()=>{button.textContent=original},1600);
    }catch(error){
      if(error?.name!=='AbortError')location.href=`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
    }
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-news-share]');
    if(!button)return;
    event.preventDefault();
    share(button);
  });
})();
