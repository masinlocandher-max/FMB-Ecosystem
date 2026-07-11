(function(){
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
  let tracks=[];
  let currentIndex=-1;

  const escape=value=>window.FMB?.escapeHtml(value)||String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const formatTime=seconds=>{if(!Number.isFinite(seconds))return'0:00';const minutes=Math.floor(seconds/60);const remainder=Math.floor(seconds%60).toString().padStart(2,'0');return `${minutes}:${remainder}`};
  const setPlayIcons=playing=>{mainPlay.textContent=playing?'❚❚':'▶';miniPlay.textContent=playing?'❚❚':'▶';mainPlay.setAttribute('aria-label',playing?'Pause':'Play');miniPlay.setAttribute('aria-label',playing?'Pause':'Play')};
  const updateActiveRows=()=>document.querySelectorAll('.song-row').forEach(row=>row.classList.toggle('active',Number(row.dataset.index)===currentIndex));

  function setArtwork(url){
    [featuredArt,miniCover].forEach(element=>{
      if(!element)return;
      element.style.backgroundImage=url?`url("${String(url).replace(/["\\]/g,'')}")`:'';
      element.style.backgroundSize='cover';
      element.style.backgroundPosition='center';
    });
  }
  function loadTrack(index,shouldPlay=true){
    if(!tracks.length)return;
    currentIndex=(index+tracks.length)%tracks.length;
    const track=tracks[currentIndex];
    if(!track.src){note.textContent='This track does not have a playable public audio file.';return}
    audio.src=track.src;
    title.textContent=track.title||'Untitled track';
    artist.textContent=track.artist||'FMB';
    miniTitle.textContent=track.title||'Untitled track';
    miniArtist.textContent=track.artist||'FMB';
    setArtwork(track.cover_url||'');
    note.textContent=track.description||'';
    updateActiveRows();
    if(shouldPlay)audio.play().then(()=>setPlayIcons(true)).catch(()=>{setPlayIcons(false);note.textContent='Tap play to begin. Your browser paused automatic audio.'});
  }
  function togglePlay(){
    if(!tracks.length){note.textContent='No published music is available yet.';return}
    if(currentIndex<0){loadTrack(0,true);return}
    if(audio.paused)audio.play().then(()=>setPlayIcons(true)).catch(()=>{note.textContent='The track could not begin. Check the public audio link and try again.'});
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
        const cover=track.cover_url?`style="background-image:url('${escape(track.cover_url)}');background-size:cover;background-position:center"`:'';
        row.innerHTML=`<div class="song-cover" ${cover}>${track.cover_url?'':escape((track.title||'F')[0])}</div><div><div class="song-title">${escape(track.title||'Untitled track')}</div><div class="song-artist">${escape(track.artist||'FMB')}</div></div><button class="song-play" type="button" aria-label="Play ${escape(track.title||'track')}">▶</button>`;
        row.querySelector('button').addEventListener('click',()=>loadTrack(index,true));list.appendChild(row);
      });
      grid.appendChild(block);
    });
    if(tracks.length){loadTrack(0,false);note.textContent='Choose a song and press play.'}
    else{grid.innerHTML='<div class="music-empty">The music player is ready, but no tracks have been published yet.</div>';note.textContent='No published music is available yet.'}
  }

  async function loadLibrary(){
    if(window.FMB?.configured){
      const client=window.FMB.createClient('local');
      const {data,error}=await client.from('music_entries').select('id,title,artist,description,category,audio_url,cover_url,sort_order').eq('status','published').order('sort_order').order('created_at');
      if(!error){
        const groups=new Map();
        (data||[]).forEach(item=>{
          const category=item.category||'Music';
          if(!groups.has(category))groups.set(category,{title:category,description:'',tracks:[]});
          groups.get(category).tracks.push({id:item.id,title:item.title,artist:item.artist,description:item.description,src:item.audio_url,cover_url:item.cover_url});
        });
        renderPlaylists([...groups.values()]);return;
      }
    }
    try{
      const response=await fetch('assets/data/music-library.json',{cache:'no-store'});
      if(!response.ok)throw new Error('Unavailable');
      const data=await response.json();
      renderPlaylists((data.playlists||[]).map(playlist=>({...playlist,tracks:(playlist.tracks||[]).map(track=>({...track,src:track.src||track.audio_url}))})));
    }catch{
      grid.innerHTML='<div class="music-empty">The music library could not be opened right now.</div>';
      note.textContent='The music library could not be opened right now.';
    }
  }

  [mainPlay,miniPlay].forEach(button=>button.addEventListener('click',togglePlay));
  [prev,miniPrev].forEach(button=>button.addEventListener('click',()=>loadTrack(currentIndex-1,true)));
  [next,miniNext].forEach(button=>button.addEventListener('click',()=>loadTrack(currentIndex+1,true)));
  volume.addEventListener('input',()=>{audio.volume=Number(volume.value)});audio.volume=Number(volume.value);
  audio.addEventListener('play',()=>setPlayIcons(true));audio.addEventListener('pause',()=>setPlayIcons(false));audio.addEventListener('ended',()=>loadTrack(currentIndex+1,true));
  audio.addEventListener('loadedmetadata',()=>{duration.textContent=formatTime(audio.duration)});
  audio.addEventListener('error',()=>{setPlayIcons(false);note.textContent='This audio file could not be played. The public link or file format may need attention.'});
  audio.addEventListener('timeupdate',()=>{
    currentTime.textContent=formatTime(audio.currentTime);const percent=audio.duration?audio.currentTime/audio.duration*100:0;progressFill.style.width=`${percent}%`;progressTrack.setAttribute('aria-valuenow',String(Math.round(percent)));
  });
  function seek(ratio){if(!audio.duration)return;audio.currentTime=Math.max(0,Math.min(1,ratio))*audio.duration}
  progressTrack.addEventListener('click',event=>{const rect=progressTrack.getBoundingClientRect();seek((event.clientX-rect.left)/rect.width)});
  progressTrack.addEventListener('keydown',event=>{if(!audio.duration||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='Home')seek(0);else if(event.key==='End')seek(1);else audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+(event.key==='ArrowRight'?5:-5)))});
  loadLibrary();
})();
