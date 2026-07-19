(function(){
  'use strict';
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  const publicBooks=new Set(['reading.html','coming-out-respect.html','men-can-cry.html']);
  const isPublic=publicBooks.has(page);
  document.documentElement.classList.add('membership-checking');

  function revealReading({publicAccess=false}={}){
    document.documentElement.classList.remove('membership-checking');
    document.body.classList.remove('membership-gated');
    document.body.classList.add(publicAccess?'public-reading-open':'member-reading-open');
    document.querySelectorAll('.members-only-content,.members-only-section').forEach(element=>{
      element.classList.remove('members-only-content','members-only-section');
      element.removeAttribute('aria-hidden');
      element.removeAttribute('data-nosnippet');
      element.inert=false;
    });
    if(!publicAccess)return;
    const cover=document.querySelector('.reading-hero, .reader-cover');
    if(!cover||document.querySelector('.membership-access-note'))return;
    const note=document.createElement('div');
    note.className='membership-access-note public-access-note';
    note.innerHTML='<span><strong>This complete reading is open to everyone.</strong> No account is required. News and verified support resources are also always public.</span><a class="text-link" href="/ebooks/">Reading library</a>';
    cover.insertAdjacentElement('afterend',note);
  }

  function showMemberGate(){
    document.documentElement.classList.remove('membership-checking');
    document.body.classList.add('membership-gated');
    document.querySelectorAll('.reading-chapter,.chapter').forEach(element=>{
      element.classList.add('members-only-section');
      element.setAttribute('aria-hidden','true');
      element.setAttribute('data-nosnippet','');
      element.inert=true;
    });
    const cover=document.querySelector('.reading-hero, .reader-cover');
    if(!cover||document.querySelector('.membership-gate-card'))return;
    const gate=document.createElement('section');
    gate.className='membership-gate-card';
    gate.innerHTML='<p class="eyebrow">Member reading</p><h2>This guide is part of our member library.</h2><p>We keep selected readings exclusive so our members have a more personal space to learn and return to. Please sign in, or create an account to continue.</p><div class="actions"><a class="pill" href="/auth.html#signin">Sign in</a><a class="pill secondary" href="/auth.html#signup">Create an account</a></div><p class="gate-note">Mental health, LGBTQIA+ dignity, Men Can Cry, and FMB News remain open to everyone.</p>';
    cover.insertAdjacentElement('afterend',gate);
  }

  if(isPublic){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>revealReading({publicAccess:true}),{once:true});
    else revealReading({publicAccess:true});
    return;
  }

  const resolveAccess=member=>{
    if(member)revealReading();
    else showMemberGate();
  };
  const boot=()=>{
    if(window.FMB_MEMBER){resolveAccess(window.FMB_MEMBER.isMember);return}
    let settled=false;
    const done=value=>{if(settled)return;settled=true;window.clearTimeout(timer);resolveAccess(Boolean(value))};
    const timer=window.setTimeout(()=>done(false),7000);
    window.addEventListener('fmb:auth-ready',event=>done(event.detail?.isMember),{once:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
