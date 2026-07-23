(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);
  let client=null;
  let user=null;
  let profile=null;
  let checkins=[];
  const moodNames={1:'Heavy',2:'Low',3:'Steady',4:'Hopeful',5:'Strong'};
  const affirmations=[
    'You deserve to meet this day without abandoning yourself.',
    'A gentle pace is still a meaningful way forward.',
    'You are allowed to protect your peace without explaining every boundary.',
    'Your feelings can be honest without becoming the whole story.',
    'You do not have to earn rest, care, or a softer beginning.',
    'The next honest step is enough for today.',
    'You can begin again without speaking badly about who you were before.',
    'Being seen starts with refusing to disappear from yourself.',
    'You are still worthy on the days when confidence feels far away.',
    'Small acts of care can return you to yourself.'
  ];

  function status(message,type=''){
    const element=$('#memberStatus');
    element.textContent=message;
    element.className=`status show${type?' '+type:''}`;
    if(type==='success')setTimeout(()=>{element.className='status';element.textContent=''},3200);
  }
  function setLoading(button,loading,label){
    if(!button)return;
    button.disabled=loading;
    if(loading){button.dataset.original=button.textContent;button.textContent=label}
    else if(button.dataset.original){button.textContent=button.dataset.original;delete button.dataset.original}
  }
  const installPendingKey='fmb-member-install-after-verification';
  const installSeenPrefix='fmb-member-install-seen:';
  const excludedInstallHost='yoni.francinemariebautista.com';
  let installPromptEvent=null;

  function safeStorageGet(key){
    try{return localStorage.getItem(key)}catch{return null}
  }
  function safeStorageSet(key,value){
    try{localStorage.setItem(key,value)}catch{}
  }
  function safeStorageRemove(key){
    try{localStorage.removeItem(key)}catch{}
  }
  function installSeenKey(){
    return user?.id?`${installSeenPrefix}${user.id}`:'';
  }
  function markInstallOfferSeen(){
    const key=installSeenKey();
    if(key)safeStorageSet(key,String(Date.now()));
    safeStorageRemove(installPendingKey);
  }
  function installedStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  }
  function pendingInstallRequest(){
    try{return JSON.parse(safeStorageGet(installPendingKey)||'null')}catch{return null}
  }
  function shouldOfferMemberInstall(){
    if(location.hostname.toLowerCase()===excludedInstallHost||!user?.email_confirmed_at)return false;
    if(installedStandalone()){markInstallOfferSeen();return false}
    const seenKey=installSeenKey();
    if(seenKey&&safeStorageGet(seenKey))return false;
    const now=Date.now();
    const pending=pendingInstallRequest();
    const requestedAt=Number(pending?.requestedAt||0);
    const pendingMatches=String(pending?.email||'').toLowerCase()===String(user.email||'').toLowerCase()&&requestedAt>0&&now-requestedAt<30*24*60*60*1000;
    const confirmedAt=Date.parse(user.email_confirmed_at||'');
    const createdAt=Date.parse(user.created_at||'');
    const recentlyConfirmed=Number.isFinite(confirmedAt)&&now-confirmedAt>=0&&now-confirmedAt<7*24*60*60*1000;
    const recentlyCreated=Number.isFinite(createdAt)&&now-createdAt>=0&&now-createdAt<30*24*60*60*1000;
    return pendingMatches||(recentlyConfirmed&&recentlyCreated);
  }
  function syncMemberInstallAction(){
    const button=$('#memberInstallButton');
    const help=$('#memberInstallHelp');
    if(!button||!help)return;
    if(installPromptEvent){
      button.textContent='Install for an enhanced experience';
      help.textContent='Installation is optional. You can keep using every available member feature in your browser.';
      return;
    }
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
      button.textContent='Show iPhone or iPad steps';
      help.textContent='Safari will show the steps for adding With love, FMB to your Home Screen.';
      return;
    }
    button.textContent='Show installation steps';
    help.textContent='If your browser supports installation, use its Install app or Add to Home screen option.';
  }
  function closeMemberInstallOffer(){
    const modal=$('#memberInstallOnboarding');
    if(!modal)return;
    modal.hidden=true;
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    markInstallOfferSeen();
  }
  function openMemberInstallOffer(){
    const modal=$('#memberInstallOnboarding');
    if(!modal||!shouldOfferMemberInstall())return;
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    syncMemberInstallAction();
    requestAnimationFrame(()=>$('#memberInstallButton')?.focus({preventScroll:true}));
  }
  async function handleMemberInstall(){
    const button=$('#memberInstallButton');
    const help=$('#memberInstallHelp');
    if(!button||!help)return;
    if(installPromptEvent){
      const prompt=installPromptEvent;
      installPromptEvent=null;
      button.disabled=true;
      await prompt.prompt();
      const choice=await prompt.userChoice;
      button.disabled=false;
      if(choice.outcome==='accepted'){
        markInstallOfferSeen();
        closeMemberInstallOffer();
        return;
      }
      help.textContent='Installation was not completed. You can continue in the browser and install later from your browser menu.';
      button.textContent='Installation not completed';
      markInstallOfferSeen();
      return;
    }
    if(/iphone|ipad|ipod/i.test(navigator.userAgent)){
      help.textContent='In Safari, tap Share, choose Add to Home Screen, then tap Add. Your verified account remains the same.';
      button.textContent='Steps shown below';
      return;
    }
    help.textContent='Open your browser menu and choose Install app or Add to Home screen. The exact wording depends on your browser and device.';
    button.textContent='Steps shown below';
  }

  window.addEventListener('beforeinstallprompt',event=>{
    if(location.hostname.toLowerCase()===excludedInstallHost)return;
    event.preventDefault();
    installPromptEvent=event;
    syncMemberInstallAction();
  });
  window.addEventListener('appinstalled',()=>{
    markInstallOfferSeen();
    const modal=$('#memberInstallOnboarding');
    if(modal&&!modal.hidden)closeMemberInstallOffer();
  });

  function showPanel(id){
    $$('.member-tab').forEach(button=>button.classList.toggle('active',button.dataset.panel===id));
    $$('.member-panel').forEach(panel=>panel.hidden=panel.id!==id);
    $$('[data-open-panel]').forEach(link=>link.classList.toggle('active',link.dataset.openPanel===id));
    history.replaceState(null,'',`#${id}`);
  }
  $('.member-tab').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.panel)));
  $('#memberInstallButton')?.addEventListener('click',handleMemberInstall);
  $('#memberInstallLater')?.addEventListener('click',closeMemberInstallOffer);
  $('#memberInstallClose')?.addEventListener('click',closeMemberInstallOffer);
  $('#memberInstallBackdrop')?.addEventListener('click',closeMemberInstallOffer);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#memberInstallOnboarding')?.hidden)closeMemberInstallOffer()});
  $$('[data-open-panel]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showPanel(link.dataset.openPanel);scrollTo({top:0,behavior:'smooth'})}));

  document.querySelectorAll('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById(button.dataset.togglePassword);
    const visible=input.type==='text';
    input.type=visible?'password':'text';
    button.textContent=visible?'Show':'Hide';
  }));

  function lockPage(){
    status('The secure account service has not been connected. Member tools are safely disabled.','error');
    $$('form input,form textarea,form button,#signOut,#settingsSignOut').forEach(control=>control.disabled=true);
  }
  function initials(name){
    return String(name||'F').trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'F';
  }
  function setAvatar(element,url,name){
    if(!element)return;
    if(url){
      element.classList.remove('placeholder');
      element.textContent='';
      element.style.backgroundImage=`url("${String(url).replace(/["\\]/g,'')}")`;
      element.style.backgroundSize='cover';
      element.style.backgroundPosition='center';
      element.setAttribute('aria-label',`${name||'Member'} profile photo`);
    }else{
      element.classList.add('placeholder');
      element.style.backgroundImage='none';
      element.textContent=initials(name);
    }
  }
  function formatDate(value){
    if(!value)return 'Joined recently';
    return `Joined ${new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}`;
  }
  function usernameAvailability(){
    const changedAt=Date.parse(profile?.username_changed_at||'');
    if(!Number.isFinite(changedAt))return {available:true,next:null};
    const next=new Date(changedAt+60*24*60*60*1000);
    return {available:next.getTime()<=Date.now(),next};
  }
  function localDateKey(date=new Date()){
    const year=date.getFullYear();
    const month=String(date.getMonth()+1).padStart(2,'0');
    const day=String(date.getDate()).padStart(2,'0');
    return `${year}-${month}-${day}`;
  }
  function readableDay(value,withYear=false){
    return new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',...(withYear?{year:'numeric'}:{})});
  }
  function setDailyAffirmation(){
    const today=localDateKey();
    const seed=Number(today.replaceAll('-',''));
    $('#dailyAffirmation').textContent=affirmations[seed%affirmations.length];
    $('#affirmationDate').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    $('#memberToday').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
  }
  function passwordStrong(value){return value.length>=10&&/[a-z]/.test(value)&&/[A-Z]/.test(value)&&/\d/.test(value)}

  async function resolveClient(){
    if(!window.FMB?.configured)return null;
    for(const mode of ['local','session']){
      const possible=window.FMB.createClient(mode);
      const {data}=await possible.auth.getSession();
      if(data.session)return possible;
    }
    return window.FMB.createClient('local');
  }

  async function loadProfile(){
    const {data,error}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();
    if(error){status('Your profile could not be loaded.','error');return}
    profile=data||{
      id:user.id,
      email:user.email,
      full_name:user.user_metadata?.full_name||user.user_metadata?.display_name||user.email?.split('@')[0]||'Member',
      username:user.user_metadata?.username||window.FMB.usernameFrom(user.email?.split('@')[0]),
      role:'member',status:'active',interests:[],joined_at:user.created_at
    };
    if(profile.status==='suspended'){
      await client.auth.signOut();
      location.replace('/auth.html#signin');
      return;
    }
    const name=profile.full_name||'Member';
    $('#greeting').textContent=`Welcome, ${name}.`;
    $('#memberEmail').textContent=user.email||'';
    $('#memberUsername').textContent=`@${profile.username||'member'}`;
    $('#memberJoined').textContent=formatDate(profile.joined_at||profile.created_at||user.created_at);
    setAvatar($('#headerAvatar'),profile.avatar_url,name);
    setAvatar($('#profilePreview'),profile.avatar_url,name);
    $('#profileName').value=name;
    $('#profileUsername').value=profile.username||window.FMB.usernameFrom(name);
    const usernameWindow=usernameAvailability();
    $('#profileUsername').readOnly=!usernameWindow.available;
    $('#memberUsernameCooldown').textContent=usernameWindow.available
      ?'You can change your public username now. After saving a new one, the next change is available in 60 days.'
      :`Your public username can be changed again on ${usernameWindow.next.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}.`;
    $('#profileEmail').value=user.email||'';
    $('#profileBio').value=profile.bio||'';
    $('#previewName').textContent=name;
    $('#previewUsername').textContent=`@${profile.username||'member'}`;
    $('#previewBio').textContent=profile.bio||'Your biography will appear here.';
    $('#joinedDate').textContent=formatDate(profile.joined_at||profile.created_at||user.created_at);
    $('#communityAlias').value=`@${profile.username||'member'}`;
    const selected=new Set(Array.isArray(profile.interests)?profile.interests:[]);
    $$('input[name="interests"]').forEach(input=>input.checked=selected.has(input.value));
    if(profile.role==='admin')$('#adminLink').hidden=false;
  }

  async function loadNotes(){
    const list=$('#noteList');
    const {data,error}=await client.from('journal_entries').select('id,title,body,created_at').order('created_at',{ascending:false});
    if(error){list.innerHTML='<div class="empty">Notes could not be loaded.</div>';return}
    $('#noteCount').textContent=String(data?.length||0);
    if(!data?.length){list.innerHTML='<div class="empty">Your saved notes will appear here.</div>';return}
    list.innerHTML=data.map(note=>`<article class="entry" data-note-id="${window.FMB.escapeHtml(note.id)}"><time class="journal-date" datetime="${window.FMB.escapeHtml(note.created_at)}">${new Date(note.created_at).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</time><strong>${window.FMB.escapeHtml(note.title||'Untitled journal entry')}</strong><p>${window.FMB.escapeHtml(note.body)}</p><small>${new Date(note.created_at).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</small><div class="actions" style="justify-content:flex-start;margin-top:12px"><button class="text-link delete-note" type="button">Delete</button></div></article>`).join('');
    list.querySelectorAll('.delete-note').forEach(button=>button.addEventListener('click',async()=>{
      const article=button.closest('[data-note-id]');
      button.disabled=true;
      const {error}=await client.from('journal_entries').delete().eq('id',article.dataset.noteId);
      if(error){button.disabled=false;status('The note could not be deleted.','error');return}
      status('The note was deleted.','success');
      loadNotes();
    }));
  }

  async function loadPosts(){
    const list=$('#postList');
    const {data,error}=await client.from('freedom_wall_posts').select('id,alias,content,status,created_at,published_at,moderation_note').order('created_at',{ascending:false});
    if(error){list.innerHTML='<div class="empty">Community submissions could not be loaded.</div>';return}
    $('#postCount').textContent=String(data?.length||0);
    if(!data?.length){list.innerHTML='<div class="empty">Submitted posts and their status will appear here.</div>';return}
    list.innerHTML=data.map(post=>`<article class="entry"><strong>${window.FMB.escapeHtml(post.alias)}</strong><span class="community-state">${window.FMB.escapeHtml(String(post.status).replaceAll('_',' '))}</span><p>${window.FMB.escapeHtml(post.content)}</p>${post.moderation_note?`<p><small>Review note: ${window.FMB.escapeHtml(post.moderation_note)}</small></p>`:''}<time datetime="${window.FMB.escapeHtml(post.created_at)}">Submitted ${new Date(post.created_at).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</time></article>`).join('');
  }

  async function loadSaved(){
    const list=$('#savedList');
    const {data,error}=await client.from('saved_content').select('id,item_key,title,url,category,created_at').order('created_at',{ascending:false});
    if(error){list.innerHTML='<div class="empty">Saved content could not be loaded.</div>';return}
    $('#savedCount').textContent=String(data?.length||0);
    if(!data?.length){list.innerHTML='<div class="empty">Use the Save button on a reading page to keep it here.</div>';return}
    list.innerHTML=data.map(item=>`<article class="mini-card" data-saved-id="${window.FMB.escapeHtml(item.id)}"><p class="eyebrow">${window.FMB.escapeHtml(item.category||'Saved')}</p><h3>${window.FMB.escapeHtml(item.title)}</h3><div class="actions" style="justify-content:flex-start"><a class="text-link" href="${window.FMB.escapeHtml(item.url)}">Open</a><button class="text-link remove-saved" type="button">Remove</button></div></article>`).join('');
    list.querySelectorAll('.remove-saved').forEach(button=>button.addEventListener('click',async()=>{
      const card=button.closest('[data-saved-id]');
      button.disabled=true;
      const {error}=await client.from('saved_content').delete().eq('id',card.dataset.savedId);
      if(error){button.disabled=false;status('The saved item could not be removed.','error');return}
      status('Removed from saved content.','success');loadSaved();
    }));
  }

  function calculateStreak(rows){
    const dates=new Set(rows.map(row=>row.checkin_date));
    const cursor=new Date();
    let streak=0;
    while(dates.has(localDateKey(cursor))){
      streak+=1;
      cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }

  function renderCheckins(){
    const list=$('#checkinList');
    $('#checkinStreak').textContent=String(calculateStreak(checkins));
    if(!checkins.length){list.innerHTML='<div class="empty">Your daily check-ins will appear here.</div>';return}
    list.innerHTML=checkins.slice(0,7).map(item=>`<article class="checkin-day"><time datetime="${window.FMB.escapeHtml(item.checkin_date)}">${readableDay(item.checkin_date)}</time><strong>${window.FMB.escapeHtml(moodNames[item.mood]||'Checked in')}</strong><p>${window.FMB.escapeHtml(item.note||'No note added.')}</p></article>`).join('');
  }

  async function loadCheckins(){
    const {data,error}=await client.from('daily_checkins').select('id,checkin_date,mood,note,created_at,updated_at').order('checkin_date',{ascending:false}).limit(45);
    if(error){
      $('#checkinList').innerHTML='<div class="empty">Daily check-ins could not be loaded right now.</div>';
      $('#checkinSavedState').textContent='The private check-in service is temporarily unavailable.';
      return;
    }
    checkins=data||[];
    const today=checkins.find(item=>item.checkin_date===localDateKey());
    if(today){
      const mood=$(`input[name="checkinMood"][value="${today.mood}"]`);
      if(mood)mood.checked=true;
      $('#checkinNote').value=today.note||'';
      $('#checkinSavedState').textContent='Today’s check-in is saved. You may update it anytime today.';
      $('#saveCheckinButton').textContent='Update today’s check-in';
    }
    renderCheckins();
  }

  $('#noteForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const title=window.FMB.cleanText($('#noteTitle').value,120);
    const body=window.FMB.cleanText($('#noteBody').value,5000);
    if(!body){status('Write something before saving the note.','error');return}
    const button=$('#saveNoteButton');setLoading(button,true,'Saving…');
    const {error}=await client.from('journal_entries').insert({user_id:user.id,title:title||null,body});
    setLoading(button,false);
    if(error){status('The note could not be saved.','error');return}
    $('#noteForm').reset();status('Your private note was saved.','success');loadNotes();
  });

  $('#checkinForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const selected=$('input[name="checkinMood"]:checked');
    if(!selected){status('Choose the feeling closest to where you are today.','error');return}
    const mood=Number(selected.value);
    const note=window.FMB.cleanText($('#checkinNote').value,240)||null;
    const button=$('#saveCheckinButton');setLoading(button,true,'Saving…');
    const {error}=await client.from('daily_checkins').upsert({user_id:user.id,checkin_date:localDateKey(),mood,note,updated_at:new Date().toISOString()},{onConflict:'user_id,checkin_date'});
    setLoading(button,false);
    if(error){status('Today’s check-in could not be saved. Please try again.','error');return}
    $('#checkinSavedState').textContent='Today’s check-in is saved and remains private to your account.';
    status('Your daily check-in was saved.','success');
    await loadCheckins();
  });

  $('#communityForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const alias=`@${profile?.username||'member'}`;
    const content=window.FMB.cleanText($('#communityBody').value,2000);
    if(content.length<10||!$('#communityConsent').checked){status('Share a short positive story or thought and confirm that it is ready for moderator review.','error');return}
    const button=$('#communityButton');setLoading(button,true,'Sending…');
    const {error}=await client.from('freedom_wall_posts').insert({user_id:user.id,alias,content,status:'pending'});
    setLoading(button,false);
    if(error){status('The post could not be sent for review.','error');return}
    $('#communityBody').value='';$('#communityConsent').checked=false;
    status('Your positive story was sent for moderator review. It is not public yet.','success');loadPosts();
  });

  $('#profileForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const username=String($('#profileUsername').value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,24);
    const bio=window.FMB.cleanText($('#profileBio').value,500);
    const interests=$$('input[name="interests"]:checked');
    const interestValues=[...interests].map(input=>input.value).slice(0,12);
    if(username.length<3){status('Use a username with at least three letters, numbers, or underscores.','error');return}
    const usernameChanged=username!==profile?.username;
    if(usernameChanged&&!usernameAvailability().available){status('Your username is still inside its 60-day change window.','error');return}
    const button=$('#saveProfileButton');setLoading(button,true,'Saving…');
    let avatarUrl=profile?.avatar_url||null;
    const file=$('#profileAvatar').files[0];
    if(file){
      const allowed=['image/jpeg','image/png','image/webp'];
      if(!allowed.includes(file.type)||file.size>3*1024*1024){setLoading(button,false);status('Choose a JPG, PNG, or WebP image no larger than 3 MB.','error');return}
      const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
      const path=`${user.id}/avatar.${extension}`;
      const {error:uploadError}=await client.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type,cacheControl:'3600'});
      if(uploadError){setLoading(button,false);status('The profile photo could not be uploaded.','error');return}
      avatarUrl=client.storage.from('avatars').getPublicUrl(path).data.publicUrl+`?v=${Date.now()}`;
    }
    const {data,error}=await client.from('profiles').update({username,bio:bio||null,interests:interestValues,avatar_url:avatarUrl,updated_at:new Date().toISOString()}).eq('id',user.id).select('*').single();
    setLoading(button,false);
    if(error){
      const message=error.code==='23505'?'That username is already in use. Choose another one.':/60 days|username change/i.test(error.message||'')?error.message:'Your profile could not be updated.';
      status(message,'error');return;
    }
    profile=data;
    if(usernameChanged)await client.auth.updateUser({data:{username}});
    $('#profileAvatar').value='';
    status('Your profile was updated.','success');loadProfile();
  });

  $('#passwordForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const first=$('#accountPassword').value;
    const second=$('#accountPasswordConfirm').value;
    if(!passwordStrong(first)){status('Use at least 10 characters with a lowercase letter, uppercase letter, and number.','error');return}
    if(first!==second){status('The passwords do not match.','error');return}
    const button=$('#passwordButton');setLoading(button,true,'Updating…');
    const {error}=await client.auth.updateUser({password:first});
    setLoading(button,false);
    if(error){status('The password could not be updated.','error');return}
    $('#passwordForm').reset();status('Your password was updated.','success');
  });

  async function signOut(){
    if(client)await client.auth.signOut();
    location.replace('/auth.html#signin');
  }
  $('#signOut').addEventListener('click',signOut);
  $('#settingsSignOut').addEventListener('click',signOut);

  async function init(){
    setDailyAffirmation();
    if(!window.FMB?.configured){lockPage();return}
    client=await resolveClient();
    const {data,error}=await client.auth.getSession();
    if(error||!data.session){location.replace('/auth.html#signin');return}
    const {data:{user:verifiedUser},error:userError}=await client.auth.getUser();
    if(userError||!verifiedUser){location.replace('/auth.html#signin');return}
    user=verifiedUser;
    if(!user.email_confirmed_at){await client.auth.signOut();location.replace('/auth.html#signin');return}
    await loadProfile();
    openMemberInstallOffer();
    await Promise.all([loadCheckins(),loadNotes(),loadPosts(),loadSaved()]);
    const initial=location.hash.slice(1);
    if(document.getElementById(initial)?.classList.contains('member-panel'))showPanel(initial);
  }
  init();
})();
