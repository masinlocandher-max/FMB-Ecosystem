(function(){
  'use strict';
  function loadAsset(tag,attrs){
    const key=attrs.href||attrs.src;
    if(document.querySelector(`${tag}[href="${key}"],${tag}[src="${key}"]`))return;
    const el=document.createElement(tag);Object.entries(attrs).forEach(([name,value])=>el.setAttribute(name,value));document.head.appendChild(el);
  }
  function boot(){
    loadAsset('link',{rel:'stylesheet',href:'assets/css/reading-library.css?v=20260712'});
    loadAsset('script',{src:'assets/js/reading-library.js?v=20260712',defer:'defer'});

    const musicSection=document.getElementById('music');
    if(musicSection)musicSection.remove();
    document.querySelectorAll('a[href="music.html"],a[href$="/music.html"]').forEach(link=>link.remove());
    document.querySelectorAll('p,h1,h2,h3,span').forEach(node=>{
      if(node.children.length)return;
      node.textContent=node.textContent
        .replace(/,?\s*music,?\s*/gi,', ')
        .replace(/wellness guides,\s*and future resources/gi,'wellness guides and future resources')
        .replace(/Read, listen, pause/gi,'Read, reflect, pause');
    });

    const readingPage=document.querySelector('.reading-page');
    const readingWrap=readingPage&&readingPage.querySelector('.reading-wrap');
    if(readingWrap){
      loadAsset('link',{rel:'stylesheet',href:'assets/css/reading-book.css?v=20260712a'});
      const hero=readingWrap.querySelector('.reading-hero');
      if(hero&&!hero.querySelector('.fmb-book-meta')){
        const meta=document.createElement('div');meta.className='fmb-book-meta';meta.innerHTML='<span>Written by Francine Marie Bautista</span><span>With love, FMB Reading Collection</span><span>Original digital edition</span>';hero.appendChild(meta);
      }
      if(hero&&!readingWrap.querySelector('.fmb-author-note')){
        const author=document.createElement('section');author.className='fmb-author-note';author.setAttribute('aria-labelledby','author-note-title');author.innerHTML='<img src="assets/images/icon-transparent.png" alt="With love, FMB emblem"><div><p class="eyebrow">A note from the author</p><h2 id="author-note-title">This reading was written with care.</h2><p>I created this material to make thoughtful information feel clearer, gentler, and easier to approach. Please read at your own pace, keep what helps, and seek qualified professional support whenever the subject requires medical, legal, psychological, or emergency guidance.</p><p class="fmb-author-byline">Francine Marie Bautista, FMB<br>Author and Founder, With love, FMB</p></div>';
        hero.insertAdjacentElement('afterend',author);
      }
      if(!readingWrap.querySelector('.fmb-legal-page')){
        const legal=document.createElement('section');legal.className='fmb-legal-page';legal.setAttribute('aria-labelledby','legal-title');legal.innerHTML='<p class="eyebrow" style="color:#f3d98f">Copyright and use notice</p><h2 id="legal-title">Please respect the work behind this reading.</h2><p><strong>Copyright © 2026 Francine Marie Bautista. All rights reserved.</strong> This reading material is an original work authored and published by Francine Marie Bautista under With love, FMB.</p><p style="margin-top:14px">No part of this material may be copied, reproduced, republished, adapted, translated, recorded, distributed, uploaded, sold, used for training, or shared in whole or in substantial part without the author’s prior written permission or clear documented consent.</p><p style="margin-top:14px">Brief quotations may be used for commentary, education, or review when legally permitted, provided that Francine Marie Bautista and With love, FMB are clearly credited and the use does not misrepresent the original work. Linking to the official webpage is encouraged.</p><p style="margin-top:14px">For permission requests, partnerships, classroom use, publication, media use, or reproduction, contact <strong>withlovefmb@gmail.com</strong> before using the material.</p><p class="fmb-rights-line">Original digital edition • FrancineMarieBautista.com • With love, FMB</p>';
        const signoff=readingWrap.querySelector('.reader-signoff');
        if(signoff)signoff.insertAdjacentElement('beforebegin',legal);else readingWrap.appendChild(legal);
      }
    }

    const toggle=document.getElementById('navToggle');
    const links=document.getElementById('navLinks');
    if(toggle&&links){
      let backdrop=document.querySelector('.nav-backdrop');
      if(!backdrop){backdrop=document.createElement('div');backdrop.className='nav-backdrop';document.body.appendChild(backdrop)}
      const sync=()=>{const open=links.classList.contains('open');backdrop.classList.toggle('open',open);document.body.classList.toggle('modal-open',open)};
      toggle.addEventListener('click',()=>setTimeout(sync,0));
      backdrop.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false');sync()});
      links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setTimeout(sync,0)));
    }
    document.querySelectorAll('img').forEach(img=>{
      img.addEventListener('error',()=>{
        const src=img.getAttribute('src')||'';
        if(img.dataset.retry==='1')return;
        const fixes={
          'assets/icon.svg':'assets/images/icon-transparent.png',
          'assets/founder.svg':'assets/images/founder.webp',
          'assets/signature.svg':'assets/images/signature.png'
        };
        if(fixes[src]){img.dataset.retry='1';img.src=fixes[src]}
      });
    });
    const marquee=document.querySelector('.promo-marquee');
    if(marquee){marquee.style.animationPlayState='running';void marquee.offsetWidth;marquee.classList.add('is-running')}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();