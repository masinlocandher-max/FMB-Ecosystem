(function(){
  'use strict';
  const config=window.FMB_CONFIG||{};
  const configured=Boolean(config.SUPABASE_URL&&config.SUPABASE_ANON_KEY&&window.supabase);
  const clients=new Map();

  function createClient(mode='local'){
    if(!configured)return null;
    if(clients.has(mode))return clients.get(mode);
    const storage=mode==='session'?window.sessionStorage:window.localStorage;
    const client=window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,{
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true,
        storage,
        storageKey:`fmb-auth-${mode}`
      }
    });
    clients.set(mode,client);
    return client;
  }

  function escapeHtml(value){
    const node=document.createElement('div');
    node.textContent=value==null?'':String(value);
    return node.innerHTML;
  }

  function cleanText(value,max=5000){
    return String(value||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max);
  }

  function usernameFrom(value){
    return String(value||'member').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'').slice(0,24)||'member';
  }

  function showToast(message,type=''){
    let toast=document.getElementById('fmbToast');
    if(!toast){toast=document.createElement('div');toast.id='fmbToast';toast.className='toast';toast.setAttribute('role','status');document.body.appendChild(toast)}
    toast.textContent=message;
    toast.dataset.type=type;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('show'),3200);
  }

  async function getActiveProfile(client){
    if(!client)return {user:null,profile:null,error:new Error('Account service is not configured.')};
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError||!session)return {user:null,profile:null,error:sessionError||new Error('No active session.')};
    const user=session.user;
    const {data:profile,error}=await client.from('profiles').select('*').eq('id',user.id).maybeSingle();
    return {user,profile,error};
  }

  window.FMB={
    config,
    configured,
    createClient,
    escapeHtml,
    cleanText,
    usernameFrom,
    showToast,
    getActiveProfile
  };

  const YONI_HOST='yoni.francinemariebautista.com';
  const LEGACY_APP_HOST='app.francinemariebautista.com';
  const isYoni=window.location.hostname===YONI_HOST||window.location.hostname===LEGACY_APP_HOST||/^\/app(?:\/|$)/.test(window.location.pathname);
  if(!isYoni)return;
  const version='20260720-1';
  if(!document.querySelector('link[data-yoni-experience]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`/assets/css/yoni-experience.css?v=${version}`;
    link.dataset.yoniExperience='true';
    document.head.appendChild(link);
  }
  const loadExperience=()=>{
    if(document.querySelector('script[data-yoni-experience]'))return;
    const script=document.createElement('script');
    script.src=`/assets/js/yoni-experience.js?v=${version}`;
    script.dataset.yoniExperience='true';
    document.body.appendChild(script);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadExperience,{once:true});
  else loadExperience();
})();
