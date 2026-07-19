(()=>{
  const body=document.body;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const AI_ARTICLE='/news/ai-water-consumption-responsible-ai-philippines/';
  const AI_SHARE='/share/ai-water/';

  const installFounderAiWaterLead=()=>{
    if(!body.classList.contains('news-channel-route'))return;
    const story=document.querySelector('.nc-lead-broadcast');
    const link=story?.querySelector(':scope > a');
    const image=story?.querySelector('.news-visual img');
    const caption=story?.querySelector('.news-visual figcaption');
    const signal=story?.querySelector('.nc-signal-tag');
    const meta=story?.querySelector('.nc-lead-meta');
    const title=story?.querySelector('h2');
    const deck=story?.querySelector('.nc-lead-deck');
    const action=story?.querySelector('.nc-broadcast-action');
    if(!story||!link||!image||!title)return;

    link.href=AI_ARTICLE;
    link.setAttribute('aria-label','Read AI Uses Water. That Is Not the Whole Story.');
    image.src='/assets/images/news/fmbco-ai-water-founder-hero.svg';
    image.width=1000;
    image.height=563;
    image.alt='Francine Marie Bautista beside the headline AI Uses Water. That Is Not the Whole Story';
    if(caption)caption.textContent='Francine Marie Bautista, founder and CEO of FMB&CO. Portrait supplied by FMB. FMB&CO. News graphic.';
    if(signal)signal.innerHTML='<i aria-hidden="true"></i> Founder Perspective';
    if(meta)meta.innerHTML='AI · Environment <span>10 min read</span>';
    title.id='top-story-title';
    title.textContent='AI Uses Water. That Is Not the Whole Story.';
    if(deck)deck.textContent='Francine Marie Bautista explains what Filipinos need to know about AI, freshwater, data centers, and responsible innovation.';
    if(action)action.innerHTML='Read the founder article <b aria-hidden="true">→</b>';

    [...document.querySelectorAll('.nc-wire-track span')].forEach((item,index)=>{
      if(index===0||index===5)item.textContent='AI uses water: FMB explains the full story';
    });

    const rundown=document.querySelector('.nc-rundown-panel');
    if(rundown&&!rundown.querySelector('[data-ai-water-rundown]')){
      const subic=document.createElement('article');
      subic.className='nc-rundown-story nc-reveal nc-visible';
      subic.dataset.aiWaterRundown='subic';
      subic.innerHTML='<a href="/news/subic-aeta-landfill/"><span class="nc-rundown-number">01</span><figure class="news-visual"><img src="/assets/images/news/subic-aeta-dumpsite-iwitness.jpg" width="800" height="533" alt="Kara David and Aeta community members looking across accumulated waste at the Subic site" loading="lazy"><figcaption>Still: GMA Public Affairs / I-Witness, via Philstar.com. Full source and credit appear in the article.</figcaption></figure><div><p>Environment · Zambales</p><h3>The dumping stopped. Subic’s duty to restore has not.</h3><span>8 min read</span></div></a>';
      const firstStory=rundown.querySelector('.nc-rundown-story');
      if(firstStory)rundown.insertBefore(subic,firstStory);
      [...rundown.querySelectorAll('.nc-rundown-number')].forEach((number,index)=>{number.textContent=String(index+1).padStart(2,'0');});
    }

    const indexList=document.querySelector('.nc-index-list');
    if(indexList&&!indexList.querySelector('[data-ai-water-index]')){
      const item=document.createElement('li');
      item.className='nc-reveal nc-visible';
      item.dataset.aiWaterIndex='true';
      item.innerHTML='<a href="/news/ai-water-consumption-responsible-ai-philippines/"><span class="nc-index-number">01</span><span class="nc-index-category">Technology and environment</span><strong>Founder Perspective</strong><span class="nc-index-action">AI, freshwater, responsibility</span></a>';
      indexList.prepend(item);
      [...indexList.querySelectorAll('.nc-index-number')].forEach((number,index)=>{number.textContent=String(index+1).padStart(2,'0');});
    }
  };

  const installFounderHeroTiles=()=>{
    document.querySelectorAll('img[src$="fmbco-ai-water-founder-hero.svg"]').forEach(image=>{
      const hero=document.createElement('div');
      hero.className='fmb-ai-water-hero-tiles';
      hero.setAttribute('role','img');
      hero.setAttribute('aria-label','Francine Marie Bautista beside the headline AI Uses Water. That Is Not the Whole Story');
      Object.assign(hero.style,{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',width:'100%',aspectRatio:'1000 / 563',overflow:'hidden',background:'#ddd'});
      for(let index=1;index<=4;index+=1){
        const tile=document.createElement('img');
        tile.src=`/assets/images/news/fmbco-ai-water-tile-${index}.svg`;
        tile.alt='';
        tile.setAttribute('aria-hidden','true');
        tile.width=250;
        tile.height=563;
        Object.assign(tile.style,{display:'block',width:'100%',height:'100%',objectFit:'fill',margin:'0',padding:'0',border:'0'});
        hero.appendChild(tile);
      }
      image.replaceWith(hero);
    });
  };

  installFounderAiWaterLead();
  installFounderHeroTiles();

  const clocks=[...document.querySelectorAll('[data-news-clock]')];
  if(clocks.length){
    const dateFormat=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',weekday:'short',month:'short',day:'numeric'});
    const timeFormat=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true});
    const updateClocks=()=>{
      const now=new Date();
      const label=`${dateFormat.format(now)} · ${timeFormat.format(now)}`;
      clocks.forEach(clock=>{clock.dateTime=now.toISOString();clock.textContent=label;clock.title='Philippine Standard Time';});
    };
    updateClocks();
    window.setInterval(updateClocks,30000);
  }

  const menuButton=document.querySelector('[data-news-menu]');
  const menu=document.querySelector('#newsNav');
  if(menuButton&&menu){
    const closeMenu=()=>{body.classList.remove('nc-menu-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open news menu');};
    menuButton.addEventListener('click',()=>{const open=!body.classList.contains('nc-menu-open');body.classList.toggle('nc-menu-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close news menu':'Open news menu');});
    menu.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  }

  const revealItems=[...document.querySelectorAll('.nc-reveal')];
  if(revealItems.length){
    if(reduced||!('IntersectionObserver' in window))revealItems.forEach(item=>item.classList.add('nc-visible'));
    else{
      body.classList.add('nc-motion-ready');
      const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('nc-visible');observer.unobserve(entry.target);}}),{rootMargin:'0px 0px -8% 0px',threshold:.12});
      revealItems.forEach(item=>observer.observe(item));
    }
  }

  const progress=document.querySelector('.nc-story-progress span');
  if(progress){
    const update=()=>{const available=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);progress.style.width=`${Math.min(100,Math.max(0,(window.scrollY/available)*100))}%`;};
    window.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
    update();
  }

  document.querySelectorAll('[data-news-share]').forEach(button=>{
    const original=button.textContent;
    button.addEventListener('click',async()=>{
      const articleIsAi=location.pathname===AI_ARTICLE;
      const shareUrl=new URL(articleIsAi?AI_SHARE:location.pathname,location.origin).href;
      const payload={title:document.title,text:document.querySelector('meta[name="description"]')?.content||document.title,url:shareUrl};
      try{
        if(navigator.share)await navigator.share(payload);
        else if(navigator.clipboard)await navigator.clipboard.writeText(payload.url);
        else throw new Error('Sharing unavailable');
        button.textContent=navigator.share?original:'Photo-preview link copied';
      }catch(error){
        if(error?.name==='AbortError')return;
        button.textContent='Copy this page link';
      }
      window.setTimeout(()=>{button.textContent=original;},2200);
    });
  });
})();