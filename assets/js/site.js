(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  const loader=$('#loader');
  if(loader){window.addEventListener('load',()=>setTimeout(()=>loader.classList.add('hide'),650));setTimeout(()=>loader.classList.add('hide'),2200)}
  const toggle=$('#navToggle'),links=$('#navLinks');
  if(toggle&&links){toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});links.addEventListener('click',e=>{if(e.target.tagName==='A'){links.classList.remove('open');toggle.setAttribute('aria-expanded','false')}})}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items=$$('.reveal');
  if(reduced||!('IntersectionObserver' in window)){items.forEach(el=>el.classList.add('in'))}else{const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -35px 0px'});items.forEach(el=>io.observe(el))}
  const contact=$('#contactForm');
  if(contact){contact.addEventListener('submit',e=>{e.preventDefault();const name=$('#contactName')?.value.trim()||'Website visitor';const subject=$('#contactSubject')?.value.trim()||'Message from the With love, FMB website';const message=$('#contactMessage')?.value.trim();if(!message){$('#contactMessage')?.focus();return}location.href=`mailto:withlovefmb@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message+'\n\nFrom: '+name)}`})}
})();
