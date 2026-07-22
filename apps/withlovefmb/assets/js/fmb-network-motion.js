(()=>{
  'use strict';
  const body=document.body;
  if(!body||body.dataset.fmbNetworkReady==='true')return;
  body.dataset.fmbNetworkReady='true';

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const path=location.pathname.replace(/\/+$/,'')||'/';
  const pageKey=body.dataset.fmbNetworkPage||(
    path==='/'?'home':
    path==='/aboutfmb'?'about':
    path==='/withlovefmb'?'withlove':
    path==='/news'?'news':
    path==='/music'?'music':
    path==='/ebooks'?'ebook':
    path==='/fmb&co'||path==='/fmbandco'?'fmbandco':
    path.includes('/fmb&co/senz')||path.includes('/fmbandco/senz')?'senz':
    path.includes('/fmb&co/cognita')||path.includes('/fmbandco/cognita')?'cognita':'public'
  );

  body.classList.add('fmb-network-page',`fmb-network-${pageKey}`);
  body.classList.toggle('fmb-motion-on',!reduced);

  const progress=document.createElement('div');
  progress.className='fmb-network-progress';
  progress.setAttribute('aria-hidden','true');
  progress.innerHTML='<span></span>';
  document.body.appendChild(progress);

  const signal=document.createElement('div');
  signal.className='fmb-network-signal';
  signal.setAttribute('aria-hidden','true');
  signal.innerHTML='<i></i><span>FMB Network</span>';
  document.body.appendChild(signal);

  const header=document.querySelector('.bulletin-header,.nav-glass,.fco-header,.nc-site-header');
  let scrollQueued=false;
  const updateScroll=()=>{
    scrollQueued=false;
    const total=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    progress.firstElementChild.style.width=`${Math.min(100,scrollY/total*100)}%`;
    header?.classList.toggle('fmb-header-condensed',scrollY>80);
  };
  const requestScroll=()=>{if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(updateScroll)};
  addEventListener('scroll',requestScroll,{passive:true});
  addEventListener('resize',requestScroll,{passive:true});
  updateScroll();

  const revealSelectors=[
    'main section>div','main section>article','main section>figure',
    '.ecosystem-card','.offer-card','.channel-card','.wlf-card','.ebook-card',
    '.fco-company-card','.fco-gateway-card','.nc-rundown-card','.story-row',
    '.fmb-network-now-card','.fmb-network-contact'
  ];
  const revealItems=[...new Set(revealSelectors.flatMap(selector=>[...document.querySelectorAll(selector)]))]
    .filter(node=>!node.closest('.az-help-layer'));
  revealItems.forEach((node,index)=>{
    node.classList.add('network-reveal');
    if(index%4)node.classList.add(`network-stagger-${index%4}`);
  });

  const mediaItems=[...document.querySelectorAll(
    '.hero-photo,.dispatch-landscape,.fmb-about-hero-visual,.fmb-about-portrait-card,.wlf-portrait-frame,.wlf-volunteer-photo,.news-visual,.fco-lead-art,.fco-hero-visual,.fco-founder-portrait-card'
  )];
  mediaItems.forEach(node=>node.classList.add('network-media-reveal'));

  if(reduced||!('IntersectionObserver' in window)){
    [...revealItems,...mediaItems].forEach(node=>node.classList.add('is-visible'));
  }else{
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },{threshold:.06,rootMargin:'0px 0px -7% 0px'});
    [...revealItems,...mediaItems].forEach(node=>observer.observe(node));
  }

  const contact=document.createElement('aside');
  contact.className='fmb-network-contact network-reveal';
  contact.setAttribute('aria-label','Official FMB contact channels');
  contact.innerHTML=`
    <div><small>Official channels</small><strong>Stay connected with FMB.</strong><p>Use these public channels for verified updates, messages, and professional inquiries.</p></div>
    <a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener"><span>Instagram</span><b>@bb.fmb</b></a>
    <a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener"><span>Facebook</span><b>/BinibiningFrancineMarie</b></a>
    <a href="mailto:withlovefmb@gmail.com"><span>Email</span><b>withlovefmb@gmail.com</b></a>`;
  const footer=document.querySelector('footer');
  if(footer)footer.before(contact);else document.body.appendChild(contact);
  if(reduced)contact.classList.add('is-visible');else{
    const contactObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');contactObserver.disconnect()}}),{threshold:.08});
    contactObserver.observe(contact);
  }

  document.querySelectorAll('main img').forEach(image=>{
    image.style.removeProperty('transform');
    image.addEventListener('error',()=>image.closest('figure,div')?.classList.add('media-unavailable'),{once:true});
  });

  if('startViewTransition' in document&&!reduced){
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[href]');
      if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      if(link.target==='_blank'||link.hasAttribute('download'))return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin||url.pathname===location.pathname)return;
      event.preventDefault();
      document.startViewTransition(()=>{location.href=url.href});
    });
  }

  if(finePointer&&!reduced){
    document.querySelectorAll('a,button').forEach(control=>{
      control.addEventListener('pointerdown',()=>control.classList.add('fmb-pressed'));
      control.addEventListener('pointerup',()=>control.classList.remove('fmb-pressed'));
      control.addEventListener('pointerleave',()=>control.classList.remove('fmb-pressed'));
    });
  }

  document.querySelectorAll('[aria-controls]').forEach(button=>{
    const id=button.getAttribute('aria-controls');
    const target=id&&document.getElementById(id);
    if(!target)return;
    button.addEventListener('click',()=>{
      const open=button.getAttribute('aria-expanded')==='true';
      document.documentElement.classList.toggle('fmb-drawer-open',open);
    });
  });

  document.documentElement.classList.add('fmb-network-loaded');
})();
