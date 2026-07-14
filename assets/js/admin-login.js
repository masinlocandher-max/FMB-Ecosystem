(function(){
  'use strict';

  const OWNER_EMAIL='fbautisat23@gmail.com';
  const button=document.getElementById('sendAdminLink');
  const status=document.getElementById('adminLoginStatus');
  if(!button||!status)return;

  function setStatus(message,type=''){
    status.textContent=message;
    status.className=`status show${type?' '+type:''}`;
  }

  function setLoading(loading){
    button.disabled=loading;
    button.textContent=loading?'Sending secure link…':'Email administrator link';
  }

  if(!window.FMB?.configured){
    button.disabled=true;
    setStatus('The secure account service is not available.','error');
    return;
  }

  const client=window.FMB.createClient('local');

  client.auth.getSession().then(({data})=>{
    const email=data.session?.user?.email?.toLowerCase();
    if(email===OWNER_EMAIL)location.replace('admin-activate.html');
  });

  button.addEventListener('click',async()=>{
    setLoading(true);
    const base=window.FMB.config.SITE_URL||location.origin+location.pathname.replace(/[^/]*$/,'');
    const redirectTo=new URL('admin-activate.html',base).href;
    const {error}=await client.auth.signInWithOtp({
      email:OWNER_EMAIL,
      options:{
        shouldCreateUser:true,
        emailRedirectTo:redirectTo,
        data:{
          full_name:'Francine Marie Bautista',
          display_name:'Francine Marie Bautista',
          username:'francinemariebautista',
          accepted_membership_version:'2026-07-12',
          accepted_privacy_version:'2026-07-12',
          accepted_guidelines_version:'2026-07-12'
        }
      }
    });
    setLoading(false);
    if(error){
      setStatus('The secure administrator link could not be sent. Please try again after a short wait.','error');
      return;
    }
    setStatus('A secure sign-in link was sent to the authorized administrator email. Open that email to continue.','success');
  });
})();
