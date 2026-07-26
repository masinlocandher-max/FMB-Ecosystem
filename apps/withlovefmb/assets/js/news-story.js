(function(){
  'use strict';
  const shell=document.getElementById('newsStoryShell');
  if(!shell)return;
  const slug=new URLSearchParams(location.search).get('slug')||'';
  function escapeHtml(value){const node=document.createElement('div');node.textContent=value==null?'':String(value);return node.innerHTML}
  function formatDate(value){return value?new Intl.DateTimeFormat('en-PH',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Manila'}).format(new Date(value)):'Not dated'}
  function paragraphs(value){return String(value||'').split(/\n{2,}/).map(part=>part.trim()).filter(Boolean).map(part=>`<p>${escapeHtml(part)}</p>`).join('')}
  function fail(message){shell.innerHTML=`<div class="news-story-state"><p class="nc-kicker">FMB News</p><h1>Brief unavailable</h1><p>${escapeHtml(message)}</p><a href="/news/">Return to the newsroom</a></div>`}
  async function init(){
    if(!slug||!window.FMB?.configured){fail('The requested published brief could not be identified.');return}
    try{
      const client=window.FMB.createClient('local');
      const {data,error}=await client.from('news_articles').select('*').eq('slug',slug).eq('status','published').maybeSingle();
      if(error)throw error;if(!data){fail('This brief is not public, or it may have been moved for correction.');return}
      document.title=`${data.title} | FMB News`;
      const content=data.body?paragraphs(data.body):paragraphs(data.summary||data.source_excerpt);
      const disclosure=data.is_ai_assisted?'Technology assisted with the first summary. Publication remains governed by FMB News source and correction standards.':'This brief was prepared from the credited source and reviewed under FMB News publication rules.';
      shell.innerHTML=`
        <article class="news-story-article">
          <header>
            <p class="nc-kicker">Automated desk · ${escapeHtml(data.category||'News')}</p>
            <h1>${escapeHtml(data.title)}</h1>
            <p class="news-story-deck">${escapeHtml(data.summary||data.source_excerpt||'')}</p>
            <div class="news-story-meta"><span>${escapeHtml(data.source_name)}</span><time>${escapeHtml(formatDate(data.published_at||data.source_published_at))}</time><span>${escapeHtml(data.verification_status||'verified')}</span></div>
          </header>
          ${data.image_url?`<figure class="news-story-image"><img src="${escapeHtml(data.image_url)}" alt="" referrerpolicy="no-referrer"><figcaption>${escapeHtml(data.image_credit||`Image supplied by or linked from ${data.source_name}.`)}</figcaption></figure>`:''}
          <div class="news-story-body">${content||'<p>Open the original source for the complete report.</p>'}</div>
          <aside class="news-story-source"><p class="nc-kicker">Primary source</p><h2>${escapeHtml(data.source_name)}</h2><p>FMB News does not reproduce the source report in full. Read the original publication for complete context and any later updates.</p><a href="${escapeHtml(data.source_url)}" target="_blank" rel="noopener noreferrer">Open the original report →</a></aside>
          <footer class="news-story-disclosure"><strong>Transparency note</strong><p>${escapeHtml(disclosure)}</p><p>See an error? <a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20correction">Send a correction.</a></p></footer>
        </article>`;
    }catch(error){console.error('[fmb-news-story]',error);fail('The live newsroom connection could not be reached.');}
  }
  init();
})();
