(function(){
  'use strict';

  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];

  const CHECKIN_KEY='fmb-mental-checkins-v1';
  const JOURNAL_KEY='fmb-mental-journal-v1';
  const REMINDER_KEY='fmb-mental-reminder-preference-v1';

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

  const initial=['home','checkin','journal','history','tools','privacy','help'].includes(location.hash.slice(1))
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
