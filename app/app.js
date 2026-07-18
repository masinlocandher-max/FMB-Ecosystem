(function(){
  'use strict';

  function installListenReadUI(){
    if(document.getElementById('screen-listen'))return;
    const style=document.createElement('style');
    style.id='listen-read-styles';
    style.textContent=`/* Listen and Read sections */
.playlist-tabs{display:flex;gap:8px;margin-top:20px;padding-bottom:4px;overflow-x:auto;scrollbar-width:none}.playlist-tabs::-webkit-scrollbar{display:none}.playlist-tabs button{flex:0 0 auto;min-height:42px;padding:9px 15px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.76);color:var(--muted);font-size:11px;font-weight:850}.playlist-tabs button.active{border-color:rgba(111,22,165,.38);background:var(--violet-900);color:#fff}.listen-player{margin-top:14px;padding:20px}.listen-now{display:grid;grid-template-columns:92px minmax(0,1fr);gap:16px;align-items:center}.listen-now img{width:92px;height:92px;border-radius:21px;object-fit:cover;box-shadow:0 12px 30px rgba(45,23,56,.13)}.listen-now h2{margin-top:5px;font-size:27px}.listen-now p:last-child{margin-top:7px;color:var(--muted);font-size:11.5px}.listen-player audio{width:100%;margin-top:18px}.listen-controls{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.track-list{display:grid;gap:9px;margin-top:14px}.track-card{display:grid;grid-template-columns:38px minmax(0,1fr) 30px;gap:11px;align-items:center;width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:19px;background:rgba(255,255,255,.76);text-align:left;color:var(--ink)}.track-card.active{border-color:rgba(111,22,165,.38);background:linear-gradient(145deg,var(--violet-100),#fff);box-shadow:0 10px 25px rgba(81,11,119,.08)}.track-number{display:grid;width:34px;height:34px;place-items:center;border-radius:12px;background:var(--violet-100);color:var(--violet-900);font-size:10px;font-weight:900}.track-card strong{display:block;color:var(--violet-900);font-size:12.5px}.track-card small{display:block;margin-top:3px;color:var(--muted);font-size:10px;line-height:1.4}.track-play{color:var(--violet-700);font-size:13px;text-align:center}.reading-grid{display:grid;gap:12px;margin-top:20px}.reading-card{display:grid;grid-template-columns:48px minmax(0,1fr);gap:15px;align-items:start;width:100%;padding:19px;text-align:left;color:var(--ink)}.reading-mark{display:grid;width:44px;height:54px;place-items:center;border-radius:12px 12px 8px 8px;background:linear-gradient(160deg,var(--violet-900),var(--violet-600));color:#fff;font-family:Georgia,"Times New Roman",serif;font-size:15px;box-shadow:0 9px 20px rgba(81,11,119,.18)}.reading-card small{color:#9a7118;font-size:9px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.reading-card h2{margin-top:6px;font-size:25px}.reading-card p{margin-top:7px;color:var(--muted);font-size:11.5px}.reader-panel{margin-top:18px;padding:20px;scroll-margin-top:78px}.reader-head{position:sticky;top:67px;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:14px;margin:-4px -4px 0;padding:10px 4px 14px;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.reader-head h2{margin-top:5px;font-size:27px}.reader-close{min-height:40px;padding:8px 13px;border:1px solid var(--line);border-radius:999px;background:var(--violet-100);color:var(--violet-900);font-size:10px;font-weight:850}.reader-content{margin-top:10px}.reader-content h2{margin:8px 0 18px;font-size:34px}.reader-content h3{margin:27px 0 12px;font-size:29px}.reader-content h4{margin:22px 0 8px;color:var(--violet-900);font-family:Georgia,"Times New Roman",serif;font-size:21px}.reader-content p{margin-bottom:15px;color:#403247;font-size:14px;line-height:1.75}.reader-content blockquote{margin:20px 0;padding:17px 18px;border-left:4px solid var(--gold);border-radius:0 15px 15px 0;background:linear-gradient(90deg,rgba(214,170,66,.12),rgba(170,88,211,.08));color:var(--violet-900);font-family:Georgia,"Times New Roman",serif;font-size:21px;font-style:italic;line-height:1.45}.reader-list-item{padding-left:8px}.reader-loading{padding:24px;text-align:center;color:var(--muted);font-size:12px}.quick-card.quiet{background:rgba(248,242,251,.82)}
@media(max-width:430px){.listen-now{grid-template-columns:76px minmax(0,1fr)}.listen-now img{width:76px;height:76px}.listen-now h2{font-size:23px}.track-card{grid-template-columns:34px minmax(0,1fr) 24px;padding:12px}.reading-card{grid-template-columns:42px minmax(0,1fr);padding:17px}.reading-mark{width:40px;height:50px}.reader-head{top:62px}}`;
    document.head.appendChild(style);

    const grid=document.querySelector('#screen-home .quick-grid');
    if(grid){
      const journal=grid.querySelector('[data-go="journal"]');
      if(journal)journal.insertAdjacentHTML('afterend','<button class="quick-card" type="button" data-go="listen"><small>Listen</small><h3>Music for the moment</h3><p>Calm instrumentals and gentle feel-good collections.</p></button><button class="quick-card" type="button" data-go="read"><small>Read</small><h3>Supportive ebooks</h3><p>Open wellbeing guides without leaving the focused app.</p></button>');
    }

    const history=document.getElementById('screen-history');
    if(history)history.insertAdjacentHTML('beforebegin',`    <section class="screen" id="screen-listen" data-screen="listen">
      <p class="kicker">Music for wellbeing</p>
      <h1 class="page-title">Choose what the moment needs.</h1>
      <p class="page-lede">Listen to Calm when you want less noise, or choose a Feel Good collection for gentle energy and movement. Music may support a pause, but it is not treatment or emergency help.</p>
      <div class="playlist-tabs" id="playlist-tabs" aria-label="Wellbeing music collections"></div>
      <article class="listen-player card">
        <div class="listen-now">
          <img id="listen-cover" src="/assets/images/music/fmb-calm-official-album-cover.jpg" alt="Calm music collection cover">
          <div><p class="kicker" id="listen-collection">Calm</p><h2 id="listen-title">Choose a track</h2><p id="listen-description">Your approved wellbeing music will appear here.</p></div>
        </div>
        <audio id="wellbeing-audio" controls preload="metadata"></audio>
        <div class="listen-controls"><button class="button soft" id="listen-prev" type="button">Previous</button><button class="button soft" id="listen-next" type="button">Next</button></div>
      </article>
      <div class="track-list" id="track-list"><div class="empty card">Loading the approved music library.</div></div>
      <p class="notice">Choose a comfortable volume. Stop listening when sound feels overstimulating or unpleasant.</p>
    </section>
    <section class="screen" id="screen-read" data-screen="read">
      <p class="kicker">Supportive reading</p>
      <h1 class="page-title">Read only what feels useful today.</h1>
      <p class="page-lede">These public guides offer reflection and general education. They do not diagnose, replace professional care, or require you to finish everything in one sitting.</p>
      <div class="reading-grid" id="reading-grid">
        <button class="reading-card card" type="button" data-read-source="/reading.html" data-read-title="Finding Your Way Back to Yourself"><span class="reading-mark">01</span><div><small>Mental health and identity</small><h2>Finding Your Way Back to Yourself</h2><p>For feeling lost, left behind, unsure, unseen, or afraid to begin again.</p></div></button>
        <button class="reading-card card" type="button" data-read-source="/coming-out-respect.html" data-read-title="Pride. Identity. Love."><span class="reading-mark">02</span><div><small>Identity and belonging</small><h2>Pride. Identity. Love.</h2><p>Safety, privacy, identity, allyship, and choosing when or whether to come out.</p></div></button>
        <button class="reading-card card" type="button" data-read-source="/men-can-cry.html" data-read-title="Men Can Cry"><span class="reading-mark">03</span><div><small>Emotional honesty</small><h2>Men Can Cry</h2><p>A compassionate guide to feelings, respect, asking for help, and healthier masculinity.</p></div></button>
      </div>
      <article class="reader-panel card" id="reader-panel" hidden><div class="reader-head"><div><p class="kicker">In-app reader</p><h2 id="reader-title"></h2></div><button class="reader-close" id="reader-close" type="button" aria-label="Close reading">Close</button></div><div class="reader-content" id="reader-content"></div></article>
      <p class="notice">Keep what helps and leave what does not. For immediate danger or crisis, use the Support section instead of relying on a reading guide.</p>
    </section>`);

    const nav=document.querySelector('.tabbar');
    if(nav){
      const historyTab=nav.querySelector('[data-tab="history"]');
      const toolsTab=nav.querySelector('[data-tab="tools"]');
      if(historyTab)historyTab.remove();
      if(toolsTab)toolsTab.remove();
      nav.insertAdjacentHTML('beforeend','<button type="button" data-tab="listen" data-go="listen"><span>♪</span><span>Listen</span></button><button type="button" data-tab="read" data-go="read"><span>▤</span><span>Read</span></button>');
    }
  }

  installListenReadUI();

  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];

  const CHECKIN_KEY='fmb-mental-checkins-v1';
  const JOURNAL_KEY='fmb-mental-journal-v1';
  const REMINDER_KEY='fmb-mental-reminder-preference-v1';
  const MUSIC_DATA_URL='/assets/data/music-library.json';
  const WELLBEING_PLAYLIST_IDS=['calm','seventies-feel-good','eighties-feel-good'];

  const screens=$$('[data-screen]');
  const tabs=$$('[data-tab]');
  const MOOD_EMOJI={1:'😰',2:'😢',3:'😟',4:'😌',5:'🙂'};

  const ACKNOWLEDGMENTS={
    5:{
      title:'It sounds like there is some steadiness today.',
      message:'Thank you for noticing it. You can save this moment, write what is helping, or simply continue with your day.'
    },
    4:{
      title:'Mostly okay still deserves a check-in.',
      message:'There may be tension beside the okay parts. You do not need to force either feeling away.'
    },
    3:{
      title:'Heavy or uncertain can be difficult to hold.',
      message:'Thank you for naming it. You may write a little, try one slow breathing cycle, or look at support without having to explain everything.'
    },
    2:{
      title:'It sounds like today is taking a lot from you.',
      message:'You do not have to solve the whole day here. Consider reaching out to someone you trust, using a grounding tool, or opening the support directory.'
    },
    1:{
      title:'Your safety matters more than completing this check-in.',
      message:'Please contact emergency services, an available crisis line, or a trusted person nearby now. This app cannot send help or guarantee that FMB or a volunteer is available.'
    }
  };

  let selectedMood=null;
  let breathing=false;
  let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let selectedHistoryDate=localDateKey();
  let wellbeingPlaylists=[];
  let currentPlaylistIndex=0;
  let currentTrackIndex=0;
  let musicReady=false;

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)||'[]')}
    catch{return []}
  }

  function write(key,value){
    try{localStorage.setItem(key,JSON.stringify(value));return true}
    catch{return false}
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>'"]/g,char=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#39;',
      '"':'&quot;'
    }[char]));
  }

  function localDate(value=new Date()){
    return new Intl.DateTimeFormat('en-PH',{
      weekday:'short',
      month:'short',
      day:'numeric',
      year:'numeric'
    }).format(value);
  }

  function localDateKey(value=new Date()){
    const date=value instanceof Date?value:new Date(value);
    const year=date.getFullYear();
    const month=String(date.getMonth()+1).padStart(2,'0');
    const day=String(date.getDate()).padStart(2,'0');
    return `${year}-${month}-${day}`;
  }

  function dateFromKey(key){
    const [year,month,day]=key.split('-').map(Number);
    return new Date(year,month-1,day);
  }

  function moodEmoji(value){
    return MOOD_EMOJI[Math.max(1,Math.min(5,Number(value)||3))]||'😟';
  }

  function journalDateKey(entry){
    return entry.date||localDateKey(entry.createdAt);
  }

  function toast(message){
    const el=$('#toast');
    el.textContent=message;
    el.classList.add('visible');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>el.classList.remove('visible'),2600);
  }

  function updatePrivacySummary(){
    $('#privacy-checkin-count').textContent=String(read(CHECKIN_KEY).length);
    $('#privacy-journal-count').textContent=String(read(JOURNAL_KEY).length);
  }

  function go(name,{updateHash=true}={}){
    const target=$(`[data-screen="${name}"]`);
    if(!target)return;

    screens.forEach(screen=>screen.classList.toggle('active',screen===target));
    tabs.forEach(tab=>tab.classList.toggle('active',tab.dataset.tab===name));

    if(updateHash)history.replaceState(null,'',`#${name}`);
    window.scrollTo({top:0,behavior:'smooth'});

    if(name==='home')renderToday();
    if(name==='journal')renderJournal();
    if(name==='history')renderCalendar();
    if(name==='listen')initListen();
    if(name==='privacy')updatePrivacySummary();
  }

  $$('[data-go]').forEach(control=>control.addEventListener('click',event=>{
    event.preventDefault();
    go(control.dataset.go);
  }));

  window.addEventListener('hashchange',()=>go(location.hash.slice(1)||'home',{updateHash:false}));

  const moodButtons=$$('.mood-option');
  moodButtons.forEach(button=>button.addEventListener('click',()=>{
    selectedMood={
      value:Number(button.dataset.mood),
      label:button.dataset.label,
      emoji:button.dataset.emoji
    };

    moodButtons.forEach(item=>item.classList.toggle('selected',item===button));

    const acknowledgment=ACKNOWLEDGMENTS[selectedMood.value]||ACKNOWLEDGMENTS[3];
    $('#ack-emoji').textContent=selectedMood.emoji;
    $('#ack-title').textContent=acknowledgment.title;
    $('#ack-message').textContent=acknowledgment.message;
    $('#feeling-ack').hidden=false;
    $('#checkin-followup').hidden=false;
    $('#save-checkin').disabled=false;
    $('#support-inline').classList.toggle('visible',selectedMood.value<=2);
    $('#checkin-confirmation').classList.remove('visible');

    requestAnimationFrame(()=>$('#feeling-ack').scrollIntoView({behavior:'smooth',block:'nearest'}));
  }));

  $('#save-checkin').addEventListener('click',()=>{
    if(!selectedMood)return;

    const entries=read(CHECKIN_KEY);
    const today=localDateKey();
    const entry={
      id:Date.now(),
      date:today,
      createdAt:new Date().toISOString(),
      mood:selectedMood.value,
      label:selectedMood.label,
      emoji:selectedMood.emoji,
      note:$('#checkin-note').value.trim()
    };

    const withoutToday=entries.filter(item=>item.date!==today);
    withoutToday.unshift(entry);

    if(!write(CHECKIN_KEY,withoutToday.slice(0,365))){
      toast('This browser could not save the check-in.');
      return;
    }

    $('#checkin-confirmation').classList.add('visible');
    toast('Today’s check-in was saved privately on this device.');
    setTimeout(()=>go('home'),900);
  });

  function renderToday(){
    $('#today-label').textContent=localDate();

    const today=localDateKey();
    const entry=read(CHECKIN_KEY).find(item=>item.date===today);
    const card=$('#today-card');

    if(!entry){
      card.innerHTML='<h3>No check-in yet.</h3><p>There is no right mood to choose. Start with the one closest to what you feel.</p>';
      return;
    }

    const emoji=entry.emoji||moodEmoji(entry.mood);
    card.innerHTML=`<h3>Today’s check-in is saved.</h3><div class="today-row"><span class="mood-mark" aria-hidden="true">${emoji}</span><span><strong>${escapeHtml(entry.label)}</strong><span>${entry.note?escapeHtml(entry.note):'No note added.'}</span></span></div>`;
  }

  const journalText=$('#journal-text');
  journalText.addEventListener('input',()=>$('#journal-count').textContent=`${journalText.value.length} characters`);
  $('#journal-date').textContent=localDate();

  $('#save-journal').addEventListener('click',()=>{
    const text=journalText.value.trim();

    if(!text){
      toast('Write something before saving.');
      journalText.focus();
      return;
    }

    const entries=read(JOURNAL_KEY);
    entries.unshift({
      id:Date.now(),
      date:localDateKey(),
      createdAt:new Date().toISOString(),
      text
    });

    if(!write(JOURNAL_KEY,entries.slice(0,365))){
      toast('This browser could not save the entry.');
      return;
    }

    journalText.value='';
    $('#journal-count').textContent='0 characters';
    renderJournal();
    toast('Journal entry saved privately on this device.');
  });

  function renderJournal(){
    const list=$('#journal-list');
    const entries=read(JOURNAL_KEY);

    if(!entries.length){
      list.innerHTML='<div class="empty card">No journal entries yet. Your first saved reflection will appear here.</div>';
      return;
    }

    list.innerHTML=entries.map(entry=>`<article class="journal-entry card"><time>${escapeHtml(localDate(new Date(entry.createdAt)))}</time><p>${escapeHtml(entry.text)}</p><div class="entry-bottom"><button type="button" data-delete-entry="${entry.id}">Delete</button></div></article>`).join('');

    $$('[data-delete-entry]').forEach(button=>button.addEventListener('click',()=>{
      if(!window.confirm('Delete this journal entry from this device?'))return;
      const next=read(JOURNAL_KEY).filter(entry=>String(entry.id)!==button.dataset.deleteEntry);
      write(JOURNAL_KEY,next);
      renderJournal();
      toast('Entry deleted from this device.');
    }));
  }


  function absoluteAssetPath(value){
    if(!value)return '';
    if(/^https?:\/\//i.test(value))return value;
    return `/${String(value).replace(/^\/+/, '')}`;
  }

  async function initListen(){
    if(musicReady)return;
    const list=$('#track-list');

    try{
      const response=await fetch(MUSIC_DATA_URL,{cache:'no-store'});
      if(!response.ok)throw new Error('Music library unavailable');
      const library=await response.json();
      wellbeingPlaylists=(library.playlists||[]).filter(playlist=>WELLBEING_PLAYLIST_IDS.includes(playlist.id));
      if(!wellbeingPlaylists.length)throw new Error('No wellbeing collections found');
      musicReady=true;
      renderPlaylistTabs();
      selectPlaylist(0,false);
    }catch(error){
      list.innerHTML='<div class="empty card">The music library could not be loaded right now. Please check your connection and try again.</div>';
      toast('The music library could not be loaded.');
    }
  }

  function renderPlaylistTabs(){
    const tabsContainer=$('#playlist-tabs');
    tabsContainer.innerHTML=wellbeingPlaylists.map((playlist,index)=>`<button type="button" data-playlist-index="${index}">${escapeHtml(playlist.title)}</button>`).join('');
    $$('[data-playlist-index]').forEach(button=>button.addEventListener('click',()=>selectPlaylist(Number(button.dataset.playlistIndex),false)));
  }

  function selectPlaylist(index,autoplay=false){
    currentPlaylistIndex=Math.max(0,Math.min(index,wellbeingPlaylists.length-1));
    currentTrackIndex=0;
    $$('[data-playlist-index]').forEach((button,buttonIndex)=>button.classList.toggle('active',buttonIndex===currentPlaylistIndex));
    renderTrackList();
    selectTrack(0,autoplay);
  }

  function renderTrackList(){
    const playlist=wellbeingPlaylists[currentPlaylistIndex];
    const list=$('#track-list');
    list.innerHTML=(playlist.tracks||[]).map((track,index)=>`<button class="track-card" type="button" data-track-index="${index}"><span class="track-number">${String(index+1).padStart(2,'0')}</span><span><strong>${escapeHtml(track.title.replace(/^\d+[A-Z]?\.\s*/,''))}</strong><small>${escapeHtml(track.description||playlist.description||'Wellbeing music')}</small></span><span class="track-play" aria-hidden="true">▶</span></button>`).join('');
    $$('[data-track-index]').forEach(button=>button.addEventListener('click',()=>selectTrack(Number(button.dataset.trackIndex),true)));
  }

  function selectTrack(index,autoplay=false){
    const playlist=wellbeingPlaylists[currentPlaylistIndex];
    const tracks=playlist?.tracks||[];
    if(!tracks.length)return;

    currentTrackIndex=(index+tracks.length)%tracks.length;
    const track=tracks[currentTrackIndex];
    const audio=$('#wellbeing-audio');

    $('#listen-cover').src=absoluteAssetPath(track.cover_url||playlist.cover_url);
    $('#listen-cover').alt=`${playlist.title} music collection cover`;
    $('#listen-collection').textContent=playlist.title;
    $('#listen-title').textContent=track.title.replace(/^\d+[A-Z]?\.\s*/,'');
    $('#listen-description').textContent=track.description||playlist.description||'';

    audio.src=absoluteAssetPath(track.src);
    $$('[data-track-index]').forEach((button,buttonIndex)=>button.classList.toggle('active',buttonIndex===currentTrackIndex));

    if(autoplay){
      audio.play().catch(()=>toast('Tap play in the audio control to begin.'));
    }
  }

  $('#listen-prev').addEventListener('click',()=>selectTrack(currentTrackIndex-1,true));
  $('#listen-next').addEventListener('click',()=>selectTrack(currentTrackIndex+1,true));
  $('#wellbeing-audio').addEventListener('ended',()=>selectTrack(currentTrackIndex+1,true));
  $('#wellbeing-audio').addEventListener('error',()=>toast('This track could not be played. Try another track.'));

  function readableElements(documentRoot){
    const main=documentRoot.querySelector('main');
    if(!main)return [];
    const chapters=[...main.querySelectorAll('.reader-cover,.chapter')];
    const roots=chapters.length?chapters:[main];
    return roots.flatMap(root=>[...root.querySelectorAll('h1,h2,h3,p,li,blockquote')]);
  }

  async function openReading(source,title){
    const panel=$('#reader-panel');
    const content=$('#reader-content');
    $('#reader-title').textContent=title;
    panel.hidden=false;
    content.innerHTML='<div class="reader-loading">Opening the guide gently.</div>';
    panel.scrollIntoView({behavior:'smooth',block:'start'});

    try{
      const response=await fetch(source,{cache:'no-store'});
      if(!response.ok)throw new Error('Reading unavailable');
      const html=await response.text();
      const documentRoot=new DOMParser().parseFromString(html,'text/html');
      const elements=readableElements(documentRoot);
      if(!elements.length)throw new Error('Reading content unavailable');

      content.innerHTML=elements.map(element=>{
        const text=escapeHtml(element.textContent.trim());
        if(!text)return '';
        if(element.tagName==='H1')return `<h2>${text}</h2>`;
        if(element.tagName==='H2')return `<h3>${text}</h3>`;
        if(element.tagName==='H3')return `<h4>${text}</h4>`;
        if(element.tagName==='LI')return `<p class="reader-list-item">• ${text}</p>`;
        if(element.tagName==='BLOCKQUOTE')return `<blockquote>${text}</blockquote>`;
        return `<p>${text}</p>`;
      }).join('');
    }catch(error){
      content.innerHTML='<div class="empty">This guide could not be opened inside the app right now.</div>';
      toast('The reading guide could not be loaded.');
    }
  }

  $$('[data-read-source]').forEach(button=>button.addEventListener('click',()=>openReading(button.dataset.readSource,button.dataset.readTitle)));
  $('#reader-close').addEventListener('click',()=>{
    $('#reader-panel').hidden=true;
    $('#reader-content').innerHTML='';
    $('#reading-grid').scrollIntoView({behavior:'smooth',block:'start'});
  });

  function renderCalendar(){
    const year=calendarCursor.getFullYear();
    const month=calendarCursor.getMonth();

    $('#calendar-month').textContent=new Intl.DateTimeFormat('en-PH',{
      month:'long',
      year:'numeric'
    }).format(calendarCursor);

    const checkins=read(CHECKIN_KEY);
    const journals=read(JOURNAL_KEY);
    const checkinMap=new Map(checkins.map(entry=>[entry.date,entry]));
    const journalMap=new Map();

    journals.forEach(entry=>{
      const key=journalDateKey(entry);
      const list=journalMap.get(key)||[];
      list.push(entry);
      journalMap.set(key,list);
    });

    const firstDay=new Date(year,month,1).getDay();
    const gridStart=new Date(year,month,1-firstDay);
    const today=localDateKey();
    const cells=[];

    for(let index=0;index<42;index++){
      const date=new Date(gridStart);
      date.setDate(gridStart.getDate()+index);

      const key=localDateKey(date);
      const checkin=checkinMap.get(key);
      const dayJournals=journalMap.get(key)||[];
      const outside=date.getMonth()!==month;
      const classes=['calendar-day'];

      if(outside)classes.push('outside');
      if(checkin||dayJournals.length)classes.push('has-data');
      if(key===selectedHistoryDate)classes.push('selected');
      if(key===today)classes.push('today');

      const label=`${localDate(date)}${checkin?`, check-in: ${checkin.label}`:''}${dayJournals.length?`, ${dayJournals.length} journal ${dayJournals.length===1?'entry':'entries'}`:''}`;

      cells.push(`<button class="${classes.join(' ')}" type="button" data-history-date="${key}" aria-label="${escapeHtml(label)}"><span class="day-number">${date.getDate()}</span><span class="day-emoji" aria-hidden="true">${checkin?(checkin.emoji||moodEmoji(checkin.mood)):''}</span>${dayJournals.length?'<span class="day-journal" aria-hidden="true"></span>':''}</button>`);
    }

    $('#calendar-grid').innerHTML=cells.join('');

    $$('[data-history-date]').forEach(button=>button.addEventListener('click',()=>{
      selectedHistoryDate=button.dataset.historyDate;
      const date=dateFromKey(selectedHistoryDate);

      if(date.getMonth()!==calendarCursor.getMonth()||date.getFullYear()!==calendarCursor.getFullYear()){
        calendarCursor=new Date(date.getFullYear(),date.getMonth(),1);
      }

      renderCalendar();
    }));

    renderHistoryDetail(selectedHistoryDate,checkinMap,journalMap);
  }

  function renderHistoryDetail(key,checkinMap=null,journalMap=null){
    const checkins=checkinMap||new Map(read(CHECKIN_KEY).map(entry=>[entry.date,entry]));
    const journals=journalMap||(()=>{
      const map=new Map();
      read(JOURNAL_KEY).forEach(entry=>{
        const entryKey=journalDateKey(entry);
        const list=map.get(entryKey)||[];
        list.push(entry);
        map.set(entryKey,list);
      });
      return map;
    })();

    const checkin=checkins.get(key);
    const dayJournals=journals.get(key)||[];
    const detail=$('#history-detail');
    const heading=escapeHtml(localDate(dateFromKey(key)));

    if(!checkin&&!dayJournals.length){
      detail.innerHTML=`<h3>${heading}</h3><p class="history-empty">No check-in or journal entry was saved for this date.</p>`;
      return;
    }

    let html=`<h3>${heading}</h3>`;

    if(checkin){
      html+=`<div class="history-block"><div class="history-label">Daily check-in</div><div class="history-checkin"><span class="mood-mark" aria-hidden="true">${checkin.emoji||moodEmoji(checkin.mood)}</span><div><strong>${escapeHtml(checkin.label)}</strong><p>${checkin.note?escapeHtml(checkin.note):'No note added.'}</p></div></div></div>`;
    }

    if(dayJournals.length){
      html+=`<div class="history-block"><div class="history-label">Journal ${dayJournals.length===1?'entry':'entries'}</div>${dayJournals.map(entry=>`<div class="history-journal"><time>${escapeHtml(new Intl.DateTimeFormat('en-PH',{hour:'numeric',minute:'2-digit'}).format(new Date(entry.createdAt)))}</time><p>${escapeHtml(entry.text)}</p></div>`).join('')}</div>`;
    }

    detail.innerHTML=html;
  }

  $('#calendar-prev').addEventListener('click',()=>{
    calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);
    renderCalendar();
  });

  $('#calendar-next').addEventListener('click',()=>{
    calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);
    renderCalendar();
  });

  const reminderSelect=$('#reminder-preference');
  reminderSelect.value=localStorage.getItem(REMINDER_KEY)||'off';
  reminderSelect.addEventListener('change',()=>{
    localStorage.setItem(REMINDER_KEY,reminderSelect.value);
    toast('Reminder preference saved on this device. Notifications are not active yet.');
  });

  $('#export-records').addEventListener('click',()=>{
    const payload={
      exportedAt:new Date().toISOString(),
      source:'With Love, FMB mental-health app',
      storage:'Local browser storage on this device',
      checkins:read(CHECKIN_KEY),
      journalEntries:read(JOURNAL_KEY),
      reminderPreference:localStorage.getItem(REMINDER_KEY)||'off'
    };

    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=`with-love-fmb-private-records-${localDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Personal records export prepared.');
  });

  $('#delete-checkins').addEventListener('click',()=>{
    if(!window.confirm('Delete all saved check-in history from this device? This cannot be undone.'))return;
    localStorage.removeItem(CHECKIN_KEY);
    selectedHistoryDate=localDateKey();
    renderToday();
    renderCalendar();
    updatePrivacySummary();
    toast('Check-in history deleted from this device.');
  });

  $('#delete-journals').addEventListener('click',()=>{
    if(!window.confirm('Delete all journal entries from this device? This cannot be undone.'))return;
    localStorage.removeItem(JOURNAL_KEY);
    renderJournal();
    renderCalendar();
    updatePrivacySummary();
    toast('All journal entries deleted from this device.');
  });

  $('#delete-all-private-data').addEventListener('click',()=>{
    if(!window.confirm('Delete all local app data, including check-ins, journals, and reminder preference?'))return;
    if(!window.confirm('This cannot be undone. Delete all local app data now?'))return;

    localStorage.removeItem(CHECKIN_KEY);
    localStorage.removeItem(JOURNAL_KEY);
    localStorage.removeItem(REMINDER_KEY);

    reminderSelect.value='off';
    selectedHistoryDate=localDateKey();
    renderToday();
    renderJournal();
    renderCalendar();
    updatePrivacySummary();
    toast('All local app data was deleted.');
  });

  const affirmations=[
    'You do not have to solve everything in this moment.',
    'Rest is not proof that you have failed.',
    'A difficult feeling is real, but it is not your whole identity.',
    'You are allowed to ask for help before things become unbearable.',
    'Small, steady care still counts.',
    'You can pause without explaining your exhaustion to everyone.',
    'Today can be survived one honest step at a time.'
  ];

  $('#new-affirmation').addEventListener('click',()=>{
    const current=$('#affirmation').textContent;
    const choices=affirmations.filter(item=>item!==current);
    $('#affirmation').textContent=choices[Math.floor(Math.random()*choices.length)];
  });

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  async function breathingPhase(label,className,seconds){
    const orb=$('#breathe-orb');
    orb.className=`breathe-orb ${className}`;
    $('#breathe-label').textContent=label;

    for(let value=seconds;value>0;value--){
      $('#breathe-time').textContent=`${label}: ${value}`;
      await wait(1000);
    }
  }

  $('#start-breathing').addEventListener('click',async()=>{
    if(breathing)return;

    breathing=true;
    const button=$('#start-breathing');
    button.disabled=true;
    button.textContent='Breathing cycle in progress';

    await breathingPhase('Inhale','inhale',4);
    await breathingPhase('Hold','hold',2);
    await breathingPhase('Exhale','exhale',6);

    $('#breathe-orb').className='breathe-orb';
    $('#breathe-label').textContent='Done';
    $('#breathe-time').textContent='Return to your natural breathing.';

    button.disabled=false;
    button.textContent='Begin another cycle';
    breathing=false;
  });

  const initial=['home','checkin','journal','listen','read','history','tools','privacy','help'].includes(location.hash.slice(1))
    ?location.hash.slice(1)
    :'home';

  go(initial,{updateHash:false});
  renderToday();
  renderJournal();
  renderCalendar();
  updatePrivacySummary();

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}),{once:true});
  }
})();
