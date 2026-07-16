(function(){
  const form=document.getElementById('volunteerForm');
  if(!form)return;
  const status=document.getElementById('volunteerStatus');
  const button=document.getElementById('volunteerSubmit');
  const message=(text,type='')=>{
    status.hidden=false;
    status.textContent=text;
    status.className='inline-status'+(type?' '+type:'');
  };

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const name=window.FMB.cleanText(document.getElementById('volunteerName').value,80);
    const email=document.getElementById('volunteerEmail').value.trim().toLowerCase();
    const role=document.getElementById('volunteerRole').value;
    const details=window.FMB.cleanText(document.getElementById('volunteerMessage').value,3000);
    const consent=document.getElementById('volunteerConsent').checked;

    if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!role||!details||!consent){
      message('Complete every field and confirm the volunteer terms.','error');
      return;
    }
    if(!window.FMB.configured){
      message('The secure application service is unavailable right now. Please email withlovefmb@gmail.com.','error');
      return;
    }

    button.disabled=true;
    button.textContent='Sending...';
    const client=window.FMB.createClient('local');
    const result=await client.rpc('submit_contact_message',{
      p_name:name,
      p_email:email,
      p_subject:'Volunteer application: '+role,
      p_message:details,
      p_kind:'volunteer'
    });
    button.disabled=false;
    button.textContent='Send application';

    if(result.error){
      message('The application could not be sent right now. Please try again later or email us directly.','error');
      return;
    }
    form.reset();
    message('Thank you. Your volunteer application was sent for review.','success');
  });
})();
