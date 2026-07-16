(function(){
  'use strict';
  const release='20260716-mobile-menu-v5';
  function loadAsset(tag,attrs){
    const key=attrs.href||attrs.src;
    if(document.querySelector(`${tag}[href="${key}"],${tag}[src="${key}"]`))return;
    const el=document.createElement(tag);
    Object.entries(attrs).forEach(([name,value])=>el.setAttribute(name,value));
    document.head.appendChild(el);
  }
  function menuIconFor(href){
    const icons={
      home:'<path d="M3.5 11.5 12 4l8.5 7.5"/><path d="M5.5 10.5V20h13v-9.5M9.5 20v-6h5v6"/>',
      read:'<path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v13H7.5A2.5 2.5 0 0 1 5 17.5Z"/><path d="M7.5 4.5v13A2.5 2.5 0 0 0 10 20"/>',
      music:'<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
      news:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      heart:'<path d="M20.5 9.5c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.5Z"/>',
      serve:'<path d="M4 13.5 8.2 11l3.8 2 3.8-2 4.2 2.5"/><path d="M5.5 14.5V19h13v-4.5M8 10V6.5M12 10V4M16 10V6.5"/>',
      brands:'<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
      person:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6"/>',
      help:'<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.8 2.1c-1 .6-1.5 1.2-1.5 2.4M12 17h.01"/>'
    };
    const value=String(href||'');
    const key=value.includes('ebooks')?'read':value.includes('music')?'music':value.includes('news')?'news':value.includes('freedom-wall')?'heart':value.includes('community')||value.includes('volunteer')?'serve':value.includes('fmbandco')?'brands':value.includes('about')?'person':value.includes('gethelp')||value.includes('support')?'help':'home';
    return `<span class="mobile-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[key]}</svg></span>`;
  }
  function boot(){
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/reading-library.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/apple-mobile.css?v=${release}`});
    loadAsset('link',{rel:'stylesheet',href:`/assets/css/experience-refresh.css?v=${release}`});
    const mobileClean=document.querySelector('link[href*="assets/css/fmb-mobile-clean.css"]');
    if(mobileClean)document.head.appendChild(mobileClean);
    else loadAsset('link',{rel:'stylesheet',href:`/assets/css/fmb-mobile-clean.css?v=${release}`});
    const luxuryHref=`/assets/css/fmb-mobile-luxury.css?v=${release}`;
    const luxuryStyles=document.querySelector(`link[href="${luxuryHref}"]`);
    if(luxuryStyles)document.head.appendChild(luxuryStyles);
    else loadAsset('link',{rel:'stylesheet',href:luxuryHref});
    loadAsset('script',{src:`/assets/js/reading-library.js?v=${release}`,defer:'defer'});

    const transparentLogos={senz:'/assets/images/projects/senz-logo.png?v=20260716-banner-v5',cognita:'/assets/images/projects/cognita-logo.png?v=20260716-banner-v5'};
    const replacePartnerImages=()=>{
      document.querySelectorAll('img').forEach(img=>{
        const source=(img.getAttribute('src')||'').toLowerCase();
        const alt=(img.getAttribute('alt')||'').toLowerCase();
        if(source.includes('senz-logo')||alt==='senz')img.src=transparentLogos.senz;
        if(source.includes('cognita-logo')||alt.includes('cognita institute'))img.src=transparentLogos.cognita;
      });
    };
    replacePartnerImages();

    const careMessage=document.querySelector('.care-message strong');
    if(careMessage)careMessage.textContent='With Love, FMB is brought to you by:';
    const partnerTrack=document.querySelector('.partner-track');
    if(partnerTrack){
      const originals=[...partnerTrack.querySelectorAll('.partner-logo')].slice(0,2);
      originals.forEach((logo,index)=>{
        const img=logo.querySelector('img');
        if(img)img.src=index===0?transparentLogos.senz:transparentLogos.cognita;
      });
      if(originals.length===2&&partnerTrack.querySelectorAll('.partner-logo').length<4){
        originals.forEach(logo=>{
          const clone=logo.cloneNode(true);
          clone.setAttribute('aria-hidden','true');
          clone.setAttribute('tabindex','-1');
          clone.querySelector('img')?.setAttribute('alt','');
          partnerTrack.appendChild(clone);
        });
      }
      partnerTrack.style.animationPlayState='running';
      requestAnimationFrame(()=>partnerTrack.getAnimations?.().forEach(animation=>animation.play()));
    }

    const media=window.matchMedia('(max-width: 800px)');
    const toggle=document.getElementById('navToggle');
    const links=document.getElementById('navLinks');
    const publicMobileBar=document.querySelector('.mobile-bar:not(.member-mobile-bar):not(.admin-mobile-bar)');
    const coreFab=document.querySelector('.mobile-menu-fab[data-core-menu-bound="true"]');
    if(coreFab){
      document.body.classList.add('fmb-mobile-menu-ready');
    }else if(toggle&&links&&links.querySelector('.nav-menu-link')){
      document.body.classList.add('fmb-mobile-menu-ready');
      links.dataset.mobileMenu='dialog';
      const introTitle=links.querySelector('.nav-menu-intro strong');
      if(introTitle){introTitle.id='mobileMenuTitle';links.setAttribute('aria-labelledby',introTitle.id)}
      links.querySelectorAll('.nav-menu-link').forEach(link=>{
        if(!link.querySelector('.mobile-menu-icon'))link.insertAdjacentHTML('afterbegin',menuIconFor(link.getAttribute('href')));
      });
      let backdrop=document.querySelector('.nav-backdrop');
      if(!backdrop){backdrop=document.createElement('div');backdrop.className='nav-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.appendChild(backdrop)}
      let fab=document.querySelector('.mobile-menu-fab');
      if(!fab){
        fab=document.createElement('button');
        fab.type='button';
        fab.className='mobile-menu-fab';
        fab.setAttribute('aria-controls','navLinks');
        fab.setAttribute('aria-expanded','false');
        fab.setAttribute('aria-label','Open website menu');
        fab.dataset.mobileMenuTrigger='true';
        fab.innerHTML='<span class="mobile-menu-fab-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="mobile-menu-fab-label">Menu</span>';
        document.body.appendChild(fab);
      }
      let restoreToFab=false;
      const updateVisibleHeight=()=>{
        const height=window.visualViewport?.height||window.innerHeight;
        document.documentElement.style.setProperty('--fmb-visible-height',`${Math.round(height)}px`);
      };
      const focusableItems=()=>[...links.querySelectorAll('a[href],button:not([disabled])')].filter(item=>getComputedStyle(item).display!=='none'&&getComputedStyle(item).visibility!=='hidden');
      const sync=()=>{
        const open=media.matches&&links.classList.contains('open');
        if(media.matches){
          links.setAttribute('role','dialog');
          links.setAttribute('aria-modal','true');
          links.setAttribute('aria-hidden',String(!open));
        }else{
          links.removeAttribute('role');
          links.removeAttribute('aria-modal');
          links.removeAttribute('aria-hidden');
        }
        toggle.setAttribute('aria-expanded',String(open));
        toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
        fab.setAttribute('aria-expanded',String(open));
        fab.setAttribute('aria-label',open?'Close website menu':'Open website menu');
        const label=fab.querySelector('.mobile-menu-fab-label');
        if(label)label.textContent=open?'Close':'Menu';
        backdrop.classList.toggle('open',open);
        document.body.classList.toggle('mobile-menu-open',open);
        document.body.classList.toggle('modal-open',open);
        publicMobileBar?.classList.toggle('is-hidden',open);
      };
      const setMenu=(open,{returnFocus=true}={})=>{
        if(open&&!media.matches)return;
        const wasOpen=links.classList.contains('open');
        links.classList.toggle('open',Boolean(open));
        restoreToFab=returnFocus&&wasOpen&&!open;
        sync();
        if(open){
          updateVisibleHeight();
          requestAnimationFrame(()=>{
            const first=focusableItems()[0];
            first?.focus({preventScroll:true});
          });
        }else if(restoreToFab){fab.focus({preventScroll:true});restoreToFab=false}
      };
      fab.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setMenu(!links.classList.contains('open'))});
      toggle.addEventListener('click',()=>setTimeout(sync,0));
      backdrop.addEventListener('click',()=>setMenu(false));
      links.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false,{returnFocus:false})});
      document.addEventListener('keydown',event=>{
        if(!media.matches||!links.classList.contains('open'))return;
        if(event.key==='Escape'){event.preventDefault();setMenu(false);return}
        if(event.key!=='Tab')return;
        const items=focusableItems();
        if(!items.length)return;
        const first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      });
      new MutationObserver(sync).observe(links,{attributes:true,attributeFilter:['class']});
      media.addEventListener?.('change',event=>{if(!event.matches)setMenu(false,{returnFocus:false});updateVisibleHeight();sync()});
      window.visualViewport?.addEventListener('resize',updateVisibleHeight,{passive:true});
      window.addEventListener('orientationchange',updateVisibleHeight,{passive:true});
      updateVisibleHeight();
      sync();
    }

    document.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error',()=>{
        const src=img.getAttribute('src')||'';
        if(img.dataset.retry==='1')return;
        const fixes={
          'assets/icon.svg':'/assets/images/icon-transparent.png',
          '/assets/icon.svg':'/assets/images/icon-transparent.png',
          'assets/founder.svg':'/assets/images/founder.webp',
          '/assets/founder.svg':'/assets/images/founder.webp',
          'assets/signature.svg':'/assets/images/signature-transparent.png',
          '/assets/signature.svg':'/assets/images/signature-transparent.png'
        };
        if(fixes[src]){img.dataset.retry='1';img.src=fixes[src]}
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
