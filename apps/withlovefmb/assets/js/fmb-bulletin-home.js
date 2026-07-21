(function(){
'use strict';
const VERSION='20260721-home-polish-v1';
const BUNDLE=`/assets/data/home/home-bundle.txt?v=${VERSION}`;
const IMAGE_PARTS={hero:4,founder:5};
const fetchText=url=>fetch(url,{credentials:'same-origin'}).then(response=>{if(!response.ok)throw new Error(`${url}: ${response.status}`);return response.text()});
function addStyles(css){if(document.getElementById('fmb-ecosystem-home-style'))return;const style=document.createElement('style');style.id='fmb-ecosystem-home-style';style.textContent=css;document.head.appendChild(style)}
function setMeta(selector,content){let node=document.querySelector(selector);if(!node){node=document.createElement('meta');const match=selector.match(/meta\[([^=]+)="([^"]+)"\]/);if(match)node.setAttribute(match[1],match[2]);document.head.appendChild(node)}node.setAttribute('content',content)}
async function readImage(name,count){const paths=Array.from({length:count},(_,i)=>`/assets/data/home/${name}-${String(i+1).padStart(2,'0')}.txt?v=${VERSION}`);return `data:image/webp;base64,${(await Promise.all(paths.map(fetchText))).join('')}`}

async function decodeBundle(value){
 const bytes=Uint8Array.from(atob(value.trim()),char=>char.charCodeAt(0));
 if(!('DecompressionStream' in window))throw new Error('This browser does not support the homepage bundle decoder.');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return JSON.parse(await new Response(stream).text());
}
function templateContent(documentFragment,id){const template=documentFragment.getElementById(id);return template?template.innerHTML:''}
function updateHead(){
 document.title='Francine Marie Bautista | FMB Ecosystem Bulletin, SENZ, Cognita & Yoni';
 setMeta('meta[name="description"]','The official FMB Ecosystem Bulletin of Francine Marie Bautista. Discover what is new from FMB&CO., SENZ marketing and digital solutions, Cognita AI learning, Yoni, public-interest news, books, music, cultural work, offers, and future applications.');
 setMeta('meta[property="og:title"]','The FMB Ecosystem Bulletin | What We Build and How We Help');
 setMeta('meta[property="og:description"]','Strategy, communication, AI learning, digital applications, culture, media, and public support from Francine Marie Bautista and the FMB ecosystem.');
 setMeta('meta[name="twitter:title"]','The FMB Ecosystem Bulletin');
 setMeta('meta[name="twitter:description"]','What is new from FMB&CO., SENZ, Cognita, Yoni, and the wider FMB ecosystem.');
 const data=document.querySelector('script[type="application/ld+json"]');
 if(data)data.textContent=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':'https://www.francinemariebautista.com/#website','url':'https://www.francinemariebautista.com/','name':'The FMB Ecosystem Bulletin','alternateName':['Francine Marie Bautista Official Website','Official FMB Bulletin'],'description':'The official portfolio, release desk, and public bulletin of Francine Marie Bautista and the FMB ecosystem.','inLanguage':'en-PH'},{'@type':'Person','@id':'https://www.francinemariebautista.com/#person','name':'Francine Marie Bautista','alternateName':['FMB','Binibining Francine Marie Bautista'],'url':'https://www.francinemariebautista.com/aboutfmb/','description':'Filipina brand strategist, creative director, entrepreneur, communications practitioner, educator, and founder from Masinloc, Zambales.'},{'@type':'Organization','@id':'https://www.francinemariebautista.com/#fmbandco','name':'FMB&CO.','url':'https://www.francinemariebautista.com/fmbandco/','founder':{'@id':'https://www.francinemariebautista.com/#person'},'department':[{'@type':'Organization','name':'SENZ Marketing and Digital Solutions','url':'https://senzpr.com'},{'@type':'EducationalOrganization','name':'Cognita Institute of AI','url':'https://thecognitainstitute.com'}]}]});
}
function activateInteractions(){
 const menu=document.getElementById('menuButton'),nav=document.getElementById('bulletinNav'),progress=document.getElementById('scrollProgress'),dock=document.querySelector('.mobile-dock'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const closeMenu=()=>{if(!menu||!nav)return;nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')};
 if(menu&&nav){menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});document.addEventListener('click',event=>{if(nav.classList.contains('open')&&!event.target.closest('#bulletinNav,#menuButton'))closeMenu()});document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()})}
 const update=()=>{const total=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=`${total>0?Math.min(100,scrollY/total*100):0}%`;if(dock)dock.classList.toggle('visible',scrollY>360)};
 addEventListener('scroll',update,{passive:true});addEventListener('resize',()=>{update();if(innerWidth>1080)closeMenu()},{passive:true});update();
 const reveals=[...document.querySelectorAll('.reveal')];if(reduced||!('IntersectionObserver'in window))reveals.forEach(element=>element.classList.add('in-view'));else{const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;entry.target.classList.add('in-view');observer.unobserve(entry.target)}),{rootMargin:'0px 0px -8% 0px',threshold:.08});reveals.forEach(element=>observer.observe(element))}
}
async function apply(){
 try{
  const bundle=await decodeBundle(await fetchText(BUNDLE));
  addStyles(bundle.css);
  const shell=bundle.template.replaceAll('/assets/images/home/cognita-wordmark-transparent.svg',`data:image/svg+xml;base64,${bundle.cognita}`);
  const [hero,founder]=await Promise.all([readImage('hero',IMAGE_PARTS.hero),readImage('founder',IMAGE_PARTS.founder)]);
  const shellDoc=new DOMParser().parseFromString(shell,'text/html');
  const wire=document.querySelector('.bulletin-wire');if(wire)wire.innerHTML=templateContent(shellDoc,'fmb-wire');
  const header=document.querySelector('.bulletin-header,.site-header');if(header){header.className='site-header';header.innerHTML=templateContent(shellDoc,'fmb-header')}
  const main=document.querySelector('main');if(main)main.innerHTML=templateContent(shellDoc,'fmb-main').replaceAll('__FMB_HERO__',hero.replace('data:image/webp;base64,','')).replaceAll('__FMB_FOUNDER__',founder.replace('data:image/webp;base64,',''));
  const footer=document.querySelector('.bulletin-footer,.site-footer');if(footer){footer.className='site-footer';footer.innerHTML=templateContent(shellDoc,'fmb-footer')}
  const dock=document.querySelector('.mobile-dock');if(dock)dock.innerHTML=templateContent(shellDoc,'fmb-dock');
  document.body.classList.add('fmb-home-polished');updateHead();activateInteractions();
 }catch(error){console.error('FMB homepage polish could not load; keeping the verified fallback homepage.',error)}
}
apply();
})();
