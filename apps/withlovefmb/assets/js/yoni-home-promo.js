(function(){
  'use strict';

  const YONI_URL='https://yoni.francinemariebautista.com/';

  function updateYoniEntryPoints(){
    document.querySelectorAll('a[href*="app.francinemariebautista.com"]').forEach(link=>{
      const href=link.getAttribute('href')||'';
      link.href=href.includes('auth=signin')?`${YONI_URL}?auth=signin`:YONI_URL;
      const text=link.textContent.trim().toLowerCase();
      if(text==='sign in')link.textContent='Sign in to Yoni';
      if(text==='get the app')link.textContent='Meet Yoni';
      if(text==='install the app'||text==='install with love, fmb')link.textContent='Open Yoni';
      if(text==='open the member app'||text==='open the app first')link.textContent='Open Yoni';
    });

    document.querySelectorAll('.destination-card').forEach(card=>{
      if(!card.href.includes('yoni.francinemariebautista.com'))return;
      const small=card.querySelector('small');
      const title=card.querySelector('h3');
      const copy=card.querySelector('p');
      if(small)small.textContent='DIGITAL COMPANION';
      if(title)title.textContent='Yoni';
      if(copy)copy.textContent='Talk, vent, check in, journal privately, and find grounding or human support.';
    });
  }

  function mountYoniPromo(){
    const section=document.getElementById('get-the-app')||document.querySelector('.home-app-promo');
    if(!section||section.dataset.yoniPromo==='ready')return;
    section.dataset.yoniPromo='ready';
    section.classList.add('yoni-home-promo');
    section.innerHTML=`
      <div class="wrap">
        <article class="yoni-promo-shell">
          <div class="yoni-promo-top">
            <div class="yoni-promo-copy">
              <span class="yoni-promo-badge">New mental health companion</span>
              <div class="yoni-promo-brand">
                <img src="/app/yoni-icon.svg" alt="Yoni app icon">
                <span><strong>yoni</strong><small>your gentle digital companion</small></span>
              </div>
              <h2 id="app-promo-title">Meet Yoni. A softer place to say what you <em>really feel.</em></h2>
              <p class="yoni-promo-lede">Yoni is a private digital companion created for the moments when you need to vent, feel heard, slow down, write honestly, or take one small step forward. He does not pretend to be human, and he does not replace professional care. He gives you a calmer place to begin.</p>
              <div class="yoni-promo-actions">
                <a class="pill" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
                <a class="pill secondary" href="https://yoni.francinemariebautista.com/?auth=signin">Sign in with my existing account</a>
              </div>
              <div class="yoni-promo-assurances" aria-label="Yoni account and privacy notes">
                <span><i></i>Same account for current members</span>
                <span><i></i>Private journal and check-ins</span>
                <span><i></i>No App Store required</span>
              </div>
            </div>

            <div class="yoni-promo-visual" aria-label="Preview of the Yoni companion app">
              <span class="yoni-promo-orbit one" aria-hidden="true"></span>
              <span class="yoni-promo-orbit two" aria-hidden="true"></span>
              <span class="yoni-promo-mode listen">Just listen</span>
              <span class="yoni-promo-mode comfort">Comfort me</span>
              <div class="yoni-promo-device">
                <div class="yoni-promo-device-screen">
                  <div class="yoni-promo-device-island"></div>
                  <div class="yoni-promo-device-head"><span><strong>Hi, I’m Yoni.</strong><small>digital companion</small></span><img src="/app/yoni-icon.svg" alt=""></div>
                  <div class="yoni-promo-device-copy"><small>A safe place to start</small><h3>You can vent here.</h3></div>
                  <div class="yoni-promo-chat"><span>You do not have to make the story neat. I can listen first.</span><span>I just need someone to hear me.</span></div>
                  <img class="yoni-promo-mascot" src="/app/yoni-mascot.svg" alt="Yoni, an orange bear wearing a green beanie">
                </div>
              </div>
            </div>
          </div>

          <div class="yoni-promo-capability-area">
            <div class="yoni-promo-section-head">
              <div><p class="home-overline">What Yoni can do</p><h3>Support that starts by listening.</h3></div>
              <p>Choose how you want him to respond. Yoni can simply listen, offer comfort, help you organize a thought, or guide a grounding pause. You remain in control of the conversation.</p>
            </div>

            <div class="yoni-capability-grid">
              <article class="yoni-capability-card"><span class="yoni-capability-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 5h14v11H9l-4 3Z"/><path d="M9 9h6M9 12h4"/></svg></span><h4>Let you vent without fixing you</h4><p>Choose “Just listen” and speak freely without receiving immediate advice or forced positivity.</p></article>
              <article class="yoni-capability-card"><span class="yoni-capability-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.7-7 10-7 10Z"/></svg></span><h4>Comfort and empower you</h4><p>Receive warm, reviewed responses that acknowledge the feeling and remind you that you are not alone.</p></article>
              <article class="yoni-capability-card"><span class="yoni-capability-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v18M5 8h14M7 16h10"/></svg></span><h4>Help you sort one thought</h4><p>Separate what happened, what you feel, what you can control, and the smallest useful next step.</p></article>
              <article class="yoni-capability-card"><span class="yoni-capability-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></span><h4>Guide grounding and breathing</h4><p>Use gentle breathing, 5-4-3-2-1 grounding, affirmations, and quiet sound tools when the moment feels loud.</p></article>
              <article class="yoni-capability-card"><span class="yoni-capability-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 4h12v16H6Z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg></span><h4>Keep a private journal and calendar</h4><p>Write what is on your mind and revisit saved entries and emotional check-ins by date on the same device.</p></article>
              <article class="yoni-capability-card"><span class="yoni-capability-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s7-3.7 7-10V5l-7-2-7 2v6c0 6.3 7 10 7 10Z"/><path d="M9 12h6M12 9v6"/></svg></span><h4>Move you toward human help</h4><p>When safety is at risk, Yoni clearly directs users to emergency contacts, crisis support, and trusted people nearby.</p></article>
            </div>

            <div class="yoni-promo-safety">
              <div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-3.7 7-10V5l-7-2-7 2v6c0 6.3 7 10 7 10Z"/><path d="M12 8v5M12 16h.01"/></svg><span><strong>Yoni is support, not a substitute for people.</strong><p>Yoni is a digital companion, not a therapist, doctor, or emergency service. Immediate danger should always go to 911 or an available crisis service.</p></span></div>
              <a href="https://yoni.francinemariebautista.com/">Enter Yoni’s safe space →</a>
            </div>
          </div>
        </article>
      </div>`;
  }

  function boot(){
    mountYoniPromo();
    updateYoniEntryPoints();
    requestAnimationFrame(()=>{mountYoniPromo();updateYoniEntryPoints()});
    window.setTimeout(()=>{mountYoniPromo();updateYoniEntryPoints()},700);
  }

  window.addEventListener('pageshow',boot);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();