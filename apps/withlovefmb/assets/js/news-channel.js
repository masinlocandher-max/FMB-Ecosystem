(()=>{
  'use strict';
  const body=document.body;
  const root=document.documentElement;
  const menu=document.querySelector('[data-news-menu]');
  const nav=document.getElementById('newsNav');
  const header=document.querySelector('.nc-site-header');
  const dock=document.querySelector('.nc-mobile-dock');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const faithfulV11=body.classList.contains('news-faithful-v11');

  const ensureStylesheet=(fragment,href)=>{
    if(document.querySelector(`link[href*="${fragment}"]`)||document.querySelector('style[data-fmb-news-final-styles]'))return;
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href=href;
    document.head.appendChild(stylesheet);
  };
  if(!faithfulV11){
    ensureStylesheet('fmb-news-channel-v4.css','/assets/css/fmb-news-channel-v4.css?v=20260727-channel-v4');
  }

  const supportStyle=document.createElement('style');
  supportStyle.textContent=`
    body.news-channel-route .news-visual.media-unavailable{background:linear-gradient(145deg,#d8dbe1,#b9bec7)}
    body.news-channel-route .news-visual.media-unavailable img{visibility:hidden}
    body.news-channel-route .news-visual.media-unavailable::before{content:'Image unavailable';position:absolute;inset:0;display:grid;place-items:center;color:#555d69;font:800 10px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}
  `;
  document.head.appendChild(supportStyle);

  body.classList.toggle('js-news-motion',!reduced);

  const progress=document.createElement('div');
  progress.className='nc-luxury-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML='<span></span>';
  Object.assign(progress.style,{position:'fixed',inset:'0 0 auto',height:'3px',zIndex:'999',pointerEvents:'none'});
  Object.assign(progress.firstElementChild.style,{display:'block',width:'0',height:'100%',background:faithfulV11?'#c99a3f':'#a10d2f'});
  document.body.appendChild(progress);

  const updateDateAndClock=()=>{
    const now=new Date();
    const time=new Intl.DateTimeFormat('en-PH',{
      timeZone:'Asia/Manila',
      hour:'2-digit',
      minute:'2-digit',
      hour12:true
    }).format(now);
    const weekday=new Intl.DateTimeFormat('en-PH',{
      timeZone:'Asia/Manila',
      weekday:'long'
    }).format(now);
    const date=new Intl.DateTimeFormat('en-PH',{
      timeZone:'Asia/Manila',
      day:'numeric',
      month:'long',
      year:'numeric'
    }).format(now);
    document.querySelectorAll('[data-news-clock]').forEach(clock=>clock.textContent=`${time} PHT`);
    document.querySelectorAll('[data-news-edition]').forEach(item=>item.textContent=`${weekday} edition · ${date}`);
    document.querySelectorAll('[data-news-date]').forEach(item=>item.textContent=`${date} · Philippine Standard Time`);
    document.querySelectorAll('[data-news-updated]').forEach(item=>item.textContent=`Updated ${date}`);
  };
  updateDateAndClock();
  setInterval(updateDateAndClock,30000);

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
