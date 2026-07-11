(function(){
  'use strict';
  const grid=document.getElementById('playlistGrid');
  const audio=document.getElementById('audioPlayer');
  const title=document.getElementById('nowTitle');
  const artist=document.getElementById('nowArtist');
  const note=document.getElementById('playerNote');
  const escapeHtml=value=>{const node=document.createElement('div');node.textContent=value||'';return node.innerHTML};
  function playTrack(track){if(!track.src)return;audio.src=track.src;title.textContent=track.title||'Untitled track';artist.textContent=track.artist||'FMB';note.textContent='';audio.play().catch(()=>{})}
  function render(data){grid.innerHTML='';(data.playlists||[]).forEach(playlist=>{const card=document.createElement('article');card.className='playlist-card';const tracks=playlist.tracks||[];card.innerHTML=`<p class="eyebrow">Playlist</p><h2>${escapeHtml(playlist.title)}</h2><p>${escapeHtml(playlist.description)}</p><div class="track-list"></div>`;const list=card.querySelector('.track-list');if(!tracks.length){list.innerHTML='<div class="empty-state">Tracks are being prepared. This playlist will update as music is added.</div>'}else{tracks.forEach(track=>{const row=document.createElement('div');row.className='track';row.innerHTML=`<div><strong>${escapeHtml(track.title||'Untitled track')}</strong><div class="form-note">${escapeHtml(track.artist||'FMB')}</div></div><button type="button" aria-label="Play ${escapeHtml(track.title||'track')}">▶</button>`;row.querySelector('button').addEventListener('click',()=>playTrack(track));list.appendChild(row)})}grid.appendChild(card)})}
  fetch('assets/data/music-library.json').then(r=>{if(!r.ok)throw new Error('Music library unavailable');return r.json()}).then(render).catch(()=>{grid.innerHTML='<article class="playlist-card"><div class="empty-state">The music library could not be opened right now.</div></article>'});
})();
