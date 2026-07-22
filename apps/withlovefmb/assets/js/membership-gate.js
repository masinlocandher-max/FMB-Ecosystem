(function(){
  'use strict';
  document.documentElement.classList.add('membership-checking');

  const LIBRARY_URL='/ebooks/';
  const EMAIL_ACCESS_SRC='/assets/js/product-email-access.js?v=20260723-modern-v2';
  const READER_CSS='/assets/css/fmb-reader-modern.css?v=20260723-reader-v1';
  const READER_JS='/assets/js/fmb-reader-modern.js?v=20260723-reader-v1';
  const FULLY_OPEN_PATHS=new Set(['/reading.html','/coming-out-respect.html','/men-can-cry.html']);
  const currentPath=location.pathname.replace(/\/+$/,'').toLowerCase()||'/';
  const isFullyOpen=FULLY_OPEN_PATHS.has(currentPath);
  let emailAccessPromise=null;

  function addStylesheet(href){
    if(document.querySelector(`link[href="${href}"]`))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
  function addScript(src){
    if(document.querySelector(`script[src="${src}"]`))return Promise.resolve();
    return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.body.appendChild(script)});
  }

  function ensureEmailAccess(){
    if(window.FMBProductEmailAccess)return Promise.resolve(window.FMBProductEmailAccess);
    if(emailAccessPromise)return emailAccessPromise;
    emailAccessPromise=addScript(EMAIL_ACCESS_SRC).then(()=>{
      if(!window.FMBProductEmailAccess)throw new Error('Email access unavailable');
      return window.FMBProductEmailAccess;
    });
    return emailAccessPromise;
  }

  function openEmailAccess(){
    ensureEmailAccess().then(access=>access.open({mode:'reading'})).catch(()=>{
      const status=document.querySelector('.email-access-fallback');
      if(status)status.textContent='The secure email form could not open. Please refresh and try again.';
    });
  }

  function addProductBranding(){
    document.body.classList.add('fmbandco-ebook-product');
    document.title=document.title.replace(/\|\s*With love, FMB/i,'| FMB eBooks');
    const brand=document.querySelector('.nav-brand');
    if(brand){
      brand.href=LIBRARY_URL;
      brand.setAttribute('aria-label','Return to FMB eBooks');
      brand.innerHTML='<img src="/assets/images/fmb-approved/fmb-ebook-official-transparent.webp" width="939" height="210" alt="FMB eBooks">';
    }
    const readingMark=document.querySelector('.reading-mark');
    if(readingMark){readingMark.src='/assets/images/fmb-approved/fmb-ebook-official-transparent.webp';readingMark.alt='FMB eBooks'}
    document.querySelectorAll('.footer-logo').forEach(logo=>{logo.src='/assets/images/fmb-approved/fmb-ebook-official-transparent.webp';logo.alt='FMB eBooks'});
  }

  const chapters=()=>Array.from(document.querySelectorAll('.reading-chapter,.chapter'));
  const hero=()=>document.querySelector('.reading-hero,.reader-cover');

  function clearAccessState(){
    document.documentElement.classList.remove('membership-checking');
    document.body.classList.remove('membership-gated');
    chapters().forEach(chapter=>{
      chapter.classList.remove('members-only-content','members-only-section','fmbandco-preview-hidden');
      chapter.removeAttribute('aria-hidden');chapter.removeAttribute('data-nosnippet');chapter.inert=false;
    });
    document.querySelectorAll('.fmbandco-locked-toc').forEach(link=>{link.classList.remove('fmbandco-locked-toc');link.removeAttribute('aria-label')});
  }

  function addStatusNote(type){
    const target=hero();
    if(!target)return;
    document.querySelector('.fmbandco-preview-note')?.remove();
    const note=document.createElement('section');note.className='fmbandco-preview-note';
    if(type==='open')note.innerHTML='<div><strong>Complete eBook open.</strong><p>This title is available in full without registration.</p></div><a class="text-link" href="/ebooks/">Return to the FMB eBook Library →</a>';
    else if(type==='member')note.innerHTML='<div><strong>Complete reading unlocked.</strong><p>Your secure email link is verified and the full eBook is available.</p></div><a class="text-link" href="/ebooks/">Return to the FMB eBook Library →</a>';
    else note.innerHTML='<div><strong>Public first chapter open.</strong><p>Read the complete opening chapter. Enter your email only when you choose to continue.</p></div><a class="text-link" href="/ebooks/">Browse all FMB eBooks →</a>';
    target.insertAdjacentElement('afterend',note);
  }

  function revealCompleteReading(type){
    clearAccessState();
    document.body.classList.add(type==='open'?'public-full-reading-open':'member-reading-open');
    document.body.classList.remove('public-reading-open');
    document.querySelector('.fmbandco-continue-gate')?.remove();
    addStatusNote(type);
  }

  function showContinueGate(){
    clearAccessState();
    document.body.classList.add('public-reading-open','membership-gated');
    document.body.classList.remove('member-reading-open','public-full-reading-open');
    const all=chapters();
    const preview=all[0];
    all.slice(1).forEach(chapter=>{
      chapter.classList.add('members-only-section','fmbandco-preview-hidden');
      chapter.setAttribute('aria-hidden','true');chapter.setAttribute('data-nosnippet','');chapter.inert=true;
    });
    addStatusNote('preview');
    document.querySelector('.fmbandco-continue-gate')?.remove();
    const gate=document.createElement('section');gate.className='fmbandco-continue-gate';gate.id='continue-reading';
    gate.innerHTML='<p class="eyebrow">Continue this FMB eBook</p><h2>Enter your email to continue reading.</h2><p>New here? Your secure email link registers your access. Returning reader? Enter the same address you used before. No password is required.</p><div class="actions"><button class="pill" type="button" data-open-email-reading>Enter email to continue</button><a class="pill secondary" href="/ebooks/">Return to the library</a></div><p class="email-access-fallback" role="status" aria-live="polite"></p>';
    gate.querySelector('[data-open-email-reading]').addEventListener('click',openEmailAccess);
    if(preview)preview.insertAdjacentElement('afterend',gate);else hero()?.insertAdjacentElement('afterend',gate);

    const hiddenIds=new Set(all.slice(1).map(chapter=>chapter.id).filter(Boolean));
    document.querySelectorAll('.reading-toc a[href^="#"],.toc a[href^="#"]').forEach(link=>{
      const id=link.getAttribute('href').slice(1);if(!hiddenIds.has(id))return;
      link.classList.add('fmbandco-locked-toc');
      link.setAttribute('aria-label',`${(link.textContent||'Chapter').trim()} — secure email access required`);
      link.addEventListener('click',event=>{event.preventDefault();openEmailAccess()});
    });
  }

  function resolveAccess(isMember){
    if(isFullyOpen){revealCompleteReading('open');return}
    if(isMember)revealCompleteReading('member');else showContinueGate();
  }

  async function boot(){
    addStylesheet(READER_CSS);
    addProductBranding();
    if(!isFullyOpen)ensureEmailAccess().catch(()=>{});
    if(isFullyOpen)resolveAccess(false);
    else if(window.FMB_MEMBER)resolveAccess(Boolean(window.FMB_MEMBER.isMember));
    else{
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolveAccess(Boolean(value));addScript(READER_JS).catch(()=>{})};
      const timer=setTimeout(()=>finish(false),6500);
      addEventListener('fmb:auth-ready',event=>finish(event.detail?.isMember),{once:true});
      return;
    }
    addScript(READER_JS).catch(()=>{});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
