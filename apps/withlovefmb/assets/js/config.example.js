(function(){
  const base=new URL('./',document.baseURI).href;
  window.FMB_CONFIG={
    SUPABASE_URL:'https://YOUR_PROJECT.supabase.co',
    SUPABASE_ANON_KEY:'YOUR_PUBLIC_ANON_KEY',
    SITE_URL:base,
    AUTH_REDIRECT_URL:new URL('profile/',base).href
  };
})();
