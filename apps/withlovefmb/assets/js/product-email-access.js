(function(){
  'use strict';

  if(window.FMBProductEmailAccess)return;

  const storageKey='fmb-product-access-email';
  let modal=null;
  let activeMode='reading';
  let submitting=false;

  const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());
  const productLabel=()=>activeMode==='music'?'FMB&CO. Music':'FMB&CO. eBooks';
  const actionLabel=()=>activeMode==='music'?'listening':'reading';

  function rememberedEmail(){
    try{return String(localStorage.getItem(storageKey)||'').trim().toLowerCase()}catch{return''}
  }

  function rememberEmail(email){
    try{localStorage.setItem(storageKey,email)}catch{}
  }

  async function waitForServices(){
    if(window.FMB?.configured)return true;
    const started=Date.now();
    while(Date.now()-started<7000){
      await new Promise(resolve=>setTimeout(resolve,120));
      if(window.FMB?.configured)return true;
    }
    return false;
  }

  function redirectUrl(){
    const url=new URL(location.href);
    url.hash='';
    return url.href;
  }

  function ensureModal(){
    if(modal)return modal;

    const style=document.createElement('style');
    style.textContent=`
      .fmb-email-access{position:fixed;inset:0;z-index:12050;display:none;place-items:center;padding:20px;background:rgba(14,7,20,.64);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      .fmb-email-access.open{display:grid}
      .fmb-email-card{position:relative;width:min(520px,100%);padding:30px;border:1px solid rgba(226,200,142,.34);border-radius:30px;background:linear-gradient(155deg,#fffdf8,#f5edf8);box-shadow:0 32px 100px rgba(13,6,19,.38);color:#2f1739}
      .fmb-email-close{position:absolute;top:16px;right:16px;width:40px;height:40px;border:1px solid rgba(75,35,91,.14);border-radius:50%;background:#fff;color:#4c2858;font:600 20px/1 system-ui;cursor:pointer}
      .fmb-email-kicker{margin:0 46px 8px 0;color:#8a6b28;font:850 10px/1.2 system-ui;letter-spacing:.14em;text-transform:uppercase}
      .fmb-email-card h2{margin:0 42px 12px 0;font:600 clamp(2.25rem,7vw,3.5rem)/.94 'Cormorant Garamond',Georgia,serif;color:#35133f}
      .fmb-email-card>p{margin:0;color:#66536c;line-height:1.65}
      .fmb-email-form{display:grid;gap:12px;margin-top:24px}
      .fmb-email-form label{font:800 11px/1.2 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#4c2858}
      .fmb-email-form input{width:100%;min-height:52px;padding:13px 16px;border:1px solid rgba(81,11,119,.2);border-radius:16px;background:#fff;color:#2f1739;font:500 16px/1.2 system-ui;outline:none}
      .fmb-email-form input:focus{border-color:#795184;box-shadow:0 0 0 4px rgba(121,81,132,.12)}
      .fmb-email-submit{min-height:50px;padding:12px 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#54206f,#7b4a98);color:#fff;font:800 14px/1 system-ui;cursor:pointer}
      .fmb-email-submit:disabled{opacity:.62;cursor:wait}
      .fmb-email-status{min-height:22px;margin:2px 0 0!important;color:#66536c!important;font-size:13px}
      .fmb-email-status.success{color:#28613d!important}
      .fmb-email-status.error{color:#9a2f42!important}
      .fmb-email-note{margin-top:16px!important;padding-top:15px;border-top:1px solid rgba(75,35,91,.12);font-size:12px;line-height:1.55!important}
      .fmb-email-note a{color:#54206f;font-weight:800}
      #musicAccessPrompt{display:none!important}
      @media(max-width:560px){.fmb-email-access{align-items:end;padding:10px}.fmb-email-card{padding:25px 20px;border-radius:27px}.fmb-email-card h2{font-size:2.55rem}}
    `;
    document.head.appendChild(style);

    modal=document.createElement('div');
    modal.className='fmb-email-access';
    modal.id='fmbProductEmailAccess';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','fmbEmailAccessTitle');
    modal.innerHTML=`
      <section class="fmb-email-card">
        <button class="fmb-email-close" type="button" aria-label="Close">×</button>
        <p class="fmb-email-kicker">Original FMB&amp;CO. digital products</p>
        <h2 id="fmbEmailAccessTitle">Enter your email to continue.</h2>
        <p class="fmb-email-copy">New here? Enter your email to register. Registered before? Enter the same email address you used to register. We will send a secure link so you can continue without entering a password.</p>
        <form class="fmb-email-form" novalidate>
          <label for="fmbProductEmail">Email address</label>
          <input id="fmbProductEmail" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required>
          <button class="fmb-email-submit" type="submit">Email me the continue link</button>
          <p class="fmb-email-status" role="status" aria-live="polite"></p>
        </form>
        <p class="fmb-email-note">By continuing, you agree to the <a href="/privacy-policy.html">Privacy Policy</a>. With Love, FMB.</p>
      </section>`;
    document.body.appendChild(modal);

    const form=modal.querySelector('form');
    const input=modal.querySelector('input');
    const submit=modal.querySelector('.fmb-email-submit');
    const status=modal.querySelector('.fmb-email-status');

    const close=()=>{
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
    };

    modal.querySelector('.fmb-email-close').addEventListener('click',close);
    modal.addEventListener('click',event=>{if(event.target===modal)close()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('open'))close()});

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(submitting)return;
      const email=input.value.trim().toLowerCase();
      status.className='fmb-email-status';
      if(!validEmail(email)){
        status.textContent='Enter a valid email address.';
        status.classList.add('error');
        input.focus();
        return;
      }

      submitting=true;
      submit.disabled=true;
      submit.textContent='Sending secure link…';
      status.textContent='Checking the secure email service…';

      const ready=await waitForServices();
      if(!ready){
        submitting=false;
        submit.disabled=false;
        submit.textContent='Email me the continue link';
        status.textContent='The secure email service is unavailable right now. Please try again shortly.';
        status.classList.add('error');
        return;
      }

      const client=window.FMB.createClient('local');
      const {error}=await client.auth.signInWithOtp({
        email,
        options:{
          shouldCreateUser:true,
          emailRedirectTo:redirectUrl(),
          data:{
            product_access_source:activeMode==='music'?'fmbandco_music':'fmbandco_ebooks',
            product_access_method:'email_link'
          }
        }
      });

      submitting=false;
      submit.disabled=false;
      submit.textContent='Email me the continue link';

      if(error){
        const limited=error.code==='over_email_send_rate_limit'||/rate limit|too many requests/i.test(error.message||'');
        status.textContent=limited?'Too many email requests were made. Please wait before trying again.':'The secure link could not be sent. Please review the email and try again.';
        status.classList.add('error');
        return;
      }

      rememberEmail(email);
      status.textContent=`Check ${email}. If it is new, the link registers it. If it was used before, the same link signs you in and continues ${actionLabel()}.`;
      status.classList.add('success');
    });

    return modal;
  }

  function open(options={}){
    activeMode=options.mode==='music'?'music':'reading';
    const element=ensureModal();
    const title=element.querySelector('h2');
    const copy=element.querySelector('.fmb-email-copy');
    const input=element.querySelector('input');
    const status=element.querySelector('.fmb-email-status');
    title.textContent=activeMode==='music'?'Enter your email to continue listening.':'Enter your email to continue reading.';
    copy.textContent='New here? Enter your email to register. Registered before? Enter the same email address you used to register. We will send a secure link so you can continue without entering a password.';
    status.textContent='';
    status.className='fmb-email-status';
    input.value=rememberedEmail();
    element.classList.add('open');
    element.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>input.focus({preventScroll:true}));
  }

  function connectMusicPrompt(){
    const original=document.getElementById('musicAccessPrompt');
    if(!original||original.dataset.fmbEmailConnected==='true')return;
    original.dataset.fmbEmailConnected='true';
    const sync=()=>{
      if(!original.classList.contains('open'))return;
      original.classList.remove('open');
      open({mode:'music'});
    };
    new MutationObserver(sync).observe(original,{attributes:true,attributeFilter:['class']});
    sync();
  }

  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-fmb-email-access]');
    if(!trigger)return;
    event.preventDefault();
    open({mode:trigger.dataset.fmbEmailAccess==='music'?'music':'reading'});
  });

  new MutationObserver(connectMusicPrompt).observe(document.documentElement,{childList:true,subtree:true});
  connectMusicPrompt();

  window.FMBProductEmailAccess={open};
})();