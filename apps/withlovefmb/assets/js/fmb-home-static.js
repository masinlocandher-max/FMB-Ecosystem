(function(){
  'use strict';

  const menu=document.getElementById('menuButton');
  const nav=document.getElementById('bulletinNav');
  const progress=document.getElementById('scrollProgress');
  const dock=document.querySelector('.mobile-dock');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function closeMenu(){
    if(!menu||!nav)return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
  }

  if(menu&&nav){
    menu.addEventListener('click',function(){
      const open=!nav.classList.contains('open');
      nav.classList.toggle('open',open);
      menu.setAttribute('aria-expanded',String(open));
      menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    });
    nav.addEventListener('click',function(event){if(event.target.closest('a'))closeMenu()});
    document.addEventListener('click',function(event){
      if(nav.classList.contains('open')&&!event.target.closest('#bulletinNav,#menuButton'))closeMenu();
    });
    document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMenu()});
  }

  function updateScrollUi(){
    const total=document.documentElement.scrollHeight-window.innerHeight;
    if(progress)progress.style.width=(total>0?Math.min(100,window.scrollY/total*100):0)+'%';
    if(dock)dock.classList.toggle('visible',window.scrollY>360);
  }

  window.addEventListener('scroll',updateScrollUi,{passive:true});
  window.addEventListener('resize',function(){updateScrollUi();if(window.innerWidth>1100)closeMenu()},{passive:true});
  updateScrollUi();

  const reveals=[].slice.call(document.querySelectorAll('.reveal'));
  if(reduced||!('IntersectionObserver' in window)){
    reveals.forEach(function(element){element.classList.add('in-view')});
  }else{
    const observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.08});
    reveals.forEach(function(element){observer.observe(element)});
  }

  const hero=document.getElementById('homeHeroImage');
  const founder=document.getElementById('homeFounderImage');
  if(hero){
    hero.addEventListener('error',function(){
      hero.src='/assets/images/hero.webp';
      hero.removeAttribute('srcset');
    },{once:true});
  }
  if(founder){
    founder.addEventListener('error',function(){
      founder.src='/assets/images/fmb/francine-founder-front-cutout-900-v1.webp';
      founder.removeAttribute('srcset');
    },{once:true});
  }
})();
