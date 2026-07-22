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
  const miniProgress=document.getElementById('miniProgressFill');
  const currentTime=document.getElementById('currentTime');
  const duration=document.getElementById('duration');
  const volume=document.getElementById('volumeControl');
  const featuredArt=document.getElementById('featuredArt');
  const miniCover=document.getElementById('miniCover');
  if(!grid||!audio||!mainPlay)return;

  const PREVIEW_LIMIT=30;
  const MUSIC_STATE_KEY='fmb_music_state_v3';
  const PREVIEW_STATE_KEY='fmb_music_preview_v2';
  let tracks=[];
  let currentIndex=-1;
  let sourceTrackIndex=-1;
  let sourceIndex=0;
  let playRequested=false;
  let memberAllowed=false;

  const readJson=(storage,key)=>{try{const value=JSON.parse(storage.getItem(key)||'null');return value&&typeof value==='object'?value:null}catch{return null}};
  const writeJson=(storage,key,value)=>{try{storage.setItem(key,JSON.stringify(value))}catch{}};
  const escape=value=>String(value||'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const formatTime=seconds=>{if(!Number.isFinite(seconds)||seconds<0)return'0:00';const m=Math.floor(seconds/60);const s=Math.floor(seconds%60).toString().padStart(2,'0');return`${m}:${s}`};

  async function waitForMember(){
    if(window.FMB_MEMBER)return Boolean(window.FMB_MEMBER.isMember);
    return new Promise(resolve=>{
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(Boolean(value))};
      const timer=setTimeout(()=>finish(false),6500);
      addEventListener('fmb:auth-ready',event=>finish(event.detail?.isMember),{once:true});
    });
  }
  memberAllowed=await waitForMember();
  document.body.classList.remove('music-access-checking');
  document.body.classList.add(memberAllowed?'music-member-ready':'music-preview-ready');

  function openEmailAccess(message){
    if(message)note.textContent=message;
    if(window.FMBProductEmailAccess){window.FMBProductEmailAccess.open({mode:'music'});return}
    const trigger=document.querySelector('[data-fmb-email-access="music"]');
    if(trigger){trigger.click();return}
    note.textContent='Secure email access is unavailable right now. Please refresh and try again.';
  }

  function previewState(){return readJson(sessionStorage,PREVIEW_STATE_KEY)||{}}
  function previewUsed(){return Boolean(previewState().used)}
  function previewIndex(){const value=Number(previewState().index);return Number.isInteger(value)?value:-1}

  function sourceCandidates(track){
    const values=[];
    const fileId=String(track?.drive_file_id||'').trim();
    if(fileId){
      values.push(`/api/music?file=${encodeURIComponent(fileId)}`);
      values.push(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`);
    }
    const direct=track?.src||track?.audio_url;
    if(direct)values.push(String(direct).startsWith('/')?direct:`/${direct}`);
    return [...new Set(values.filter(Boolean))];
  }

  function normalizeTrack(track,playlist){
    return {...track,playlist,sources:sourceCandidates(track)};
  }

  function setArtwork(url){
    [featuredArt,miniCover].forEach(element=>{
      if(!element)return;
      element.style.backgroundImage=url?`url("${String(url).replace(/["\\]/g,'')}")`:'';
      element.style.backgroundSize='cover';
      element.style.backgroundPosition='center';
      element.style.backgroundRepeat='no-repeat';
    });
  }

  function setPlaying(playing){
    [mainPlay,miniPlay].filter(Boolean).forEach(button=>{
      button.dataset.playing=String(playing);
      button.textContent=playing?'Pause':'Play';
      button.setAttribute('aria-label',playing?'Pause':'Play');
    });
  }

  function updateRows(){
    document.querySelectorAll('.song-row').forEach(row=>row.classList.toggle('active',Number(row.dataset.index)===currentIndex));
  }

  function publishState(){
    const track=tracks[currentIndex]||{};
    const detail={
      index:currentIndex,
      title:track.title||'',
      artist:track.artist||'FMB Music',
      cover_url:track.cover_url||'',
      currentTime:Number.isFinite(audio.currentTime)?audio.currentTime:0,
      duration:Number.isFinite(audio.duration)?audio.duration:0,
      playing:!audio.paused&&!audio.ended
    };
    if(memberAllowed)writeJson(sessionStorage,MUSIC_STATE_KEY,{...detail,updatedAt:Date.now()});
    dispatchEvent(new CustomEvent('fmb:music-state',{detail}));
  }

  function resetAudioSource(){
    playRequested=false;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    sourceTrackIndex=-1;
    sourceIndex=0;
    currentTime.textContent='0:00';
    duration.textContent=memberAllowed?'0:00':'0:30';
    progressFill.style.width='0%';
    if(miniProgress)miniProgress.style.width='0%';
  }

  function selectTrack(index,{keepSource=false}={}){
    if(!tracks.length)return;
    const normalized=(Number(index)+tracks.length)%tracks.length;
    if(!keepSource&&normalized!==sourceTrackIndex)resetAudioSource();
    currentIndex=normalized;
    const track=tracks[currentIndex];
    title.textContent=(track.title||'Untitled track').replace(/^\d+[A-Z]?\.\s*/,'');
    artist.textContent=track.artist||'FMB Music';
    miniTitle.textContent=title.textContent;
    miniArtist.textContent=artist.textContent;
    note.textContent=track.description||'Select play when you are ready.';
    setArtwork(track.cover_url||'');
    updateRows();
    publishState();
  }

  function applySource(){
    const track=tracks[currentIndex];
    if(!track?.sources?.length){note.textContent='This published track does not have a playable audio source right now.';return false}
    if(sourceTrackIndex===currentIndex&&audio.src)return true;
    sourceTrackIndex=currentIndex;
    sourceIndex=0;
    audio.src=track.sources[0];
    return true;
  }

  function beginPlayback(){
    if(!applySource())return;
    playRequested=true;
    audio.play().then(()=>setPlaying(true)).catch(()=>{
      playRequested=false;
      setPlaying(false);
      note.textContent='Tap play again to begin. Your browser paused the first audio request.';
    });
  }

  function requestTrack(index){
    if(!tracks.length)return;
    const normalized=(Number(index)+tracks.length)%tracks.length;
    if(memberAllowed){selectTrack(normalized);beginPlayback();return}
    if(!previewUsed()){
      writeJson(sessionStorage,PREVIEW_STATE_KEY,{used:true,index:normalized,startedAt:Date.now()});
      selectTrack(normalized);
      note.textContent='Your 30-second public preview is playing.';
      beginPlayback();
      return;
    }
    if(normalized===previewIndex()){
      selectTrack(normalized,{keepSource:true});
      if(audio.currentTime<PREVIEW_LIMIT){beginPlayback();return}
    }
    selectTrack(normalized);
    openEmailAccess('Enter your email to continue listening beyond the public preview.');
  }

  function togglePlay(){
    if(!tracks.length){note.textContent='No published tracks are available right now.';return}
    if(currentIndex<0)selectTrack(0);
    if(!memberAllowed){
      if(!previewUsed()){requestTrack(currentIndex);return}
      if(currentIndex!==previewIndex()||audio.currentTime>=PREVIEW_LIMIT){openEmailAccess('Enter your email to continue listening beyond the public preview.');return}
    }
    if(audio.paused)beginPlayback();
    else{playRequested=false;audio.pause();setPlaying(false)}
  }

  function renderPlaylists(playlists){
    tracks=[];
    grid.innerHTML='';
    playlists.forEach(playlist=>{
      const block=document.createElement('section');
      block.className='playlist-block';
      block.dataset.collection=String(playlist.title||'').toLowerCase();
      block.innerHTML=`<h3>${escape(playlist.title)}</h3><p class="playlist-description">${escape(playlist.description||'')}</p><div class="track-list"></div>`;
      const list=block.querySelector('.track-list');
      (playlist.tracks||[]).forEach(raw=>{
        const track=normalizeTrack(raw,playlist.title);
        const index=tracks.length;
        tracks.push(track);
        const row=document.createElement('article');
        row.className='song-row';
        row.dataset.index=String(index);
        row.innerHTML=`
          <div class="song-cover"${track.cover_url?` style="background-image:url('${escape(track.cover_url)}');background-size:cover;background-position:center"`:''}>${track.cover_url?'':escape((track.title||'F')[0])}</div>
          <div><div class="song-title">${escape(track.title||'Untitled track')}</div><div class="song-artist">${escape(track.artist||'FMB Music')}</div></div>
          <div class="song-album">${escape(playlist.title||'FMB Music')}</div>
          <button class="song-play" type="button" aria-label="Play ${escape(track.title||'track')}">Play</button>`;
        row.querySelector('button').addEventListener('click',()=>requestTrack(index));
        row.addEventListener('dblclick',()=>requestTrack(index));
        list.appendChild(row);
      });
      grid.appendChild(block);
    });
    if(!tracks.length){grid.innerHTML='<div class="music-empty">The music library is ready, but no tracks have been published.</div>';return}
    const saved=memberAllowed?readJson(sessionStorage,MUSIC_STATE_KEY):null;
    const initial=Number.isInteger(saved?.index)&&saved.index<tracks.length?saved.index:(previewIndex()>=0&&previewIndex()<tracks.length?previewIndex():0);
    selectTrack(initial);
    note.textContent=memberAllowed?'Choose any track. Audio begins only after you press play.':previewUsed()?'Your preview choice is saved for this visit. Enter your email when you are ready to continue.':'Choose any track to begin a 30-second public preview.';
  }

  async function loadLibrary(){
    try{
      const response=await fetch('/assets/data/music-library.json',{cache:'no-store'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      renderPlaylists(data.playlists||[]);
    }catch(error){
      grid.innerHTML='<div class="music-empty">The published track list could not be opened right now. Please refresh and try again.</div>';
      note.textContent='The FMB Music library could not be loaded.';
      console.error('FMB Music library error',error);
    }
  }

  [mainPlay,miniPlay].filter(Boolean).forEach(button=>button.addEventListener('click',togglePlay));
  [prev,miniPrev].filter(Boolean).forEach(button=>button.addEventListener('click',()=>requestTrack((currentIndex<0?0:currentIndex)-1)));
  [next,miniNext].filter(Boolean).forEach(button=>button.addEventListener('click',()=>requestTrack((currentIndex<0?-1:currentIndex)+1)));
  if(volume){audio.volume=Number(volume.value);volume.addEventListener('input',()=>{audio.volume=Number(volume.value)})}

  audio.addEventListener('play',()=>{playRequested=true;setPlaying(true);publishState()});
  audio.addEventListener('pause',()=>{setPlaying(false);publishState()});
  audio.addEventListener('loadedmetadata',()=>{
    const visible=memberAllowed?audio.duration:Math.min(audio.duration||PREVIEW_LIMIT,PREVIEW_LIMIT);
    duration.textContent=formatTime(visible);
    publishState();
  });
  audio.addEventListener('timeupdate',()=>{
    if(!memberAllowed&&currentIndex===previewIndex()&&audio.currentTime>=PREVIEW_LIMIT){
      audio.pause();audio.currentTime=PREVIEW_LIMIT;setPlaying(false);openEmailAccess('Your 30-second preview has ended. Enter your email to continue listening.');
    }
    const effective=memberAllowed?audio.duration:Math.min(audio.duration||PREVIEW_LIMIT,PREVIEW_LIMIT);
    const percent=effective?Math.min(audio.currentTime,effective)/effective*100:0;
    currentTime.textContent=formatTime(audio.currentTime);
    progressFill.style.width=`${percent}%`;
    if(miniProgress)miniProgress.style.width=`${percent}%`;
    progressTrack.setAttribute('aria-valuenow',String(Math.round(percent)));
    publishState();
  });
  audio.addEventListener('ended',()=>{if(memberAllowed)requestTrack(currentIndex+1);else openEmailAccess('Enter your email to continue listening.')});
  audio.addEventListener('error',()=>{
    const track=tracks[currentIndex];
    if(track&&sourceIndex+1<track.sources.length){
      sourceIndex+=1;audio.src=track.sources[sourceIndex];note.textContent='Switching to a backup audio source.';
      if(playRequested)audio.play().catch(()=>{note.textContent='Tap play to continue with the backup source.'});
      return;
    }
    playRequested=false;setPlaying(false);note.textContent='This track could not be played. Try another published track.';
  });

  function seek(ratio){
    if(!audio.duration||sourceTrackIndex!==currentIndex)return;
    const limit=memberAllowed?audio.duration:Math.min(audio.duration,PREVIEW_LIMIT);
    audio.currentTime=Math.max(0,Math.min(1,ratio))*limit;
  }
  progressTrack.addEventListener('click',event=>{const rect=progressTrack.getBoundingClientRect();seek((event.clientX-rect.left)/rect.width)});
  progressTrack.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')seek(0);else if(event.key==='End')seek(1);else audio.currentTime=Math.max(0,Math.min(memberAllowed?(audio.duration||0):PREVIEW_LIMIT,audio.currentTime+(event.key==='ArrowRight'?5:-5)));
  });

  document.querySelectorAll('[data-collection-link],[data-music-sidebar]').forEach(link=>link.addEventListener('click',()=>{
    const key=link.dataset.collectionLink||link.dataset.musicSidebar||'all';
    const button=[...document.querySelectorAll('[data-music-filter]')].find(item=>item.dataset.musicFilter===key);
    button?.click();
  }));

  addEventListener('pagehide',publishState);
  await loadLibrary();
})();
