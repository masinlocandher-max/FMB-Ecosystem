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
      const canonical=document.getElementById('newsStoryCanonical');
      if(canonical)canonical.href=`https://www.francinemariebautista.com/news/story.html?slug=${encodeURIComponent(data.slug)}`;
      const description=document.getElementById('newsStoryDescription');
      if(description)description.content=String(data.seo_description||data.filipino_impact||data.summary||'A source-attributed published brief from FMB News.').slice(0,160);
      const content=data.body?paragraphs(data.body):paragraphs(data.summary||data.source_excerpt);
      const groups=(data.affected_groups||[]).map(group=>`<li>${escapeHtml(group)}</li>`).join('');
      const disclosure=data.is_ai_assisted?'Technology assisted with the first structured draft. FMB News applies a Filipino-first editorial policy and keeps the source visible.':'This brief was prepared from the credited source under the FMB News Filipino-first editorial policy.';
      shell.innerHTML=`
        <article class="news-story-article">
          <header>
            <p class="nc-kicker">FMB News · ${escapeHtml(data.category||'News')}</p>
            <h1>${escapeHtml(data.title)}</h1>
            <p class="news-story-deck">${escapeHtml(data.summary||data.source_excerpt||'')}</p>
            <div class="news-story-meta"><span>${escapeHtml(data.source_name)}</span><time>${escapeHtml(formatDate(data.published_at||data.source_published_at))}</time><span>${data.auto_published?'Published by safeguards':'Human-reviewed'}</span></div>
          </header>
          ${data.image_url?`<figure class="news-story-image"><img src="${escapeHtml(data.image_url)}" alt="" referrerpolicy="no-referrer"><figcaption>${escapeHtml(data.image_credit||`Image supplied by or linked from ${data.source_name}.`)}</figcaption></figure>`:''}
          <section class="news-story-body"><h2>What happened</h2>${content||'<p>Open the original source for the complete report.</p>'}</section>
          <section class="news-impact-block news-impact-primary"><p class="nc-kicker">The Filipino question</p><h2>What does this mean for Filipinos?</h2>${paragraphs(data.filipino_impact)}</section>
          <section class="news-impact-grid">
            <div><h2>Who may feel it most</h2>${groups?`<ul>${groups}</ul>`:'<p>The available source does not identify a specific affected group.</p>'}</div>
            <div><h2>Effect on everyday life</h2>${paragraphs(data.household_impact)}</div>
            <div><h2>What Filipinos should watch next</h2>${paragraphs(data.public_interest_action)}</div>
          </section>
          <section class="news-fmb-perspective"><p class="nc-kicker">FMB Perspective</p><h2>People first, not personalities</h2>${paragraphs(data.fmb_perspective)}<p class="news-perspective-note">This perspective evaluates the effect on Filipinos across income levels, especially those with the least protection and access. It is not an endorsement or attack on any politician or public figure.</p></section>
          <aside class="news-story-source"><p class="nc-kicker">Primary source</p><h2>${escapeHtml(data.source_name)}</h2><p>FMB News does not reproduce the source report in full. Read the original publication for complete context and any later updates.</p><a href="${escapeHtml(data.source_url)}" target="_blank" rel="noopener noreferrer">Open the original report →</a></aside>
          <footer class="news-story-disclosure"><strong>Transparency note</strong><p>${escapeHtml(disclosure)}</p><p>Impact confidence: <strong>${escapeHtml(data.impact_confidence||'not stated')}</strong>.</p><p>See an error? <a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20correction">Send a correction.</a></p></footer>
        </article>`;
    }catch(error){console.error('[fmb-news-story]',error);fail('The live newsroom connection could not be reached.');}
  }
  init();
})();
