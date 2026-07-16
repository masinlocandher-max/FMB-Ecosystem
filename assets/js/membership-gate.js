(function(){
  'use strict';
  document.documentElement.classList.add('membership-checking');

  function openReading(){
    document.documentElement.classList.remove('membership-checking');
    document.body.classList.remove('membership-gated');
    document.body.classList.add('public-reading-open');
    document.querySelectorAll('.members-only-content,.members-only-section').forEach(element=>{
      element.classList.remove('members-only-content','members-only-section');
      element.removeAttribute('aria-hidden');
      element.removeAttribute('data-nosnippet');
      element.inert=false;
    });
    const cover=document.querySelector('.reading-hero, .reader-cover');
    if(!cover||document.querySelector('.membership-access-note'))return;
    const note=document.createElement('div');
    note.className='membership-access-note public-access-note';
    note.innerHTML='<span><strong>The complete reading is open to everyone.</strong> No account is required while our membership email system is being completed.</span><a class="text-link" href="/auth.html#signin">Sign in for private tools</a>';
    cover.insertAdjacentElement('afterend',note);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openReading,{once:true});else openReading();
})();
