(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);
  let client=null;
  let user=null;
  let profile=null;

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
  function showPanel(id){
    $$('.member-tab').forEach(button=>button.classList.toggle('active',button.dataset.panel===id));
    $$('.member-panel').forEach(panel=>panel.hidden=panel.id!==id);
    history.replaceState(null,'',`#${id}`);
  }
  $$('.member-tab').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.panel)));
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
      location.replace('auth.html#signin');
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
    $('#profileEmail').value=user.email||'';
    $('#profileBio').value=profile.bio||'';
    $('#previewName').textContent=name;
    $('#previewUsername').textContent=`@${profile.username||'member'}`;
    $('#previewBio').textContent=profile.bio||'Your biography will appear here.';
    $('#joinedDate').textContent=formatDate(profile.joined_at||profile.created_at||user.created_at);
    $('#communityAlias').value=name.slice(0,40);
    const selected=new Set(Array.isArray(profile.interests)?profile.interests:[]);
    $$('input[name="interests"]').forEach(input=>input.checked=selected.has(input.value));
    if(['admin','moderator'].includes(profile.role))$('#adminLink').hidden=false;
  }

  async function loadNotes(){
    const list=$('#noteList');
    const {data,error}=await client.from('journal_entries').select('id,title,body,created_at').order('created_at',{ascending:false});
    if(error){list.innerHTML='<div class="empty">Notes could not be loaded.</div>';return}
    $('#noteCount').textContent=String(data?.length||0);
    if(!data?.length){list.innerHTML='<div class="empty">Your saved notes will appear here.</div>';return}
    list.innerHTML=data.map(note=>`<article class="entry" data-note-id="${window.FMB.escapeHtml(note.id)}"><strong>${window.FMB.escapeHtml(note.title||'Untitled note')}</strong><p>${window.FMB.escapeHtml(note.body)}</p><time>${new Date(note.created_at).toLocaleString()}</time><div class="actions" style="justify-content:flex-start;margin-top:12px"><button class="text-link delete-note" type="button">Delete</button></div></article>`).join('');
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
    list.innerHTML=data.map(post=>`<article class="entry"><strong>${window.FMB.escapeHtml(post.alias)} · ${window.FMB.escapeHtml(String(post.status).replaceAll('_',' '))}</strong><p>${window.FMB.escapeHtml(post.content)}</p>${post.moderation_note?`<p><small>Review note: ${window.FMB.escapeHtml(post.moderation_note)}</small></p>`:''}<time>${new Date(post.created_at).toLocaleString()}</time></article>`).join('');
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

  $('#communityForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const alias=window.FMB.cleanText($('#communityAlias').value,40);
    const content=window.FMB.cleanText($('#communityBody').value,2000);
    if(!alias||!content||!$('#communityConsent').checked){status('Complete the post and confirm that it will be reviewed.','error');return}
    const button=$('#communityButton');setLoading(button,true,'Sending…');
    const {error}=await client.from('freedom_wall_posts').insert({user_id:user.id,alias,content,status:'pending'});
    setLoading(button,false);
    if(error){status('The post could not be sent for review.','error');return}
    $('#communityBody').value='';$('#communityConsent').checked=false;
    status('Your post was sent for review. It is not public yet.','success');loadPosts();
  });

  $('#profileForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const fullName=window.FMB.cleanText($('#profileName').value,80);
    const username=String($('#profileUsername').value||'').trim().toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,24);
    const bio=window.FMB.cleanText($('#profileBio').value,500);
    const interests=$$('input[name="interests"]:checked');
    const interestValues=[...interests].map(input=>input.value).slice(0,12);
    if(fullName.length<2){status('Enter your full name.','error');return}
    if(username.length<3){status('Use a username with at least three letters, numbers, or underscores.','error');return}
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
    const {data,error}=await client.from('profiles').update({full_name:fullName,username,bio:bio||null,interests:interestValues,avatar_url:avatarUrl,updated_at:new Date().toISOString()}).eq('id',user.id).select('*').single();
    setLoading(button,false);
    if(error){
      status(error.code==='23505'?'That username is already in use. Choose another one.':'Your profile could not be updated.','error');return;
    }
    profile=data;
    await client.auth.updateUser({data:{full_name:fullName,display_name:fullName,username}});
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
    location.replace('auth.html#signin');
  }
  $('#signOut').addEventListener('click',signOut);
  $('#settingsSignOut').addEventListener('click',signOut);

  async function init(){
    if(!window.FMB?.configured){lockPage();return}
    client=await resolveClient();
    const {data,error}=await client.auth.getSession();
    if(error||!data.session){location.replace('auth.html#signin');return}
    user=data.session.user;
    if(!user.email_confirmed_at){await client.auth.signOut();location.replace('auth.html#signin');return}
    await loadProfile();
    await Promise.all([loadNotes(),loadPosts(),loadSaved()]);
    const initial=location.hash.slice(1);
    if(document.getElementById(initial)?.classList.contains('member-panel'))showPanel(initial);
  }
  init();
})();
