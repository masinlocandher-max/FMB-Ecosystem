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
  let tracks=[];
  let currentIndex=-1;

  const escapeHtml=value=>{const node=document.createElement('div');node.textContent=value||'';return node.innerHTML};
  const formatTime=seconds=>{if(!Number.isFinite(seconds))return'0:00';const mins=Math.floor(seconds/60);const secs=Math.floor(seconds%60).toString().padStart(2,'0');return `${mins}:${secs}`};
  const setPlayIcons=playing=>{mainPlay.textContent=playing?'❚❚':'▶';miniPlay.textContent=playing?'❚❚':'▶';mainPlay.setAttribute('aria-label',playing?'Pause':'Play');miniPlay.setAttribute('aria-label',playing?'Pause':'Play')};
  const updateActiveRows=()=>document.querySelectorAll('.song-row').forEach(row=>row.classList.toggle('active',Number(row.dataset.index)===currentIndex));

  function loadTrack(index,shouldPlay=true){
    if(!tracks.length)return;
    currentIndex=(index+tracks.length)%tracks.length;
    const track=tracks[currentIndex];
    if(!track.src){note.textContent='This track does not yet have a public audio link.';return}
    audio.src=track.src;
    title.textContent=track.title||'Untitled track';
    artist.textContent=track.artist||'FMB';
    miniTitle.textContent=track.title||'Untitled track';
    miniArtist.textContent=track.artist||'FMB';
    note.textContent='';
    updateActiveRows();
    if(shouldPlay){
      audio.play().then(()=>setPlayIcons(true)).catch(()=>{
        setPlayIcons(false);
        note.textContent='Tap play to begin. Your browser paused automatic audio.';
      });
    }
  }

  function togglePlay(){
    if(!tracks.length){note.textContent='The uploaded songs are not visible to the website yet.';return}
    if(currentIndex<0){loadTrack(0,true);return}
    if(audio.paused){audio.play().then(()=>setPlayIcons(true)).catch(()=>{note.textContent='Tap play again after the song finishes loading.'})}
    else{audio.pause();setPlayIcons(false)}
  }

  function render(data){
    tracks=[];
    grid.innerHTML='';
    (data.playlists||[]).forEach(playlist=>{
      const block=document.createElement('section');
      block.className='playlist-block';
      block.innerHTML=`<h3>${escapeHtml(playlist.title)}</h3><p class="playlist-description">${escapeHtml(playlist.description)}</p><div class="track-list"></div>`;
      const list=block.querySelector('.track-list');
      const playlistTracks=playlist.tracks||[];
      if(!playlistTracks.length){
        list.innerHTML=`<div class="music-empty">Songs uploaded to this folder still need a public audio link before the website can play them.</div>`;
      }else{
        playlistTracks.forEach(track=>{
          const index=tracks.length;
          tracks.push({...track,playlist:playlist.title});
          const row=document.createElement('div');
          row.className='song-row';
          row.dataset.index=String(index);
          row.innerHTML=`<div class="song-cover">f</div><div><div class="song-title">${escapeHtml(track.title||'Untitled track')}</div><div class="song-artist">${escapeHtml(track.artist||'FMB')}</div></div><button class="song-play" type="button" aria-label="Play ${escapeHtml(track.title||'track')}">▶</button>`;
          row.querySelector('button').addEventListener('click',()=>loadTrack(index,true));
          list.appendChild(row);
        });
      }
      grid.appendChild(block);
    });
    if(tracks.length){
      loadTrack(0,false);
      audio.play().then(()=>setPlayIcons(true)).catch(()=>{
        setPlayIcons(false);
        note.textContent='Tap play to begin. Automatic audio may be blocked on iPhone.';
      });
    }else{
      note.textContent='The music page is ready, but no playable audio links are in the library yet.';
    }
  }

  [mainPlay,miniPlay].forEach(button=>button.addEventListener('click',togglePlay));
  [prev,miniPrev].forEach(button=>button.addEventListener('click',()=>loadTrack(currentIndex-1,true)));
  [next,miniNext].forEach(button=>button.addEventListener('click',()=>loadTrack(currentIndex+1,true)));
  volume.addEventListener('input',()=>{audio.volume=Number(volume.value)});
  audio.volume=Number(volume.value);
  audio.addEventListener('play',()=>setPlayIcons(true));
  audio.addEventListener('pause',()=>setPlayIcons(false));
  audio.addEventListener('ended',()=>loadTrack(currentIndex+1,true));
  audio.addEventListener('loadedmetadata',()=>{duration.textContent=formatTime(audio.duration)});
  audio.addEventListener('timeupdate',()=>{
    currentTime.textContent=formatTime(audio.currentTime);
    const percent=audio.duration?audio.currentTime/audio.duration*100:0;
    progressFill.style.width=`${percent}%`;
  });
  progressTrack.addEventListener('click',event=>{
    if(!audio.duration)return;
    const rect=progressTrack.getBoundingClientRect();
    audio.currentTime=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width))*audio.duration;
  });

  fetch('assets/data/music-library.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error('Music library unavailable');return response.json()})
    .then(render)
    .catch(()=>{
      grid.innerHTML='<div class="music-empty">The music library could not be opened right now.</div>';
      note.textContent='The music library could not be opened right now.';
    });
})();
