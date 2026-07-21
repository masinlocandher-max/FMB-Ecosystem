(function(){
  'use strict';
  const menu=document.getElementById('menuButton');
  const nav=document.getElementById('bulletinNav');
  const progress=document.getElementById('scrollProgress');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function closeMenu(){
    if(!menu||!nav)return;
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
  }

  if(menu&&nav){
    menu.addEventListener('click',()=>{
      const open=!nav.classList.contains('open');
      nav.classList.toggle('open',open);
      menu.setAttribute('aria-expanded',String(open));
      menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    });
    nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
    document.addEventListener('click',event=>{if(nav.classList.contains('open')&&!event.target.closest('#bulletinNav,#menuButton'))closeMenu()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
  }

  function updateProgress(){
    if(!progress)return;
    const total=document.documentElement.scrollHeight-window.innerHeight;
    progress.style.width=`${total>0?Math.min(100,window.scrollY/total*100):0}%`;
  }
  window.addEventListener('scroll',updateProgress,{passive:true});
  window.addEventListener('resize',()=>{updateProgress();if(window.innerWidth>1100)closeMenu()},{passive:true});
  updateProgress();

  const reveals=[...document.querySelectorAll('.reveal')];
  if(reduced||!('IntersectionObserver' in window))reveals.forEach(element=>element.classList.add('in-view'));
  else{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }),{rootMargin:'0px 0px -8% 0px',threshold:.08});
    reveals.forEach(element=>observer.observe(element));
  }
})();
