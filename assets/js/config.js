(function(){
  const base=new URL('./',window.location.href).href;
  window.FMB_CONFIG={
    SUPABASE_URL:'https://wjnavdpppnhxbuydkrkd.supabase.co',
    SUPABASE_ANON_KEY:'sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8',
    SITE_URL:base,
    AUTH_REDIRECT_URL:new URL('member.html',base).href
  };
})();
