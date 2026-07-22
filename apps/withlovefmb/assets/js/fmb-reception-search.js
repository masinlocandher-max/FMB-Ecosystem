(()=>{
  'use strict';
  const receptionArticles=[
    {section:'News',title:'The Dumping Stopped. Subic’s Duty to Restore Has Not.',href:'/news/subic-aeta-landfill/',summary:'Reporting and reflection on the Subic landfill, Aeta communities and restoration duties.',terms:'subic aeta landfill dumping stopped restore restoration environment indigenous iwitness'},
    {section:'News',title:'Remembering Amor Deloso, Former Governor of Zambales',href:'/news/remembering-amor-deloso/',summary:'A memorial report on Amor Deloso and his years of public service in Zambales.',terms:'amor deloso governor zambales memorial public service'},
    {section:'News',title:'Calling Filipinos “Monkeys” Is Racist, Not Clever',href:'/news/filipinos-monkey-insult-racism/',summary:'A factual response to racist language, monkey intelligence and Philippine macaques.',terms:'filipinos monkey monkeys racist racism macaque philippines insult satire'},
    {section:'News',title:'Pax Silica Will Need a Lot of Water. Luzon Deserves the Full Plan.',href:'/news/pax-silica-water/',summary:'Public-interest context on industrial water demand, infrastructure and accountability.',terms:'pax silica water luzon new clark city environment industry supply'},
    {section:'News',title:'North Luzon Takes Both Crowns at Binibining Pilipinas 2026',href:'/news/binibining-pilipinas-2026/',summary:'The FMB News report on the 2026 Binibining Pilipinas coronation and North Luzon winners.',terms:'binibining pilipinas 2026 pageant crowns north luzon winners coronation'},
    {section:'News',title:'When Propaganda Becomes Dehumanization',href:'/news/china-ai-monkey-video/',summary:'An editorial examination of the racist AI monkey video and dehumanizing propaganda.',terms:'china ai monkey video propaganda dehumanization racism filipino'},
    {section:'News',title:'Three Reasons for Credible Hope',href:'/news/good-news/',summary:'Constructive reporting focused on credible, sourced reasons for hope.',terms:'good news hope constructive positive reasons'},
    {section:'News',title:'AI Uses Water. That Is Not the Whole Story.',href:'/news/ai-water-consumption-responsible-ai-philippines/',summary:'Responsible context on AI water consumption and what the public debate often misses.',terms:'ai water consumption responsible artificial intelligence philippines technology'},
    {section:'eBook',title:'Finding Your Way Back to Yourself',href:'/reading.html',summary:'A reflective guide for feeling lost, unseen or afraid to begin again.',terms:'finding way back yourself mental health identity lost reflection ebook book'},
    {section:'eBook',title:'Women’s Health Matters',href:'/womens-health.html',summary:'Body awareness, preventive care, emotional health and speaking up in medical appointments.',terms:'women womens health preventive care medical ebook book'},
    {section:'eBook',title:'Care Without the Pressure',href:'/skin-care-makeup.html',summary:'Skin care, makeup basics, hygiene and beauty without shame.',terms:'skin care makeup beauty hygiene pressure ebook book'},
    {section:'eBook',title:'Pride. Identity. Love.',href:'/coming-out-respect.html',summary:'Safety, identity, belonging, allyship and choosing when or whether to come out.',terms:'pride identity love lgbt lgbtq coming out allyship ebook book'},
    {section:'eBook',title:'Men Can Cry',href:'/men-can-cry.html',summary:'A compassionate guide to emotional honesty, respect and healthier masculinity.',terms:'men can cry masculinity emotions mental health ebook book'},
    {section:'eBook',title:'Dress With Intention',href:'/dress-with-intention.html',summary:'Professional presence, grooming, scent, fit and appearance bias.',terms:'dress intention image personal brand grooming scent wardrobe ebook book'},
    {section:'Music',title:'FMB Music Library',href:'/music/',summary:'Original Calm, Feel Good and With Love, FMB soundtrack collections.',terms:'music songs audio calm feel good ost soundtrack player tracks'},
    {section:'Biography',title:'Francine Marie Bautista, FMB',href:'/aboutfmb/',summary:'The official biography, professional journey, expertise and public work of Francine Marie Bautista.',terms:'francine marie bautista fmb biography founder strategist creative director educator advocate'},
    {section:'Community',title:'With Love, FMB',href:'/withlovefmb/',summary:'Projects, people-first applications, volunteer opportunities, public support and ways to get involved.',terms:'with love fmb projects apps volunteer get involved support community'},
    {section:'Corporate',title:'FMB&Co.',href:'/fmb&co/',summary:'The founder-led company and portfolio connecting SENZ and Cognita.',terms:'fmb co company corporate portfolio senz cognita'},
    {section:'SENZ',title:'SENZ Marketing and Digital Solutions',href:'/fmb&co/senz/',summary:'Marketing, PR, branding, websites, digital systems and public positioning.',terms:'senz marketing pr branding digital solutions website space for rent'},
    {section:'Cognita',title:'Cognita Institute of AI',href:'/fmb&co/cognita/',summary:'Practical, responsible and human-centered AI education and the upcoming qualifying test.',terms:'cognita institute ai qualifying test education learning artificial intelligence'}
  ];
  const normalise=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const render=(form,query,results)=>{
    const transcript=form.closest('.az-help-panel')?.querySelector('.az-help-transcript');
    if(!transcript)return;
    const input=form.querySelector('input[type="search"]');
    const safe=query.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const user=document.createElement('div');user.className='az-message is-user';user.innerHTML=`<div class="az-message-bubble"><p>${safe}</p></div>`;
    const bot=document.createElement('div');bot.className='az-message is-bot';bot.innerHTML='<span class="az-message-mark">P</span><div class="az-message-bubble"><strong>Search Results</strong><p>I found the closest full articles and official pages. Open any result to read the complete material.</p></div>';
    const list=document.createElement('div');list.className='az-search-results';
    results.forEach(item=>{const link=document.createElement('a');link.className='az-search-result';link.href=item.href;link.innerHTML=`<small>${item.section}</small><strong>${item.title}</strong><span>${item.summary}</span>`;list.appendChild(link)});
    transcript.append(user,bot,list);if(input)input.value='';requestAnimationFrame(()=>{transcript.scrollTop=transcript.scrollHeight});
  };
  const wire=()=>{
    const form=document.querySelector('.az-help-search');if(!form||form.dataset.fullSearchReady==='true')return;
    form.dataset.fullSearchReady='true';const input=form.querySelector('input[type="search"]');if(input)input.placeholder='Search full articles, FAQs and brands';
    form.addEventListener('submit',event=>{
      const query=String(input?.value||'').trim();const clean=normalise(query);if(!clean)return;
      const words=[...new Set(clean.split(' ').filter(word=>word.length>1))];
      const ranked=receptionArticles.map(item=>{const hay=normalise(`${item.title} ${item.summary} ${item.terms} ${item.section}`);const matches=words.reduce((score,word)=>score+(hay.includes(word)?1:0),0);const exact=hay.includes(clean)?4:0;return {...item,score:matches+exact}}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
      if(!ranked.length)return;event.preventDefault();event.stopImmediatePropagation();render(form,query,ranked);
    },true);
  };
  let scopedObserver=null;
  const attach=()=>{
    wire();
    const layer=document.querySelector('.az-help-layer');
    if(layer&&!scopedObserver){
      scopedObserver=new MutationObserver(wire);
      scopedObserver.observe(layer,{subtree:true,childList:true});
    }
  };
  addEventListener('pearly:ready',attach);
  document.addEventListener('click',event=>{if(event.target.closest('.pearly-lazy-trigger,.az-help-trigger'))setTimeout(attach,0)},true);
  attach();
})();
