(()=>{
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const menu=document.getElementById('menuButton');
  const nav=document.getElementById('bulletinNav');
  const header=document.querySelector('.bulletin-header');
  const progress=document.getElementById('scrollProgress');
  const dock=document.querySelector('.mobile-dock');
  const hero=document.getElementById('homeHeroImage');
  const founder=document.getElementById('homeFounderImage');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;

  body.classList.toggle('js-luxury-motion',!reduced);

  const closeMenu=()=>{
    if(!menu||!nav)return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
  };

  if(menu&&nav){
    menu.addEventListener('click',()=>{
      const open=!nav.classList.contains('open');
      nav.classList.toggle('open',open);
      menu.setAttribute('aria-expanded',String(open));
      menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    });
    nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
    addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
    document.addEventListener('click',event=>{
      if(nav.classList.contains('open')&&!event.target.closest('#bulletinNav,#menuButton'))closeMenu();
    });
  }

  const revealItems=[...document.querySelectorAll('.reveal')];
  if(reduced||!('IntersectionObserver' in window)){
    revealItems.forEach(item=>item.classList.add('in-view'));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    },{threshold:.08,rootMargin:'0px 0px -9% 0px'});
    revealItems.forEach(item=>observer.observe(item));
  }

  let ticking=false;
  const updateScroll=()=>{
    ticking=false;
    const y=scrollY;
    const total=Math.max(1,root.scrollHeight-innerHeight);
    if(progress)progress.style.width=`${Math.min(100,y/total*100)}%`;
    header?.classList.toggle('is-condensed',y>72);
    dock?.classList.toggle('visible',y>420);
    root.style.setProperty('--fmb-scroll',String(y));
    if(!reduced&&innerWidth>820){
      if(hero){
        const travel=Math.min(34,Math.max(-8,y*.032));
        hero.style.transform=`translate3d(0,${travel}px,0) scale(1.035)`;
      }
      if(founder){
        const rect=founder.getBoundingClientRect();
        const offset=(rect.top-innerHeight*.55)*-.025;
        founder.style.transform=`translate3d(0,${Math.max(-18,Math.min(18,offset))}px,0) scale(1.025)`;
      }
    }else{
      hero?.style.removeProperty('transform');
      founder?.style.removeProperty('transform');
    }
  };
  const requestScrollUpdate=()=>{if(ticking)return;ticking=true;requestAnimationFrame(updateScroll)};
  addEventListener('scroll',requestScrollUpdate,{passive:true});
  addEventListener('resize',()=>{closeMenu();requestScrollUpdate()},{passive:true});
  requestScrollUpdate();

  if(finePointer&&!reduced){
    document.querySelectorAll('.ecosystem-card,.offer-card,.channel-card').forEach(card=>{
      card.addEventListener('pointermove',event=>{
        const rect=card.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width-.5;
        const y=(event.clientY-rect.top)/rect.height-.5;
        card.style.transform=`perspective(900px) rotateX(${y*-2.2}deg) rotateY(${x*2.8}deg) translateY(-6px)`;
      });
      card.addEventListener('pointerleave',()=>card.style.removeProperty('transform'));
    });
  }

  const sections=[...document.querySelectorAll('main section[id]')];
  const internalLinks=[...document.querySelectorAll('.bulletin-nav a[href^="#"],.mobile-dock a[href^="#"]')];
  if(sections.length&&internalLinks.length&&'IntersectionObserver' in window){
    const sectionObserver=new IntersectionObserver(entries=>{
      const active=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!active)return;
      internalLinks.forEach(link=>link.toggleAttribute('aria-current',link.getAttribute('href')===`#${active.target.id}`));
    },{rootMargin:'-28% 0px -62% 0px',threshold:[0,.08,.35]});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  const fallback=(image,src)=>image?.addEventListener('error',()=>{
    image.src=src;
    image.removeAttribute('srcset');
  },{once:true});
  fallback(hero,'/assets/images/hero.webp');
  fallback(founder,'/assets/images/fmb/francine-founder-front-cutout-900-v1.webp');
})();
