(function(){
  'use strict';

  const $=selector=>document.querySelector(selector);
  const elements={
    grid:$('#playlistGrid'),
    tabs:$('#collectionTabs'),
    audio:$('#audioPlayer'),
    title:$('#nowTitle'),
    version:$('#nowVersion'),
    collection:$('#nowCollection'),
    description:$('#playerNote'),
    moment:$('#trackMoment'),
    credits:$('#trackCredits'),
    details:$('#trackDetails'),
    detailsButton:$('#detailsButton'),
    mainPlay:$('#mainPlayButton'),
    miniPlay:$('#miniPlay'),
    prev:$('#prevButton'),
    next:$('#nextButton'),
    miniPrev:$('#miniPrev'),
    miniNext:$('#miniNext'),
    miniPlayer:$('#miniPlayer'),
    miniTitle:$('#miniTitle'),
    miniArtist:$('#miniArtist'),
    featuredArt:$('#featuredArt'),
    miniCover:$('#miniCover'),
    progress:$('#progressControl'),
    currentTime:$('#currentTime'),
    duration:$('#duration'),
    volume:$('#volumeControl'),
    shuffle:$('#shuffleButton'),
    repeat:$('#repeatButton'),
    listeningState:$('#listeningState'),
    dialog:$('#membershipDialog'),
    dialogClose:$('#dialogClose'),
    maybeLater:$('#maybeLater'),
    playerSection:$('#player'),
    reviewerAccess:$('#reviewerAccess')
  };

  if(!elements.audio||!elements.grid)return;

  let collections=[];
  let allTracks=[];
  let queue=[];
  let currentTrack=null;
  let activeCollection='calm';
  let isMember=false;
  const isReviewer=new URLSearchParams(location.search).get('review')==='francine-full-preview';
  let isReady=false;
  let isShuffled=false;
  let repeatTrack=false;
  let hasStarted=false;
  let guestTrackId=sessionStorage.getItem('fmb-listening-guest-track')||'';
  let guestComplete=sessionStorage.getItem('fmb-listening-guest-complete')==='true';
  const fullAccess=()=>isMember||isReviewer;

  const escape=value=>window.FMB?.escapeHtml(value)||String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const formatTime=seconds=>{
    if(!Number.isFinite(seconds)||seconds<0)return'0:00';
    const minutes=Math.floor(seconds/60);
    return `${minutes}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
  };
  const shuffled=items=>{
    const next=[...items];
    for(let index=next.length-1;index>0;index--){
      const target=Math.floor(Math.random()*(index+1));
      [next[index],next[target]]=[next[target],next[index]];
    }
    return next;
  };

  function setButtonPlaying(button,playing){
    if(!button)return;
    button.querySelector('.play-symbol')?.toggleAttribute('hidden',playing);
    button.querySelector('.pause-symbol')?.toggleAttribute('hidden',!playing);
    button.setAttribute('aria-label',playing?'Pause':'Play');
  }

  function setPlayingState(playing){
    setButtonPlaying(elements.mainPlay,playing);
    setButtonPlaying(elements.miniPlay,playing);
    document.querySelectorAll('.song-row').forEach(row=>{
      const button=row.querySelector('.song-play');
      if(!button)return;
      const active=row.dataset.trackId===currentTrack?.id;
      const action=active&&playing?'Pause':'Play';
      button.setAttribute('aria-label',`${action} ${active&&playing?currentTrack.title:row.dataset.trackTitle||'track'}`);
      button.innerHTML=active&&playing
        ?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7v10M15 7v10"></path></svg><span class="song-action-label">Pause</span>'
        :'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z"></path></svg><span class="song-action-label">Play</span>';
    });
  }

  function updateActiveRows(){
    document.querySelectorAll('.song-row').forEach(row=>row.classList.toggle('active',row.dataset.trackId===currentTrack?.id));
    setPlayingState(!elements.audio.paused);
  }

  function setProgress(value){
    const percent=Math.max(0,Math.min(100,Number(value)||0));
    elements.progress.value=String(Math.round(percent*10));
    elements.progress.style.background=`linear-gradient(90deg,#fff ${percent}%,rgba(255,255,255,.2) ${percent}%)`;
  }

  function showDialog(){
    elements.audio.pause();
    setPlayingState(false);
    if(typeof elements.dialog.showModal==='function'){
      if(!elements.dialog.open)elements.dialog.showModal();
    }else elements.dialog.setAttribute('open','');
  }

  function closeDialog(){
    if(typeof elements.dialog.close==='function'&&elements.dialog.open)elements.dialog.close();
    else elements.dialog.removeAttribute('open');
  }

  function visitorMayOpen(track){
    if(fullAccess())return true;
    if(guestComplete){showDialog();return false}
    if(guestTrackId&&guestTrackId!==track.id){showDialog();return false}
    return true;
  }

  function trackById(id){return allTracks.find(track=>track.id===id)||null}

  function loadTrack(track,shouldPlay=false){
    if(!track||!visitorMayOpen(track))return;
    currentTrack=track;
    elements.audio.src=track.src;
    elements.audio.load();
    elements.title.textContent=track.title;
    elements.version.textContent=track.version||'Track';
    elements.collection.textContent=track.collectionTitle;
    elements.description.textContent=track.description;
    elements.moment.textContent=track.moment?`Suggested listening: ${track.moment}`:'';
    elements.credits.innerHTML=(track.credits||[]).map(credit=>`<span>${escape(credit)}</span>`).join('');
    elements.featuredArt.src=track.cover_url;
    elements.featuredArt.alt=`${track.collectionTitle} artwork for ${track.title}`;
    elements.miniCover.src=track.cover_url;
    elements.miniTitle.textContent=track.title;
    elements.miniArtist.textContent=track.artist;
    elements.duration.textContent=formatTime(track.duration_seconds);
    elements.currentTime.textContent='0:00';
    setProgress(0);
    updateActiveRows();
    if(shouldPlay)playCurrent();
  }

  function playCurrent(){
    if(!isReady||!currentTrack)return;
    if(!fullAccess()&&guestComplete){showDialog();return}
    elements.audio.play().catch(()=>{
      setPlayingState(false);
      elements.description.textContent='Tap play once more to begin. The browser paused the audio before it started.';
    });
  }

  function togglePlay(){
    if(!isReady||!currentTrack)return;
    if(!elements.audio.paused){elements.audio.pause();return}
    playCurrent();
  }

  function moveBy(direction,fromEnded=false){
    if(!queue.length||!currentTrack)return;
    if(!fullAccess()&&(guestTrackId||guestComplete)){
      if(fromEnded){
        guestComplete=true;
        sessionStorage.setItem('fmb-listening-guest-complete','true');
      }
      showDialog();
      return;
    }
    const index=Math.max(0,queue.findIndex(track=>track.id===currentTrack.id));
    const target=queue[(index+direction+queue.length)%queue.length];
    loadTrack(target,fromEnded||hasStarted);
  }

  function requestTrack(track){
    if(currentTrack?.id===track.id){togglePlay();return}
    loadTrack(track,true);
  }

  function renderCollection(id){
    activeCollection=id;
    const collection=collections.find(item=>item.id===id)||collections[0];
    if(!collection)return;
    elements.tabs.querySelectorAll('.collection-tab').forEach(tab=>{
      const selected=tab.dataset.collection===collection.id;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
    });
    const tracks=collection.tracks||[];
    elements.grid.innerHTML=`
      <section class="playlist-block" aria-labelledby="collection-${escape(collection.id)}">
        <div class="playlist-cover-head"><img src="${escape(collection.cover_url)}" alt="${escape(collection.title)} collection cover"><div><p class="music-kicker">With love, FMB Music</p><h3 id="collection-${escape(collection.id)}">${escape(collection.title)}</h3><p class="playlist-description">${escape(collection.description)}</p></div></div>
        <div class="track-list">${tracks.length?'':'<div class="music-empty">This collection is still being prepared.</div>'}</div>
      </section>`;
    const list=elements.grid.querySelector('.track-list');
    tracks.forEach(track=>{
      const row=document.createElement('article');
      row.className='song-row';
      row.dataset.trackId=track.id;
      row.dataset.trackTitle=track.title;
      row.innerHTML=`<div class="song-cover"><img src="${escape(track.cover_url)}" alt=""></div><div><div class="song-title">${escape(track.title)}</div><div class="song-artist">${escape(track.artist)}</div><span class="song-version-mobile">${escape(track.version)}</span></div><span class="song-version">${escape(track.version)}</span><span class="song-duration">${formatTime(track.duration_seconds)}</span><button class="song-play" type="button" aria-label="Play ${escape(track.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z"></path></svg><span class="song-action-label">Play</span></button>`;
      row.querySelector('.song-play').addEventListener('click',()=>requestTrack(track));
      list.appendChild(row);
    });
    updateActiveRows();
  }

  function renderTabs(){
    elements.tabs.innerHTML='';
    collections.forEach((collection,index)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='collection-tab';
      button.role='tab';
      button.dataset.collection=collection.id;
      button.setAttribute('aria-selected',String(collection.id===activeCollection));
      button.tabIndex=collection.id===activeCollection?0:-1;
      button.textContent=collection.title;
      button.addEventListener('click',()=>renderCollection(collection.id));
      button.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        const tabs=[...elements.tabs.querySelectorAll('.collection-tab')];
        const current=tabs.indexOf(button);
        const nextIndex=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
        tabs[nextIndex].focus();
        renderCollection(tabs[nextIndex].dataset.collection);
      });
      elements.tabs.appendChild(button);
    });
  }

  async function activeMember(){
    if(!window.FMB?.configured)return null;
    for(const mode of ['local','session']){
      const client=window.FMB.createClient(mode);
      try{
        const {data:{session}}=await client.auth.getSession();
        if(!session)continue;
        const {data:{user},error:userError}=await client.auth.getUser();
        if(userError||!user||!user.email_confirmed_at)continue;
        const {data:profile,error}=await client.from('profiles').select('status').eq('id',user.id).maybeSingle();
        if(!error&&profile?.status==='active')return {client,user};
      }catch{}
    }
    return null;
  }

  function updateMemberExperience(){
    elements.listeningState.textContent=isReviewer?'Private reviewer listening':isMember?'Member listening':'Public listening';
    if(elements.reviewerAccess)elements.reviewerAccess.hidden=!isReviewer;
    if(!fullAccess())return;
    guestTrackId='';
    guestComplete=false;
    sessionStorage.removeItem('fmb-listening-guest-track');
    sessionStorage.removeItem('fmb-listening-guest-complete');
    queue=shuffled(allTracks);
    isShuffled=true;
    elements.shuffle.setAttribute('aria-pressed','true');
    if(!isMember)return;
    const signIn=document.querySelector('.nav-actions a[href*="auth.html#signin"]');
    const join=document.querySelector('.nav-actions a[href*="auth.html#signup"]');
    if(signIn){signIn.href='member.html';signIn.textContent='Member space'}
    if(join)join.hidden=true;
    const profileLink=document.querySelector('.music-mobile-bar a:last-child');
    if(profileLink){profileLink.href='member.html';profileLink.querySelector('span').textContent='Profile'}
  }

  async function loadLibrary(){
    const response=await fetch('assets/data/music-library.json',{cache:'no-store'});
    if(!response.ok)throw new Error('The music library is unavailable.');
    const data=await response.json();
    collections=(data.collections||[]).map(collection=>({
      ...collection,
      tracks:(collection.tracks||[]).map(track=>({...track,collectionId:collection.id,collectionTitle:collection.title,cover_url:collection.cover_url}))
    }));
    allTracks=collections.flatMap(collection=>collection.tracks);
    queue=[...allTracks];
    if(!allTracks.length)throw new Error('No preview tracks are available.');
  }

  function setMiniVisibility(){
    if(!hasStarted||!elements.playerSection)return;
    const outside=elements.playerSection.getBoundingClientRect().bottom<120;
    elements.miniPlayer.hidden=!outside;
  }

  elements.mainPlay.addEventListener('click',togglePlay);
  elements.miniPlay.addEventListener('click',togglePlay);
  elements.prev.addEventListener('click',()=>moveBy(-1));
  elements.next.addEventListener('click',()=>moveBy(1));
  elements.miniPrev.addEventListener('click',()=>moveBy(-1));
  elements.miniNext.addEventListener('click',()=>moveBy(1));
  elements.volume.addEventListener('input',()=>{elements.audio.volume=Number(elements.volume.value)});
  elements.audio.volume=Number(elements.volume.value);
  elements.progress.addEventListener('input',()=>{
    if(!elements.audio.duration)return;
    const percent=Number(elements.progress.value)/10;
    elements.audio.currentTime=elements.audio.duration*(percent/100);
    setProgress(percent);
  });
  elements.detailsButton.addEventListener('click',()=>{
    const expanded=elements.detailsButton.getAttribute('aria-expanded')==='true';
    elements.detailsButton.setAttribute('aria-expanded',String(!expanded));
    elements.detailsButton.setAttribute('aria-label',expanded?'Show track details':'Hide track details');
    elements.details.hidden=expanded;
  });
  elements.shuffle.addEventListener('click',()=>{
    if(!fullAccess()&&guestTrackId){showDialog();return}
    isShuffled=!isShuffled;
    queue=isShuffled?shuffled(allTracks):[...allTracks];
    elements.shuffle.setAttribute('aria-pressed',String(isShuffled));
    if(!fullAccess()&&!guestTrackId){
      const random=queue.find(track=>track.id!==currentTrack?.id)||queue[0];
      loadTrack(random,false);
    }
  });
  elements.repeat.addEventListener('click',()=>{
    if(!fullAccess()&&guestTrackId){showDialog();return}
    repeatTrack=!repeatTrack;
    elements.repeat.setAttribute('aria-pressed',String(repeatTrack));
  });
  elements.dialogClose.addEventListener('click',closeDialog);
  elements.maybeLater.addEventListener('click',closeDialog);
  elements.dialog.addEventListener('click',event=>{if(event.target===elements.dialog)closeDialog()});
  elements.audio.addEventListener('contextmenu',event=>event.preventDefault());
  elements.audio.addEventListener('play',()=>{
    hasStarted=true;
    if(!fullAccess()&&!guestTrackId&&currentTrack){
      guestTrackId=currentTrack.id;
      sessionStorage.setItem('fmb-listening-guest-track',guestTrackId);
    }
    setPlayingState(true);
    setMiniVisibility();
  });
  elements.audio.addEventListener('pause',()=>setPlayingState(false));
  elements.audio.addEventListener('loadedmetadata',()=>{
    elements.duration.textContent=formatTime(elements.audio.duration||currentTrack?.duration_seconds);
  });
  elements.audio.addEventListener('timeupdate',()=>{
    elements.currentTime.textContent=formatTime(elements.audio.currentTime);
    setProgress(elements.audio.duration?elements.audio.currentTime/elements.audio.duration*100:0);
  });
  elements.audio.addEventListener('ended',()=>{
    setPlayingState(false);
    if(fullAccess()&&repeatTrack){elements.audio.currentTime=0;playCurrent();return}
    moveBy(1,true);
  });
  elements.audio.addEventListener('error',()=>{
    setPlayingState(false);
    elements.description.textContent='This track could not be opened. Please try another track or return later.';
  });
  window.addEventListener('scroll',setMiniVisibility,{passive:true});
  window.addEventListener('resize',setMiniVisibility,{passive:true});

  async function init(){
    try{
      const [member]=await Promise.all([activeMember(),loadLibrary()]);
      isMember=Boolean(member);
      updateMemberExperience();
      renderTabs();
      renderCollection(activeCollection);
      const restored=!fullAccess()&&guestTrackId?trackById(guestTrackId):null;
      const initial=restored||collections.find(collection=>collection.id==='calm')?.tracks[0]||allTracks[0];
      isReady=true;
      loadTrack(initial,false);
      if(!fullAccess()&&guestComplete)elements.description.textContent=initial.description;
    }catch(error){
      elements.grid.innerHTML='<div class="music-empty">The listening room could not be prepared right now. Please return later.</div>';
      elements.description.textContent='The music library is temporarily unavailable.';
    }
  }

  init();
})();
