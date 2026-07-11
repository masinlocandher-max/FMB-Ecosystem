(function(){
  'use strict';
  if(!document.querySelector('link[href="assets/css/icon-fix.css"]')){
    const iconFix=document.createElement('link');
    iconFix.rel='stylesheet';
    iconFix.href='assets/css/icon-fix.css';
    document.head.appendChild(iconFix);
  }
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  const loader=$('#loader');
  if(loader){window.addEventListener('load',()=>setTimeout(()=>loader.classList.add('hide'),650));setTimeout(()=>loader.classList.add('hide'),2200)}
  const toggle=$('#navToggle'),links=$('#navLinks');
  if(toggle&&links){toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});links.addEventListener('click',e=>{if(e.target.tagName==='A'){links.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})}

  const topPromo=$('.support-glass');
  if(topPromo){
    topPromo.setAttribute('aria-label','Work with FMB website services');
    topPromo.innerHTML=`
      <strong>Make your own website!</strong>
      <a class="support-chip light" href="mailto:withlovefmb@gmail.com?subject=Website%20Project%20with%20FMB">Work with FMB</a>
      <a class="support-chip" href="https://senzpr.com" target="_blank" rel="noopener">Branding and digital needs</a>`;
  }

  const landingHero=$('.hero');
  if(landingHero){
    const banner=landingHero.querySelector('.hero-banner');
    const bannerImage=banner?.querySelector('img');
    const heroCard=landingHero.querySelector('.hero-card');
    if(bannerImage){
      bannerImage.src='assets/hero-banner.svg';
      bannerImage.alt='With love, FMB official banner featuring Francine Marie Bautista';
      bannerImage.removeAttribute('width');
      bannerImage.removeAttribute('height');
    }
    if(heroCard)heroCard.remove();
    const heroStyle=document.createElement('style');
    heroStyle.textContent=`
      .hero{padding:132px 0 0!important;min-height:0!important;background:#fff!important}
      .hero-banner{width:100%!important;max-width:none!important;margin:0!important;border:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important;overflow:hidden!important}
      .hero-banner img{display:block!important;width:100%!important;height:auto!important;aspect-ratio:16/9!important;object-fit:contain!important;object-position:center!important;background:#fff!important}
      @media(max-width:800px){.hero{padding-top:132px!important}.hero-banner{border-radius:0!important}}
    `;
    document.head.appendChild(heroStyle);
  }

  const bookshelf=$('#bookshelf .bookshelf');
  if(bookshelf){
    bookshelf.innerHTML=`
      <article class="book-feature reveal in">
        <div class="book-feature-inner">
          <div>
            <p class="eyebrow" style="color:#f0d58b">Life and identity</p>
            <h3>Finding Your Way Back to Yourself</h3>
            <p>A complete guide about life, identity, feeling left behind, feeling lost, coming out, self-doubt, belonging, and learning to trust yourself again.</p>
            <div class="book-meta"><span>Life</span><span>Identity</span><span>Feeling lost</span><span>Self-doubt</span><span>Belonging</span></div>
          </div>
          <div class="actions" style="justify-content:flex-start"><a class="pill" style="background:#fff;color:#4c0d73;box-shadow:none" href="reading.html">Open the guide</a></div>
        </div>
      </article>
      <div class="book-stack">
        <a class="mini-card" href="womens-health.html"><p class="eyebrow">Women's health</p><h3>Your Body Is Worth Listening To</h3><p>Periods, preventive care, sexual health, mental health, body awareness, and speaking up during appointments.</p><small>Open the full reading</small></a>
        <a class="mini-card" href="skin-care-makeup.html"><p class="eyebrow">Skin care and makeup</p><h3>Care Without the Pressure</h3><p>A simple routine, sunscreen, acne care, makeup basics, product hygiene, and beauty without shame.</p><small>Open the full reading</small></a>
        <a class="mini-card" href="coming-out-respect.html"><p class="eyebrow">LGBTQIA+</p><h3>Coming Out and Learning to Respect</h3><p>Safety, privacy, coming-out choices, and a direct message to straight and cisgender people.</p><small>Open the full reading</small></a>
        <a class="mini-card" href="men-can-cry.html"><p class="eyebrow">Men and emotions</p><h3>Men Can Cry</h3><p>Healthier masculinity, emotional honesty, asking for help, respect, grooming, and skin care.</p><small>Open the full reading</small></a>
      </div>`;
  }

  const memberLibrary=$('#readPanel .member-grid');
  if(memberLibrary){
    memberLibrary.innerHTML=`
      <a class="glass-card" href="reading.html"><p class="eyebrow">Life and identity</p><h3>Finding Your Way Back to Yourself</h3><p>For feeling lost, left behind, unsure, unseen, or afraid to begin again.</p></a>
      <a class="glass-card" href="womens-health.html"><p class="eyebrow">Women's health</p><h3>Your Body Is Worth Listening To</h3><p>Body awareness, periods, preventive care, sexual health, mental health, and medical self-advocacy.</p></a>
      <a class="glass-card" href="skin-care-makeup.html"><p class="eyebrow">Skin care and makeup</p><h3>Care Without the Pressure</h3><p>Simple routines, sun protection, acne care, makeup basics, and safer product habits.</p></a>
      <a class="glass-card" href="coming-out-respect.html"><p class="eyebrow">LGBTQIA+</p><h3>Coming Out and Learning to Respect</h3><p>For LGBTQIA+ people and the straight and cisgender people who want to respond well.</p></a>
      <a class="glass-card" href="men-can-cry.html"><p class="eyebrow">Men and emotions</p><h3>Men Can Cry</h3><p>Emotional honesty, asking for help, respect, skin care, and a healthier masculinity.</p></a>
      <a class="glass-card" href="music.html"><p class="eyebrow">Music</p><h3>For Quieter Moments</h3><p>Open gentle listening and original work by FMB.</p></a>`;
  }

  const readingPage=$('.reading-page');
  if(readingPage){
    document.body.classList.add('ebook-protected');
    const toast=document.createElement('div');
    toast.className='ebook-guard-toast';
    toast.setAttribute('role','status');
    toast.textContent='This reading is protected. Please read it here.';
    document.body.appendChild(toast);
    let toastTimer;
    const warn=()=>{clearTimeout(toastTimer);toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)};
    ['copy','cut','dragstart','contextmenu'].forEach(type=>document.addEventListener(type,event=>{event.preventDefault();warn()}));
    document.addEventListener('keydown',event=>{
      const key=event.key.toLowerCase();
      const blocked=(event.ctrlKey||event.metaKey)&&['c','x','p','s','u'].includes(key);
      if(blocked){event.preventDefault();warn()}
    });
  }

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items=$$('.reveal');
  if(reduced||!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in'))}else{const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -35px 0px'});items.forEach(el=>io.observe(el))}
  const contact=$('#contactForm');
  if(contact){contact.addEventListener('submit',e=>{e.preventDefault();const name=$('#contactName')?.value.trim()||'Website visitor';const subject=$('#contactSubject')?.value.trim()||'Message from the With love, FMB website';const message=$('#contactMessage')?.value.trim();if(!message){$('#contactMessage')?.focus();return}location.href=`mailto:withlovefmb@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message+'\n\nFrom: '+name)}`})}
})();
