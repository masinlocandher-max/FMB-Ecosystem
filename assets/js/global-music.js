(function(){
  'use strict';
  if(window.__fmbGlobalMusic)return;
  window.__fmbGlobalMusic=true;

  const STORAGE_KEY='fmb_music_state_v2';
  const MUSIC_PATH='/music/';
  const existingAudio=document.getElementById('audioPlayer');
  const audio=existingAudio||document.createElement('audio');
  const ownsAudio=!existingAudio;
  let tracks=[];
  let currentIndex=0;
  let lastSavedSecond=-1;
  let resumeRequested=false;

  if(ownsAudio){
    audio.id='fmbGlobalAudio';
    audio.preload='metadata';
    audio.hidden=true;
    document.body.appendChild(audio);
  }

  const readState=()=>{
    try{
      const value=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'{}');
      return value&&typeof value==='object'?value:{};
    }catch{return{}}
  };
  const writeState=patch=>{
    const previous=readState();
    const next={...previous,...patch,updatedAt:Date.now()};
    try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(next))}catch{}
    return next;
  };
  const cleanUrl=value=>String(value||'').replace(/["\\]/g,'');
  const flattenLibrary=data=>(data.playlists||[]).flatMap(playlist=>
    (playlist.tracks||[]).map(track=>({
      ...track,
      src:track.src||track.audio_url||'',
      playlist:playlist.title||''
    }))
  );

  const dock=document.createElement('aside');
  dock.className='fmb-music-dock';
  dock.setAttribute('aria-label','Persistent music controls');
  dock.innerHTML='<section class="fmb-music-panel" id="fmbMusicPanel" aria-label="Music control panel"><button class="fmb-music-close" type="button" aria-label="Close music controls">×</button><div class="fmb-music-panel-inner"><div class="fmb-music-art" aria-hidden="true"></div><div class="fmb-music-copy"><div class="fmb-music-kicker">With love, FMB Music</div><div class="fmb-music-title">Choose a track</div><div class="fmb-music-artist">Calm and original soundtracks</div></div><div class="fmb-music-progress" aria-hidden="true"><span></span></div><div class="fmb-music-controls"><button class="fmb-music-prev" type="button" aria-label="Previous track">Back</button><button class="fmb-music-play" type="button" aria-label="Play music">Play</button><button class="fmb-music-next" type="button" aria-label="Next track">Next</button></div><div class="fmb-music-status" role="status" aria-live="polite">Music is available across the website.</div></div></section><button class="fmb-music-orb" type="button" aria-expanded="false" aria-controls="fmbMusicPanel" aria-label="Open music controls"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg></button>';
  document.body.appendChild(dock);
  document.body.classList.add('fmb-global-music-ready');

  const panel=dock.querySelector('.fmb-music-panel');
  const orb=dock.querySelector('.fmb-music-orb');
  const closeButton=dock.querySelector('.fmb-music-close');
  const playButton=dock.querySelector('.fmb-music-play');
  const prevButton=dock.querySelector('.fmb-music-prev');
  const nextButton=dock.querySelector('.fmb-music-next');
  const title=dock.querySelector('.fmb-music-title');
  const artist=dock.querySelector('.fmb-music-artist');
  const art=dock.querySelector('.fmb-music-art');
  const progress=dock.querySelector('.fmb-music-progress span');
  const status=dock.querySelector('.fmb-music-status');

  const setOpen=open=>{
    dock.classList.toggle('is-open',Boolean(open));
    orb.setAttribute('aria-expanded',String(Boolean(open)));
    orb.setAttribute('aria-label',open?'Close music controls':'Open music controls');
    panel.setAttribute('aria-hidden',String(!open));
    if(open)playButton.focus({preventScroll:true});
  };
  const setPlaying=playing=>{
    playButton.textContent=playing?'Pause':'Play';
    playButton.setAttribute('aria-label',playing?'Pause music':'Play music');
    orb.classList.toggle('is-playing',playing);
  };
  const setTrackDisplay=track=>{
    if(!track)return;
    title.textContent=track.title||'Untitled track';
    artist.textContent=track.artist||'With love, FMB';
    const cover=cleanUrl(track.cover_url||track.cover||'');
    art.style.backgroundImage=cover?'url("'+cover+'")':'';
  };
  const stateForCurrent=()=>{
    const track=tracks[currentIndex]||{};
    return{
      index:currentIndex,
      src:audio.currentSrc||audio.src||track.src||'',
      title:title.textContent||track.title||'',
      artist:artist.textContent||track.artist||'With love, FMB',
      cover_url:track.cover_url||'',
      currentTime:Number.isFinite(audio.currentTime)?audio.currentTime:0,
      duration:Number.isFinite(audio.duration)?audio.duration:0,
      playing:!audio.paused&&!audio.ended
    };
  };
  const saveCurrent=()=>writeState(stateForCurrent());

  const dispatchCommand=(type,detail={})=>{
    window.dispatchEvent(new CustomEvent('fmb:global-music-command',{detail:{type,...detail}}));
  };

  const selectOwnedTrack=(index,shouldPlay=true,startTime=0)=>{
    if(!tracks.length)return;
    currentIndex=(Number(index)+tracks.length)%tracks.length;
    const track=tracks[currentIndex];
    if(!track?.src){
      status.textContent='This track is not available right now.';
      return;
    }
    const requestedSrc=new URL(track.src,location.href).href;
    if(audio.src!==requestedSrc)audio.src=track.src;
    setTrackDisplay(track);
    writeState({index:currentIndex,src:track.src,title:track.title,artist:track.artist,cover_url:track.cover_url,currentTime:startTime,playing:shouldPlay});
    const restoreTime=()=>{
      if(startTime>0&&Number.isFinite(audio.duration))audio.currentTime=Math.min(startTime,Math.max(0,audio.duration-.25));
      audio.removeEventListener('loadedmetadata',restoreTime);
    };
    if(startTime>0)audio.addEventListener('loadedmetadata',restoreTime);
    if(shouldPlay){
      audio.play().then(()=>{
        setPlaying(true);
        status.textContent='Playing across the website.';
      }).catch(()=>{
        resumeRequested=true;
        setPlaying(false);
        status.textContent='Tap Play to continue listening on this page.';
      });
    }
  };

  const selectTrack=(index,shouldPlay=true,startTime=0)=>{
    if(ownsAudio)selectOwnedTrack(index,shouldPlay,startTime);
    else dispatchCommand('track',{index,shouldPlay,startTime});
  };

  const toggle=()=>{
    if(!tracks.length&&ownsAudio){
      status.textContent='Open the Music page to view the complete library.';
      location.href=MUSIC_PATH;
      return;
    }
    if(ownsAudio){
      if(!audio.src){selectOwnedTrack(currentIndex,true);return}
      if(audio.paused){
        audio.play().then(()=>{
          resumeRequested=false;
          setPlaying(true);
          status.textContent='Playing across the website.';
        }).catch(()=>{status.textContent='The track could not begin. Please try again.'});
      }else audio.pause();
    }else dispatchCommand('toggle');
  };
  const move=direction=>{
    if(ownsAudio)selectOwnedTrack(currentIndex+direction,true);
    else dispatchCommand(direction<0?'previous':'next');
  };

  orb.addEventListener('click',()=>setOpen(!dock.classList.contains('is-open')));
  closeButton.addEventListener('click',()=>setOpen(false));
  playButton.addEventListener('click',toggle);
  prevButton.addEventListener('click',()=>move(-1));
  nextButton.addEventListener('click',()=>move(1));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dock.classList.contains('is-open'))setOpen(false)});

  audio.addEventListener('play',()=>{
    setPlaying(true);
    resumeRequested=false;
    status.textContent='Playing across the website.';
    saveCurrent();
  });
  audio.addEventListener('pause',()=>{setPlaying(false);saveCurrent()});
  audio.addEventListener('ended',()=>{
    if(ownsAudio)selectOwnedTrack(currentIndex+1,true);
  });
  audio.addEventListener('timeupdate',()=>{
    const percent=audio.duration?Math.min(100,audio.currentTime/audio.duration*100):0;
    progress.style.width=percent+'%';
    const second=Math.floor(audio.currentTime||0);
    if(second!==lastSavedSecond){
      lastSavedSecond=second;
      saveCurrent();
    }
  });
  audio.addEventListener('error',()=>{
    setPlaying(false);
    status.textContent='This audio file could not be played right now.';
  });

  window.addEventListener('fmb:music-state',event=>{
    const detail=event.detail||{};
    if(Number.isFinite(Number(detail.index)))currentIndex=Number(detail.index);
    setTrackDisplay(detail);
    if(Number.isFinite(Number(detail.currentTime))&&Number.isFinite(Number(detail.duration))&&Number(detail.duration)>0){
      progress.style.width=Math.min(100,Number(detail.currentTime)/Number(detail.duration)*100)+'%';
    }
    setPlaying(Boolean(detail.playing));
    writeState(detail);
  });

  const configureMediaSession=track=>{
    if(!('mediaSession' in navigator)||!track)return;
    try{
      navigator.mediaSession.metadata=new MediaMetadata({
        title:track.title||'With love, FMB Music',
        artist:track.artist||'With love, FMB',
        album:track.playlist||'With love, FMB Music',
        artwork:track.cover_url?[{src:track.cover_url,sizes:'512x512'}]:[]
      });
      navigator.mediaSession.setActionHandler('play',toggle);
      navigator.mediaSession.setActionHandler('pause',toggle);
      navigator.mediaSession.setActionHandler('previoustrack',()=>move(-1));
      navigator.mediaSession.setActionHandler('nexttrack',()=>move(1));
    }catch{}
  };

  async function loadLibrary(){
    try{
      const response=await fetch('/assets/data/music-library.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Music library unavailable');
      tracks=flattenLibrary(await response.json());
      const saved=readState();
      const matchedIndex=tracks.findIndex(track=>saved.src&&new URL(track.src,location.href).href===new URL(saved.src,location.href).href);
      currentIndex=matchedIndex>=0?matchedIndex:Math.max(0,Math.min(Number(saved.index)||0,Math.max(0,tracks.length-1)));
      const track=tracks[currentIndex];
      setTrackDisplay(saved.title?{...track,...saved}:track);
      configureMediaSession(track);
      if(ownsAudio&&track){
        const shouldResume=Boolean(saved.playing);
        selectOwnedTrack(currentIndex,shouldResume,Number(saved.currentTime)||0);
        if(!shouldResume)status.textContent='Ready when you are.';
      }else if(existingAudio){
        status.textContent=existingAudio.paused?'Ready when you are.':'Playing across the website.';
      }
    }catch{
      status.textContent='Music is available from the Music page.';
    }
  }

  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link)return;
    const url=new URL(link.href,location.href);
    if(url.origin===location.origin)saveCurrent();
  },{capture:true});
  window.addEventListener('pagehide',saveCurrent);
  window.addEventListener('pageshow',()=>{
    const state=readState();
    if(resumeRequested||state.playing)status.textContent=audio.paused?'Tap Play to continue listening on this page.':'Playing across the website.';
  });

  panel.setAttribute('aria-hidden','true');
  loadLibrary();
})();