(function(){
  'use strict';
  function init(){
    const section=document.getElementById('bookshelf');
    if(section){
      section.className='reading-library';
      section.innerHTML=`<div class="wrap">
        <div class="section-head reveal in"><div><p class="eyebrow">Reading materials</p><h2 class="section-title">Knowledge that heals. Stories that stay.</h2><p class="section-lede">Written by Francine Marie Bautista. Explore each guide in one calm, organized library.</p></div></div>
        <div class="reading-featured" aria-label="Featured reading collection">
          <article class="reading-cover-card"><a class="reading-cover-link" href="womens-health.html"><img loading="lazy" decoding="async" src="assets/images/reading/B4DDDB01-C125-4E08-8908-09A5FE5157E7.png" alt="Women's Health Matters book cover by Francine Marie Bautista"></a><div class="reading-card-body"><p class="card-tag">Women’s health</p><h3>Women’s Health Matters</h3><p>Body awareness, preventive care, emotional health, and speaking up during medical appointments.</p><a class="pill" href="womens-health.html">Read the guide</a></div></article>
          <article class="reading-cover-card"><a class="reading-cover-link" href="men-can-cry.html"><img loading="lazy" decoding="async" src="assets/images/reading/E9562EB3-F505-4736-B5E8-E4D54C769059.png" alt="Men Can Cry book cover by Francine Marie Bautista"></a><div class="reading-card-body"><p class="card-tag">Men and emotions</p><h3>Men Can Cry</h3><p>A compassionate guide to emotional honesty, asking for help, respect, and healthier masculinity.</p><a class="pill" href="men-can-cry.html">Read the guide</a></div></article>
          <article class="reading-cover-card"><a class="reading-cover-link" href="coming-out-respect.html"><img loading="lazy" decoding="async" src="assets/images/reading/07883274-1340-48DC-A112-C4AD44B5ABD1.png" alt="LGBTQIA+ Pride Identity Love book cover by Francine Marie Bautista"></a><div class="reading-card-body"><p class="card-tag">LGBTQIA+</p><h3>Pride. Identity. Love.</h3><p>Safety, privacy, identity, belonging, allyship, and choosing when or whether to come out.</p><a class="pill" href="coming-out-respect.html">Read the guide</a></div></article>
        </div>
        <p class="reading-swipe-hint" aria-hidden="true">Swipe to browse the collection</p>
        <nav class="reading-topic-bar" aria-label="Browse reading topics"><a href="womens-health.html">Women’s health</a><a href="men-can-cry.html">Mental health</a><a href="skin-care-makeup.html">Self-care</a><a href="coming-out-respect.html">LGBTQIA+</a><a href="reading.html">Identity</a><a href="#support">Crisis support</a></nav>
        <div class="reading-more">
          <a href="reading.html"><p class="card-tag">Life and identity</p><h4>Finding Your Way Back to Yourself</h4><p>For feeling lost, left behind, uncertain, or disconnected from who you are becoming.</p></a>
          <a href="skin-care-makeup.html"><p class="card-tag">Self-care</p><h4>Care Without the Pressure</h4><p>Simple skin care, makeup basics, product hygiene, and beauty without shame.</p></a>
          <a href="#support"><p class="card-tag">Mental health support</p><h4>It’s Okay to Feel Overwhelmed</h4><p>Grounding support, crisis contacts, and gentle reminders that you do not have to face a difficult moment alone.</p></a>
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