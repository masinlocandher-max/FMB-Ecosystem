(function(){
  'use strict';
  if(window.__fmbDesktopPremium)return;
  window.__fmbDesktopPremium=true;

  const desktop=window.matchMedia('(min-width: 1025px)');
  let lastY=window.scrollY;
  let ticking=false;

  const updateDesktopHeader=()=>{
    if(!desktop.matches){
      document.body.classList.remove('desktop-nav-hidden');
      lastY=window.scrollY;
      ticking=false;
      return;
    }
    const currentY=window.scrollY;
    const movingDown=currentY>lastY+8;
    const movingUp=currentY<lastY-8;
    if(currentY<88||movingUp)document.body.classList.remove('desktop-nav-hidden');
    else if(movingDown&&currentY>150)document.body.classList.add('desktop-nav-hidden');
    lastY=currentY;
    ticking=false;
  };
  const scheduleHeader=()=>{
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(updateDesktopHeader);
  };

  window.addEventListener('scroll',scheduleHeader,{passive:true});
  desktop.addEventListener?.('change',updateDesktopHeader);
  window.addEventListener('pageshow',()=>{lastY=window.scrollY;updateDesktopHeader()});

  const revealTargets=[];
  if(document.body.classList.contains('landing-home')){
    document.querySelectorAll('.home-benefits .wrap,.home-destinations .wrap,.home-overview-pair .wrap,.home-support .wrap,.home-faq .wrap').forEach(element=>{
      element.classList.add('reveal','fmb-premium-reveal');
      revealTargets.push(element);
    });
  }

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced||!('IntersectionObserver' in window)){
    revealTargets.forEach(element=>element.classList.add('in'));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    },{threshold:.12,rootMargin:'0px 0px -60px 0px'});
    revealTargets.forEach(element=>{
      if(element.getBoundingClientRect().top<window.innerHeight*.9)element.classList.add('in');
      else observer.observe(element);
    });
  }

  const support=document.querySelector('.support-glass');
  if(support){
    support.setAttribute('data-sticky-banner','true');
    support.querySelectorAll('.brand-chip-logo img').forEach(image=>{
      image.decoding='async';
      image.loading='eager';
    });
  }

  const footer=document.querySelector('.footer:last-of-type');
  if(footer)footer.setAttribute('data-page-ending','true');

  updateDesktopHeader();
})();