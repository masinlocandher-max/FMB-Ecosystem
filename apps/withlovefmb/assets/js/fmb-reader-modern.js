(function(){
  'use strict';
  document.documentElement.classList.add('fmb-reader-loaded');
  document.body.classList.add('fmb-reader-modern');
  const title=document.querySelector('h1')?.textContent?.trim()||document.title.split('|')[0].trim()||'FMB eBook';
  const toc=document.querySelector('.toc,.reading-toc');
  const chapters=[...document.querySelectorAll('.chapter,.reading-chapter')];
  const storageKey=`fmb_reader_settings_v1`;
  let settings={scale:1,theme:'light'};
  try{settings={...settings,...JSON.parse(localStorage.getItem(storageKey)||'{}')}}catch{}
  const applySettings=()=>{
    document.documentElement.style.setProperty('--reader-font-scale',String(Math.max(.9,Math.min(1.28,Number(settings.scale)||1))));
    document.body.classList.toggle('reader-theme-sepia',settings.theme==='sepia');
    document.body.classList.toggle('reader-theme-dark',settings.theme==='dark');
  };
  const saveSettings=()=>{try{localStorage.setItem(storageKey,JSON.stringify(settings))}catch{}};
  applySettings();

  const topbar=document.createElement('header');
  topbar.className='fmb-reader-topbar';
  topbar.innerHTML=`
    <a class="fmb-reader-brand" href="/ebooks/" aria-label="Return to FMB eBooks"><img src="/assets/images/fmb-approved/fmb-ebook-official-transparent.webp" alt="FMB eBooks"></a>
    <div class="fmb-reader-current"><strong>${title.replace(/[&<>"']/g,'')}</strong><span data-reader-progress-label>0% read</span></div>
    <div class="fmb-reader-tools">
      <button class="reader-tool reader-toc-button" type="button" data-reader-toc aria-expanded="false">Contents</button>
      <button class="reader-tool reader-font-down" type="button" data-reader-font="down" aria-label="Decrease text size">A−</button>
      <button class="reader-tool reader-font-up" type="button" data-reader-font="up" aria-label="Increase text size">A+</button>
      <button class="reader-tool" type="button" data-reader-theme aria-label="Change reading theme">Theme</button>
    </div>`;
  const progress=document.createElement('div');
  progress.className='fmb-reader-progress';progress.innerHTML='<span></span>';
  const drawer=document.createElement('aside');
  drawer.className='fmb-reader-drawer';drawer.setAttribute('aria-hidden','true');
  drawer.innerHTML=`<div class="fmb-reader-drawer-head"><h2>Contents</h2><button class="reader-tool" type="button" data-reader-close aria-label="Close contents">Close</button></div><nav>${toc?toc.innerHTML:chapters.map((chapter,index)=>`<a href="#${chapter.id}"><span>${chapter.querySelector('h2')?.textContent||`Chapter ${index+1}`}</span><span>${String(index+1).padStart(2,'0')}</span></a>`).join('')}</nav>`;
  const scrim=document.createElement('div');scrim.className='fmb-reader-scrim';
  document.body.prepend(progress,topbar,drawer,scrim);

  const closeDrawer=()=>{drawer.classList.remove('open');scrim.classList.remove('open');drawer.setAttribute('aria-hidden','true');topbar.querySelector('[data-reader-toc]')?.setAttribute('aria-expanded','false')};
  const openDrawer=()=>{drawer.classList.add('open');scrim.classList.add('open');drawer.setAttribute('aria-hidden','false');topbar.querySelector('[data-reader-toc]')?.setAttribute('aria-expanded','true')};
  topbar.querySelector('[data-reader-toc]')?.addEventListener('click',()=>drawer.classList.contains('open')?closeDrawer():openDrawer());
  drawer.querySelector('[data-reader-close]')?.addEventListener('click',closeDrawer);
  scrim.addEventListener('click',closeDrawer);
  drawer.addEventListener('click',event=>{if(event.target.closest('a'))closeDrawer()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDrawer()});

  topbar.querySelectorAll('[data-reader-font]').forEach(button=>button.addEventListener('click',()=>{
    settings.scale=Math.max(.9,Math.min(1.28,(Number(settings.scale)||1)+(button.dataset.readerFont==='up'?.08:-.08)));
    applySettings();saveSettings();
  }));
  const themes=['light','sepia','dark'];
  topbar.querySelector('[data-reader-theme]')?.addEventListener('click',()=>{
    settings.theme=themes[(themes.indexOf(settings.theme)+1)%themes.length];applySettings();saveSettings();
  });

  const fill=progress.querySelector('span');
  const label=topbar.querySelector('[data-reader-progress-label]');
  let ticking=false;
  const update=()=>{
    ticking=false;
    const total=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const value=Math.max(0,Math.min(100,scrollY/total*100));
    fill.style.width=`${value}%`;if(label)label.textContent=`${Math.round(value)}% read`;
    try{localStorage.setItem('fmb_reader_last_position',JSON.stringify({path:location.pathname,title,progress:value,scrollY,updatedAt:Date.now()}))}catch{}
  };
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});update();

  let saved=null;try{saved=JSON.parse(localStorage.getItem('fmb_reader_last_position')||'null')}catch{}
  if(saved?.path===location.pathname&&Number(saved.scrollY)>500&&Number(saved.progress)<98&&performance.getEntriesByType('navigation')[0]?.type!=='reload'){
    const resume=document.createElement('button');resume.type='button';resume.className='reader-tool';resume.textContent=`Resume ${Math.round(saved.progress)}%`;resume.style.minWidth='auto';
    resume.addEventListener('click',()=>{scrollTo({top:Number(saved.scrollY)||0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});resume.remove()});
    topbar.querySelector('.fmb-reader-tools')?.prepend(resume);
  }
})();
