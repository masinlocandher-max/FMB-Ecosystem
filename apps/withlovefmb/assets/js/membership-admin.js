(function(){
  'use strict';

  const control=document.getElementById('membershipControl');
  const state=document.getElementById('membershipState');
  const detail=document.getElementById('membershipStateDetail');
  const button=document.getElementById('toggleMembership');
  if(!control||!state||!detail||!button)return;

  let client=null;
  function render(status){
    state.textContent='Membership registration is closed.';
    detail.textContent=`New profiles cannot be created. Existing members can still sign in.${status?.schema_version?` Schema ${status.schema_version} is responding.`:''}`;
    button.disabled=true;
    button.textContent='Registration closed';
  }

  function unavailable(message){
    state.textContent='Registration status is unavailable.';
    detail.textContent=message;
    button.disabled=true;
    button.textContent='Registration closed';
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
    if(!client){unavailable('Sign in with the administrator account to verify registration status.');return}

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

  loadStatus();
})();
