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
    stylesheet.href='/assets/css/fmb-news-luxury.css?v=20260722-luxury-v1';
    document.head.appendChild(stylesheet);
  }

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
    if(!reduced&&innerWidth>900){
      const lead=document.querySelector('.nc-lead-broadcast .news-visual img');
      if(lead){
        const rect=lead.getBoundingClientRect();
        const offset=Math.max(-16,Math.min(22,(innerHeight*.45-rect.top)*.018));
        lead.style.transform=`translate3d(0,${offset}px,0) scale(1.045)`;
      }
    }
  };
  const requestUpdate=()=>{if(ticking)return;ticking=true;requestAnimationFrame(updateScroll)};
  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',()=>{closeMenu();requestUpdate()},{passive:true});
  requestUpdate();

  document.querySelectorAll('.news-visual img').forEach(image=>{
    image.decoding='async';
    image.addEventListener('error',()=>image.closest('.news-visual')?.classList.add('media-unavailable'),{once:true});
  });
})();
