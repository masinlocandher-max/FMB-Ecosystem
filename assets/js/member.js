(function(){
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
  const config=window.FMB_CONFIG||{};
  const configured=Boolean(config.SUPABASE_URL&&config.SUPABASE_ANON_KEY&&window.supabase);
  const client=configured?window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY):null;
  let user=null;
  function status(message,type){const el=$('#memberStatus');el.textContent=message;el.className='status show'+(type?' '+type:'')}
  function lockPage(){status('The account service is being connected. Sign in and verified member tools will open after the secure database is active.','error');$$('form button').forEach(b=>b.disabled=true);$('#signOut').disabled=true}
  function showPanel(id){$$('.member-tab').forEach(b=>b.classList.toggle('active',b.dataset.panel===id));$$('.member-panel').forEach(p=>p.hidden=p.id!==id)}
  $$('.member-tab').forEach(b=>b.addEventListener('click',()=>showPanel(b.dataset.panel)));
  async function loadProfile(){const name=user.user_metadata?.display_name||user.email?.split('@')[0]||'Friend';$('#greeting').textContent=`Kumusta ka, ${name}?`;$('#memberEmail').textContent=user.email;$('#profileName').value=name;$('#profileEmail').value=user.email||'';$('#communityAlias').value=name;try{const {data}=await client.from('profiles').select('display_name').eq('id',user.id).maybeSingle();if(data?.display_name){$('#profileName').value=data.display_name;$('#communityAlias').value=data.display_name;$('#greeting').textContent=`Kumusta ka, ${data.display_name}?`}}catch{}}
  async function loadNotes(){const list=$('#noteList');const {data,error}=await client.from('journal_entries').select('id,title,body,created_at').order('created_at',{ascending:false});if(error){list.innerHTML='<div class="empty">Notes could not be loaded yet.</div>';return}list.innerHTML=data?.length?data.map(n=>`<article class="entry"><strong>${escapeHtml(n.title||'Untitled note')}</strong><p>${escapeHtml(n.body)}</p><time>${new Date(n.created_at).toLocaleString()}</time></article>`).join(''):'<div class="empty">Your saved notes will appear here.</div>'}
  function escapeHtml(value){const d=document.createElement('div');d.textContent=value||'';return d.innerHTML}
  $('#noteForm').addEventListener('submit',async e=>{e.preventDefault();if(!client||!user)return;const title=$('#noteTitle').value.trim(),body=$('#noteBody').value.trim();if(!body)return;const {error}=await client.from('journal_entries').insert({user_id:user.id,title:title||null,body});if(error){status(error.message,'error');return}$('#noteTitle').value='';$('#noteBody').value='';status('Your note was saved.','success');loadNotes()});
  $('#communityForm').addEventListener('submit',async e=>{e.preventDefault();if(!client||!user)return;const alias=$('#communityAlias').value.trim(),content=$('#communityBody').value.trim();if(!alias||!content||!$('#communityConsent').checked)return;const {error}=await client.from('freedom_wall_posts').insert({user_id:user.id,alias,content,status:'pending'});if(error){status(error.message,'error');return}$('#communityBody').value='';$('#communityConsent').checked=false;status('Your post was sent for review. It is not public yet.','success')});
  $('#profileForm').addEventListener('submit',async e=>{e.preventDefault();if(!client||!user)return;const display_name=$('#profileName').value.trim();const {error}=await client.from('profiles').upsert({id:user.id,display_name,email:user.email,updated_at:new Date().toISOString()});if(error){status(error.message,'error');return}await client.auth.updateUser({data:{display_name}});status('Your profile was updated.','success');loadProfile()});
  $('#signOut').addEventListener('click',async()=>{if(client)await client.auth.signOut();location.href='auth.html#signin'});
  async function init(){if(!configured){lockPage();return}const {data,error}=await client.auth.getSession();if(error||!data.session){location.href='auth.html#signin';return}user=data.session.user;if(!user.email_confirmed_at){location.href='auth.html#signin';return}await loadProfile();await loadNotes()}
  init();
})();
