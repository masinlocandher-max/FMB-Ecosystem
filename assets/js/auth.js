(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const config=window.FMB_CONFIG||{};
  const configured=Boolean(config.SUPABASE_URL&&config.SUPABASE_ANON_KEY&&window.supabase);
  const client=configured?window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY):null;
  const signinTab=$('#signinTab'),signupTab=$('#signupTab'),signinPanel=$('#signinPanel'),signupPanel=$('#signupPanel');
  function showPanel(name){const signup=name==='signup';signinTab.classList.toggle('active',!signup);signupTab.classList.toggle('active',signup);signinPanel.hidden=signup;signupPanel.hidden=!signup;history.replaceState(null,'',signup?'#signup':'#signin')}
  signinTab.addEventListener('click',()=>showPanel('signin'));signupTab.addEventListener('click',()=>showPanel('signup'));showPanel(location.hash==='#signup'?'signup':'signin');
  function setStatus(id,message,type){const el=$(id);el.textContent=message;el.className='status show'+(type?' '+type:'')}
  function noService(id){setStatus(id,'Account verification is being connected. No account was created or changed.','error')}
  $('#signinForm').addEventListener('submit',async e=>{e.preventDefault();if(!configured){noService('#signinStatus');return}const email=$('#signinEmail').value.trim(),password=$('#signinPassword').value;setStatus('#signinStatus','Signing you in...');const {data,error}=await client.auth.signInWithPassword({email,password});if(error){setStatus('#signinStatus',error.message,'error');return}if(!data.user?.email_confirmed_at){setStatus('#signinStatus','Please verify your email before opening your profile.','error');return}location.href='member.html'});
  $('#signupForm').addEventListener('submit',async e=>{e.preventDefault();const name=$('#displayName').value.trim(),email=$('#signupEmail').value.trim(),password=$('#signupPassword').value,confirm=$('#confirmPassword').value;if(password!==confirm){setStatus('#signupStatus','The passwords do not match.','error');return}if(!configured){noService('#signupStatus');return}setStatus('#signupStatus','Creating your profile...');const redirectTo=config.AUTH_REDIRECT_URL||new URL('member.html',location.href).href;const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{display_name:name}}});if(error){setStatus('#signupStatus',error.message,'error');return}if(data.session){location.href='member.html';return}setStatus('#signupStatus','Check your email and open the verification link. Then return here to sign in.','success')});
  $('#resetPassword').addEventListener('click',async()=>{const email=$('#signinEmail').value.trim();if(!email){setStatus('#signinStatus','Enter your email first.','error');return}if(!configured){noService('#signinStatus');return}const redirectTo=new URL('auth.html#signin',location.href).href;const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});setStatus('#signinStatus',error?error.message:'Check your email for the password reset link.',error?'error':'success')});
  if(configured){client.auth.getSession().then(({data})=>{if(data.session&&data.session.user?.email_confirmed_at)location.href='member.html'})}
})();
