(async function(){
  'use strict';
  const grid=document.getElementById('playlistGrid');
  const audio=document.getElementById('audioPlayer');
  const title=document.getElementById('nowTitle');
  const artist=document.getElementById('nowArtist');
  const note=document.getElementById('playerNote');
  const mainPlay=document.getElementById('mainPlayButton');
  const miniPlay=document.getElementById('miniPlay');
  const prev=document.getElementById('prevButton');
  const next=document.getElementById('nextButton');
  const miniPrev=document.getElementById('miniPrev');
  const miniNext=document.getElementById('miniNext');
  const miniTitle=document.getElementById('miniTitle');
  const miniArtist=document.getElementById('miniArtist');
  const progressTrack=document.getElementById('progressTrack');
  const progressFill=document.getElementById('progressFill');
  const currentTime=document.getElementById('currentTime');
  const duration=document.getElementById('duration');
  const volume=document.getElementById('volumeControl');
  const featuredArt=document.getElementById('featuredArt');
  const miniCover=document.getElementById('miniCover');
  if(!grid||!audio||!mainPlay)return;

  let tracks=[];
  let currentIndex=-1;
  let pendingRestoreTime=0;
  let lastPublishedSecond=-1;
  const musicStateKey='fmb_music_state_v2';
  const previewStateKey='fmb_music_preview_v1';
  const previewLimit=30;

  const waitForMember=()=>{
    if(window.FMB_MEMBER)return Promise.resolve(Boolean(window.FMB_MEMBER.isMember));
    return new Promise(resolve=>{
      let finished=false;
      const done=value=>{if(finished)return;finished=true;window.clearTimeout(timer);resolve(Boolean(value))};
      const timer=window.setTimeout(()=>done(false),7000);
      window.addEventListener('fmb:auth-ready',event=>done(event.detail?.isMember),{once:true});
    });
  };

  const memberAllowed=await waitForMember();
  document.body.classList.remove('music-access-checking');
  document.body.classList.add(memberAllowed?'music-member-ready':'music-preview-ready');

  const readJson=(key)=>{try{const value=JSON.parse(sessionStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{}}catch{return{}}};
  const writeJson=(key,value)=>{try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}};
  let previewState=readJson(previewStateKey);
  const previewUsed=()=>Boolean(previewState.used);
  const previewTrackIndex=()=>Number.isInteger(previewState.index)?previewState.index:-1;

  function injectPreviewUi(){
    if(memberAllowed||document.getElementById('musicAccessPrompt'))return;
    const style=document.createElement('style');
    style.textContent=`
      .music-access-overlay{position:fixed;inset:0;z-index:10020;display:none;place-items:center;padding:24px;background:rgba(24,8,34,.38);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .music-access-overlay.open{display:grid}
      .music-access-dialog{width:min(440px,100%);padding:28px;border:1px solid rgba(255,255,255,.6);border-radius:28px;background:rgba(255,250,255,.94);box-shadow:0 28px 80px rgba(38,8,55,.28);color:#35133f;text-align:left}
      .music-access-dialog small{display:block;margin-bottom:8px;font-size:.74rem;letter-spacing:.15em;text-transform:uppercase;color:#795184}
      .music-access-dialog h2{margin:0 0 10px;font:600 clamp(2rem,7vw,3rem)/.96 'Cormorant Garamond',serif}
      .music-access-dialog p{margin:0;color:#5f4865;line-height:1.6}
      .music-access-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
      .music-access-actions a,.music-access-actions button{min-height:44px;padding:12px 17px;border:1px solid rgba(81,11,119,.18);border-radius:999px;font:inherit;text-decoration:none;cursor:pointer}
      .music-access-actions a{background:#510b77;color:#fff}
      .music-access-actions a.secondary{background:#fff;color:#510b77}
      .music-access-actions button{background:transparent;color:#6c5572}
    `;
    document.head.appendChild(style);
    const overlay=document.createElement('div');
    overlay.id='musicAccessPrompt';
    overlay.className='music-access-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-labelledby','musicAccessTitle');
    overlay.innerHTML=`<div class="music-access-dialog"><small>With love, FMB Music</small><h2 id="musicAccessTitle">Continue listening</h2><p>Create an account or sign in to hear the full track and explore the complete music library.</p><div class="music-access-actions"><a href="/auth.html#signup">Create an account</a><a class="secondary" href="/auth.html#signin">Sign in</a><button type="button" data-close-music-prompt>Keep browsing</button></div></div>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.classList.remove('open');
    overlay.addEventListener('click',event=>{if(event.target===overlay||event.target.closest('[data-close-music-prompt]'))close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  }

  function showAccessPrompt(message){
    if(memberAllowed)return;
    if(message)note.textContent=message;
    const prompt=document.getElementById('musicAccessPrompt');
    prompt?.classList.add('open');
  }

  injectPreviewUi();

  const readMusicState=()=>readJson(musicStateKey);
  const publishState=()=>{
    const track=tracks[currentIndex]||{};
    const detail={
      index:currentIndex,
      src:audio.currentSrc||audio.src||track.src||'',
      title:track.title||title.textContent||'',
      artist:track.artist||artist.textContent||'With love, FMB',
      cover_url:track.cover_url||'',
      currentTime:Number.isFinite(audio.currentTime)?audio.currentTime:0,
      duration:Number.isFinite(audio.duration)?audio.duration:0,
      playing:!audio.paused&&!audio.ended
    };
    if(memberAllowed)writeJson(musicStateKey,{...detail,updatedAt:Date.now()});
    window.dispatchEvent(new CustomEvent('fmb:music-state',{detail}));
  };

  const escape=value=>window.FMB?.escapeHtml(value)||String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const formatTime=seconds=>{if(!Number.isFinite(seconds))return'0:00';const minutes=Math.floor(seconds/60);const remainder=Math.floor(seconds%60).toString().padStart(2,'0');return `${minutes}:${remainder}`};
  const setPlayIcons=playing=>{mainPlay.textContent=playing?'Pause':'Play';miniPlay.textContent=playing?'Pause':'Play';mainPlay.setAttribute('aria-label',playing?'Pause':'Play');miniPlay.setAttribute('aria-label',playing?'Pause':'Play')};
  const updateActiveRows=()=>document.querySelectorAll('.song-row').forEach(row=>row.classList.toggle('active',Number(row.dataset.index)===currentIndex));

  function setArtwork(url){
    [featuredArt,miniCover].forEach(element=>{
      if(!element)return;
      element.style.backgroundImage=url?`url("${String(url).replace(/["\\]/g,'')}")`:'';
      element.style.backgroundSize='contain';
      element.style.backgroundPosition='center';
      element.style.backgroundRepeat='no-repeat';
    });
  }

  function loadTrack(index,shouldPlay=true){
    if(!tracks.length)return;
    currentIndex=(index+tracks.length)%tracks.length;
    const track=tracks[currentIndex];
    if(!track.src){note.textContent='This track does not have a playable audio file.';return}
    audio.src=track.src;
    title.textContent=track.title||'Untitled track';
    artist.textContent=track.artist||'FMB';
    miniTitle.textContent=track.title||'Untitled track';
    miniArtist.textContent=track.artist||'FMB';
    setArtwork(track.cover_url||'');
    note.textContent=track.description||'';
    updateActiveRows();
    publishState();
    if(shouldPlay)audio.play().then(()=>setPlayIcons(true)).catch(()=>{setPlayIcons(false);note.textContent='Tap play to begin. Your browser paused automatic audio.'});
  }

  function requestTrack(index){
    if(memberAllowed){loadTrack(index,true);return}
    if(!previewUsed()){
      previewState={used:true,index,startedAt:Date.now()};
      writeJson(previewStateKey,previewState);
      loadTrack(index,true);
      note.textContent='Preview playing. Enjoy a short listen.';
      return;
    }
    if(index===previewTrackIndex()&&currentIndex===index&&audio.currentTime<previewLimit){
      audio.play().then(()=>setPlayIcons(true)).catch(()=>{note.textContent='Tap play again to continue the preview.'});
      return;
    }
    showAccessPrompt('Create an account or sign in to continue listening.');
  }

  function togglePlay(){
    if(!tracks.length){note.textContent='No published music is available yet.';return}
    if(memberAllowed){
      if(currentIndex<0){loadTrack(0,true);return}
      if(audio.paused)audio.play().then(()=>setPlayIcons(true)).catch(()=>{note.textContent='The track could not begin. Please try again.'});
      else{audio.pause();setPlayIcons(false)}
      return;
    }
    if(currentIndex<0){requestTrack(0);return}
    if(!previewUsed()){requestTrack(currentIndex);return}
    if(currentIndex!==previewTrackIndex()||audio.currentTime>=previewLimit){showAccessPrompt('Create an account or sign in to continue listening.');return}
    if(audio.paused)audio.play().then(()=>setPlayIcons(true)).catch(()=>{note.textContent='Tap play again to continue the preview.'});
    else{audio.pause();setPlayIcons(false)}
  }

  function renderPlaylists(playlists){
    tracks=[];grid.innerHTML='';
    playlists.forEach(playlist=>{
      const block=document.createElement('section');
      block.className='playlist-block';
      block.innerHTML=`<h3>${escape(playlist.title)}</h3><p class="playlist-description">${escape(playlist.description||'')}</p><div class="track-list"></div>`;
      const list=block.querySelector('.track-list');
      if(!playlist.tracks?.length)list.innerHTML='<div class="music-empty">No published tracks are available in this category yet.</div>';
      else playlist.tracks.forEach(track=>{
        const index=tracks.length;tracks.push({...track,playlist:playlist.title});
        const row=document.createElement('div');row.className='song-row';row.dataset.index=String(index);
        const cover=track.cover_url?`style="background-image:url('${escape(track.cover_url)}');background-size:contain;background-position:center;background-repeat:no-repeat"`:'';
        row.innerHTML=`<div class="song-cover" ${cover}>${track.cover_url?'':escape((track.title||'F')[0])}</div><div><div class="song-title">${escape(track.title||'Untitled track')}</div><div class="song-artist">${escape(track.artist||'FMB')}</div></div><button class="song-play" type="button" aria-label="Play ${escape(track.title||'track')}">Play</button>`;
        row.querySelector('button').addEventListener('click',()=>requestTrack(index));list.appendChild(row);
      });
      grid.appendChild(block);
    });
    if(tracks.length){
      if(memberAllowed){
        const saved=readMusicState();
        const savedIndex=Math.max(0,Math.min(Number(saved.index)||0,tracks.length-1));
        pendingRestoreTime=Number(saved.currentTime)||0;
        loadTrack(savedIndex,false);
        note.textContent=saved.playing?'Restoring your listening session.':'Choose a song and press play.';
        if(saved.playing)audio.play().catch(()=>{note.textContent='Tap play to continue listening on this page.'});
      }else{
        const initialIndex=previewTrackIndex()>=0&&previewTrackIndex()<tracks.length?previewTrackIndex():0;
        loadTrack(initialIndex,false);
        note.textContent=previewUsed()?'Choose a track. Sign in when you are ready to continue listening.':'Choose any track to begin a short preview.';
      }
    }else{grid.innerHTML='<div class="music-empty">The music player is ready, but no tracks have been published yet.</div>';note.textContent='No published music is available yet.'}
  }

  async function loadLibrary(){
    try{
      const response=await fetch('assets/data/music-library.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Unavailable');
      const data=await response.json();
      const approved=(data.playlists||[]).map(playlist=>({...playlist,tracks:(playlist.tracks||[]).map(track=>({...track,src:track.src||track.audio_url}))}));
      renderPlaylists(approved);
    }catch{
      grid.innerHTML='<div class="music-empty">The music library could not be opened right now.</div>';
      note.textContent='The music library could not be opened right now.';
    }
  }

  [mainPlay,miniPlay].forEach(button=>button.addEventListener('click',togglePlay));
  [prev,miniPrev].forEach(button=>button.addEventListener('click',()=>requestTrack(currentIndex-1)));
  [next,miniNext].forEach(button=>button.addEventListener('click',()=>requestTrack(currentIndex+1)));
  volume.addEventListener('input',()=>{audio.volume=Number(volume.value)});audio.volume=Number(volume.value);
  audio.addEventListener('play',()=>{setPlayIcons(true);publishState()});
  audio.addEventListener('pause',()=>{setPlayIcons(false);publishState()});
  audio.addEventListener('ended',()=>{if(memberAllowed)loadTrack(currentIndex+1,true);else showAccessPrompt('Create an account or sign in to continue listening.')});
  audio.addEventListener('loadedmetadata',()=>{
    const visibleDuration=memberAllowed?audio.duration:Math.min(audio.duration||previewLimit,previewLimit);
    duration.textContent=formatTime(visibleDuration);
    if(memberAllowed&&pendingRestoreTime>0){audio.currentTime=Math.min(pendingRestoreTime,Math.max(0,audio.duration-.25));pendingRestoreTime=0}
    publishState();
  });
  audio.addEventListener('error',()=>{setPlayIcons(false);note.textContent='This audio file could not be played. Please try another track.'});
  audio.addEventListener('timeupdate',()=>{
    if(!memberAllowed&&previewUsed()&&currentIndex===previewTrackIndex()&&audio.currentTime>=previewLimit){
      audio.pause();audio.currentTime=previewLimit;setPlayIcons(false);showAccessPrompt('Your preview has ended. Sign in or create an account to hear the full track.');
    }
    currentTime.textContent=formatTime(audio.currentTime);
    const effectiveDuration=memberAllowed?audio.duration:Math.min(audio.duration||previewLimit,previewLimit);
    const percent=effectiveDuration?Math.min(audio.currentTime,effectiveDuration)/effectiveDuration*100:0;
    progressFill.style.width=`${percent}%`;progressTrack.setAttribute('aria-valuenow',String(Math.round(percent)));
    const second=Math.floor(audio.currentTime||0);if(second!==lastPublishedSecond){lastPublishedSecond=second;publishState()}
  });
  function seek(ratio){
    if(!audio.duration)return;
    if(!memberAllowed){
      if(!previewUsed()||currentIndex!==previewTrackIndex()){showAccessPrompt('Choose a preview first, then sign in to continue listening.');return}
      audio.currentTime=Math.max(0,Math.min(previewLimit,ratio*previewLimit));
      return;
    }
    audio.currentTime=Math.max(0,Math.min(1,ratio))*audio.duration;
  }
  progressTrack.addEventListener('click',event=>{const rect=progressTrack.getBoundingClientRect();seek((event.clientX-rect.left)/rect.width)});
  progressTrack.addEventListener('keydown',event=>{if(!audio.duration||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='Home')seek(0);else if(event.key==='End')seek(1);else audio.currentTime=Math.max(0,Math.min(memberAllowed?audio.duration:previewLimit,audio.currentTime+(event.key==='ArrowRight'?5:-5)))});
  window.addEventListener('fmb:global-music-command',event=>{
    const command=event.detail||{};
    if(command.type==='toggle')togglePlay();
    else if(command.type==='previous')requestTrack(currentIndex-1);
    else if(command.type==='next')requestTrack(currentIndex+1);
    else if(command.type==='track')requestTrack(Number(command.index)||0);
  });
  window.addEventListener('pagehide',publishState);
  loadLibrary();
})();
