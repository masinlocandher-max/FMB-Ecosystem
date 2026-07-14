(function(){
  'use strict';
  function loadAsset(tag,attrs){
    const key=attrs.href||attrs.src;
    if(document.querySelector(`${tag}[href="${key}"],${tag}[src="${key}"]`))return;
    const el=document.createElement(tag);Object.entries(attrs).forEach(([name,value])=>el.setAttribute(name,value));document.head.appendChild(el);
  }
  function boot(){
    loadAsset('link',{rel:'stylesheet',href:'assets/css/reading-library.css?v=20260712d'});
    loadAsset('link',{rel:'stylesheet',href:'assets/css/apple-mobile.css?v=20260712d'});
    loadAsset('script',{src:'assets/js/reading-library.js?v=20260712d',defer:'defer'});

    const musicSection=document.getElementById('music');
    if(musicSection)musicSection.remove();
    document.querySelectorAll('a[href="music.html"],a[href$="/music.html"]').forEach(link=>link.remove());
    document.querySelectorAll('p,h1,h2,h3,span').forEach(node=>{
      if(node.children.length)return;
      node.textContent=node.textContent
        .replace(/,?\s*music,?\s*/gi,', ')
        .replace(/wellness guides,\s*and future resources/gi,'wellness guides and future resources')
        .replace(/Read, listen, pause/gi,'Read, reflect, pause');
    });

    const toggle=document.getElementById('navToggle');
    const links=document.getElementById('navLinks');
    const mobileBar=document.querySelector('.mobile-bar');
    if(toggle&&links){
      let backdrop=document.querySelector('.nav-backdrop');
      if(!backdrop){backdrop=document.createElement('div');backdrop.className='nav-backdrop';document.body.appendChild(backdrop)}
      const sync=()=>{
        const open=links.classList.contains('open');
        backdrop.classList.toggle('open',open);
        document.body.classList.toggle('modal-open',open);
        if(mobileBar)mobileBar.classList.toggle('is-hidden',open);
      };
      toggle.addEventListener('click',()=>setTimeout(sync,0));
      backdrop.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false');sync()});
      links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(sync,0)));
    }

    if(mobileBar){
      mobileBar.style.gridTemplateColumns=`repeat(${mobileBar.children.length},minmax(0,1fr))`;
      let lastY=window.scrollY;
      let ticking=false;
      const reveal=()=>mobileBar.classList.remove('is-hidden');
      const update=()=>{
        const currentY=window.scrollY;
        if(!document.body.classList.contains('modal-open')){
          if(currentY>lastY+8&&currentY>180)mobileBar.classList.add('is-hidden');
          else if(currentY<lastY-8||currentY<90)reveal();
        }
        lastY=currentY;
        ticking=false;
      };
      window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
      window.addEventListener('pageshow',reveal);
      mobileBar.addEventListener('focusin',reveal);
      mobileBar.addEventListener('pointerdown',reveal,{passive:true});
    }

    const page=location.pathname.split('/').pop()||'index.html';
    if(page==='auth.html'){
      const card=document.querySelector('.auth-card');
      if(card&&!card.querySelector('[data-admin-access-link]')){
        const note=document.createElement('p');
        note.className='form-note';
        note.style.marginTop='12px';
        note.dataset.adminAccessLink='true';
        note.append('FMB administrator? ');
        const link=document.createElement('a');
        link.className='text-link';
        link.href='admin-login.html';
        link.textContent='Open administrator access';
        note.append(link,'.');
        card.appendChild(note);
      }
    }

    const footerGroups=[...document.querySelectorAll('.footer .footer-links')];
    if(footerGroups.length&&!document.querySelector('.footer a[href="admin-login.html"]')){
      const link=document.createElement('a');
      link.href='admin-login.html';
      link.textContent='Administrator access';
      footerGroups[footerGroups.length-1].appendChild(link);
    }

    document.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error',()=>{
        const src=img.getAttribute('src')||'';
        if(img.dataset.retry==='1')return;
        const fixes={
          'assets/icon.svg':'assets/images/icon-transparent.png',
          'assets/founder.svg':'assets/images/founder.webp',
          'assets/signature.svg':'assets/images/signature.png'
        };
        if(fixes[src]){img.dataset.retry='1';img.src=fixes[src]}
      });
    });
    const marquee=document.querySelector('.promo-marquee');
    if(marquee){marquee.style.animationPlayState='running';void marquee.offsetWidth;marquee.classList.add('is-running')}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
