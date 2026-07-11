(function(){
  const base=new URL('./',window.location.href).href;
  window.FMB_CONFIG={
    SUPABASE_URL:'https://YOUR_PROJECT.supabase.co',
    SUPABASE_ANON_KEY:'YOUR_PUBLIC_ANON_KEY',
    SITE_URL:base,
    AUTH_REDIRECT_URL:new URL('member.html',base).href
  };
})();
