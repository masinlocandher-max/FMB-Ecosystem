(function(){
  'use strict';

  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const gate=$('#accessGate');
  if(!gate)return;

  const appShell=$('#appShell');
  const appTabbar=$('#appTabbar');
  const accessLoading=$('#accessLoading');
  const accessContent=$('#accessContent');
  const signupTab=$('#appSignupTab');
  const signinTab=$('#appSigninTab');
  const signupPanel=$('#appSignupPanel');
  const signinPanel=$('#appSigninPanel');
  const signupForm=$('#appSignupForm');
  const signinForm=$('#appSigninForm');
  const signupButton=$('#appSignupButton');
  const signinButton=$('#appSigninButton');
  const readiness=$('#appMembershipReadiness');
  const verification=$('#appVerification');
  const verificationEmail=$('#appVerificationEmail');
  const pendingEmailKey='fmb-app-pending-verification-email';
  const installOfferKey='fmb-member-install-after-verification';
  const greetingKey='fmb-app-last-greeting-v1';
  const themeKey='fmb-app-theme-v1';
  const fruitAvatars={orange:'🍊',apple:'🍏',grapes:'🍇',cherry:'🍒',peach:'🍑',lemon:'🍋',blueberry:'🫐',watermelon:'🍉'};
  const greetings=[
    name=>`Hey ${name}, quick vibe check.`,
    name=>`Welcome back, ${name}. How is your headspace?`,
    name=>`Okay ${name}, what is the vibe today?`,
    name=>`Hey ${name}, you made it. How are you doing?`,
    name=>`Soft reset, ${name}. What do you need today?`,
    name=>`${name}, let us take today one thing at a time.`,
    name=>`Good to see you, ${name}. What is on your mind?`,
    name=>`Hey ${name}, no pressure. How are you, really?`,
    name=>`${name}, this is your moment to check in.`,
    name=>`Welcome in, ${name}. Let us slow things down.`,
    name=>`Hey ${name}, how is your energy right now?`,
    name=>`${name}, what is taking up space today?`,
    name=>`Hi ${name}. You can be honest here.`,
    name=>`Hey ${name}, let us check the emotional weather.`,
    name=>`${name}, how is life landing today?`,
    name=>`Welcome back, ${name}. What feels true right now?`,
    name=>`Hey ${name}, pause with us for a minute.`,
    name=>`${name}, what would feel kind today?`,
    name=>`Hi ${name}. How is your inner world doing?`,
    name=>`Hey ${name}, come as you are.`,
    name=>`${name}, let us make a little room for you.`,
    name=>`Good to have you here, ${name}. How are things?`,
    name=>`Hey ${name}, your check-in can be simple today.`,
    name=>`${name}, what does your mind need right now?`,
    name=>`Welcome, ${name}. Let us meet the day gently.`,
    name=>`Hey ${name}, what is the honest update?`,
    name=>`${name}, you do not have to perform here.`,
    name=>`Hi ${name}. Let us find your pace for today.`,
    name=>`Hey ${name}, how is your heart doing?`,
    name=>`${name}, take a breath. What is the vibe?`,
    name=>`Welcome back, ${name}. What needs care today?`,
    name=>`Hey ${name}, let us keep it real and kind.`,
    name=>`${name}, how are you holding up today?`,
    name=>`Hi ${name}. What would make today feel lighter?`,
    name=>`Hey ${name}, this space is yours for a minute.`,
    name=>`${name}, let us start with where you are.`,
    name=>`Hey ${name}, what is the mood in one word?`,
    name=>`${name}, glad you are here. Let us do a gentle check-in.`,
    name=>`Real talk, ${name}: how are you feeling?`,
    name=>`Hey ${name}, zero judgment. What is going on?`,
    name=>`${name}, you are allowed to take up space here.`,
    name=>`Hi ${name}. Let us keep this check-in low pressure.`,
    name=>`Hey ${name}, what is your energy saying today?`,
    name=>`${name}, no perfect answer needed. How are you?`,
    name=>`Welcome in, ${name}. Let us find one honest feeling.`,
    name=>`Hey ${name}, what has your attention right now?`,
    name=>`${name}, this can be a soft place to land.`,
    name=>`Hi ${name}. What is the emotional headline today?`,
    name=>`Hey ${name}, let us make the moment a little lighter.`,
    name=>`${name}, what kind of support would feel good today?`,
    name=>`Welcome back, ${name}. Your pace is okay here.`,
    name=>`Hey ${name}, what feeling showed up with you?`,
    name=>`${name}, let us check in without overthinking it.`,
    name=>`Hi ${name}. You can start with just one word.`,
    name=>`Hey ${name}, what is your mind carrying today?`,
    name=>`${name}, being here already counts as care.`,
    name=>`Welcome, ${name}. Let us take a calm minute.`,
    name=>`Hey ${name}, what would your honest status be?`,
    name=>`${name}, you can show up exactly as you are.`,
    name=>`Hi ${name}. Ready for a tiny reset?`
  ];

  let registrationOpen=false;
  let readinessPromise=null;
  let activeClient=null;
  let activeMode='local';
  let pendingVerificationEmail='';

  function setStatus(selector,message,type=''){
    const element=$(selector);
    if(!element)return;
    element.textContent=message;
    element.dataset.type=type;
    element.classList.toggle('visible',Boolean(message));
  }

  function setLoading(button,loading,label){
    if(!button)return;
    button.disabled=loading;
    button.classList.toggle('is-loading',loading);
    if(loading){
      button.dataset.original=button.textContent;
      button.textContent=label;
    }else if(button.dataset.original){
      button.textContent=button.dataset.original;
      delete button.dataset.original;
    }
  }

  function validEmail(value){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function passwordChecks(value){
    return {
      length:value.length>=10,
      lower:/[a-z]/.test(value),
      upper:/[A-Z]/.test(value),
      number:/\d/.test(value)
    };
  }

  function validPassword(value){
    return Object.values(passwordChecks(value)).every(Boolean);
  }

  function showPanel(name,{focus=false}={}){
    const signingIn=name==='signin';
    signupTab.classList.toggle('active',!signingIn);
    signinTab.classList.toggle('active',signingIn);
    signupTab.setAttribute('aria-selected',String(!signingIn));
    signinTab.setAttribute('aria-selected',String(signingIn));
    signupPanel.hidden=signingIn;
    signinPanel.hidden=!signingIn;
    if(focus){
      requestAnimationFrame(()=>$(signingIn?'#appSigninEmail':'#appFullName')?.focus({preventScroll:true}));
    }
  }

  function serviceMessage(selector){
    setStatus(selector,'Secure profile access is temporarily unavailable. No password or profile was created or changed.','error');
  }

  function authRedirect(){
    if(location.hostname.toLowerCase()==='app.francinemariebautista.com'){
      return 'https://app.francinemariebautista.com/app/';
    }
    return new URL('/app/',location.origin).href;
  }

  function passwordResetRedirect(){
    const base=window.FMB?.config?.SITE_URL||'https://www.francinemariebautista.com/';
    return new URL('reset-password.html',base).href;
  }

  function rememberInstallOffer(email){
    try{
      localStorage.setItem(installOfferKey,JSON.stringify({email:String(email||'').toLowerCase(),requestedAt:Date.now()}));
    }catch{}
  }

  function rememberVerificationEmail(email){
    pendingVerificationEmail=String(email||'').trim().toLowerCase();
    try{sessionStorage.setItem(pendingEmailKey,pendingVerificationEmail)}catch{}
  }

  function savedVerificationEmail(){
    if(pendingVerificationEmail)return pendingVerificationEmail;
    try{return sessionStorage.getItem(pendingEmailKey)||''}catch{return ''}
  }

  function showVerification(email){
    rememberVerificationEmail(email);
    verificationEmail.textContent=email;
    signupForm.hidden=true;
    verification.hidden=false;
    signupPanel.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }

  function resetVerification(){
    signupForm.hidden=false;
    verification.hidden=true;
  }

  function initials(value){
    return String(value||'F').trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()).join('')||'F';
  }

  function firstName(value){
    return String(value||'').trim().split(/\s+/)[0]||'';
  }

  function changingGreeting(name){
    let last=-1;
    try{last=Number(localStorage.getItem(greetingKey))}catch{}
    const choices=greetings.map((_,index)=>index).filter(index=>index!==last);
    const index=choices[Math.floor(Math.random()*choices.length)]??0;
    try{localStorage.setItem(greetingKey,String(index))}catch{}
    return greetings[index](name||'friend');
  }

  function applyTheme(value){
    const allowed=['violet','navy','forest','slate'];
    const theme=allowed.includes(value)?value:'violet';
    document.body.dataset.theme=theme;
    try{localStorage.setItem(themeKey,theme)}catch{}
    return theme;
  }

  function setAccountAvatar(profile,user){
    const avatar=$('#appAccountAvatar');
    const button=$('#appAccountButton');
    if(!avatar||!button)return;
    const name=profile?.full_name||profile?.display_name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||'Member';
    const preset=fruitAvatars[profile?.avatar_preset]||'';
    const photo=preset?'':profile?.avatar_url;
    avatar.textContent=preset||(!photo?initials(name):'');
    avatar.style.backgroundImage=photo?`url("${String(photo).replace(/["\\]/g,'')}")`:'none';
    avatar.classList.toggle('has-photo',Boolean(photo));
    avatar.classList.toggle('has-fruit',Boolean(preset));
    button.setAttribute('aria-label',`Open ${name}'s profile`);
    const homeTitle=$('#homeTitle');
    const givenName=firstName(name);
    if(homeTitle)homeTitle.textContent=changingGreeting(givenName||'friend');
  }

  function showApp(user,profile,client,mode){
    activeClient=client||activeClient;
    activeMode=mode||activeMode;
    let savedTheme='violet';
    try{savedTheme=localStorage.getItem(themeKey)||'violet'}catch{}
    applyTheme(profile?.app_theme||savedTheme);
    setAccountAvatar(profile,user);
    window.FMB_APP_SESSION={client:activeClient,user,profile:profile||{},mode:activeMode};
    window.FMB_APP_ACCESS={
      applyProfile(nextProfile){
        const merged={...(window.FMB_APP_SESSION?.profile||{}),...(nextProfile||{})};
        window.FMB_APP_SESSION.profile=merged;
        applyTheme(merged.app_theme||document.body.dataset.theme);
        setAccountAvatar(merged,user);
        return merged;
      },
      applyTheme,
      async refreshProfile(){
        const result=await profileFor(activeClient,user);
        if(result.profile)this.applyProfile(result.profile);
        return result;
      },
      async signOut(){
        await Promise.all(['local','session'].map(storageMode=>window.FMB?.createClient(storageMode)?.auth.signOut({scope:'local'}).catch(()=>{})));
        location.replace('/app/?auth=signin');
      },
      fruitAvatars
    };
    gate.hidden=true;
    gate.setAttribute('aria-busy','false');
    appShell.hidden=false;
    appTabbar.hidden=false;
    document.body.classList.remove('auth-pending','auth-required');
    document.body.classList.add('app-authenticated');
    document.documentElement.style.colorScheme='light';
    window.dispatchEvent(new CustomEvent('fmb:app-auth-ready',{detail:window.FMB_APP_SESSION}));
  }

  function readAuthError(){
    const params=new URLSearchParams(location.hash.replace(/^#/,''));
    return params.get('error_description')||params.get('error')||'';
  }

  function showAccess(message='',panel='signup'){
    setLoading(signinButton,false);
    setLoading(signupButton,false);
    appShell.hidden=true;
    appTabbar.hidden=true;
    gate.hidden=false;
    gate.setAttribute('aria-busy','false');
    accessLoading.hidden=true;
    accessContent.hidden=false;
    document.body.classList.remove('auth-pending','app-authenticated');
    document.body.classList.add('auth-required');
    showPanel(panel);
    if(message)setStatus(panel==='signin'?'#appSigninStatus':'#appSignupStatus',message,'error');
    checkReadiness();
  }

  async function checkReadiness(){
    if(readinessPromise)return readinessPromise;
    readinessPromise=(async()=>{
      if(!window.FMB?.configured){
        readiness.textContent='Secure profile creation is temporarily unavailable. Existing members may still sign in.';
        readiness.dataset.state='closed';
        signupButton.textContent='Profile creation unavailable';
        signupButton.disabled=true;
        return;
      }
      try{
        const client=window.FMB.createClient('local');
        const {data,error}=await client.rpc('get_membership_status');
        registrationOpen=!error&&data?.ready===true&&data?.registration_open===true;
      }catch{
        registrationOpen=false;
      }
      readiness.dataset.state=registrationOpen?'open':'closed';
      readiness.textContent=registrationOpen
        ?'Profile creation is open. We will verify your email before opening the app.'
        :'New profiles are temporarily paused. Existing members may still sign in.';
      signupButton.disabled=!registrationOpen;
      signupButton.textContent=registrationOpen?'Create my profile':'Profile creation paused';
    })();
    return readinessPromise;
  }

  async function profileFor(client,user){
    try{
      const {data,error}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();
      if(error)return {profile:null,error};
      return {profile:data,error:null};
    }catch(error){
      return {profile:null,error};
    }
  }

  async function openVerifiedSession(client,mode,knownUser=null){
    const verified=knownUser?{user:knownUser,error:null}:(await client.auth.getUser()).data;
    const user=verified?.user||knownUser;
    if(!user||!user.email_confirmed_at)return false;
    const {profile,error}=await profileFor(client,user);
    if(error||!profile){
      await client.auth.signOut({scope:'local'}).catch(()=>{});
      showAccess('Your email is verified, but an active member profile could not be opened. Please try again or contact withlovefmb@gmail.com.','signin');
      return true;
    }
    if(profile?.status==='suspended'){
      await client.auth.signOut({scope:'local'}).catch(()=>{});
      showAccess('This profile is suspended. Contact withlovefmb@gmail.com if you believe this is a mistake.','signin');
      return true;
    }
    if(profile.status!=='active'){
      await client.auth.signOut({scope:'local'}).catch(()=>{});
      showAccess('An active member profile is required to enter this space. Contact withlovefmb@gmail.com for help.','signin');
      return true;
    }
    showApp(user,profile,client,mode);
    return true;
  }

  async function resolveStoredSession(){
    const redirectError=readAuthError();
    if(!window.FMB?.configured){
      showAccess('Secure profile access is temporarily unavailable. Please try again later.','signin');
      return;
    }
    for(const mode of ['local','session']){
      const client=window.FMB.createClient(mode);
      if(!client)continue;
      try{
        const {data,error}=await client.auth.getSession();
        if(error||!data.session)continue;
        const {data:userData,error:userError}=await client.auth.getUser();
        if(userError||!userData.user)continue;
        if(await openVerifiedSession(client,mode,userData.user))return;
      }catch{}
    }
    const requestedPanel=new URLSearchParams(location.search).get('auth')==='signin'?'signin':'signup';
    showAccess(redirectError?decodeURIComponent(redirectError.replace(/\+/g,' ')):'',redirectError?'signin':requestedPanel);
  }

  signupTab.addEventListener('click',()=>showPanel('signup',{focus:true}));
  signinTab.addEventListener('click',()=>showPanel('signin',{focus:true}));

  $$('[data-access-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById(button.dataset.accessToggle);
    if(!input)return;
    const showing=input.type==='text';
    input.type=showing?'password':'text';
    button.textContent=showing?'Show':'Hide';
    button.setAttribute('aria-label',showing?'Show password':'Hide password');
  }));

  $('#appSignupPassword').addEventListener('input',event=>{
    const checks=passwordChecks(event.currentTarget.value);
    Object.entries(checks).forEach(([rule,valid])=>{
      $(`[data-access-rule="${rule}"]`)?.classList.toggle('valid',valid);
    });
  });

  signinForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const email=$('#appSigninEmail').value.trim().toLowerCase();
    const password=$('#appSigninPassword').value;
    const remember=$('#appRememberSession').checked;
    if(!validEmail(email)){
      setStatus('#appSigninStatus','Enter a valid email address.','error');
      $('#appSigninEmail').focus();
      return;
    }
    if(!password){
      setStatus('#appSigninStatus','Enter your password.','error');
      $('#appSigninPassword').focus();
      return;
    }
    if(!window.FMB?.configured){serviceMessage('#appSigninStatus');return}
    setStatus('#appSigninStatus','');
    setLoading(signinButton,true,'Signing in');
    const mode=remember?'local':'session';
    const client=window.FMB.createClient(mode);
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error){
      setLoading(signinButton,false);
      const unconfirmed=/email not confirmed/i.test(error.message||'');
      setStatus('#appSigninStatus',unconfirmed?'Open the verification email before signing in.':'The email or password is incorrect.','error');
      return;
    }
    if(!data.user?.email_confirmed_at){
      await client.auth.signOut({scope:'local'}).catch(()=>{});
      setLoading(signinButton,false);
      setStatus('#appSigninStatus','Open the verification email before signing in.','error');
      return;
    }
    const handled=await openVerifiedSession(client,mode,data.user);
    if(!handled){
      setLoading(signinButton,false);
      setStatus('#appSigninStatus','We could not open this profile. Please try again.','error');
    }
  });

  signupForm.addEventListener('submit',async event=>{
    event.preventDefault();
    await checkReadiness();
    if(!registrationOpen){
      setStatus('#appSignupStatus','New profile creation is temporarily paused. Existing members may still sign in.','error');
      return;
    }
    const fullName=window.FMB?.cleanText($('#appFullName').value,80)||'';
    const email=$('#appSignupEmail').value.trim().toLowerCase();
    const password=$('#appSignupPassword').value;
    const confirmation=$('#appConfirmPassword').value;
    if(fullName.length<2){setStatus('#appSignupStatus','Enter your full name.','error');$('#appFullName').focus();return}
    if(!validEmail(email)){setStatus('#appSignupStatus','Enter a valid email address.','error');$('#appSignupEmail').focus();return}
    if(!validPassword(password)){setStatus('#appSignupStatus','Use at least 10 characters with a lowercase letter, uppercase letter, and number.','error');$('#appSignupPassword').focus();return}
    if(password!==confirmation){setStatus('#appSignupStatus','The passwords do not match.','error');$('#appConfirmPassword').focus();return}
    if(!$('#appLegalConsent').checked){setStatus('#appSignupStatus','Read and accept the membership, privacy, and community terms before continuing.','error');return}
    if(!window.FMB?.configured){serviceMessage('#appSignupStatus');return}

    setStatus('#appSignupStatus','');
    setLoading(signupButton,true,'Creating your profile');
    const client=window.FMB.createClient('local');
    const {data,error}=await client.auth.signUp({
      email,
      password,
      options:{
        emailRedirectTo:authRedirect(),
        data:{
          full_name:fullName,
          display_name:fullName,
          username:window.FMB.usernameFrom(fullName),
          accepted_membership_version:'2026-07-12',
          accepted_privacy_version:'2026-07-12',
          accepted_guidelines_version:'2026-07-12'
        }
      }
    });
    setLoading(signupButton,false);
    signupButton.disabled=!registrationOpen;
    if(error){
      const duplicate=['user_already_exists','email_exists'].includes(error.code)||/already registered|already exists/i.test(error.message||'');
      const limited=error.code==='over_email_send_rate_limit'||/rate limit|too many requests/i.test(error.message||'');
      setStatus('#appSignupStatus',duplicate
        ?'A profile may already use this email. Choose Sign in or reset the password.'
        :limited
          ?'Verification email sending is temporarily at its limit. Please wait before trying again.'
          :'The profile could not be created. Review the details and try again.','error');
      if(duplicate){
        $('#appSigninEmail').value=email;
        showPanel('signin');
      }
      return;
    }
    const existingAccount=Boolean(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0);
    if(existingAccount){
      $('#appSigninEmail').value=email;
      showPanel('signin');
      setStatus('#appSigninStatus','A profile already uses this email. Sign in, or reset the password if needed.','error');
      return;
    }
    rememberInstallOffer(email);
    if(data.session&&data.user?.email_confirmed_at){
      await openVerifiedSession(client,'local',data.user);
      return;
    }
    signupForm.reset();
    $$('#appPasswordRules span').forEach(rule=>rule.classList.remove('valid'));
    showVerification(email);
  });

  $('#appOpenSignin').addEventListener('click',()=>{
    const email=savedVerificationEmail();
    if(email)$('#appSigninEmail').value=email;
    showPanel('signin',{focus:true});
  });

  $('#appResendConfirmation').addEventListener('click',async event=>{
    const email=savedVerificationEmail();
    if(!validEmail(email)){
      resetVerification();
      setStatus('#appSignupStatus','Enter the email used for your profile first.','error');
      return;
    }
    if(!window.FMB?.configured){
      $('#appResendHelp').textContent='Secure profile access is temporarily unavailable. Please try again later.';
      return;
    }
    const button=event.currentTarget;
    setLoading(button,true,'Requesting a new email');
    const client=window.FMB.createClient('local');
    const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:authRedirect()}});
    setLoading(button,false);
    $('#appResendHelp').textContent=error
      ?'The verification email could not be requested right now. Please wait before trying again.'
      :'If this profile is still awaiting verification, a new message was requested. Check all email folders.';
  });

  $('#appResetPassword').addEventListener('click',async event=>{
    const email=$('#appSigninEmail').value.trim().toLowerCase();
    if(!validEmail(email)){
      setStatus('#appSigninStatus','Enter the email connected to your profile first.','error');
      $('#appSigninEmail').focus();
      return;
    }
    if(!window.FMB?.configured){serviceMessage('#appSigninStatus');return}
    const button=event.currentTarget;
    setLoading(button,true,'Sending reset link');
    const client=window.FMB.createClient('local');
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:passwordResetRedirect()});
    setLoading(button,false);
    setStatus('#appSigninStatus',error
      ?'The reset request could not be sent right now. Please wait and try again.'
      :'If a profile uses that email, a password reset link is on the way.',error?'error':'success');
  });

  resolveStoredSession();
})();
