(function(){
  'use strict';
  if(location.hostname.toLowerCase()==='yoni.francinemariebautista.com')return;

  const CORE_SRC='/assets/js/az-assistant-core.js?v=20260722-pearly-search-v2';
  const STYLE_HREF='/assets/css/az-assistant.css?v=20260720-az-website-only-v1';
  const receptionMark='<img src="/assets/images/fmbandco/fmbandco-ampersand-gold.png" width="257" height="282" decoding="async" fetchpriority="low" alt="">';
  let loadPromise=null;
  let pendingOpen=false;
  let layerObserver=null;

  function ensureBootstrapStyle(){
    if(document.getElementById('pearly-reception-style'))return;
    const style=document.createElement('style');
    style.id='pearly-reception-style';
    style.textContent=`
      .pearly-lazy-trigger{position:fixed;right:18px;bottom:22px;z-index:2147482000;display:flex;align-items:center;gap:10px;min-width:174px;min-height:58px;padding:7px 17px 7px 8px;border:1px solid rgba(255,255,255,.78);border-radius:999px;background:rgba(255,255,255,.92);box-shadow:0 18px 56px rgba(31,7,45,.18);color:#250936;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif;text-align:left;cursor:pointer;touch-action:manipulation}
      .pearly-lazy-trigger span:first-child{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:linear-gradient(145deg,#250936,#5a1e78)}
      .pearly-lazy-trigger img{width:25px;height:28px;object-fit:contain;filter:none!important}
      .pearly-lazy-trigger strong{display:block;font-size:12px;line-height:1}.pearly-lazy-trigger small{display:block;margin-top:4px;color:#766d79;font-size:8px;font-weight:750;letter-spacing:.04em}
      html.pearly-core-loading .az-help-trigger,html.pearly-core-loading .az-help-layer{visibility:hidden!important}
      .az-help-trigger{min-width:174px!important;padding:7px 17px 7px 8px!important;border-radius:999px!important}
      .az-help-trigger-label{position:static!important;display:block!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:nowrap!important}
      .az-help-trigger-label strong{font-size:12px!important;line-height:1!important}.az-help-trigger-label small{display:block!important}
      .az-help-trigger-icon img{width:27px!important;height:30px!important;object-fit:contain!important;filter:none!important}
      .az-message-mark{font-size:0!important}.az-message-mark::after{content:'P';font-size:9px;font-weight:900}
      @media(max-width:800px){.pearly-lazy-trigger,.az-help-trigger{right:12px!important;bottom:calc(86px + env(safe-area-inset-bottom,0px))!important;min-width:164px!important;min-height:54px!important}}
    `;
    document.head.appendChild(style);
  }

  function createLazyTrigger(){
    if(document.querySelector('.pearly-lazy-trigger,.az-help-trigger'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='pearly-lazy-trigger';
    button.setAttribute('aria-label','Open Reception Desk');
    button.innerHTML=`<span>${receptionMark}</span><span><strong>Reception Desk</strong><small>Search · FAQ · Contact</small></span>`;
    button.addEventListener('click',()=>loadReception(true));
    document.body.appendChild(button);
  }

  function replaceNameInText(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const current=node.nodeValue||'';
      const next=current.replace(/\bAZ\b/g,'Pearly').replace(/\bFMB ecosystem\b/gi,'FMB network');
      if(next!==current)node.nodeValue=next;
    });
    if(root.nodeType===1){
      [root,...root.querySelectorAll('*')].forEach(element=>{
        ['aria-label','placeholder','title'].forEach(name=>{
          const current=element.getAttribute?.(name);
          if(!current)return;
          const next=current.replace(/\bAZ\b/g,'Pearly').replace(/\bFMB ecosystem\b/gi,'FMB network');
          if(next!==current)element.setAttribute(name,next);
        });
      });
    }
  }

  function decorateReception(){
    const trigger=document.querySelector('.az-help-trigger');
    const layer=document.querySelector('.az-help-layer');
    if(trigger&&!trigger.dataset.pearlyReady){
      trigger.dataset.pearlyReady='true';
      trigger.setAttribute('aria-label','Open Reception Desk');
      const icon=trigger.querySelector('.az-help-trigger-icon');
      const label=trigger.querySelector('.az-help-trigger-label');
      if(icon)icon.innerHTML=receptionMark;
      if(label)label.innerHTML='<strong>Reception Desk</strong><small>Search · FAQ · Contact</small>';
    }
    const avatar=document.querySelector('.az-help-avatar');
    if(avatar)avatar.innerHTML=receptionMark;
    const title=document.querySelector('#azHelpTitle');
    if(title&&title.textContent!=='Pearly')title.textContent='Pearly';
    document.querySelectorAll('.az-message-mark').forEach(mark=>{if(mark.textContent!=='P')mark.textContent='P'});
    replaceNameInText(layer);

    if(layer&&!layerObserver){
      layerObserver=new MutationObserver(()=>{
        replaceNameInText(layer);
        document.querySelectorAll('.az-message-mark').forEach(mark=>{if(mark.textContent!=='P')mark.textContent='P'});
      });
      layerObserver.observe(layer,{subtree:true,childList:true});
    }

    document.querySelector('.pearly-lazy-trigger')?.remove();
    document.documentElement.classList.remove('pearly-core-loading');
    window.dispatchEvent(new CustomEvent('pearly:ready'));
    if(pendingOpen&&trigger){
      pendingOpen=false;
      requestAnimationFrame(()=>trigger.click());
    }
  }

  function ensureStylesheet(){
    const existing=document.querySelector(`link[href^="${STYLE_HREF.split('?')[0]}"]`);
    if(existing)return Promise.resolve();
    return new Promise(resolve=>{
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=STYLE_HREF;
      link.addEventListener('load',resolve,{once:true});
      link.addEventListener('error',resolve,{once:true});
      document.head.appendChild(link);
    });
  }

  function ensureCore(){
    if(document.querySelector('.az-help-trigger'))return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=CORE_SRC;
      script.async=true;
      script.addEventListener('load',resolve,{once:true});
      script.addEventListener('error',()=>reject(new Error('Pearly Reception Desk could not load.')),{once:true});
      document.head.appendChild(script);
    });
  }

  function loadReception(open=false){
    pendingOpen=pendingOpen||open;
    if(document.querySelector('.az-help-trigger')){
      decorateReception();
      return Promise.resolve();
    }
    if(loadPromise)return loadPromise;
    document.documentElement.classList.add('pearly-core-loading');
    loadPromise=Promise.all([ensureStylesheet(),ensureCore()])
      .then(()=>new Promise(resolve=>requestAnimationFrame(()=>{decorateReception();resolve()})))
      .catch(error=>{
        document.documentElement.classList.remove('pearly-core-loading');
        loadPromise=null;
        console.error(error);
      });
    return loadPromise;
  }

  function prefetchReception(){
    if(document.querySelector('link[data-pearly-prefetch]'))return;
    for(const [href,as] of [[STYLE_HREF,'style'],[CORE_SRC,'script']]){
      const link=document.createElement('link');
      link.rel='prefetch';
      link.href=href;
      link.as=as;
      link.dataset.pearlyPrefetch='true';
      document.head.appendChild(link);
    }
  }

  ensureBootstrapStyle();
  createLazyTrigger();
  addEventListener('load',()=>{
    if('requestIdleCallback' in window)requestIdleCallback(prefetchReception,{timeout:7000});
    else setTimeout(prefetchReception,4500);
  },{once:true});
})();
