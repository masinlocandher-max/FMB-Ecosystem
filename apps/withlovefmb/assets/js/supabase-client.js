(function(){
  'use strict';
  const YONI_HOST='yoni.francinemariebautista.com';
  const hostname=window.location.hostname;
  const pathname=window.location.pathname;
  const isDedicatedYoniHost=hostname===YONI_HOST;

  // Hard routing fallback. Vercel also redirects these hosts, but this prevents
  // the main FMB website from remaining visible if a stale edge route is served.
  if(isDedicatedYoniHost&&(pathname==='/'||pathname==='/index.html')){
    window.location.replace('/app/');
    return;
  }

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
    getActiveProfile,
    registrationOpen:false
  };

  const isYoni=isDedicatedYoniHost||/^\/app(?:\/|$)/.test(pathname);
  if(!isYoni)return;

  function installYoniRegistrationGuard(){
    const form=document.getElementById('signupForm');
    const button=form?.querySelector('button[type="submit"]');
    const status=document.getElementById('signupStatus');
    if(!form||!button)return;

    const registrationOpen=false;

    function showStatus(message,type=''){
      if(!status)return;
      status.textContent=message;
      status.dataset.type=type;
      status.classList.toggle('visible',Boolean(message));
    }

    function setAvailability(message){
      window.FMB.registrationOpen=false;
      button.disabled=true;
      button.textContent='Registration closed';
      form.dataset.registration='closed';
      showStatus(message);
    }

    setAvailability('Registration is closed. Existing members may still sign in.');
    form.addEventListener('submit',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      showStatus('Registration is closed. Existing members may still sign in.','error');
    },true);
  }

  installYoniRegistrationGuard();

  const YONI_ROOT='/app/assets/yoni/';
  const officialHero=YONI_ROOT+'yoni-hero.webp';
  const officialBackground=YONI_ROOT+'yoni-theme-background.webp';
  const officialAppIcon=YONI_ROOT+'yoni-app-icon-192.png';
  window.YONI_ASSETS={
    ...(window.YONI_ASSETS||{}),
    appIcon:officialAppIcon,
    hero:officialHero,
    background:officialBackground
  };

  // Lock browser and iPhone install metadata to the approved square launch artwork.
  document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"]').forEach(link=>{
    const apple=link.rel==='apple-touch-icon';
    link.href=apple?YONI_ROOT+'yoni-apple-touch-icon-180.png':officialAppIcon;
    link.type='image/png';
    link.sizes=apple?'180x180':'192x192';
  });

  if(!document.querySelector('link[data-yoni-hero-preload]')){
    const preload=document.createElement('link');
    preload.rel='preload';
    preload.as='image';
    preload.href=officialHero;
    preload.dataset.yoniHeroPreload='true';
    document.head.appendChild(preload);
  }

  const experienceVersion='20260721-complete-app-v1';

  function loadScript(src,marker){
    return new Promise(resolve=>{
      if(document.querySelector(`script[${marker}]`)){resolve();return}
      const script=document.createElement('script');
      script.src=src;
      script.setAttribute(marker,'true');
      script.onload=resolve;
      script.onerror=resolve;
      document.body.appendChild(script);
    });
  }

  const loadExperience=async()=>{
    await loadScript(`/assets/js/yoni-experience-loader.js?v=${experienceVersion}`,'data-yoni-final-loader');
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadExperience,{once:true});
  else loadExperience();
})();
