(function(){
  'use strict';
  const STORAGE_KEY='withlovefmb_public_daily_v1';
  const $=selector=>document.querySelector(selector);
  const affirmations=[
    'You deserve to meet this day without abandoning yourself.',
    'A gentle pace is still a meaningful way forward.',
    'You are allowed to protect your peace without explaining every boundary.',
    'Your feelings can be honest without becoming the whole story.',
    'You do not have to earn rest, care, or a softer beginning.',
    'The next honest step is enough for today.',
    'You can begin again without speaking badly about who you were before.',
    'Being seen starts with refusing to disappear from yourself.',
    'You are still worthy on days when confidence feels far away.',
    'Small acts of care can return you to yourself.'
  ];
  const moodNames={1:'Heavy',2:'Low',3:'Steady',4:'Hopeful',5:'Strong'};
  const today=()=>{
    const date=new Date();
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  };
  const readableDate=value=>new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  const escape=value=>window.FMB?.escapeHtml(value)||String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const clean=(value,max)=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
  const cleanMultiline=(value,max)=>String(value||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'').trim().slice(0,max);
  let state={checkins:[],journal:[]};

  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    state.checkins=Array.isArray(saved.checkins)?saved.checkins.slice(0,90):[];
    state.journal=Array.isArray(saved.journal)?saved.journal.slice(0,250):[];
  }catch{}

  function persist(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch{return false}
  }
  function showStatus(element,message,type=''){
    if(!element)return;
    element.hidden=false;
    element.textContent=message;
    element.className=`inline-status${type?' '+type:''}`;
  }
  function makeId(){
    if(window.crypto?.randomUUID)return window.crypto.randomUUID();
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const dateKey=today();
  const seed=Number(dateKey.replace(/-/g,''));
  $('#dailyAffirmation').textContent=affirmations[seed%affirmations.length];
  $('#affirmationDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  $('#guestJournalDate').value=dateKey;

  function renderCheckins(){
    const list=$('#guestCheckinList');
    const rows=[...state.checkins].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14);
    list.innerHTML=rows.length?rows.map(item=>`<article class="daily-entry"><div class="daily-entry-head"><strong>${escape(moodNames[item.mood]||'Check-in')} · ${escape(String(item.mood))}/5</strong><time datetime="${escape(item.date)}">${escape(readableDate(item.date))}</time></div>${item.note?`<p>${escape(item.note)}</p>`:''}</article>`).join(''):'<p class="daily-empty">Your check-ins will appear here.</p>';
  }

  function renderJournal(){
    const list=$('#guestJournalList');
    const rows=[...state.journal].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
    $('#journalCount').textContent=`${rows.length} ${rows.length===1?'entry':'entries'}`;
    list.innerHTML=rows.length?rows.map(item=>`<article class="daily-entry"><div class="daily-entry-head"><div><strong>${escape(item.title||'Private entry')}</strong><br><time datetime="${escape(item.date)}">${escape(readableDate(item.date))}</time></div><button type="button" data-delete-entry="${escape(item.id)}" aria-label="Delete ${escape(item.title||'journal entry')}">Delete</button></div><p>${escape(item.body)}</p></article>`).join(''):'<p class="daily-empty">Your dated entries will appear here.</p>';
    list.querySelectorAll('[data-delete-entry]').forEach(button=>button.addEventListener('click',()=>{
      state.journal=state.journal.filter(item=>item.id!==button.dataset.deleteEntry);
      persist();renderJournal();
    }));
  }

  $('#guestCheckinForm').addEventListener('submit',event=>{
    event.preventDefault();
    const mood=Number(new FormData(event.currentTarget).get('guestMood'));
    const note=cleanMultiline($('#guestCheckinNote').value,240);
    const status=$('#guestCheckinStatus');
    if(!moodNames[mood]){showStatus(status,'Choose the feeling closest to where you are.','error');return}
    const existing=state.checkins.findIndex(item=>item.date===dateKey);
    const record={date:dateKey,mood,note,updatedAt:new Date().toISOString()};
    if(existing>=0)state.checkins[existing]=record;else state.checkins.unshift(record);
    state.checkins=state.checkins.slice(0,90);
    if(!persist()){showStatus(status,'This browser could not save the check-in. Check private browsing or storage settings.','error');return}
    showStatus(status,'Today’s check-in is saved only on this device.','success');
    renderCheckins();
  });

  $('#guestJournalForm').addEventListener('submit',event=>{
    event.preventDefault();
    const date=$('#guestJournalDate').value;
    const title=clean($('#guestJournalTitle').value,120);
    const body=cleanMultiline($('#guestJournalBody').value,5000);
    const status=$('#guestJournalStatus');
    if(!date||!body){showStatus(status,'Choose a date and write an entry before saving.','error');return}
    state.journal.unshift({id:makeId(),date,title,body,createdAt:new Date().toISOString()});
    state.journal=state.journal.slice(0,250);
    if(!persist()){state.journal.shift();showStatus(status,'This browser could not save the entry. Check private browsing or storage settings.','error');return}
    event.currentTarget.reset();$('#guestJournalDate').value=dateKey;
    showStatus(status,'Your dated entry is saved only on this device.','success');
    renderJournal();
  });

  $('#exportGuestData').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({exported_at:new Date().toISOString(),checkins:state.checkins,journal:state.journal},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=`with-love-fmb-private-notes-${today()}.json`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  });

  $('#clearGuestData').addEventListener('click',()=>{
    if(!confirm('Clear every check-in and journal entry stored by With love, FMB in this browser? This cannot be undone.'))return;
    state={checkins:[],journal:[]};localStorage.removeItem(STORAGE_KEY);renderCheckins();renderJournal();
    showStatus($('#guestJournalStatus'),'Local check-ins and journal entries were cleared.','success');
  });

  $('#guestCommunityForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const alias=clean($('#guestAlias').value,40);
    const email=String($('#guestEmail').value||'').trim().toLowerCase();
    const body=cleanMultiline($('#guestCommunityBody').value,2000);
    const consent=$('#guestCommunityConsent').checked;
    const status=$('#guestCommunityStatus'),button=$('#guestCommunityButton');
    if(!alias||!body||!consent||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showStatus(status,'Complete the form, use a valid email, and confirm the review notice.','error');return}
    if(!window.FMB?.configured){showStatus(status,'The review inbox is temporarily unavailable. Please email withlovefmb@gmail.com.','error');return}
    button.disabled=true;button.textContent='Sending for review';
    const client=window.FMB.createClient('local');
    const message=`Requested public alias: ${alias}\n\nRequested community post:\n${body}\n\nVisitor confirmed that administrator review is required before publication.`;
    const {error}=await client.rpc('submit_contact_message',{p_name:alias,p_email:email,p_subject:`Community post for review: ${alias}`.slice(0,120),p_message:message,p_kind:'contact'});
    button.disabled=false;button.textContent='Send for review';
    if(error){showStatus(status,'The message could not be sent right now. Please try again or email us directly.','error');return}
    event.currentTarget.reset();showStatus(status,'Your message was sent to the administrator for review. It has not been published.','success');
  });

  renderCheckins();renderJournal();
})();
