(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const form=$('#passwordResetForm');
  const submit=$('#resetSubmit');
  const password=$('#newPassword');

  function setStatus(message,type=''){
    const status=$('#resetStatus');
    status.textContent=message;
    status.className=`status show${type?' '+type:''}`;
  }
  function checks(value){return {length:value.length>=10,lower:/[a-z]/.test(value),upper:/[A-Z]/.test(value),number:/\d/.test(value)}}
  function isStrong(value){return Object.values(checks(value)).every(Boolean)}
  function setLoading(loading){submit.disabled=loading;submit.textContent=loading?'Updating…':'Update password'}

  document.querySelectorAll('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{
    const input=document.getElementById(button.dataset.togglePassword);
    const visible=input.type==='text';
    input.type=visible?'password':'text';
    button.textContent=visible?'Show':'Hide';
  }));
  password.addEventListener('input',()=>Object.entries(checks(password.value)).forEach(([rule,valid])=>document.querySelector(`[data-rule="${rule}"]`)?.classList.toggle('valid',valid)));

  if(!window.FMB?.configured){
    form.querySelectorAll('input,button').forEach(control=>control.disabled=true);
    setStatus('The secure account service has not been connected yet. No password can be changed.','error');
    return;
  }
  const client=window.FMB.createClient('local');
  let recoveryReady=false;

  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'||session){
      recoveryReady=true;
      form.querySelectorAll('input,button').forEach(control=>control.disabled=false);
      setStatus('The reset link is verified. Choose a new password.','success');
    }
  });

  client.auth.getSession().then(({data,error})=>{
    if(error||!data.session){
      setTimeout(()=>{if(!recoveryReady){form.querySelectorAll('input,button').forEach(control=>control.disabled=true);setStatus('This reset link is invalid or has expired. Request a new link from the sign-in page.','error')}},700);
    }else recoveryReady=true;
  });

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const first=password.value;
    const second=$('#confirmNewPassword').value;
    if(!recoveryReady){setStatus('This reset link is invalid or has expired.','error');return}
    if(!isStrong(first)){setStatus('Use at least 10 characters with a lowercase letter, uppercase letter, and number.','error');return}
    if(first!==second){setStatus('The passwords do not match.','error');return}
    setLoading(true);
    const {error}=await client.auth.updateUser({password:first});
    setLoading(false);
    if(error){setStatus(error.message||'The password could not be updated. Request a new reset link and try again.','error');return}
    await client.auth.signOut();
    form.reset();
    document.querySelectorAll('#passwordRules span').forEach(rule=>rule.classList.remove('valid'));
    setStatus('Password updated. You can now sign in with the new password.','success');
    setTimeout(()=>location.replace('auth.html#signin'),1400);
  });
})();
