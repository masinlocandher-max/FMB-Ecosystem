(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);
  let client=null;
  let user=null;
  let members=[];
  let contentItems=[];
  let musicItems=[];

  function setStatus(message,type=''){
    const element=$('#adminStatus');
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
  function formatDate(value){return value?new Date(value).toLocaleString():'—'}
  function bytes(value){
    const number=Number(value)||0;
    if(number<1024)return `${number} B`;
    if(number<1048576)return `${(number/1024).toFixed(1)} KB`;
    return `${(number/1048576).toFixed(1)} MB`;
  }
  function showPanel(id){
    $$('.admin-nav button').forEach(button=>button.classList.toggle('active',button.dataset.adminPanel===id));
    $$('.admin-panel').forEach(panel=>panel.hidden=panel.id!==id);
    $$('[data-admin-open]').forEach(button=>button.classList.toggle('active',button.dataset.adminOpen===id));
    const label=$(`.admin-nav button[data-admin-panel="${id}"]`)?.dataset.panelTitle;
    if(label)document.title=`${label} | FMB&CO. Orchestrator`;
    history.replaceState(null,'',`${location.pathname}${location.search}#${id}`);
    window.dispatchEvent(new CustomEvent('fmb:admin-panel',{detail:{id}}));
  }
  $$('.admin-nav button').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.adminPanel)));
  $$('[data-admin-open]').forEach(button=>button.addEventListener('click',()=>{showPanel(button.dataset.adminOpen);scrollTo({top:0,behavior:'smooth'})}));

  async function resolveClient(){
    for(const mode of ['local','session']){
      const possible=window.FMB.createClient(mode);
      const {data}=await possible.auth.getSession();
      if(data.session)return possible;
    }
    return window.FMB.createClient('local');
  }
  async function logActivity(action,entityType,entityId='',details={}){
    await client.from('admin_activity').insert({actor_id:user.id,action,entity_type:entityType,entity_id:String(entityId||''),details});
  }

  async function count(table,filters=[]){
    let query=client.from(table).select('*',{count:'exact',head:true});
    filters.forEach(([method,column,value])=>{query=query[method](column,value)});
    const {count,error}=await query;
    return error?0:count||0;
  }

  async function loadOverview(){
    const monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);
    const [total,recent,published,pending,newMessages]=await Promise.all([
      count('profiles'),
      count('profiles',[['gte','joined_at',monthStart.toISOString()]]),
      count('content_items',[['eq','status','published']]),
      count('freedom_wall_posts',[['eq','status','pending']]),
      count('contact_messages',[['eq','status','new']])
    ]);
    $('#totalMembers').textContent=String(total);
    $('#recentMembers').textContent=String(recent);
    $('#publishedContent').textContent=String(published);
    $('#pendingPosts').textContent=String(pending);
    $('#newMessages').textContent=String(newMessages);

    const {data:registrations}=await client.from('profiles').select('full_name,username,joined_at,status').order('joined_at',{ascending:false}).limit(8);
    $('#recentRegistrationList').innerHTML=registrations?.length?registrations.map(item=>`<article class="entry"><strong>${window.FMB.escapeHtml(item.full_name)}</strong><p>@${window.FMB.escapeHtml(item.username)} · ${window.FMB.escapeHtml(item.status)}</p><time>${formatDate(item.joined_at)}</time></article>`).join(''):'<div class="empty">No member registrations yet.</div>';

    const {data:activity}=await client.from('admin_activity').select('action,entity_type,created_at').order('created_at',{ascending:false}).limit(8);
    $('#activityList').innerHTML=activity?.length?activity.map(item=>`<article class="entry"><strong>${window.FMB.escapeHtml(item.action.replaceAll('_',' '))}</strong><p>${window.FMB.escapeHtml(item.entity_type)}</p><time>${formatDate(item.created_at)}</time></article>`).join(''):'<div class="empty">No administrative activity recorded yet.</div>';
  }

  $('#refreshOverview').addEventListener('click',async()=>{
    const button=$('#refreshOverview');setLoading(button,true,'Refreshing…');
    await Promise.all([loadOverview(),loadMembers(),loadModeration(),loadMessages()]);
    setLoading(button,false);setStatus('Dashboard information was refreshed.','success');
  });

  async function loadMembers(){
    const {data,error}=await client.from('profiles').select('id,full_name,username,email,role,status,joined_at').order('joined_at',{ascending:false}).limit(500);
    if(error){setStatus('Members could not be loaded.','error');return}
    members=data||[];renderMembers();
  }
  function renderMembers(){
    const search=$('#memberSearch').value.trim().toLowerCase();
    const role=$('#memberRoleFilter').value;
    const statusFilter=$('#memberStatusFilter').value;
    const filtered=members.filter(member=>{
      const haystack=`${member.full_name} ${member.username} ${member.email}`.toLowerCase();
      return (!search||haystack.includes(search))&&(!role||member.role===role)&&(!statusFilter||member.status===statusFilter);
    });
    $('#memberRows').innerHTML=filtered.length?filtered.map(member=>`<tr data-member-id="${window.FMB.escapeHtml(member.id)}"><td><strong>${window.FMB.escapeHtml(member.full_name)}</strong><br><small>@${window.FMB.escapeHtml(member.username)}</small></td><td>${window.FMB.escapeHtml(member.email||'')}</td><td>${formatDate(member.joined_at)}</td><td><select class="row-role" aria-label="Role for ${window.FMB.escapeHtml(member.full_name)}"><option value="member"${member.role==='member'?' selected':''}>Member</option><option value="moderator"${member.role==='moderator'?' selected':''}>Moderator</option><option value="admin"${member.role==='admin'?' selected':''}>Admin</option></select></td><td><select class="row-status" aria-label="Status for ${window.FMB.escapeHtml(member.full_name)}"><option value="active"${member.status==='active'?' selected':''}>Active</option><option value="suspended"${member.status==='suspended'?' selected':''}>Suspended</option></select></td><td><div class="table-actions"><button class="save-member" type="button">Save</button></div></td></tr>`).join(''):'<tr><td colspan="6">No members match these filters.</td></tr>';
    $$('.save-member').forEach(button=>button.addEventListener('click',async()=>{
      const row=button.closest('[data-member-id]');
      const roleValue=row.querySelector('.row-role').value;
      const statusValue=row.querySelector('.row-status').value;
      setLoading(button,true,'Saving…');
      const {error}=await client.rpc('admin_update_member',{p_user_id:row.dataset.memberId,p_role:roleValue,p_status:statusValue});
      setLoading(button,false);
      if(error){setStatus(error.message||'The member could not be updated.','error');return}
      setStatus('Member access was updated.','success');await loadMembers();await loadOverview();
    }));
  }
  ['memberSearch','memberRoleFilter','memberStatusFilter'].forEach(id=>document.getElementById(id).addEventListener('input',renderMembers));
  $('#refreshMembers').addEventListener('click',loadMembers);

  async function loadModeration(){
    const value=$('#moderationFilter').value;
    let query=client.from('freedom_wall_posts').select('id,user_id,alias,content,status,moderation_note,created_at,published_at').order('created_at',{ascending:false}).limit(200);
    if(value!=='all')query=query.eq('status',value);
    const {data,error}=await query;
    if(error){$('#moderationList').innerHTML='<div class="empty">Community posts could not be loaded.</div>';return}
    $('#moderationList').innerHTML=data?.length?data.map(post=>`<article class="glass-card" data-post-id="${window.FMB.escapeHtml(post.id)}"><p class="eyebrow">${window.FMB.escapeHtml(post.status.replaceAll('_',' '))} · ${formatDate(post.created_at)}</p><h3>${window.FMB.escapeHtml(post.alias)}</h3><p>${window.FMB.escapeHtml(post.content)}</p><div class="field"><label>Review note</label><textarea class="moderation-note" maxlength="1000">${window.FMB.escapeHtml(post.moderation_note||'')}</textarea></div><div class="table-actions"><button type="button" data-moderation="published">Publish</button><button type="button" data-moderation="changes_requested">Request changes</button><button type="button" data-moderation="rejected">Reject</button></div></article>`).join(''):'<div class="empty">No posts match this status.</div>';
    $$('[data-moderation]').forEach(button=>button.addEventListener('click',async()=>{
      const card=button.closest('[data-post-id]');
      const nextStatus=button.dataset.moderation;
      const note=window.FMB.cleanText(card.querySelector('.moderation-note').value,1000)||null;
      setLoading(button,true,'Saving…');
      const update={status:nextStatus,moderation_note:note,moderated_by:user.id,moderated_at:new Date().toISOString(),published_at:nextStatus==='published'?new Date().toISOString():null};
      const {error}=await client.from('freedom_wall_posts').update(update).eq('id',card.dataset.postId);
      setLoading(button,false);
      if(error){setStatus('The moderation decision could not be saved.','error');return}
      await logActivity('community_post_moderated','freedom_wall_post',card.dataset.postId,{status:nextStatus});
      setStatus('The moderation decision was saved.','success');loadModeration();loadOverview();
    }));
  }
  $('#moderationFilter').addEventListener('change',loadModeration);
  $('#refreshModeration').addEventListener('click',loadModeration);

  function resetContentForm(){
    $('#contentForm').reset();$('#contentId').value='';$('#contentStatus').value='draft';$('#contentOrder').value='0';$('#deleteContent').disabled=true;
    $$('#contentList button').forEach(button=>button.classList.remove('active'));
  }
  async function loadContent(){
    const {data,error}=await client.from('content_items').select('*').order('sort_order').order('created_at',{ascending:false}).limit(500);
    if(error){$('#contentList').innerHTML='<div class="empty">Content could not be loaded.</div>';return}
    contentItems=data||[];
    $('#contentList').innerHTML=contentItems.length?contentItems.map(item=>`<button type="button" data-content-id="${window.FMB.escapeHtml(item.id)}"><strong>${window.FMB.escapeHtml(item.title)}</strong><br><small>${window.FMB.escapeHtml(item.category)} · ${window.FMB.escapeHtml(item.status)}</small></button>`).join(''):'<div class="empty">No managed content yet.</div>';
    $$('[data-content-id]').forEach(button=>button.addEventListener('click',()=>editContent(button.dataset.contentId)));
  }
  function editContent(id){
    const item=contentItems.find(entry=>entry.id===id);if(!item)return;
    $('#contentId').value=item.id;$('#contentTitle').value=item.title;$('#contentSlug').value=item.slug;$('#contentCategory').value=item.category;$('#contentAudience').value=(item.audience||[]).join(', ');$('#contentExcerpt').value=item.excerpt||'';$('#contentBody').value=item.body||'';$('#contentSource').value=item.source_url||'';$('#contentCover').value=item.cover_url||'';$('#contentStatus').value=item.status;$('#contentFeatured').checked=Boolean(item.featured);$('#contentOrder').value=String(item.sort_order||0);$('#deleteContent').disabled=false;
    $$('#contentList button').forEach(button=>button.classList.toggle('active',button.dataset.contentId===id));
  }
  $('#contentForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const id=$('#contentId').value;
    const title=window.FMB.cleanText($('#contentTitle').value,180);
    const slug=String($('#contentSlug').value||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,100);
    if(title.length<2||slug.length<2){setStatus('Content needs a title and valid slug.','error');return}
    const statusValue=$('#contentStatus').value;
    const payload={title,slug,category:$('#contentCategory').value,audience:$('#contentAudience').value.split(',').map(value=>window.FMB.cleanText(value,40)).filter(Boolean).slice(0,12),excerpt:window.FMB.cleanText($('#contentExcerpt').value,500)||null,body:window.FMB.cleanText($('#contentBody').value,50000)||null,source_url:$('#contentSource').value.trim()||null,cover_url:$('#contentCover').value.trim()||null,status:statusValue,featured:$('#contentFeatured').checked,sort_order:Number($('#contentOrder').value)||0,updated_by:user.id,published_at:statusValue==='published'?new Date().toISOString():null};
    const button=$('#saveContent');setLoading(button,true,'Saving…');
    let result;
    if(id)result=await client.from('content_items').update(payload).eq('id',id).select().single();
    else result=await client.from('content_items').insert({...payload,created_by:user.id}).select().single();
    setLoading(button,false);
    if(result.error){setStatus(result.error.code==='23505'?'That content slug is already in use.':'Content could not be saved.','error');return}
    await logActivity(id?'content_updated':'content_created','content_item',result.data.id,{status:statusValue});
    setStatus('Content was saved.','success');await loadContent();editContent(result.data.id);loadOverview();
  });
  $('#newContent').addEventListener('click',resetContentForm);
  $('#deleteContent').addEventListener('click',async()=>{
    const id=$('#contentId').value;if(!id||!confirm('Delete this content item permanently?'))return;
    const {error}=await client.from('content_items').delete().eq('id',id);
    if(error){setStatus('Content could not be deleted.','error');return}
    await logActivity('content_deleted','content_item',id);resetContentForm();loadContent();loadOverview();setStatus('Content was deleted.','success');
  });

  function resetMusicForm(){
    $('#musicForm').reset();$('#musicId').value='';$('#musicArtist').value='FMB';$('#musicCategory').value='Made by FMB';$('#musicStatus').value='draft';$('#musicOrder').value='0';$('#deleteMusic').disabled=true;
    $$('#musicList button').forEach(button=>button.classList.remove('active'));
  }
  async function loadMusic(){
    const {data,error}=await client.from('music_entries').select('*').order('sort_order').order('created_at',{ascending:false}).limit(500);
    if(error){$('#musicList').innerHTML='<div class="empty">Music could not be loaded.</div>';return}
    musicItems=data||[];
    $('#musicList').innerHTML=musicItems.length?musicItems.map(item=>`<button type="button" data-music-id="${window.FMB.escapeHtml(item.id)}"><strong>${window.FMB.escapeHtml(item.title)}</strong><br><small>${window.FMB.escapeHtml(item.category)} · ${window.FMB.escapeHtml(item.status)}</small></button>`).join(''):'<div class="empty">No music entries yet.</div>';
    $$('[data-music-id]').forEach(button=>button.addEventListener('click',()=>editMusic(button.dataset.musicId)));
  }
  function editMusic(id){
    const item=musicItems.find(entry=>entry.id===id);if(!item)return;
    $('#musicId').value=item.id;$('#musicTitle').value=item.title;$('#musicArtist').value=item.artist;$('#musicDescription').value=item.description||'';$('#musicCategory').value=item.category;$('#musicAudio').value=item.audio_url;$('#musicCover').value=item.cover_url||'';$('#musicStatus').value=item.status;$('#musicOrder').value=String(item.sort_order||0);$('#deleteMusic').disabled=false;
    $$('#musicList button').forEach(button=>button.classList.toggle('active',button.dataset.musicId===id));
  }
  $('#musicForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const id=$('#musicId').value,title=window.FMB.cleanText($('#musicTitle').value,180),artist=window.FMB.cleanText($('#musicArtist').value,120),audioUrl=$('#musicAudio').value.trim();
    if(!title||!artist||!audioUrl){setStatus('Music needs a title, artist, and public audio URL.','error');return}
    const statusValue=$('#musicStatus').value;
    const payload={title,artist,description:window.FMB.cleanText($('#musicDescription').value,1000)||null,category:window.FMB.cleanText($('#musicCategory').value,100)||'Made by FMB',audio_url:audioUrl,cover_url:$('#musicCover').value.trim()||null,status:statusValue,sort_order:Number($('#musicOrder').value)||0,updated_by:user.id,published_at:statusValue==='published'?new Date().toISOString():null};
    const button=$('#saveMusic');setLoading(button,true,'Saving…');
    const result=id?await client.from('music_entries').update(payload).eq('id',id).select().single():await client.from('music_entries').insert({...payload,created_by:user.id}).select().single();
    setLoading(button,false);
    if(result.error){setStatus('Music could not be saved.','error');return}
    await logActivity(id?'music_updated':'music_created','music_entry',result.data.id,{status:statusValue});setStatus('Music was saved.','success');await loadMusic();editMusic(result.data.id);
  });
  $('#newMusic').addEventListener('click',resetMusicForm);
  $('#deleteMusic').addEventListener('click',async()=>{
    const id=$('#musicId').value;if(!id||!confirm('Delete this music entry permanently?'))return;
    const {error}=await client.from('music_entries').delete().eq('id',id);
    if(error){setStatus('Music could not be deleted.','error');return}
    await logActivity('music_deleted','music_entry',id);resetMusicForm();loadMusic();setStatus('Music was deleted.','success');
  });

  async function loadMedia(){
    const {data,error}=await client.from('media_assets').select('*').order('created_at',{ascending:false}).limit(500);
    if(error){$('#mediaRows').innerHTML='<tr><td colspan="5">Media could not be loaded.</td></tr>';return}
    $('#mediaRows').innerHTML=data?.length?data.map(item=>`<tr data-media-id="${window.FMB.escapeHtml(item.id)}" data-storage-path="${window.FMB.escapeHtml(item.storage_path)}"><td><a href="${window.FMB.escapeHtml(item.public_url)}" target="_blank" rel="noopener">${window.FMB.escapeHtml(item.file_name)}</a><br><small>${window.FMB.escapeHtml(item.alt_text||'')}</small></td><td>${window.FMB.escapeHtml(item.mime_type)}</td><td>${bytes(item.size_bytes)}</td><td>${formatDate(item.created_at)}</td><td><div class="table-actions"><button class="delete-media" type="button">Delete</button></div></td></tr>`).join(''):'<tr><td colspan="5">No uploaded media yet.</td></tr>';
    $$('.delete-media').forEach(button=>button.addEventListener('click',async()=>{
      const row=button.closest('[data-media-id]');
      if(!confirm('Delete this media file? Pages that use it may break.'))return;
      setLoading(button,true,'Deleting…');
      const {error:storageError}=await client.storage.from('site-media').remove([row.dataset.storagePath]);
      if(storageError){setLoading(button,false);setStatus('The stored file could not be deleted.','error');return}
      const {error}=await client.from('media_assets').delete().eq('id',row.dataset.mediaId);
      if(error){setLoading(button,false);setStatus('The media record could not be deleted.','error');return}
      await logActivity('media_deleted','media_asset',row.dataset.mediaId);setStatus('Media was deleted.','success');loadMedia();
    }));
  }
  $('#mediaForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const file=$('#mediaFile').files[0];
    if(!file){setStatus('Choose a file to upload.','error');return}
    const allowed=['image/jpeg','image/png','image/webp','image/svg+xml','audio/mpeg','audio/mp4','audio/wav','audio/ogg'];
    if(!allowed.includes(file.type)||file.size>15*1024*1024){setStatus('Choose an approved image or audio file no larger than 15 MB.','error');return}
    const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(-100);
    const path=`${new Date().toISOString().slice(0,10)}/${Date.now()}-${safeName}`;
    const button=$('#uploadMedia');setLoading(button,true,'Uploading…');
    const {error:uploadError}=await client.storage.from('site-media').upload(path,file,{contentType:file.type,cacheControl:'3600'});
    if(uploadError){setLoading(button,false);setStatus('The file could not be uploaded.','error');return}
    const publicUrl=client.storage.from('site-media').getPublicUrl(path).data.publicUrl;
    const {data,error}=await client.from('media_assets').insert({storage_path:path,public_url:publicUrl,file_name:file.name,mime_type:file.type,size_bytes:file.size,alt_text:window.FMB.cleanText($('#mediaAlt').value,300)||null,uploaded_by:user.id}).select().single();
    setLoading(button,false);
    if(error){await client.storage.from('site-media').remove([path]);setStatus('The media record could not be saved.','error');return}
    await logActivity('media_uploaded','media_asset',data.id,{file_name:file.name});$('#mediaForm').reset();setStatus('Media was uploaded.','success');loadMedia();
  });

  async function loadMessages(){
    const filter=$('#messageFilter').value;
    let query=client.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(300);
    if(filter!=='all')query=query.eq('status',filter);
    const {data,error}=await query;
    if(error){$('#messageList').innerHTML='<div class="empty">Messages could not be loaded.</div>';return}
    $('#messageList').innerHTML=data?.length?data.map(message=>`<article class="glass-card" data-message-id="${window.FMB.escapeHtml(message.id)}"><p class="eyebrow">${window.FMB.escapeHtml(message.kind)} · ${window.FMB.escapeHtml(message.status)} · ${formatDate(message.created_at)}</p><h3>${window.FMB.escapeHtml(message.subject)}</h3><p><strong>${window.FMB.escapeHtml(message.name)}</strong> · <a href="mailto:${window.FMB.escapeHtml(message.email)}">${window.FMB.escapeHtml(message.email)}</a></p><p>${window.FMB.escapeHtml(message.message)}</p><div class="table-actions"><button type="button" data-message-status="resolved">Mark resolved</button><button type="button" data-message-status="archived">Archive</button><button type="button" data-message-status="new">Mark new</button></div></article>`).join(''):'<div class="empty">No messages match this status.</div>';
    $$('[data-message-status]').forEach(button=>button.addEventListener('click',async()=>{
      const card=button.closest('[data-message-id]');setLoading(button,true,'Saving…');
      const {error}=await client.rpc('admin_set_message_status',{p_message_id:card.dataset.messageId,p_status:button.dataset.messageStatus});
      setLoading(button,false);
      if(error){setStatus('The message status could not be updated.','error');return}
      setStatus('Message status updated.','success');loadMessages();loadOverview();
    }));
  }
  $('#messageFilter').addEventListener('change',loadMessages);
  $('#refreshMessages').addEventListener('click',loadMessages);

  $('#adminSignOut').addEventListener('click',async()=>{if(client)await client.auth.signOut();location.replace('auth.html#signin')});

  async function init(){
    const localPreview=/^(localhost|127\.0\.0\.1)$/i.test(location.hostname)&&new URLSearchParams(location.search).get('preview')==='1';
    if(localPreview){
      $('#adminIdentity').textContent='Local design preview · live member data is paused';
      ['membersCommunityPanel','membersPanel','moderationPanel','contentPanel','musicPanel','mediaPanel','messagesPanel'].forEach(id=>{
        const panel=document.getElementById(id);if(!panel)return;
        panel.querySelectorAll('button,input,textarea,select').forEach(control=>control.disabled=true);
      });
      document.body.classList.add('orchestrator-ready');
      window.dispatchEvent(new CustomEvent('fmb:admin-ready',{detail:{client:null,user:null,profile:null,preview:true}}));
      const initial=location.hash.slice(1);if(document.getElementById(initial)?.classList.contains('admin-panel'))showPanel(initial);else showPanel('overviewPanel');
      return;
    }
    if(!window.FMB?.configured){
      const splash=document.querySelector('.orchestrator-auth-splash span');if(splash)splash.textContent='Secure account service is not connected';
      return;
    }
    client=await resolveClient();
    const {data,error}=await client.auth.getSession();
    if(error||!data.session){location.replace('auth.html?next=%2Fadmin.html#signin');return}
    const {data:{user:verifiedUser},error:userError}=await client.auth.getUser();
    if(userError||!verifiedUser){location.replace('auth.html?next=%2Fadmin.html#signin');return}
    user=verifiedUser;
    const {data:profile,error:profileError}=await client.from('profiles').select('full_name,role,status').eq('id',user.id).maybeSingle();
    if(profileError||!profile||profile.role!=='admin'||profile.status!=='active'){
      setStatus('Administrator access is required.','error');
      setTimeout(()=>location.replace('/profile/'),900);
      return;
    }
    $('#adminIdentity').textContent=`Signed in as ${profile.full_name} · administrator`;
    document.body.classList.add('orchestrator-ready');
    window.dispatchEvent(new CustomEvent('fmb:admin-ready',{detail:{client,user,profile,preview:false}}));
    await Promise.all([loadOverview(),loadMembers(),loadModeration(),loadContent(),loadMusic(),loadMedia(),loadMessages()]);
    const initial=location.hash.slice(1);if(document.getElementById(initial)?.classList.contains('admin-panel'))showPanel(initial);else showPanel('overviewPanel');
  }
  init();
})();
