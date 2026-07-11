(function(){
  const base=new URL('./',window.location.href).href;
  window.FMB_CONFIG={
    SUPABASE_URL:'',
    SUPABASE_ANON_KEY:'',
    SITE_URL:base,
    AUTH_REDIRECT_URL:new URL('member.html',base).href
  };
})();
