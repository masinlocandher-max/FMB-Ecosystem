(function(){
  'use strict';
  document.documentElement.classList.add('membership-checking');

  const chapterSelector='.reading-chapter, .chapter';

  async function activeMember(){
    if(!window.FMB?.configured)return null;
    for(const mode of ['local','session']){
      const client=window.FMB.createClient(mode);
      const {data:{session}}=await client.auth.getSession();
      if(!session)continue;
      const {data:{user},error:userError}=await client.auth.getUser();
      if(userError||!user||!user.email_confirmed_at)continue;
      const {data:profile,error}=await client.from('profiles').select('status').eq('id',user.id).maybeSingle();
      if(!error&&profile?.status==='active')return {client,user};
    }
    return null;
  }

  function addMemberNote(){
    const cover=document.querySelector('.reading-hero, .reader-cover');
    if(!cover||document.querySelector('.membership-access-note'))return;
    const note=document.createElement('div');
    note.className='membership-access-note';
    note.innerHTML='<span><strong>Member access is active.</strong> The complete reading is open for this account.</span><a class="text-link" href="member.html">Open member space</a>';
    cover.insertAdjacentElement('afterend',note);
  }

  function updateMemberNavigation(){
    const authLinks=[...document.querySelectorAll('.nav-actions a[href^="auth.html"]')];
    if(!authLinks.length)return;
    authLinks[0].href='member.html';
    authLinks[0].textContent='Member space';
    if(authLinks[1])authLinks[1].hidden=true;
  }

  function unlock(){
    document.documentElement.classList.remove('membership-checking');
    document.body.classList.add('member-reading-open');
    addMemberNote();
    updateMemberNavigation();
  }

  function lockElement(element,section=false){
    element.classList.add(section?'members-only-section':'members-only-content');
    element.setAttribute('aria-hidden','true');
    element.setAttribute('data-nosnippet','');
    element.inert=true;
  }

  function gate(){
    document.documentElement.classList.remove('membership-checking');
    const chapters=[...document.querySelectorAll(chapterSelector)];
    if(!chapters.length)return;
    document.body.classList.add('membership-gated');

    const first=chapters[0];
    const firstParagraph=[...first.children].find(element=>element.tagName==='P'&&!element.classList.contains('eyebrow'));
    let afterPreview=false;
    [...first.children].forEach(element=>{
      if(element===firstParagraph){afterPreview=true;return}
      if(afterPreview)lockElement(element);
    });
    chapters.slice(1).forEach(chapter=>lockElement(chapter,true));

    const card=document.createElement('aside');
    card.className='membership-gate-card';
    card.setAttribute('aria-label','Free member access');
    card.innerHTML='<p class="eyebrow">Free for our members</p><h2>Continue reading in our member space.</h2><p>Create a free account or sign in to unlock the full guide, save reading materials, keep a private journal, and join the moderated community.</p><div class="actions"><a class="pill" href="auth.html#signup">Create free account</a><a class="pill secondary" href="auth.html#signin">Sign in</a></div><p class="gate-note">Immediate crisis and emergency support always remains available without an account.</p>';
    const anchor=firstParagraph||first.querySelector('h2')||first;
    anchor.insertAdjacentElement('afterend',card);
  }

  async function init(){
    try{
      const member=await activeMember();
      if(member)unlock();else gate();
    }catch(error){
      gate();
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
