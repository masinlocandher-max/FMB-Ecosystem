(function(){
  'use strict';
  if(location.hostname.toLowerCase()==='app.francinemariebautista.com')return;

  const CORE_SRC='/assets/js/az-assistant-core.js?v=20260722-pearly-search-v2';
  const receptionMark='<img src="/assets/images/fmbandco/fmbandco-ampersand-gold.png" width="257" height="282" alt="">';

  function ensureStyle(){
    if(document.getElementById('pearly-reception-style'))return;
    const style=document.createElement('style');
    style.id='pearly-reception-style';
    style.textContent=`
      .az-help-trigger{min-width:174px!important;padding:7px 17px 7px 8px!important;border-radius:999px!important}
      .az-help-trigger-label{position:static!important;display:block!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:nowrap!important}
      .az-help-trigger-label strong{font-size:12px!important;line-height:1!important}
      .az-help-trigger-label small{display:block!important}
      .az-help-trigger-icon img{width:27px!important;height:30px!important;object-fit:contain!important;filter:none!important}
      .az-message-mark{font-size:0!important}
      .az-message-mark::after{content:'P';font-size:9px;font-weight:900}
      @media(max-width:800px){.az-help-trigger{min-width:164px!important;min-height:54px!important}}
    `;
    document.head.appendChild(style);
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
    ensureStyle();
    const trigger=document.querySelector('.az-help-trigger');
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
    replaceNameInText(document.body);
  }

  const observer=new MutationObserver(mutations=>{
    mutations.forEach(mutation=>{
      if(mutation.type==='characterData')replaceNameInText(mutation.target.parentElement);
      mutation.addedNodes.forEach(node=>replaceNameInText(node.nodeType===1?node:node.parentElement));
    });
    decorateReception();
  });

  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
  ensureStyle();

  const script=document.createElement('script');
  script.src=CORE_SRC;
  script.defer=false;
  script.addEventListener('load',decorateReception,{once:true});
  script.addEventListener('error',()=>console.error('Pearly Reception Desk could not load.'),{once:true});
  document.head.appendChild(script);
})();
