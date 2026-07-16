(function(){
  'use strict';

  const control=document.getElementById('membershipControl');
  const state=document.getElementById('membershipState');
  const detail=document.getElementById('membershipStateDetail');
  const button=document.getElementById('toggleMembership');
  if(!control||!state||!detail||!button)return;

  let client=null;
  let isOpen=false;

  function render(status){
    isOpen=status?.registration_open===true;
    state.textContent=isOpen?'Membership registration is open.':'Membership registration is closed.';
    detail.textContent=isOpen
      ?'New visitors can create verified profiles. Close registration immediately if testing reveals a problem.'
      :`New profiles cannot be created. Existing members can still sign in.${status?.schema_version?` Schema ${status.schema_version} is responding.`:''}`;
    button.disabled=false;
    button.textContent=isOpen?'Close membership':'Open membership';
  }

  function unavailable(message){
    state.textContent='Membership launch control is not installed.';
    detail.textContent=message;
    button.disabled=true;
    button.textContent='Run Supabase migration first';
  }

  async function resolveClient(){
    if(!window.FMB?.configured)return null;
    for(const mode of ['local','session']){
      const possible=window.FMB.createClient(mode);
      const {data}=await possible.auth.getSession();
      if(data.session)return possible;
    }
    return null;
  }

  async function loadStatus(){
    client=await resolveClient();
    if(!client){unavailable('Sign in with the administrator account before changing registration.');return}

    const {data:{session}}=await client.auth.getSession();
    const {data:profile,error:profileError}=await client.from('profiles').select('role,status').eq('id',session.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin'||profile?.status!=='active'){
      control.hidden=true;
      return;
    }

    const {data,error}=await client.rpc('get_membership_status');
    if(error||!data?.ready){
      unavailable('Run supabase/migrations/20260712_membership_readiness.sql after the main production schema. Registration remains safely closed until then.');
      return;
    }
    render(data);
  }

  button.addEventListener('click',async()=>{
    if(!client||button.disabled)return;
    const nextOpen=!isOpen;
    const action=nextOpen?'open':'close';
    if(!confirm(`Are you sure you want to ${action} public member registration?`))return;

    button.disabled=true;
    button.textContent=nextOpen?'Opening…':'Closing…';
    const {data,error}=await client.rpc('admin_set_membership_open',{p_open:nextOpen});
    if(error){
      detail.textContent='The registration setting could not be changed. Check administrator access and the Supabase migration.';
      button.disabled=false;
      button.textContent=isOpen?'Close membership':'Open membership';
      return;
    }
    render(data);
  });

  loadStatus();
})();
