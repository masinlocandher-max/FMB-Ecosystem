(function(){
  'use strict';
  function boot(){
    const toggle=document.getElementById('navToggle');
    const links=document.getElementById('navLinks');
    if(toggle&&links){
      let backdrop=document.querySelector('.nav-backdrop');
      if(!backdrop){backdrop=document.createElement('div');backdrop.className='nav-backdrop';document.body.appendChild(backdrop)}
      const sync=()=>{const open=links.classList.contains('open');backdrop.classList.toggle('open',open);document.body.classList.toggle('modal-open',open)};
      toggle.addEventListener('click',()=>setTimeout(sync,0));
      backdrop.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false');sync()});
      links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(sync,0)));
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
