(function(){
  'use strict';

  const grid=document.getElementById('automatedNewsGrid');
  const status=document.getElementById('automatedNewsStatus');
  const updated=document.getElementById('automatedNewsUpdated');
  if(!grid)return;

  function escapeHtml(value){
    if(window.FMB?.escapeHtml)return window.FMB.escapeHtml(value);
    const node=document.createElement('div');node.textContent=value==null?'':String(value);return node.innerHTML;
  }
  function formatDate(value){
    if(!value)return 'Recently imported';
    return new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(new Date(value));
  }
  function readingTime(item){
    const words=`${item.summary||''} ${item.source_excerpt||''} ${item.body||''}`.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1,Math.ceil(words/180))} min brief`;
  }
  function empty(message){
    grid.innerHTML=`<div class="news-auto-empty"><strong>No automated brief is public yet.</strong><p>${escapeHtml(message)}</p></div>`;
    if(status)status.textContent='Editorial queue ready';
  }
  function render(items){
    if(!items.length){empty('Approved sources can now be connected from the private FMB&CO. Orchestrator. Curated FMB reports remain available above.');return}
    grid.innerHTML=items.map((item,index)=>{
      const href=`/news/story.html?slug=${encodeURIComponent(item.slug)}`;
      const image=item.image_url?`<figure><img src="${escapeHtml(item.image_url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></figure>`:`<div class="news-auto-monogram" aria-hidden="true">${String(index+1).padStart(2,'0')}</div>`;
      return `<article class="news-auto-card">
        <a href="${href}">
          ${image}
          <div class="news-auto-card-copy">
            <div class="news-auto-meta"><span>${escapeHtml(item.category||'News')}</span><time>${escapeHtml(formatDate(item.published_at||item.source_published_at))}</time></div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary||item.source_excerpt||'Open the brief for the verified source and publication details.')}</p>
            <div class="news-auto-source"><span>${escapeHtml(item.source_name)}</span><b>${readingTime(item)} →</b></div>
          </div>
        </a>
      </article>`;
    }).join('');
    if(status)status.textContent=`${items.length} published brief${items.length===1?'':'s'}`;
    if(updated)updated.textContent=`Updated ${formatDate(items[0].published_at||items[0].source_published_at)}`;
    const wire=document.querySelector('.nc-wire-track');
    if(wire){
      const headlines=items.slice(0,5).map(item=>`<span>${escapeHtml(item.title)}</span>`).join('');
      if(headlines)wire.insertAdjacentHTML('afterbegin',headlines);
    }
  }
  async function init(){
    if(!window.FMB?.configured){empty('The public news database is not connected in this deployment.');return}
    try{
      const client=window.FMB.createClient('local');
      const {data,error}=await client.from('news_articles')
        .select('slug,title,summary,source_excerpt,body,category,source_name,image_url,published_at,source_published_at')
        .eq('status','published')
        .order('published_at',{ascending:false})
        .limit(12);
      if(error)throw error;
      render(data||[]);
    }catch(error){
      console.error('[fmb-news-feed]',error);
      empty('The live desk could not be loaded. Please use the curated newsroom while the connection is checked.');
    }
  }
  init();
})();
