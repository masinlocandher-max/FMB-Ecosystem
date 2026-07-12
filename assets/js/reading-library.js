(function(){
  'use strict';
  function init(){
    const section=document.getElementById('bookshelf');
    if(section){
      section.className='reading-library';
      section.innerHTML=`<div class="wrap">
        <div class="section-head reveal in"><div><p class="eyebrow">Reading materials</p><h2 class="section-title">Knowledge that heals. Stories that stay.</h2><p class="section-lede">Our guides are organized in one calm library so readers can find the support they need without searching through scattered sections.</p></div></div>
        <div class="reading-featured">
          <article class="reading-cover-card"><a href="womens-health.html"><img src="assets/images/reading/womens-health-cover.svg" alt="Women's Health Matters reading cover"></a><div class="reading-card-body"><p class="card-tag">Women’s health</p><h3>Women’s Health Matters</h3><p>Body awareness, preventive care, emotional health, and speaking up during medical appointments.</p><a class="pill" href="womens-health.html">Read the guide</a></div></article>
          <article class="reading-cover-card"><a href="men-can-cry.html"><img src="assets/images/reading/men-can-cry-cover.svg" alt="Men Can Cry reading cover"></a><div class="reading-card-body"><p class="card-tag">Men and emotions</p><h3>Men Can Cry</h3><p>A direct, compassionate guide to emotional honesty, asking for help, respect, and healthier masculinity.</p><a class="pill" href="men-can-cry.html">Read the guide</a></div></article>
          <article class="reading-cover-card"><a href="#support"><img src="assets/images/reading/overwhelmed-cover.svg" alt="It's Okay to Feel Overwhelmed support cover"></a><div class="reading-card-body"><p class="card-tag">Mental health support</p><h3>It’s Okay to Feel Overwhelmed</h3><p>Grounding support, crisis contacts, and gentle reminders that no one has to face a difficult moment alone.</p><a class="pill" href="#support">Open support resources</a></div></article>
        </div>
        <nav class="reading-topic-bar" aria-label="Browse reading topics"><a href="womens-health.html">Women’s health</a><a href="men-can-cry.html">Mental health</a><a href="skin-care-makeup.html">Self-care</a><a href="coming-out-respect.html">LGBTQIA+</a><a href="reading.html">Identity</a><a href="#support">Crisis support</a></nav>
        <div class="reading-more">
          <a href="reading.html"><p class="card-tag">Life and identity</p><h4>Finding Your Way Back to Yourself</h4><p>For feeling lost, left behind, uncertain, or disconnected from who you are becoming.</p></a>
          <a href="skin-care-makeup.html"><p class="card-tag">Self-care</p><h4>Care Without the Pressure</h4><p>Simple skin care, makeup basics, product hygiene, and beauty without shame.</p></a>
          <a href="coming-out-respect.html"><p class="card-tag">LGBTQIA+</p><h4>Coming Out and Learning to Respect</h4><p>Safety, privacy, identity, allyship, and choosing when or whether to come out.</p></a>
          <a href="#community"><p class="card-tag">Community</p><h4>Words Worth Sharing</h4><p>Approved reflections and supportive messages chosen by members of our community.</p></a>
        </div>
      </div>`;
    }

    const work=document.getElementById('work');
    if(work){
      const cards=work.querySelectorAll('.card');
      if(cards[0]){
        const media=cards[0].querySelector('.card-media');
        const img=media&&media.querySelector('img');
        if(img){img.src='assets/images/projects/senz-hero.jpg';img.alt='SENZ Strategic Communications hero banner';img.onerror=()=>{media.classList.add('project-logo-fallback');img.src='assets/senz.svg'}}
      }
      if(cards[1]){
        const media=cards[1].querySelector('.card-media');
        const img=media&&media.querySelector('img');
        if(img){img.src='assets/images/projects/cognita-hero.svg';img.alt='Cognita Institute of AI hero banner';img.onerror=()=>{media.classList.add('project-logo-fallback');img.src='assets/cognita.svg'}}
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
