(function(){
  'use strict';

  document.documentElement.classList.add('membership-checking');

  const registerUrl='/auth.html#signup';
  const signInUrl='/auth.html#signin';
  const libraryUrl='/ebooks/';

  function addProductBranding(){
    document.body.classList.add('fmbandco-ebook-product');
    document.title=document.title.replace(/\|\s*With love, FMB/i,'| FMB&CO. eBook Library');

    const style=document.createElement('style');
    style.textContent=`
      .fmbandco-ebook-product .nav-brand{min-width:190px}
      .fmbandco-ebook-product .nav-brand img{width:min(210px,42vw);height:48px;object-fit:contain;object-position:left center}
      .fmbandco-ebook-product .reading-mark{width:min(300px,74vw);height:auto;object-fit:contain}
      .fmbandco-ebook-product .footer-logo{width:min(230px,74vw);height:auto;object-fit:contain;object-position:left center}
      .fmbandco-preview-note,.fmbandco-continue-gate{margin:28px 0;padding:24px;border:1px solid rgba(80,37,105,.15);border-radius:24px;background:linear-gradient(145deg,#fffaf0,#fff);box-shadow:0 16px 42px rgba(45,21,60,.07)}
      .fmbandco-preview-note{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
      .fmbandco-preview-note strong,.fmbandco-continue-gate h2{color:#3d174f}
      .fmbandco-preview-note p,.fmbandco-continue-gate p{margin:7px 0 0;color:#6e6274}
      .fmbandco-preview-note .text-link{font-weight:800;color:#5b2674}
      .fmbandco-continue-gate{text-align:left}
      .fmbandco-continue-gate .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
      .fmbandco-continue-gate .pill{display:inline-flex;min-height:46px;align-items:center;justify-content:center;padding:11px 18px;border-radius:999px;text-decoration:none;font-weight:800;background:linear-gradient(135deg,#54206f,#7b4a98);color:#fff}
      .fmbandco-continue-gate .pill.secondary{border:1px solid rgba(84,32,111,.2);background:#fff;color:#54206f}
      .fmbandco-preview-hidden{display:none!important}
      .fmbandco-locked-toc{opacity:.56}
      @media(max-width:640px){.fmbandco-preview-note{align-items:flex-start}.fmbandco-continue-gate .pill{width:100%}}
    `;
    document.head.appendChild(style);

    const brand=document.querySelector('.nav-brand');
    if(brand){
      brand.href=libraryUrl;
      brand.setAttribute('aria-label','FMB and Company eBook Library');
      brand.innerHTML='<img src="/assets/images/fmbandco/fmbandco-primary-clean.png" alt="FMB&CO.">';
    }

    const readingMark=document.querySelector('.reading-mark');
    if(readingMark){
      readingMark.src='/assets/images/fmbandco/fmbandco-primary-clean.png';
      readingMark.alt='FMB&CO. eBook Library';
    }

    document.querySelectorAll('.footer-logo').forEach(logo=>{
      logo.src='/assets/images/fmbandco/fmbandco-primary-reversed.png';
      logo.alt='FMB&CO.';
    });

    document.querySelectorAll('.footer').forEach(footer=>{
      const paragraphs=footer.querySelectorAll('p');
      if(paragraphs[0])paragraphs[0].textContent='Official FMB&CO. digital publications and eBooks.';
    });
  }

  function chapters(){
    return Array.from(document.querySelectorAll('.reading-chapter,.chapter'));
  }

  function clearAccessState(){
    document.documentElement.classList.remove('membership-checking');
    document.body.classList.remove('membership-gated');
    chapters().forEach(chapter=>{
      chapter.classList.remove('members-only-content','members-only-section','fmbandco-preview-hidden');
      chapter.removeAttribute('aria-hidden');
      chapter.removeAttribute('data-nosnippet');
      chapter.inert=false;
    });
  }

  function addStatusNote(member){
    const hero=document.querySelector('.reading-hero,.reader-cover');
    if(!hero||document.querySelector('.fmbandco-preview-note'))return;
    const note=document.createElement('section');
    note.className='fmbandco-preview-note';
    note.innerHTML=member
      ? '<div><strong>Complete reading unlocked.</strong><p>You are signed in and can continue through the full FMB&CO. eBook.</p></div><a class="text-link" href="/ebooks/">Return to the eBook Library →</a>'
      : '<div><strong>Public preview open.</strong><p>Everyone can read the opening chapter. Register only when you are ready to continue.</p></div><a class="text-link" href="/ebooks/">Browse all FMB&CO. eBooks →</a>';
    hero.insertAdjacentElement('afterend',note);
  }

  function revealCompleteReading(){
    clearAccessState();
    document.body.classList.add('member-reading-open');
    document.body.classList.remove('public-reading-open');
    document.querySelector('.fmbandco-continue-gate')?.remove();
    addStatusNote(true);
  }

  function showContinueGate(){
    clearAccessState();
    document.body.classList.add('public-reading-open','membership-gated');
    document.body.classList.remove('member-reading-open');

    const allChapters=chapters();
    const previewChapter=allChapters[0];
    allChapters.slice(1).forEach(chapter=>{
      chapter.classList.add('members-only-section','fmbandco-preview-hidden');
      chapter.setAttribute('aria-hidden','true');
      chapter.setAttribute('data-nosnippet','');
      chapter.inert=true;
    });

    addStatusNote(false);

    if(!document.querySelector('.fmbandco-continue-gate')){
      const gate=document.createElement('section');
      gate.className='fmbandco-continue-gate';
      gate.id='continue-reading';
      gate.innerHTML='<p class="eyebrow">Continue this FMB&CO. eBook</p><h2>Register to keep reading.</h2><p>You have reached the end of the public preview. Create a free account or sign in to unlock the remaining chapters and return to your reading later.</p><div class="actions"><a class="pill" href="'+registerUrl+'">Register to continue</a><a class="pill secondary" href="'+signInUrl+'">Sign in</a></div>';
      if(previewChapter)previewChapter.insertAdjacentElement('afterend',gate);
      else document.querySelector('.reading-hero,.reader-cover')?.insertAdjacentElement('afterend',gate);
    }

    const hiddenIds=new Set(allChapters.slice(1).map(chapter=>chapter.id).filter(Boolean));
    document.querySelectorAll('.reading-toc a[href^="#"]').forEach(link=>{
      const id=link.getAttribute('href').slice(1);
      if(!hiddenIds.has(id))return;
      link.classList.add('fmbandco-locked-toc');
      link.setAttribute('aria-label',(link.textContent||'Chapter').trim()+' — registration required');
      link.addEventListener('click',event=>{
        event.preventDefault();
        document.getElementById('continue-reading')?.scrollIntoView({behavior:'smooth',block:'center'});
      });
    });
  }

  function resolveAccess(isMember){
    if(isMember)revealCompleteReading();
    else showContinueGate();
  }

  function boot(){
    addProductBranding();
    if(window.FMB_MEMBER){resolveAccess(Boolean(window.FMB_MEMBER.isMember));return}
    let settled=false;
    const done=value=>{
      if(settled)return;
      settled=true;
      window.clearTimeout(timer);
      resolveAccess(Boolean(value));
    };
    const timer=window.setTimeout(()=>done(false),7000);
    window.addEventListener('fmb:auth-ready',event=>done(event.detail?.isMember),{once:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();