(function(){
  'use strict';

  const POST_TABLE='app_freedom_wall_posts';
  const REPORT_TABLE='app_freedom_wall_reports';
  const allowedDestinations=new Set(['home','checkin','journal','listen','read','history','tools','privacy','help']);
  const client=window.FMB?.createClient?.('local')||null;
  let activeUser=null;
  let activeProfile=null;
  let currentReportPost=null;

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

  function escapeHtml(value){
    return window.FMB?.escapeHtml?window.FMB.escapeHtml(value):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function clean(value,max){
    return window.FMB?.cleanText?window.FMB.cleanText(value,max):String(value||'').trim().slice(0,max);
  }

  function showToast(message){
    const toast=$('#toast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('visible');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('visible'),2800);
  }

  function relativeTime(value){
    const date=new Date(value);
    const diff=Math.max(0,Date.now()-date.getTime());
    const minutes=Math.floor(diff/60000);
    if(minutes<1)return 'Just now';
    if(minutes<60)return `${minutes}m`;
    const hours=Math.floor(minutes/60);
    if(hours<24)return `${hours}h`;
    const days=Math.floor(hours/24);
    if(days<7)return `${days}d`;
    return new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric'}).format(date);
  }

  function initials(alias){
    return String(alias||'FMB').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  }

  function injectCommunity(){
    if($('#screen-community'))return;

    const quickGrid=$('#screen-home .quick-grid');
    if(quickGrid){
      const privacyCard=quickGrid.querySelector('[data-go="privacy"]');
      const card=document.createElement('button');
      card.className='quick-card wide community-home-card';
      card.type='button';
      card.dataset.communityOpen='true';
      card.innerHTML='<small>App community</small><h3>Freedom Wall</h3><p>Read approved reflections or submit a thoughtful post for moderation.</p>';
      privacyCard?.before(card);
    }

    const help=$('#screen-help');
    help?.insertAdjacentHTML('beforebegin',`
      <section class="screen" id="screen-community" data-screen="community">
        <article class="community-hero card">
          <div class="community-hero-row">
            <div><p class="kicker">App-only community</p><h1>Freedom Wall</h1></div>
            <button class="button primary community-compose" id="open-compose-sheet" type="button" aria-label="Write a community post">+</button>
          </div>
          <p>A gentle wall for approved reflections about hope, identity, rest, support, and becoming. This community belongs only to the mental-health app.</p>
          <div class="community-status" id="community-auth-status">Checking community access.</div>
        </article>
        <div class="section-heading"><h2>Approved reflections</h2><span>Moderated before display</span></div>
        <div class="community-feed" id="community-feed"><article class="card empty">Opening the Freedom Wall.</article></div>
        <section id="my-pending-section" hidden>
          <div class="section-heading"><h2>Your submissions</h2><span>Only you can see these</span></div>
          <div class="pending-list" id="my-pending-list"></div>
        </section>
        <p class="notice">The Freedom Wall is supportive community content, not professional advice or emergency help. Do not include private medical details, addresses, phone numbers, or information that identifies another person.</p>
      </section>`);
  }

  function injectSheets(){
    if($('#app-more-sheet'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <div class="sheet-backdrop" id="app-more-sheet" aria-hidden="true">
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="more-title">
          <div class="sheet-grabber"></div>
          <div class="sheet-head"><div><h2 id="more-title">More</h2><p>Your quieter tools and account controls.</p></div><button class="sheet-close" type="button" data-close-sheet aria-label="Close">×</button></div>
          <div class="sheet-menu">
            <button type="button" data-sheet-dest="read"><span>Read supportive ebooks</span><span>›</span></button>
            <button type="button" data-sheet-dest="history"><span>Check-in and journal history</span><span>›</span></button>
            <button type="button" data-sheet-dest="tools"><span>Grounding and breathing</span><span>›</span></button>
            <button type="button" data-sheet-dest="privacy"><span>Privacy and records</span><span>›</span></button>
            <button type="button" data-sheet-dest="help"><span>Support contacts</span><span>›</span></button>
            <a href="/profile/"><span>Member profile</span><span>›</span></a>
          </div>
        </section>
      </div>

      <div class="sheet-backdrop" id="compose-sheet" aria-hidden="true">
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="compose-title">
          <div class="sheet-grabber"></div>
          <div class="sheet-head"><div><h2 id="compose-title">Share with care</h2><p>Your post enters moderation before it can appear.</p></div><button class="sheet-close" type="button" data-close-sheet aria-label="Close">×</button></div>
          <form class="sheet-form" id="community-compose-form">
            <label>Safe name or alias<input id="community-alias" maxlength="40" autocomplete="nickname" required placeholder="How should the wall credit you?"></label>
            <label>Theme<select id="community-topic"><option value="reflection">Reflection</option><option value="hope">Hope</option><option value="identity">Identity</option><option value="rest">Rest</option><option value="support">Support</option><option value="gratitude">Gratitude</option></select></label>
            <label>Your reflection<textarea id="community-content" maxlength="600" required placeholder="Share something honest, supportive, and safe."></textarea></label>
            <div class="count-row"><span id="community-character-count">0 / 600</span></div>
            <div class="sheet-disclosure">Posts are never published automatically. An administrator must approve each submission. Do not share crisis details that need an immediate response; use Support instead.</div>
            <div class="sheet-actions"><button class="button primary" id="community-submit" type="submit">Submit for review</button><a class="button soft" id="community-signin" href="/auth.html#signin" hidden>Sign in to post</a></div>
            <div class="community-status" id="community-submit-status" role="status" aria-live="polite"></div>
          </form>
        </section>
      </div>

      <div class="sheet-backdrop" id="report-sheet" aria-hidden="true">
        <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="report-title">
          <div class="sheet-grabber"></div>
          <div class="sheet-head"><div><h2 id="report-title">Report a post</h2><p>Reports are reviewed privately by administrators.</p></div><button class="sheet-close" type="button" data-close-sheet aria-label="Close">×</button></div>
          <form class="sheet-form" id="community-report-form">
            <label>Reason<select id="report-reason"><option value="harmful">Harmful</option><option value="abusive">Abusive</option><option value="threatening">Threatening</option><option value="discriminatory">Discriminatory</option><option value="unsafe">Unsafe advice</option><option value="privacy">Privacy concern</option><option value="other">Other</option></select></label>
            <label>Optional details<textarea id="report-details" maxlength="500" placeholder="Briefly explain the concern."></textarea></label>
            <div class="sheet-actions"><button class="button danger" type="submit">Send private report</button><a class="button soft" id="report-signin" href="/auth.html#signin" hidden>Sign in to report</a></div>
            <div class="community-status" id="report-status" role="status" aria-live="polite"></div>
          </form>
        </section>
      </div>`);
  }

  function replaceTabbar(){
    const nav=$('.tabbar');
    if(!nav)return;
    nav.innerHTML=`
      <button class="active" type="button" data-ux-dest="home"><span>⌂</span><span>Home</span></button>
      <button type="button" data-ux-dest="checkin"><span>✓</span><span>Check-in</span></button>
      <button type="button" data-ux-dest="journal"><span>✎</span><span>Journal</span></button>
      <button type="button" data-ux-dest="listen"><span>♪</span><span>Listen</span></button>
      <button type="button" data-ux-dest="community"><span>◫</span><span>Community</span></button>`;
    $$('[data-ux-dest]',nav).forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.uxDest)));
  }

  function setActiveTab(name){
    $$('[data-ux-dest]').forEach(button=>button.classList.toggle('active',button.dataset.uxDest===name));
  }

  function navigate(name){
    closeAllSheets();
    if(name==='community'){
      $$('.screen').forEach(screen=>screen.classList.toggle('active',screen.id==='screen-community'));
      history.replaceState(null,'','#community');
      setActiveTab('community');
      window.scrollTo({top:0,behavior:'smooth'});
      loadCommunity();
      return;
    }
    $('#screen-community')?.classList.remove('active');
    if(!allowedDestinations.has(name))name='home';
    if(location.hash.slice(1)===name){
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }else{
      location.hash=name;
    }
    setActiveTab(['home','checkin','journal','listen'].includes(name)?name:'');
  }

  function openSheet(id){
    const sheet=$(id);
    if(!sheet)return;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setTimeout(()=>sheet.querySelector('input,textarea,select,button')?.focus(),180);
  }

  function closeSheet(sheet){
    if(!sheet)return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden','true');
    if(!$('.sheet-backdrop.open'))document.body.classList.remove('modal-open');
  }

  function closeAllSheets(){
    $$('.sheet-backdrop.open').forEach(closeSheet);
  }

  async function loadIdentity(){
    if(!client){
      setAuthUi();
      return;
    }
    const {data:{session}}=await client.auth.getSession();
    activeUser=session?.user||null;
    if(activeUser){
      const result=await window.FMB.getActiveProfile(client);
      activeProfile=result.profile||null;
    }
    setAuthUi();
  }

  function setAuthUi(){
    const status=$('#community-auth-status');
    const signedIn=Boolean(activeUser);
    if(status){
      status.textContent=signedIn
        ?'Signed in. Your submissions are private while waiting for review.'
        :'Anyone may read approved posts. Sign in with an active member profile to submit or report.';
    }
    $('#community-signin')?.toggleAttribute('hidden',signedIn);
    $('#community-submit')?.toggleAttribute('hidden',!signedIn);
    $('#report-signin')?.toggleAttribute('hidden',signedIn);
    $('#community-report-form button[type="submit"]')?.toggleAttribute('hidden',!signedIn);
    if(signedIn&&$('#community-alias')&&!$('#community-alias').value){
      $('#community-alias').value=activeProfile?.display_name||activeProfile?.full_name||activeUser.user_metadata?.full_name||'Member';
    }
  }

  function renderPosts(posts){
    const feed=$('#community-feed');
    if(!feed)return;
    if(!posts.length){
      feed.innerHTML='<article class="card empty">No approved reflections are available yet.</article>';
      return;
    }
    feed.innerHTML=posts.map(post=>`
      <article class="wall-post card">
        <div class="wall-post-head">
          <div class="wall-author"><span class="wall-avatar" aria-hidden="true">${escapeHtml(initials(post.alias))}</span><span><strong>${escapeHtml(post.alias)}</strong><small>${post.author_kind==='fmb'?'With Love, FMB reflection':'Approved member reflection'}</small></span></div>
          <time class="wall-time" datetime="${escapeHtml(post.published_at||post.created_at)}">${relativeTime(post.published_at||post.created_at)}</time>
        </div>
        <blockquote>${escapeHtml(post.content)}</blockquote>
        <div class="wall-post-foot"><span class="topic-chip">${escapeHtml(post.topic)}</span><button class="report-link" type="button" data-report-post="${escapeHtml(post.id)}">Report</button></div>
      </article>`).join('');
    $$('[data-report-post]',feed).forEach(button=>button.addEventListener('click',()=>{
      currentReportPost=button.dataset.reportPost;
      $('#report-status').textContent=activeUser?'Your report is private.':'Sign in to send a report.';
      openSheet('#report-sheet');
    }));
  }

  function renderPending(posts){
    const section=$('#my-pending-section');
    const list=$('#my-pending-list');
    if(!section||!list)return;
    section.hidden=!activeUser;
    if(!activeUser)return;
    if(!posts.length){
      list.innerHTML='<article class="pending-post"><strong>No pending submissions.</strong><p>Your submitted reflections will appear here while they are being reviewed.</p></article>';
      return;
    }
    list.innerHTML=posts.map(post=>`
      <article class="pending-post">
        <strong>${escapeHtml(post.alias)} · ${escapeHtml(post.topic)}</strong>
        <p>${escapeHtml(post.content)}</p>
        <small>${escapeHtml(post.status.replace('_',' '))}</small>
      </article>`).join('');
  }

  async function loadCommunity(){
    if(!client){
      renderPosts([]);
      renderPending([]);
      return;
    }
    $('#community-feed').innerHTML='<article class="card empty">Opening approved reflections.</article>';
    const publishedPromise=client.from(POST_TABLE).select('id,alias,content,topic,author_kind,published_at,created_at').eq('status','published').order('published_at',{ascending:false}).limit(40);
    const pendingPromise=activeUser
      ?client.from(POST_TABLE).select('id,alias,content,topic,status,created_at,moderation_note').eq('user_id',activeUser.id).neq('status','published').order('created_at',{ascending:false}).limit(20)
      :Promise.resolve({data:[],error:null});
    const [published,pending]=await Promise.all([publishedPromise,pendingPromise]);
    if(published.error){
      $('#community-feed').innerHTML='<article class="card empty">The Freedom Wall could not be loaded right now.</article>';
    }else{
      renderPosts(published.data||[]);
    }
    renderPending(pending.data||[]);
  }

  async function submitPost(event){
    event.preventDefault();
    if(!activeUser){
      $('#community-submit-status').textContent='Sign in with an active member profile to submit.';
      return;
    }
    const alias=clean($('#community-alias').value,40);
    const topic=$('#community-topic').value;
    const content=clean($('#community-content').value,600);
    if(!alias||!content){
      $('#community-submit-status').textContent='Add a safe alias and your reflection.';
      return;
    }
    const button=$('#community-submit');
    button.disabled=true;
    button.textContent='Submitting';
    const {error}=await client.from(POST_TABLE).insert({
      user_id:activeUser.id,
      author_kind:'member',
      alias,
      content,
      topic,
      status:'pending'
    });
    button.disabled=false;
    button.textContent='Submit for review';
    if(error){
      $('#community-submit-status').textContent=error.code==='42501'
        ?'Posting is available to active members. Check your profile status or sign in again.'
        :'Your post could not be submitted right now.';
      return;
    }
    $('#community-content').value='';
    $('#community-character-count').textContent='0 / 600';
    $('#community-submit-status').textContent='Submitted privately for administrator review.';
    showToast('Your reflection is pending review.');
    await loadCommunity();
    setTimeout(()=>closeSheet($('#compose-sheet')),900);
  }

  async function submitReport(event){
    event.preventDefault();
    if(!activeUser||!currentReportPost){
      $('#report-status').textContent='Sign in to send a private report.';
      return;
    }
    const reason=$('#report-reason').value;
    const details=clean($('#report-details').value,500)||null;
    const {error}=await client.from(REPORT_TABLE).insert({
      post_id:currentReportPost,
      reporter_id:activeUser.id,
      reason,
      details,
      status:'open'
    });
    if(error){
      $('#report-status').textContent=error.code==='23505'?'You already reported this post.':'The report could not be sent right now.';
      return;
    }
    $('#report-status').textContent='Report sent privately for administrator review.';
    $('#report-details').value='';
    showToast('Private report submitted.');
    setTimeout(()=>closeSheet($('#report-sheet')),900);
  }

  function bindUi(){
    $('#open-more-sheet')?.addEventListener('click',()=>openSheet('#app-more-sheet'));
    $('#open-compose-sheet')?.addEventListener('click',()=>openSheet('#compose-sheet'));
    $('[data-community-open]')?.addEventListener('click',()=>navigate('community'));

    $$('[data-close-sheet]').forEach(button=>button.addEventListener('click',()=>closeSheet(button.closest('.sheet-backdrop'))));
    $$('.sheet-backdrop').forEach(backdrop=>backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeSheet(backdrop)}));
    $$('[data-sheet-dest]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.sheetDest)));
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeAllSheets()});

    $('#community-content')?.addEventListener('input',event=>{
      $('#community-character-count').textContent=`${event.target.value.length} / 600`;
    });
    $('#community-compose-form')?.addEventListener('submit',submitPost);
    $('#community-report-form')?.addEventListener('submit',submitReport);

    window.addEventListener('hashchange',()=>{
      const destination=location.hash.slice(1)||'home';
      if(destination==='community'){
        navigate('community');
      }else{
        $('#screen-community')?.classList.remove('active');
        setActiveTab(['home','checkin','journal','listen'].includes(destination)?destination:'');
      }
    });
  }

  async function start(){
    injectCommunity();
    injectSheets();
    replaceTabbar();
    bindUi();
    await loadIdentity();
    if(client){
      client.auth.onAuthStateChange(async(_event,session)=>{
        activeUser=session?.user||null;
        activeProfile=null;
        if(activeUser){
          const result=await window.FMB.getActiveProfile(client);
          activeProfile=result.profile||null;
        }
        setAuthUi();
        loadCommunity();
      });
    }
    if(location.hash.slice(1)==='community')navigate('community');
  }

  start();
})();
