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

  const config=window.FMB_CONFIG||{};
  if(!config.SUPABASE_URL||!config.SUPABASE_ANON_KEY){
    button.disabled=true;
    setStatus('The secure account service is not available.','error');
    return;
  }

  async function existingOwnerSession(){
    try{
      if(!window.FMB?.configured)return;
      const client=window.FMB.createClient('local');
      const {data}=await client.auth.getSession();
      if(data.session?.user?.email?.toLowerCase()===OWNER_EMAIL){
        location.replace('admin-activate.html');
      }
    }catch(_error){
      // The direct Auth request below remains available even when the SDK is blocked.
    }
  }
  existingOwnerSession();

  button.addEventListener('click',async()=>{
    setLoading(true);
    setStatus('Contacting the secure account service…');

    const base=config.SITE_URL||location.origin+location.pathname.replace(/[^/]*$/,'');
    const redirectTo=new URL('admin-activate.html',base).href;
    const endpoint=`${String(config.SUPABASE_URL).replace(/\/$/,'')}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`;

    try{
      const response=await fetch(endpoint,{
        method:'POST',
        mode:'cors',
        headers:{
          'Content-Type':'application/json',
          'apikey':config.SUPABASE_ANON_KEY,
          'Authorization':`Bearer ${config.SUPABASE_ANON_KEY}`
        },
        body:JSON.stringify({
          email:OWNER_EMAIL,
          create_user:true,
          data:{
            full_name:'Francine Marie Bautista',
            display_name:'Francine Marie Bautista',
            username:'francinemariebautista',
            accepted_membership_version:'2026-07-12',
            accepted_privacy_version:'2026-07-12',
            accepted_guidelines_version:'2026-07-12'
          },
          gotrue_meta_security:{}
        })
      });

      const result=await response.json().catch(()=>({}));
      setLoading(false);

      if(!response.ok){
        const code=String(result.code||result.error_code||'');
        const message=String(result.msg||result.message||result.error_description||'');
        if(code==='email_address_not_authorized'||/not authorized/i.test(message)){
          setStatus('Supabase is not authorized to send to this email yet. The project email provider must be configured before administrator activation can continue.','error');
          return;
        }
        if(response.status===429||/rate limit|too many/i.test(message)){
          setStatus('The email service is temporarily rate-limited. Please wait a short while before requesting another link.','error');
          return;
        }
        setStatus(message||'Supabase rejected the administrator email request. Please report this exact screen message.','error');
        return;
      }

      setStatus('Supabase accepted the request. Check Inbox, Spam, Promotions, and All Mail for the administrator link.','success');
    }catch(error){
      setLoading(false);
      setStatus(`The browser could not reach Supabase Auth: ${error?.message||'network request failed'}. Open this page in Safari or Chrome rather than an in-app browser.`, 'error');
    }
  });
})();
