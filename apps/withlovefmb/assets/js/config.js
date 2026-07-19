(function(){
  const production=/(^|\.)francinemariebautista\.com$/i.test(window.location.hostname);
  const base=production?'https://www.francinemariebautista.com/':new URL('./',document.baseURI).href;
  window.FMB_CONFIG={
    SUPABASE_URL:'https://wjnavdpppnhxbuydkrkd.supabase.co',
    SUPABASE_ANON_KEY:'sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8',
    SITE_URL:base,
    AUTH_REDIRECT_URL:new URL('profile/',base).href
  };
})();
