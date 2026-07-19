(function(){
  'use strict';

  const form=document.getElementById('signupForm');
  const button=document.getElementById('signupButton');
  const readiness=document.getElementById('membershipReadiness');
  const signupStatus=document.getElementById('signupStatus');
  if(!form||!button)return;

  let registrationOpen=false;

  function setSignupStatus(message,type=''){
    if(!signupStatus)return;
    signupStatus.textContent=message;
    signupStatus.className=`status show${type?' '+type:''}`;
  }

  function setAvailability(open,message){
    registrationOpen=Boolean(open);
    button.disabled=!registrationOpen;
    button.textContent=registrationOpen?'Create profile':'Membership opening soon';
    if(readiness){
      readiness.textContent=message;
      readiness.dataset.state=registrationOpen?'open':'closed';
    }
  }

  form.addEventListener('submit',event=>{
    if(registrationOpen)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setSignupStatus('Membership registration is not open yet. Existing members may still sign in.','error');
  },true);

  async function checkReadiness(){
    if(!window.FMB?.configured){
      setAvailability(false,'Membership setup is still being completed. Existing members may sign in.');
      return;
    }

    try{
      const client=window.FMB.createClient('local');
      const {data,error}=await client.rpc('get_membership_status');
      if(error||!data?.ready){
        setAvailability(false,'Membership setup is still being completed. Existing members may sign in.');
        return;
      }

      if(data.registration_open===true){
        setAvailability(true,'Membership is open. Complete the form below to create a verified profile.');
        return;
      }

      setAvailability(false,'Membership profiles are being prepared for public opening. Existing members may sign in.');
    }catch{
      setAvailability(false,'Membership availability could not be confirmed. Registration remains safely closed.');
    }
  }

  checkReadiness();
})();
