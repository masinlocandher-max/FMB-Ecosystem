(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const signinTab=$('#signinTab');
  const signupTab=$('#signupTab');
  const signinPanel=$('#signinPanel');
  const signupPanel=$('#signupPanel');
  const verificationActions=$('#verificationActions');
  const verificationLead=$('#verificationLead');
  const verificationEmail=$('#verificationEmail');
  const resendConfirmation=$('#resendConfirmation');
  const resendHelp=$('#resendHelp');
  const openSignIn=$('#openSignIn');
  const pendingEmailKey='fmb-pending-verification-email';
  const installOfferKey='fmb-member-install-after-verification';

  function rememberInstallOffer(email){
    try{
      localStorage.setItem(installOfferKey,JSON.stringify({email:String(email||'').trim().toLowerCase(),requestedAt:Date.now()}));
    }catch{}
  }

  function showPanel(name){
    signinTab.classList.add('active');
    signupTab.classList.remove('active');
    signinTab.setAttribute('aria-selected','true');
    signupTab.setAttribute('aria-selected','false');
    signupTab.disabled=true;
    signinPanel.hidden=false;
    signupPanel.hidden=true;
    history.replaceState(null,'',`${location.pathname}${location.search}#signin`);
  }
  signinTab.addEventListener('click',()=>showPanel('signin'));
  signupTab.addEventListener('click',()=>showPanel('signin'));
  showPanel('signin');

  document.querySelectorAll('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById(button.dataset.togglePassword);
    if(!input)return;
    const visible=input.type==='text';
    input.type=visible?'password':'text';
    button.textContent=visible?'Show':'Hide';
    button.setAttribute('aria-label',visible?'Show password':'Hide password');
  }));

  function setStatus(selector,message,type=''){
    const element=$(selector);
    element.textContent=message;
    element.className=`status show${type?' '+type:''}`;
  }
  function setLoading(button,loading,label){
    button.disabled=loading;
    button.classList.toggle('is-loading',loading);
    if(loading){button.dataset.original=button.textContent;button.textContent=label}
    else if(button.dataset.original){button.textContent=button.dataset.original;delete button.dataset.original}
  }
  function serviceUnavailable(selector){
    setStatus(selector,'The secure account service has not been connected yet. No account or password was created or changed.','error');
  }
  function validEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
  function passwordChecks(value){
    return {length:value.length>=10,lower:/[a-z]/.test(value),upper:/[A-Z]/.test(value),number:/\d/.test(value)};
  }
  function validPassword(value){return Object.values(passwordChecks(value)).every(Boolean)}
  function authBase(){
    const configuredBase=window.FMB?.config?.SITE_URL;
    if(configuredBase)return configuredBase;
    if(/(^|\.)francinemariebautista\.com$/i.test(location.hostname))return 'https://www.francinemariebautista.com/';
    return location.origin+location.pathname.replace(/[^/]*$/,'');
  }
  function signedInDestination(){
    const next=new URLSearchParams(location.search).get('next');
    if(next&&next.startsWith('/')&&!next.startsWith('//')&&!next.includes('\\')){
      try{
        const target=new URL(next,location.origin);
        if(target.origin===location.origin)return `${target.pathname}${target.search}${target.hash}`;
      }catch{}
    }
    if(location.hostname.toLowerCase()==='data.francinemariebautista.com')return '/admin.html';
    return '/profile/';
  }
  function showVerification(email){
    if(!verificationActions||!verificationEmail)return;
    if(verificationLead)verificationLead.textContent='Verification requested for';
    verificationEmail.textContent=email;
    if(resendConfirmation)resendConfirmation.hidden=false;
    verificationActions.hidden=false;
    sessionStorage.setItem(pendingEmailKey,email);
  }
  function showExistingAccount(email){
    if($('#signinEmail'))$('#signinEmail').value=email;
    sessionStorage.removeItem(pendingEmailKey);
    if(verificationActions)verificationActions.hidden=false;
    if(verificationLead)verificationLead.textContent='A profile already uses';
    if(verificationEmail)verificationEmail.textContent=email;
    if(resendConfirmation)resendConfirmation.hidden=true;
    if(resendHelp)resendHelp.textContent='This profile does not need another signup verification email. Open Sign in and enter the password, or choose Forgot password to receive a recovery link.';
  }

  const signupPassword=$('#signupPassword');
  signupPassword.addEventListener('input',()=>{
    const checks=passwordChecks(signupPassword.value);
    Object.entries(checks).forEach(([rule,valid])=>document.querySelector(`[data-rule="${rule}"]`)?.classList.toggle('valid',valid));
  });

  const localClient=window.FMB?.createClient('local');
  const sessionClient=window.FMB?.createClient('session');

  async function redirectExistingSession(){
    if(!window.FMB?.configured)return;
    for(const client of [localClient,sessionClient]){
      if(!client)continue;
      const {data}=await client.auth.getSession();
      if(data.session?.user?.email_confirmed_at){location.replace(signedInDestination());return}
    }
  }
  redirectExistingSession();

  $('#signinForm').addEventListener('submit',async event=>{
    event.preventDefault();
    const email=$('#signinEmail').value.trim().toLowerCase();
    const password=$('#signinPassword').value;
    const remember=$('#rememberSession').checked;
    if(!validEmail(email)){setStatus('#signinStatus','Enter a valid email address.','error');return}
    if(!password){setStatus('#signinStatus','Enter your password.','error');return}
    if(!window.FMB?.configured){serviceUnavailable('#signinStatus');return}
    const button=$('#signinButton');
    setLoading(button,true,'Signing in…');
    const client=window.FMB.createClient(remember?'local':'session');
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error){
      setLoading(button,false);
      const message=error.message?.toLowerCase().includes('email not confirmed')?'Open the verification email before signing in.':'The email or password is incorrect.';
      setStatus('#signinStatus',message,'error');
      return;
    }
    if(!data.user?.email_confirmed_at){
      await client.auth.signOut();
      setLoading(button,false);
      setStatus('#signinStatus','Open the verification email before signing in.','error');
      return;
    }
    const {data:profile}=await client.from('profiles').select('status').eq('id',data.user.id).maybeSingle();
    if(profile?.status==='suspended'){
      await client.auth.signOut();
      setLoading(button,false);
      setStatus('#signinStatus','This profile is suspended. Contact withlovefmb@gmail.com if you believe this is a mistake.','error');
      return;
    }
    location.replace(signedInDestination());
  });

  $('#signupForm').addEventListener('submit',event=>{
    event.preventDefault();
    setStatus('#signupStatus','Registration is closed. Existing members may sign in.','error');
    showPanel('signin');
  });

  $('#resetPassword').addEventListener('click',async()=>{
    const email=$('#signinEmail').value.trim().toLowerCase();
    if(!validEmail(email)){setStatus('#signinStatus','Enter the email connected to your profile first.','error');$('#signinEmail').focus();return}
    if(!window.FMB?.configured){serviceUnavailable('#signinStatus');return}
    const button=$('#resetPassword');
    setLoading(button,true,'Sending…');
    const client=window.FMB.createClient('local');
    const base=authBase();
    const redirectTo=new URL('reset-password.html',base).href;
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
    setLoading(button,false);
    if(error){
      const rateLimited=error.code==='over_email_send_rate_limit'||/rate limit|too many requests/i.test(error.message||'');
      setStatus('#signinStatus',rateLimited?'Password reset email sending is temporarily at its limit. Please wait before trying again.':'The reset request could not be sent right now. Please try again later.','error');
      return;
    }
    setStatus('#signinStatus','If a profile uses that email, a password reset link is on the way.','success');
  });

  openSignIn?.addEventListener('click',()=>{
    const email=(verificationEmail?.textContent||sessionStorage.getItem(pendingEmailKey)||'').trim().toLowerCase();
    if(validEmail(email)&&$('#signinEmail'))$('#signinEmail').value=email;
    showPanel('signin');
    setStatus('#signinStatus','Enter your password to sign in. Normal sign-in does not send an email. If you do not remember it, choose Forgot password.','');
  });
  resendConfirmation?.addEventListener('click',async()=>{
    const email=(verificationEmail?.textContent||sessionStorage.getItem(pendingEmailKey)||'').trim().toLowerCase();
    if(!validEmail(email)){setStatus('#signupStatus','Enter the email used for the profile first.','error');return}
    if(!window.FMB?.configured){serviceUnavailable('#signupStatus');return}
    setLoading(resendConfirmation,true,'Sending again…');
    const client=window.FMB.createClient('local');
    const redirectTo=window.FMB.config.AUTH_REDIRECT_URL||new URL('profile/',authBase()).href;
    const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectTo}});
    setLoading(resendConfirmation,false);
    if(error){
      const rateLimited=error.code==='over_email_send_rate_limit'||/rate limit|too many requests/i.test(error.message||'');
      setStatus('#signupStatus',rateLimited?'Please wait before requesting another verification email. Check Spam, Promotions, and All Mail first.':'The verification message could not be resent right now.','error');
      return;
    }
    rememberInstallOffer(email);
    resendConfirmation.disabled=true;
    let seconds=60;
    resendHelp.textContent=`Verification sent. You can request another message in ${seconds} seconds.`;
    const timer=setInterval(()=>{
      seconds-=1;
      if(seconds<=0){clearInterval(timer);resendConfirmation.disabled=false;resendHelp.textContent='Check Inbox, Spam, Promotions, and All Mail before requesting another message.';return}
      resendHelp.textContent=`Verification sent. You can request another message in ${seconds} seconds.`;
    },1000);
    setStatus('#signupStatus','If this profile is still awaiting verification, a fresh message was requested. Already verified profiles will not receive another signup email.','success');
  });

})();
