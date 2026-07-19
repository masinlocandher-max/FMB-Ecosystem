(()=>{
  const body=document.body;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const clocks=[...document.querySelectorAll('[data-news-clock]')];
  if(clocks.length){
    const dateFormat=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'short',month:'short',day:'numeric'});
    const timeFormat=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true});
    const updateClocks=()=>{
      const now=new Date();
      const label=`${dateFormat.format(now)} · ${timeFormat.format(now)}`;
      clocks.forEach(clock=>{
        clock.dateTime=now.toISOString();
        clock.textContent=label;
        clock.title='Philippine Standard Time';
      });
    };
    updateClocks();
    window.setInterval(updateClocks,30000);
  }

  const menuButton=document.querySelector('[data-news-menu]');
  const menu=document.querySelector('#newsNav');
  if(menuButton&&menu){
    const closeMenu=()=>{
      body.classList.remove('nc-menu-open');
      menuButton.setAttribute('aria-expanded','false');
      menuButton.setAttribute('aria-label','Open news menu');
    };
    menuButton.addEventListener('click',()=>{
      const open=!body.classList.contains('nc-menu-open');
      body.classList.toggle('nc-menu-open',open);
      menuButton.setAttribute('aria-expanded',String(open));
      menuButton.setAttribute('aria-label',open?'Close news menu':'Open news menu');
    });
    menu.addEventListener('click',event=>{
      if(event.target.closest('a'))closeMenu();
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape')closeMenu();
    });
    window.addEventListener('resize',()=>{
      if(window.innerWidth>800)closeMenu();
    },{passive:true});
  }

  const revealItems=[...document.querySelectorAll('.nc-reveal')];
  if(revealItems.length){
    if(reduced||!('IntersectionObserver' in window)){
      revealItems.forEach(item=>item.classList.add('nc-visible'));
    }else{
      body.classList.add('nc-motion-ready');
      const revealObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          entry.target.classList.add('nc-visible');
          revealObserver.unobserve(entry.target);
        });
      },{rootMargin:'0px 0px -8% 0px',threshold:.12});
      revealItems.forEach(item=>revealObserver.observe(item));
    }
  }

  const topicLinks=[...document.querySelectorAll('.nc-topic-rail a[href^="#"]')];
  if(topicLinks.length&&'IntersectionObserver' in window){
    const sections=topicLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
    const sectionObserver=new IntersectionObserver(entries=>{
      const active=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!active)return;
      topicLinks.forEach(link=>link.toggleAttribute('aria-current',link.getAttribute('href')===`#${active.target.id}`));
    },{rootMargin:'-32% 0px -58% 0px',threshold:[0,.1,.4]});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  const progress=document.querySelector('.nc-story-progress span');
  if(progress){
    let ticking=false;
    const updateProgress=()=>{
      const available=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const percent=Math.min(100,Math.max(0,(window.scrollY/available)*100));
      progress.style.width=`${percent}%`;
      ticking=false;
    };
    window.addEventListener('scroll',()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(updateProgress);
    },{passive:true});
    updateProgress();
  }

  document.querySelectorAll('[data-news-share]').forEach(button=>{
    const original=button.textContent;
    button.addEventListener('click',async()=>{
      const payload={title:document.title,text:document.querySelector('meta[name="description"]')?.content||document.title,url:window.location.href};
      try{
        if(navigator.share)await navigator.share(payload);
        else if(navigator.clipboard)await navigator.clipboard.writeText(payload.url);
        else throw new Error('Sharing unavailable');
        button.textContent=navigator.share?original:'Link copied';
      }catch(error){
        if(error?.name==='AbortError')return;
        button.textContent='Copy this page link';
      }
      window.setTimeout(()=>{button.textContent=original;},2200);
    });
  });
})();
