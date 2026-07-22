(function(){
  'use strict';
  const header=document.querySelector('.fmb-product-header');
  const menu=document.querySelector('.fmb-product-menu');
  const nav=document.querySelector('.fmb-product-nav');
  const setHeader=()=>header?.classList.toggle('is-condensed',scrollY>24);
  addEventListener('scroll',setHeader,{passive:true});setHeader();
  menu?.addEventListener('click',()=>{
    const open=menu.getAttribute('aria-expanded')!=='true';
    menu.setAttribute('aria-expanded',String(open));
    nav?.classList.toggle('is-open',open);
  });
  nav?.addEventListener('click',event=>{
    if(!event.target.closest('a'))return;
    menu?.setAttribute('aria-expanded','false');
    nav.classList.remove('is-open');
  });

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals=[...document.querySelectorAll('.fmb-reveal')];
  if(reduced||!('IntersectionObserver' in window)){
    reveals.forEach(element=>element.classList.add('is-visible'));
  }else{
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }),{threshold:.12,rootMargin:'0px 0px -40px'});
    reveals.forEach(element=>observer.observe(element));
  }

  const musicSearch=document.getElementById('musicSearch');
  const musicFilters=[...document.querySelectorAll('[data-music-filter]')];
  let activeMusic='all';
  function filterMusic(){
    const query=(musicSearch?.value||'').trim().toLowerCase();
    document.querySelectorAll('.playlist-block').forEach(block=>{
      const playlist=(block.querySelector('h3')?.textContent||'').toLowerCase();
      const collectionMatch=activeMusic==='all'||playlist.includes(activeMusic);
      let visible=0;
      block.querySelectorAll('.song-row').forEach(row=>{
        const match=collectionMatch&&(!query||(row.textContent||'').toLowerCase().includes(query));
        row.hidden=!match;if(match)visible++;
      });
      block.hidden=visible===0;
    });
  }
  musicSearch?.addEventListener('input',filterMusic);
  musicFilters.forEach(button=>button.addEventListener('click',()=>{
    activeMusic=button.dataset.musicFilter||'all';
    musicFilters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    filterMusic();
  }));
  const musicGrid=document.getElementById('playlistGrid');
  if(musicGrid)new MutationObserver(filterMusic).observe(musicGrid,{childList:true,subtree:true});

  const ebookSearch=document.getElementById('ebookSearch');
  const ebookFilters=[...document.querySelectorAll('[data-ebook-filter]')];
  const ebookCards=[...document.querySelectorAll('[data-ebook-card]')];
  let activeEbook='all';
  function filterBooks(){
    const query=(ebookSearch?.value||'').trim().toLowerCase();
    ebookCards.forEach(card=>{
      const access=card.dataset.access||'';
      const topics=(card.dataset.topics||'').split(/\s+/).filter(Boolean);
      const facetMatch=activeEbook==='all'||access===activeEbook||topics.includes(activeEbook);
      const match=facetMatch&&(!query||(card.textContent||'').toLowerCase().includes(query));
      card.hidden=!match;
    });
  }
  ebookSearch?.addEventListener('input',filterBooks);
  ebookFilters.forEach(button=>button.addEventListener('click',()=>{
    activeEbook=button.dataset.ebookFilter||'all';
    ebookFilters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    filterBooks();
  }));

  const continuePanel=document.getElementById('ebookContinue');
  if(continuePanel){
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem('fmb_reader_last_position')||'null')}catch{}
    if(saved?.path&&saved?.title&&Number(saved.progress)>2&&Number(saved.progress)<98){
      continuePanel.classList.add('is-visible');
      const title=continuePanel.querySelector('[data-continue-title]');
      const copy=continuePanel.querySelector('[data-continue-copy]');
      const link=continuePanel.querySelector('a');
      if(title)title.textContent=saved.title;
      if(copy)copy.textContent=`Continue from ${Math.round(saved.progress)}%`;
      if(link)link.href=saved.path;
    }
  }

  const audio=document.getElementById('audioPlayer');
  const mainPlay=document.getElementById('mainPlayButton');
  const nextButton=document.getElementById('nextButton');
  const prevButton=document.getElementById('prevButton');
  const playerNote=document.getElementById('playerNote');
  let activeMusicIndex=-1;
  let restoreState=null;
  let restored=false;
  try{restoreState=JSON.parse(sessionStorage.getItem('fmb_music_state_v3')||'null')}catch{}

  function restoreListeningPosition(){
    if(restored||!audio||!restoreState||activeMusicIndex!==Number(restoreState.index))return;
    const target=Number(restoreState.currentTime);
    if(!Number.isFinite(target)||target<=1||!Number.isFinite(audio.duration)||audio.duration<=1)return;
    audio.currentTime=Math.min(target,Math.max(0,audio.duration-.25));
    restored=true;
    if(playerNote)playerNote.textContent='Restoring your listening session. Press play when you are ready.';
  }
  audio?.addEventListener('loadedmetadata',restoreListeningPosition);

  document.addEventListener('fmb:music-state',event=>{
    const detail=event.detail||{};
    activeMusicIndex=Number.isInteger(detail.index)?detail.index:Number(detail.index);
    const play=document.getElementById('mainPlayButton');
    const miniFill=document.getElementById('miniProgressFill');
    if(play)play.dataset.playing=String(Boolean(detail.playing));
    if(miniFill&&detail.duration)miniFill.style.width=`${Math.min(100,(detail.currentTime/detail.duration)*100)}%`;
  });

  addEventListener('fmb:global-music-command',event=>{
    if(!audio||!mainPlay)return;
    const detail=event.detail||{};
    const command=String(detail.command||detail.action||'').toLowerCase();
    if(command==='play'&&audio.paused)mainPlay.click();
    else if(command==='pause'&&!audio.paused)audio.pause();
    else if(command==='toggle')mainPlay.click();
    else if(command==='next')nextButton?.click();
    else if(command==='previous'||command==='prev')prevButton?.click();
    else if(command==='seek'&&Number.isFinite(Number(detail.currentTime))){
      const applySeek=()=>{audio.currentTime=Math.max(0,Math.min(Number(detail.currentTime),audio.duration||Number(detail.currentTime)))};
      if(audio.readyState>=1)applySeek();else audio.addEventListener('loadedmetadata',applySeek,{once:true});
    }else if(command==='select'&&Number.isInteger(Number(detail.index))){
      document.querySelector(`.song-row[data-index="${Number(detail.index)}"] .song-play`)?.click();
    }
  });
})();
