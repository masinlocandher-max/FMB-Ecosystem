(function(){
  'use strict';
  if(location.hostname.toLowerCase()==='app.francinemariebautista.com')return;

  const CORE_SRC='/assets/js/az-assistant-core.js?v=20260721-pearly-v1';
  const phoneIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.7 3.8 9.2 3a1.5 1.5 0 0 1 1.8.8l1.2 2.8a1.5 1.5 0 0 1-.4 1.7L10 9.8a14.2 14.2 0 0 0 4.2 4.2l1.5-1.8a1.5 1.5 0 0 1 1.7-.4l2.8 1.2a1.5 1.5 0 0 1 .8 1.8l-.8 2.5a3 3 0 0 1-3.3 2.1C10.1 18.5 5.5 13.9 4.6 7.1A3 3 0 0 1 6.7 3.8Z"/></svg>';

  function ensureStyle(){
    if(document.getElementById('pearly-reception-style'))return;
    const style=document.createElement('style');
    style.id='pearly-reception-style';
    style.textContent=`
      .az-help-trigger{min-width:154px!important;padding:7px 16px 7px 8px!important;border-radius:999px!important}
      .az-help-trigger-label{position:static!important;display:block!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:nowrap!important}
      .az-help-trigger-label strong{font-size:12px!important;line-height:1!important}
      .az-help-trigger-label small{display:none!important}
      .az-help-trigger-icon svg{width:24px!important;height:24px!important}
      .az-message-mark{font-size:0!important}
      .az-message-mark::after{content:'P';font-size:9px;font-weight:900}
      @media(max-width:800px){
        .az-help-trigger{left:12px!important;bottom:calc(82px + var(--az-safe-bottom))!important;min-width:154px!important;min-height:54px!important;padding:7px 16px 7px 8px!important;border-radius:999px!important}
      }
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
      const next=current.replace(/\bAZ\b/g,'Pearly').replace(/\bFMB ecosystem\b/gi,'FMB');
      if(next!==current)node.nodeValue=next;
    });
    if(root.nodeType===1){
      [root,...root.querySelectorAll('*')].forEach(element=>{
        ['aria-label','placeholder','title'].forEach(name=>{
          const current=element.getAttribute?.(name);
          if(!current)return;
          const next=current.replace(/\bAZ\b/g,'Pearly').replace(/\bFMB ecosystem\b/gi,'FMB');
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
      if(icon)icon.innerHTML=phoneIcon;
      if(label)label.innerHTML='<strong>Reception Desk</strong>';
    }
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
