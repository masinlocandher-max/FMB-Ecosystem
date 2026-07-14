(function(){
  'use strict';

  const OWNER_EMAIL='fbautisat23@gmail.com';
  const heading=document.getElementById('activationHeading');
  const detail=document.getElementById('activationDetail');
  const status=document.getElementById('activationStatus');
  const retry=document.getElementById('activationRetry');
  if(!heading||!detail||!status||!retry)return;

  let client=null;
  let busy=false;
  let finished=false;

  function show(message,type=''){
    status.textContent=message;
    status.className=`status show${type?' '+type:''}`;
  }

  function fail(message){
    if(finished)return;
    heading.textContent='Administrator access could not be completed.';
    detail.textContent='Request a fresh secure link and open it using the authorized owner email.';
    show(message,'error');
    retry.hidden=false;
  }

  async function activate(session){
    if(busy||finished||!session)return;
    busy=true;

    const email=session.user?.email?.toLowerCase();
    if(email!==OWNER_EMAIL){
      await client.auth.signOut();
      busy=false;
      fail('This signed-in email is not authorized for the FMB administrator account.');
      return;
    }

    show('Verified. Applying the administrator role…');
    const {data,error}=await client.rpc('claim_initial_admin');
    if(error){
      busy=false;
      fail('The administrator role could not be applied. The secure link may have expired or the owner account may already be configured elsewhere.');
      return;
    }

    finished=true;
    heading.textContent='Administrator access is ready.';
    detail.textContent=`Welcome, ${data?.full_name||'Francine Marie Bautista'}. Opening your security settings so you can choose your password.`;
    show('Administrator verified successfully.','success');
    setTimeout(()=>location.replace('member.html#settingsPanel'),1100);
  }

  if(!window.FMB?.configured){
    fail('The secure account service is not available.');
    return;
  }

  client=window.FMB.createClient('local');
  client.auth.onAuthStateChange((_event,session)=>{
    if(session)activate(session);
  });

  client.auth.getSession().then(({data,error})=>{
    if(error){fail('The secure session could not be read.');return}
    if(data.session){activate(data.session);return}
    setTimeout(()=>{
      if(!busy&&!finished)fail('This administrator link is invalid or has expired.');
    },1600);
  });
})();
