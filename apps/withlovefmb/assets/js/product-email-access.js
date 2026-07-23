(function(){
  'use strict';
  if(window.FMBProductEmailAccess)return;
  const storageKey='fmb-product-access-email';
  let modal=null;
  let activeMode='reading';
  let submitting=false;
  const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
  const actionLabel=()=>activeMode==='music'?'listening':'reading';
  const rememberedEmail=()=>{try{return String(localStorage.getItem(storageKey)||'').trim().toLowerCase()}catch{return''}};
  const rememberEmail=email=>{try{localStorage.setItem(storageKey,email)}catch{}};

  async function waitForServices(){
    if(window.FMB?.configured)return true;
    const started=Date.now();
    while(Date.now()-started<7000){await new Promise(resolve=>setTimeout(resolve,120));if(window.FMB?.configured)return true}
    return false;
  }
  function redirectUrl(){const url=new URL(location.href);url.hash='';return url.href}

  function ensureModal(){
    if(modal)return modal;
    const style=document.createElement('style');
    style.textContent=`
      .fmb-email-access{position:fixed;inset:0;z-index:12050;display:none;place-items:center;padding:20px;background:rgba(10,5,15,.58);-webkit-backdrop-filter:blur(22px) saturate(135%);backdrop-filter:blur(22px) saturate(135%)}
      .fmb-email-access.open{display:grid}
      .fmb-email-card{position:relative;width:min(510px,100%);padding:34px;border:1px solid rgba(60,60,67,.14);border-radius:28px;background:rgba(253,252,255,.96);box-shadow:0 36px 110px rgba(10,5,15,.38);color:#1d1d1f;transform:translateY(18px) scale(.985);opacity:0;animation:fmbEmailIn .48s cubic-bezier(.22,1,.36,1) forwards}
      @keyframes fmbEmailIn{to{transform:none;opacity:1}}
      .fmb-email-close{position:absolute;top:15px;right:15px;width:38px;height:38px;border:1px solid rgba(60,60,67,.12);border-radius:50%;background:#f2f2f7;color:#3a3a3c;font:650 18px/1 system-ui;cursor:pointer}
      .fmb-email-lockup{display:block;width:min(280px,76%);height:58px;padding:8px 12px;border-radius:14px;background:#0d0713;object-fit:contain;object-position:left center;margin-bottom:24px}
      .fmb-email-kicker{margin:0 46px 9px 0;color:#7a3fe4;font:800 10px/1.2 system-ui;letter-spacing:.13em;text-transform:uppercase}
      .fmb-email-card h2{margin:0 42px 13px 0;font:500 clamp(2rem,7vw,3.25rem)/.98 Cinzel,Georgia,serif;color:#1d1d1f;letter-spacing:-.035em}
      .fmb-email-card>p{margin:0;color:#6e6e73;font:400 14px/1.65 system-ui}
      .fmb-email-form{display:grid;gap:11px;margin-top:24px}
      .fmb-email-form label{font:750 10px/1.2 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#48484a}
      .fmb-email-form input{width:100%;min-height:52px;padding:13px 15px;border:1px solid rgba(60,60,67,.17);border-radius:14px;background:#fff;color:#1d1d1f;font:500 16px/1.2 system-ui;outline:none}
      .fmb-email-form input:focus{border-color:#7a3fe4;box-shadow:0 0 0 4px rgba(122,63,228,.1)}
      .fmb-email-submit{min-height:50px;padding:12px 18px;border:0;border-radius:999px;background:#1d1d1f;color:#fff;font:750 13px/1 system-ui;cursor:pointer;transition:transform .2s ease,opacity .2s ease}
      .fmb-email-submit:hover{transform:translateY(-1px)}.fmb-email-submit:disabled{opacity:.58;cursor:wait;transform:none}
      .fmb-email-status{min-height:22px;margin:2px 0 0!important;color:#6e6e73!important;font-size:12px!important}.fmb-email-status.success{color:#267342!important}.fmb-email-status.error{color:#a42c3e!important}
      .fmb-email-note{margin-top:15px!important;padding-top:14px;border-top:1px solid rgba(60,60,67,.1);font-size:11px!important;line-height:1.55!important}.fmb-email-note a{color:#5b2674;font-weight:750}
      #musicAccessPrompt{display:none!important}
      @media(max-width:560px){.fmb-email-access{align-items:end;padding:8px}.fmb-email-card{padding:28px 20px 24px;border-radius:26px}.fmb-email-card h2{font-size:2.35rem}}
      @media(prefers-reduced-motion:reduce){.fmb-email-card{animation:none;transform:none;opacity:1}}
    `;
    document.head.appendChild(style);
    modal=document.createElement('div');modal.className='fmb-email-access';modal.id='fmbProductEmailAccess';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','fmbEmailAccessTitle');
    modal.innerHTML=`<section class="fmb-email-card"><button class="fmb-email-close" type="button" aria-label="Close">×</button><img class="fmb-email-lockup" alt=""><p class="fmb-email-kicker">Existing member access</p><h2 id="fmbEmailAccessTitle">Enter your member email.</h2><p class="fmb-email-copy">Registration is closed. Existing members can request a secure sign-in link using the email already connected to their profile.</p><form class="fmb-email-form" novalidate><label for="fmbProductEmail">Member email address</label><input id="fmbProductEmail" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required><button class="fmb-email-submit" type="submit">Email me the secure link</button><p class="fmb-email-status" role="status" aria-live="polite"></p></form><p class="fmb-email-note">By continuing, you agree to the <a href="/privacy-policy.html">Privacy Policy</a>. Your information is not displayed publicly.</p></section>`;
    document.body.appendChild(modal);
    const form=modal.querySelector('form'),input=modal.querySelector('input'),submit=modal.querySelector('.fmb-email-submit'),status=modal.querySelector('.fmb-email-status');
    const close=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')};
    modal.querySelector('.fmb-email-close').addEventListener('click',close);modal.addEventListener('click',event=>{if(event.target===modal)close()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('open'))close()});
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(submitting)return;
      const email=input.value.trim().toLowerCase();status.className='fmb-email-status';
      if(!validEmail(email)){status.textContent='Enter a valid email address.';status.classList.add('error');input.focus();return}
      submitting=true;submit.disabled=true;submit.textContent='Sending secure link…';status.textContent='Connecting to the secure email service…';
      const ready=await waitForServices();
      if(!ready){submitting=false;submit.disabled=false;submit.textContent='Email me the secure link';status.textContent='The secure email service is unavailable right now. Please try again shortly.';status.classList.add('error');return}
      const client=window.FMB.createClient('local');
      const {error}=await client.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:redirectUrl()}});
      submitting=false;submit.disabled=false;submit.textContent='Email me the secure link';
      if(error){const limited=error.code==='over_email_send_rate_limit'||/rate limit|too many requests/i.test(error.message||'');status.textContent=limited?'Too many email requests were made. Please wait before trying again.':'The secure link could not be sent. Review the email and try again.';status.classList.add('error');return}
      rememberEmail(email);status.textContent=`If ${email} belongs to an existing member, check that inbox for a secure link to continue ${actionLabel()}.`;status.classList.add('success');
    });
    return modal;
  }

  function open(options={}){
    activeMode=options.mode==='music'?'music':'reading';
    const element=ensureModal();
    const isMusic=activeMode==='music';
    element.querySelector('.fmb-email-lockup').src=isMusic?'/assets/images/fmb-approved/fmb-music-official-transparent.webp':'/assets/images/fmb-approved/fmb-ebook-official-transparent.webp';
    element.querySelector('.fmb-email-lockup').alt=isMusic?'FMB Music':'FMB eBooks';
    element.querySelector('h2').textContent=isMusic?'Continue listening.':'Continue reading.';
    element.querySelector('.fmb-email-copy').textContent=isMusic?'Registration is closed. Existing members can request a secure link using the email already connected to their profile.':'Registration is closed. Existing members can request a secure link using the email already connected to their profile.';
    const input=element.querySelector('input'),status=element.querySelector('.fmb-email-status');input.value=rememberedEmail();status.textContent='';status.className='fmb-email-status';element.classList.add('open');element.setAttribute('aria-hidden','false');requestAnimationFrame(()=>input.focus({preventScroll:true}));
  }
  document.addEventListener('click',event=>{const trigger=event.target.closest('[data-fmb-email-access]');if(!trigger)return;event.preventDefault();open({mode:trigger.dataset.fmbEmailAccess==='music'?'music':'reading'})});
  window.FMBProductEmailAccess={open};
})();
