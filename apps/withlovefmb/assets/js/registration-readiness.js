(function(){
  'use strict';

  const form=document.getElementById('signupForm');
  const button=document.getElementById('signupButton');
  const readiness=document.getElementById('membershipReadiness');
  const signupStatus=document.getElementById('signupStatus');
  if(!form||!button)return;

  const registrationOpen=false;

  function setSignupStatus(message,type=''){
    if(!signupStatus)return;
    signupStatus.textContent=message;
    signupStatus.className=`status show${type?' '+type:''}`;
  }

  function setAvailability(message){
    button.disabled=true;
    button.textContent='Registration closed';
    if(readiness){
      readiness.textContent=message;
      readiness.dataset.state='closed';
    }
  }

  form.addEventListener('submit',event=>{
    if(registrationOpen)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setSignupStatus('Registration is closed. Existing members may still sign in.','error');
  },true);

  setAvailability('Registration is closed. Existing members may sign in.');
})();
