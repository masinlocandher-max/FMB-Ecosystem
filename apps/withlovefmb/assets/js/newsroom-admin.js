(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const $$=selector=>document.querySelectorAll(selector);
  let client=null,user=null,sources=[],articles=[];
  const panel=$('#newsroomPanel');
  if(!panel)return;

  function esc(value){return window.FMB?.escapeHtml?window.FMB.escapeHtml(value):String(value||'')}
  function clean(value,max=1000){return window.FMB?.cleanText?window.FMB.cleanText(value,max):String(value||'').trim().slice(0,max)}
  function fmt(value){return value?new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Manila'}).format(new Date(value)):'Never'}
  function setStatus(message,type=''){
    const element=$('#newsroomStatus');if(!element)return;element.textContent=message;element.dataset.type=type;
    if(type==='success')setTimeout(()=>{if(element.textContent===message){element.textContent='';element.dataset.type=''}},3500);
  }
  function loading(button,on,label='Working…'){
    if(!button)return;if(on){button.dataset.label=button.textContent;button.textContent=label;button.disabled=true}else{button.textContent=button.dataset.label||button.textContent;button.disabled=false;delete button.dataset.label}
  }
  function metric(id,value){const element=$(id);if(element)element.textContent=String(value||0)}
  function groups(value){return String(value||'').split(',').map(item=>clean(item,100)).filter(Boolean).slice(0,6)}

  async function loadAll(){
    if(!client)return;
    const [sourceResult,articleResult,runResult]=await Promise.all([
      client.from('news_sources').select('*').order('created_at',{ascending:false}).limit(200),
      client.from('news_articles').select('*').order('created_at',{ascending:false}).limit(300),
      client.from('news_ingestion_runs').select('*').order('started_at',{ascending:false}).limit(12)
    ]);
    if(sourceResult.error||articleResult.error||runResult.error){
      setStatus(sourceResult.error?.message||articleResult.error?.message||runResult.error?.message||'The newsroom could not be loaded.','error');return;
    }
    sources=sourceResult.data||[];articles=articleResult.data||[];
    renderSources();renderReviews();renderRuns(runResult.data||[]);renderMetrics();
  }

  function renderMetrics(){
    metric('#newsMetricSources',sources.filter(item=>item.active).length);
    const pending=articles.filter(item=>item.status==='pending_review').length;metric('#newsMetricPending',pending);metric('#navNewsPending',pending);
    metric('#newsMetricPublished',articles.filter(item=>item.status==='published').length);
    metric('#newsMetricCorrections',articles.filter(item=>item.status==='needs_correction').length);
  }

  function renderSources(){
    const host=$('#newsSourceList');if(!host)return;
    host.innerHTML=sources.length?sources.map(source=>`<article class="ops-news-source" data-news-source="${esc(source.id)}">
      <header><div><h3>${esc(source.name)}</h3><p>${esc(source.feed_url)}</p></div><button type="button" data-news-edit-source="${esc(source.id)}">Edit</button></header>
      <div class="ops-news-badges"><span>${esc(source.category)}</span><span>${esc(source.risk_level)} risk</span><span>${source.active?'active':'paused'}</span><span>${source.auto_publish?'automatic with safeguards':'manual publishing'}</span></div>
      <p>Last successful check: ${esc(fmt(source.last_success_at))}${source.last_error?`<br><strong>Last error:</strong> ${esc(source.last_error)}`:''}</p>
      <div class="ops-news-actions"><button type="button" data-news-toggle-source="${esc(source.id)}">${source.active?'Pause':'Activate'}</button><button class="danger" type="button" data-news-delete-source="${esc(source.id)}">Delete</button></div>
    </article>`).join(''):'<div class="ops-news-empty">No approved feed has been added. Add an official RSS, Atom, or JSON feed to begin importing.</div>';
    $$('[data-news-edit-source]').forEach(button=>button.addEventListener('click',()=>editSource(button.dataset.newsEditSource)));
    $$('[data-news-toggle-source]').forEach(button=>button.addEventListener('click',()=>toggleSource(button)));
    $$('[data-news-delete-source]').forEach(button=>button.addEventListener('click',()=>deleteSource(button)));
  }

  function resetSourceForm(){
    $('#newsSourceForm')?.reset();
    if($('#newsSourceId'))$('#newsSourceId').value='';
    if($('#newsSourceType'))$('#newsSourceType').value='rss';
    if($('#newsSourceCategory'))$('#newsSourceCategory').value='Philippines';
    if($('#newsSourceRisk'))$('#newsSourceRisk').value='medium';
    if($('#newsSourceActive'))$('#newsSourceActive').checked=true;
    if($('#newsSourceAuto'))$('#newsSourceAuto').checked=true;
  }
  function editSource(id){
    const item=sources.find(source=>source.id===id);if(!item)return;
    $('#newsSourceId').value=item.id;$('#newsSourceName').value=item.name;$('#newsSourceFeed').value=item.feed_url;$('#newsSourceHomepage').value=item.homepage_url||'';$('#newsSourceType').value=item.source_type;$('#newsSourceCategory').value=item.category;$('#newsSourceRegion').value=item.region||'';$('#newsSourceRisk').value=item.risk_level;$('#newsSourceRights').value=item.rights_note||'';$('#newsSourceActive').checked=Boolean(item.active);$('#newsSourceAuto').checked=Boolean(item.auto_publish);
    $('#newsSourceName').focus();panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function toggleSource(button){
    const item=sources.find(source=>source.id===button.dataset.newsToggleSource);if(!item)return;
    loading(button,true,'Saving…');const {error}=await client.from('news_sources').update({active:!item.active,updated_at:new Date().toISOString()}).eq('id',item.id);loading(button,false);
    if(error){setStatus('The source could not be updated.','error');return}setStatus(item.active?'Source paused.':'Source activated.','success');loadAll();
  }
  async function deleteSource(button){
    const id=button.dataset.newsDeleteSource;const item=sources.find(source=>source.id===id);if(!item||!confirm(`Delete ${item.name} from approved sources? Imported articles will remain.`))return;
    loading(button,true,'Deleting…');const {error}=await client.from('news_sources').delete().eq('id',id);loading(button,false);
    if(error){setStatus('The source could not be deleted.','error');return}resetSourceForm();setStatus('Source deleted.','success');loadAll();
  }

  $('#newsSourceForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const id=$('#newsSourceId').value;
    const name=clean($('#newsSourceName').value,160);const feed=$('#newsSourceFeed').value.trim();
    if(name.length<2||!/^https:\/\//i.test(feed)){setStatus('Enter a source name and a secure HTTPS feed URL.','error');return}
    const payload={name,feed_url:feed,homepage_url:$('#newsSourceHomepage').value.trim()||null,source_type:$('#newsSourceType').value,category:clean($('#newsSourceCategory').value,80)||'Philippines',region:clean($('#newsSourceRegion').value,120)||null,risk_level:$('#newsSourceRisk').value,rights_note:clean($('#newsSourceRights').value,1000)||null,active:$('#newsSourceActive').checked,auto_publish:$('#newsSourceAuto').checked,updated_at:new Date().toISOString()};
    const button=$('#newsSaveSource');loading(button,true,'Saving…');
    const result=id?await client.from('news_sources').update(payload).eq('id',id):await client.from('news_sources').insert({...payload,created_by:user.id});
    loading(button,false);
    if(result.error){setStatus(result.error.code==='23505'?'That feed is already connected.':result.error.message||'The source could not be saved.','error');return}
    resetSourceForm();setStatus('Approved source saved.','success');loadAll();
  });
  $('#newsNewSource')?.addEventListener('click',resetSourceForm);

  function filteredArticles(){const value=$('#newsReviewFilter')?.value||'pending_review';return articles.filter(item=>value==='all'||item.status===value)}
  function renderReviews(){
    const host=$('#newsReviewList');if(!host)return;const list=filteredArticles();
    host.innerHTML=list.length?list.map(item=>`<article class="ops-news-review" data-news-article="${esc(item.id)}">
      <header><div><h3>${esc(item.title)}</h3><p>${esc(item.source_name)} · ${esc(fmt(item.source_published_at||item.created_at))}</p></div><a href="${esc(item.source_url)}" target="_blank" rel="noopener">Source ↗</a></header>
      <div class="ops-news-badges"><span>${esc(item.status)}</span><span>${esc(item.risk_level)} risk</span><span>${esc(item.impact_confidence||'low')} impact confidence</span>${item.auto_published?'<span>auto-published</span>':''}${item.is_ai_assisted?'<span>AI-assisted draft</span>':''}</div>
      ${item.requires_review_reason?`<p><strong>Why it stopped:</strong> ${esc(item.requires_review_reason)}</p>`:''}
      <p>${esc(item.source_excerpt||'No source excerpt was supplied by the feed.')}</p>
      <label><span>What happened</span><textarea data-news-summary maxlength="700">${esc(item.summary||'')}</textarea></label>
      <label><span>What this means for Filipinos</span><textarea data-news-impact maxlength="1200">${esc(item.filipino_impact||'')}</textarea></label>
      <label><span>Who is affected, comma-separated</span><input data-news-groups maxlength="650" value="${esc((item.affected_groups||[]).join(', '))}"></label>
      <label><span>Effect on everyday life and household realities</span><textarea data-news-household maxlength="1000">${esc(item.household_impact||'')}</textarea></label>
      <label><span>What Filipinos should watch or do next</span><textarea data-news-action maxlength="1000">${esc(item.public_interest_action||'')}</textarea></label>
      <label><span>FMB Filipino-first perspective</span><textarea data-news-perspective maxlength="1200">${esc(item.fmb_perspective||'')}</textarea></label>
      <label><span>Impact confidence</span><select data-news-confidence><option value="low" ${item.impact_confidence==='low'?'selected':''}>Low</option><option value="medium" ${item.impact_confidence==='medium'?'selected':''}>Medium</option><option value="high" ${item.impact_confidence==='high'?'selected':''}>High</option></select></label>
      <div class="ops-news-actions"><button class="primary" type="button" data-news-decision="published">Publish</button><button type="button" data-news-decision="pending_review">Keep for review</button><button type="button" data-news-decision="needs_correction">Mark correction</button><button class="danger" type="button" data-news-decision="rejected">Reject</button></div>
    </article>`).join(''):'<div class="ops-news-empty">No stories match this review state.</div>';
    $$('[data-news-decision]').forEach(button=>button.addEventListener('click',()=>saveDecision(button)));
  }
  async function saveDecision(button){
    const card=button.closest('[data-news-article]');const id=card.dataset.newsArticle;const status=button.dataset.newsDecision;const now=new Date().toISOString();
    const summary=clean(card.querySelector('[data-news-summary]').value,700);
    const filipinoImpact=clean(card.querySelector('[data-news-impact]').value,1200);
    const affectedGroups=groups(card.querySelector('[data-news-groups]').value);
    const householdImpact=clean(card.querySelector('[data-news-household]').value,1000);
    const publicInterestAction=clean(card.querySelector('[data-news-action]').value,1000);
    const fmbPerspective=clean(card.querySelector('[data-news-perspective]').value,1200);
    const impactConfidence=card.querySelector('[data-news-confidence]').value;
    if(status==='published'&&(filipinoImpact.length<40||!affectedGroups.length||householdImpact.length<20||publicInterestAction.length<20||fmbPerspective.length<40||impactConfidence==='low')){
      setStatus('Publication blocked: complete the Filipino impact, affected groups, everyday-life effect, public-interest next step, FMB perspective, and use medium or high confidence.','error');return;
    }
    const payload={summary:summary||null,filipino_impact:filipinoImpact||null,affected_groups:affectedGroups,household_impact:householdImpact||null,public_interest_action:publicInterestAction||null,fmb_perspective:fmbPerspective||null,impact_confidence:impactConfidence,editorial_lens_version:'fmb_filipino_first_v1',status,updated_at:now,reviewed_by:user.id,reviewed_at:now,verification_status:status==='published'?'verified':status==='needs_correction'?'corrected':'imported',published_at:status==='published'?now:null,auto_published:false,requires_review_reason:status==='published'?null:'Editorial decision required.',rejection_reason:status==='rejected'?'Rejected through the FMB News editorial queue.':null};
    loading(button,true,'Saving…');const {error}=await client.from('news_articles').update(payload).eq('id',id);loading(button,false);
    if(error){setStatus(error.message||'The editorial decision could not be saved.','error');return}setStatus(`Story moved to ${status.replaceAll('_',' ')}.`,'success');loadAll();
  }
  $('#newsReviewFilter')?.addEventListener('change',renderReviews);

  function renderRuns(runs){
    const host=$('#newsRunList');if(!host)return;
    host.innerHTML=runs.length?runs.map(run=>`<article class="ops-news-run"><div><strong>${esc(run.status)}</strong><p>${esc(fmt(run.started_at))} · ${esc(run.trigger_type)}</p></div><p>${run.sources_checked} sources · ${run.items_imported} imported · ${run.items_published} published${run.error_summary?`<br>${esc(run.error_summary)}`:''}</p></article>`).join(''):'<div class="ops-news-empty">No ingestion run has been recorded yet.</div>';
  }

  $('#newsRunImport')?.addEventListener('click',async event=>{
    const button=event.currentTarget;loading(button,true,'Importing…');setStatus('Checking approved feeds and building the Filipino-first story structure.');
    try{
      const {data}=await client.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Your secure session has expired.');
      const response=await fetch('/api/news/ingest',{method:'POST',headers:{Authorization:`Bearer ${token}`}});const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||payload.detail||'The import failed.');
      setStatus(`Import complete: ${payload.items_imported} new, ${payload.items_published} automatically published.`,'success');await loadAll();
    }catch(error){setStatus(error.message||'The import could not be completed.','error')}
    finally{loading(button,false)}
  });
  $('#newsRefresh')?.addEventListener('click',loadAll);

  window.addEventListener('fmb:admin-panel',event=>{if(event.detail?.id==='newsroomPanel'&&client)loadAll()});
  window.addEventListener('fmb:admin-ready',event=>{
    if(event.detail?.preview){setStatus('Newsroom data is paused in local design preview.');return}
    if(event.detail?.profile?.role!=='admin'){panel.hidden=true;return}
    client=event.detail.client;user=event.detail.user;resetSourceForm();loadAll();
  },{once:true});
})();
