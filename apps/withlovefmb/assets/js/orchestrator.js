(function(){
  'use strict';

  const $=selector=>document.querySelector(selector);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const STORAGE_KEY='fmb-orchestrator-workspace-v1';
  const WORKSPACE_KEY='fmbco-main';
  const SCHEMA_VERSION=1;
  const BRANDS=['FMB&CO.','SENZ','With Love, FMB','Yoni','Cognita','Mabayani'];
  const CHANNELS=['Messenger','Instagram','Facebook','Website','ChatGPT','Email','Manual'];
  const INTENTS=['General','Consultation','Pricing','Volunteer','Partnership','Membership','Support and safety','App help','Media inquiry','Culture and heritage'];
  const CONTENT_CHANNELS=['Facebook','Instagram','Website','LinkedIn','YouTube','Email','Cross-channel'];
  const FIXED_DATE='2026-07-23T00:00:00.000Z';
  const iconPaths={
    overview:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    inbox:'<path d="M4 5h16v12H8l-4 3Z"/><path d="M8 9h8M8 13h5"/>',
    knowledge:'<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2Z"/><path d="M8 4v16M11 8h5M11 12h5"/>',
    reply:'<path d="M5 6h14v10H9l-4 4Z"/><path d="M9 10h6M9 13h4"/>',
    planner:'<path d="M5 5h14v15H5zM8 3v4M16 3v4M5 10h14"/>',
    analytics:'<path d="M5 19V9M12 19V4M19 19v-7"/>',
    automation:'<path d="M12 4v4M12 16v4M4 12h4M16 12h4"/><circle cx="12" cy="12" r="4"/>',
    qa:'<path d="M5 4h14v16H5zM8 10l2 2 5-5M8 16h8"/>',
    community:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c.6-4 2.6-6 6-6s5.4 2 6 6M15 15c3 0 4.8 1.7 5 5"/>',
    members:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6"/>',
    moderation:'<path d="M12 3 5 6v5c0 5.4 3.1 8.3 7 10 3.9-1.7 7-4.6 7-10V6Z"/><path d="m9 12 2 2 4-5"/>',
    content:'<path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"/>',
    music:'<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    media:'<rect x="4" y="5" width="16" height="14" rx="1"/><circle cx="9" cy="10" r="2"/><path d="m6 17 4-4 3 3 2-2 3 3"/>',
    messages:'<path d="M4 5h16v12H8l-4 3Z"/>'
  };

  let state=null;
  let adminClient=null;
  let adminUser=null;
  let cloudTimer=null;
  let selectedReplySetId='';
  let searchResults=null;
  let initialized=false;

  function uid(prefix){
    const value=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${value}`;
  }
  function escapeHtml(value){
    if(window.FMB?.escapeHtml)return window.FMB.escapeHtml(value);
    const node=document.createElement('div');node.textContent=value==null?'':String(value);return node.innerHTML;
  }
  function cleanText(value,max=10000){
    return String(value||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max);
  }
  function normalize(value){
    return cleanText(value,20000).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  }
  function redactQuestion(value){
    return cleanText(value,1000)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email removed]')
      .replace(/(?:\+?63|0)?\s*9\d{2}[\s.-]*\d{3}[\s.-]*\d{4}/g,'[phone removed]')
      .replace(/@[A-Za-z0-9](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9])?/g,'[handle removed]');
  }
  function formatDate(value,withTime=false){
    if(!value)return 'Not set';
    const date=new Date(value);if(Number.isNaN(date.getTime()))return String(value);
    return new Intl.DateTimeFormat('en-PH',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(date);
  }
  function isoDate(value){return value?String(value).slice(0,10):''}
  function statusLabel(value){
    return ({uncovered:'Needs coverage',covered:'Covered',review:'Needs review',approved:'Approved',draft:'Draft','not-run':'Not run',passed:'Passed',issue:'Issue',idea:'Idea',drafting:'Drafting',scheduled:'Scheduled',published:'Published'})[value]||String(value||'').replaceAll('-',' ');
  }
  function statusBadge(value){return `<span class="ops-status ${escapeHtml(value)}">${escapeHtml(statusLabel(value))}</span>`}
  function makeOptions(values,selected='',includeAuto=false){
    const lead=includeAuto?'<option value="">Auto classify</option>':'';
    return lead+values.map(value=>`<option value="${escapeHtml(value)}"${value===selected?' selected':''}>${escapeHtml(value)}</option>`).join('');
  }
  function emptyRow(message,columns){return `<tr><td colspan="${columns}"><div class="ops-empty"><div><strong>${escapeHtml(message)}</strong><p>Add a real record when it becomes useful. Nothing here is padded with fake activity.</p></div></div></td></tr>`}
  function emptyBlock(title,message){return `<div class="ops-empty"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div></div>`}

  function defaultKnowledge(){
    return [
      {id:'kb-fmbco',brand:'FMB&CO.',question:'What is FMB&CO.?',answer:'FMB&CO. is the company home of SENZ and Cognita, founded by Francine Marie Bautista. Each business keeps its own role, audience, and identity.',intents:['General','Partnership','Media inquiry'],status:'approved',source:'/fmbandco/',reviewedAt:FIXED_DATE},
      {id:'kb-senz',brand:'SENZ',question:'What does SENZ do?',answer:'SENZ is the marketing and digital solutions business of FMB&CO. Current services and offers must be confirmed through the official SENZ website or inquiry channel.',intents:['General','Consultation','Pricing'],status:'approved',source:'https://senzpr.com/',reviewedAt:FIXED_DATE},
      {id:'kb-cognita',brand:'Cognita',question:'What is Cognita?',answer:'Cognita is the knowledge and learning arm of FMB&CO. Current resources and learning offers must be confirmed through the official Cognita website or inquiry channel.',intents:['General','Consultation'],status:'approved',source:'https://thecognitainstitute.com/',reviewedAt:FIXED_DATE},
      {id:'kb-withlove',brand:'With Love, FMB',question:'What belongs under With Love, FMB?',answer:'With Love, FMB carries advocacy, culture, community, wellbeing, and social-impact work. Its active concerns include language preservation, women, the LGBTQIA+ community, mental health, culture, heritage, and community development.',intents:['General','Volunteer','Partnership'],status:'approved',source:'/withlovefmb/',reviewedAt:FIXED_DATE},
      {id:'kb-yoni',brand:'Yoni',question:'Is Yoni a crisis service or a therapist?',answer:'No. Yoni is a supportive digital companion and safe-space application. It is not an emergency responder, crisis service, therapist, or substitute for professional care. Urgent safety concerns must be directed to emergency services, an available crisis line, or a trusted person nearby.',intents:['Support and safety','App help','General'],status:'approved',source:'https://yoni.francinemariebautista.com/',reviewedAt:FIXED_DATE},
      {id:'kb-data-boundary',brand:'FMB&CO.',question:'Which inquiries should be stored in Supabase?',answer:'Only authenticated members, paying clients, and the records required to serve them belong in the separated Supabase projects. General social-media inquiries and casual conversations stay in the external automation or CRM layer unless the person becomes a member or paying client.',intents:['General','Membership','Consultation'],status:'approved',source:'Approved FMB data boundary',reviewedAt:FIXED_DATE},
      {id:'kb-human-review',brand:'FMB&CO.',question:'May automation answer people automatically?',answer:'No. Automation may collect, de-identify, classify, count, route, and surface unknown questions. Public replies must come from a human-approved reply bank and remain subject to human review before they are sent.',intents:['General','Support and safety','Media inquiry'],status:'approved',source:'Approved FMB automation rule',reviewedAt:FIXED_DATE},
      {id:'kb-mabayani',brand:'Mabayani',question:'What is Mabayani?',answer:'Mabayani is an FMB cultural and historical project focused on history, expression, remembrance, Sambal identity, language, and the memory of Masinloc. Historical claims remain unpublished until source review is complete.',intents:['General','Culture and heritage','Partnership'],status:'approved',source:'/mabayani/',reviewedAt:FIXED_DATE}
    ];
  }
  function defaultReplySets(){
    return [
      {id:'reply-general',name:'General acknowledgment',brand:'FMB&CO.',intent:'General',status:'review',cursor:0,variants:[
        'Thank you for reaching out. We received your message and will route it to the right FMB&CO. team. A human will review it before you receive a detailed reply.',
        'Thank you for your message. We are organizing it under the appropriate FMB&CO. brand or project so the right person can review and respond.',
        'Your message has been received. We will review the concern, confirm where it belongs, and reply through the appropriate FMB&CO. channel.'
      ],updatedAt:FIXED_DATE},
      {id:'reply-consultation',name:'SENZ consultation inquiry',brand:'SENZ',intent:'Consultation',status:'review',cursor:0,variants:[
        'Thank you for considering SENZ. Please share the business, project, or communication challenge you want us to review, together with your preferred timeline. Our team will assess the right next step.',
        'We appreciate your interest in working with SENZ. Kindly send a short description of the project, the result you need, and the target date so we can review the most suitable consultation path.',
        'Thank you for reaching out to SENZ. To prepare for a useful consultation, please tell us what you are building, what is currently unclear, and when you hope to begin.'
      ],updatedAt:FIXED_DATE},
      {id:'reply-yoni-safety',name:'Yoni safety boundary',brand:'Yoni',intent:'Support and safety',status:'review',cursor:0,variants:[
        'Yoni can offer supportive tools and information, but it cannot provide emergency help or replace professional care. If you may be in immediate danger, please contact emergency services, an available crisis line, or a trusted person nearby now.',
        'Thank you for saying what is happening. Yoni is a digital companion, not a crisis service. For urgent safety concerns, please contact emergency services, a crisis line available in your area, or someone you trust who can stay with you.',
        'Your safety matters. Yoni cannot send help or guarantee that FMB or a volunteer is available. Please contact emergency services, an available crisis line, or a trusted person close to you if the situation is urgent.'
      ],updatedAt:FIXED_DATE},
      {id:'reply-volunteer',name:'Volunteer interest',brand:'With Love, FMB',intent:'Volunteer',status:'review',cursor:0,variants:[
        'Thank you for wanting to volunteer with With Love, FMB. Please tell us your location, availability, and the kind of support you can offer. A human coordinator will review where your help may fit.',
        'We appreciate your interest in helping. Kindly share your area, available schedule, and skills so our team can review the appropriate volunteer or collaboration opportunity.',
        'Thank you for offering your time. Please send your location, availability, and preferred way to contribute. We will review it against the projects currently being organized.'
      ],updatedAt:FIXED_DATE}
    ];
  }
  function defaultChecklist(){
    return [
      {id:'auto-access-meta',group:'Access and consent',title:'Confirm Meta Business access',detail:'Verify the Facebook Page, Instagram account, and Messenger permissions under the correct business owner.',done:false},
      {id:'auto-access-policy',group:'Access and consent',title:'Approve privacy and retention rules',detail:'Define what may be collected, how long raw platform messages remain, and who may review them.',done:false},
      {id:'auto-intake-messenger',group:'Intake',title:'Connect Messenger intake',detail:'Receive messages in the external automation layer without copying casual contacts into Supabase.',done:false},
      {id:'auto-intake-instagram',group:'Intake',title:'Connect Instagram messages and comments',detail:'Collect question text, channel, timestamp, and public post context where permitted.',done:false},
      {id:'auto-intake-facebook',group:'Intake',title:'Connect Facebook comments',detail:'Separate public comments from private messages and preserve the original platform thread.',done:false},
      {id:'auto-intake-website',group:'Intake',title:'Connect website forms and ChatGPT handoffs',detail:'Route inquiry types to the same classification map without merging member, SENZ, or Cognita data.',done:false},
      {id:'auto-classify-redact',group:'Classification',title:'Redact personal identifiers before analysis',detail:'Keep the reusable question pattern, not names, handles, email addresses, or phone numbers.',done:false},
      {id:'auto-classify-brand',group:'Classification',title:'Map brand and intent rules',detail:'Route business inquiries to FMB&CO. or SENZ and advocacy or community inquiries to With Love, FMB.',done:false},
      {id:'auto-classify-unknown',group:'Classification',title:'Create the unknown-question queue',detail:'Anything without approved knowledge remains visible for FMB to decide.',done:false},
      {id:'auto-review-lock',group:'Human review',title:'Block automatic public replies',detail:'The system may suggest an approved set, but it cannot press send.',done:false},
      {id:'auto-review-rotation',group:'Human review',title:'Test rotational reply selection',detail:'Rotate approved variants while preserving one factual answer and the correct brand voice.',done:false},
      {id:'auto-review-escalation',group:'Human review',title:'Define escalation paths',detail:'Route safety, legal, reputation, media, payment, and sensitive community issues to a human immediately.',done:false},
      {id:'auto-knowledge-verify',group:'Knowledge and reporting',title:'Source and approve the knowledge base',detail:'Record the source, owner, status, and last review date for every answer.',done:false},
      {id:'auto-report-weekly',group:'Knowledge and reporting',title:'Prepare the weekly insight report',detail:'Summarize repeated questions, unknown patterns, brand demand, and content opportunities.',done:false},
      {id:'auto-report-export',group:'Knowledge and reporting',title:'Test export and recovery',detail:'Download the workspace JSON and confirm it can be restored before live automation begins.',done:false},
      {id:'auto-launch-sandbox',group:'Launch control',title:'Run a private sandbox test',detail:'Use test accounts and invented messages before connecting real public traffic.',done:false},
      {id:'auto-launch-qa',group:'Launch control',title:'Complete human QA and sign-off',detail:'Review routing, wording, privacy, mobile behavior, failure states, and audit records.',done:false}
    ];
  }
  function defaultQaRoutes(){
    return [
      {id:'qa-home',path:'/',checkPath:'/index.html',label:'Official bulletin',purpose:'Official FMB bulletin and ecosystem gateway',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-about',path:'/aboutfmb/',label:'About FMB',purpose:'Verified founder profile, authority, and identity',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-news',path:'/news/',label:'News',purpose:'Public editorial and national news channel',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-projects',path:'/projects/',label:'Projects',purpose:'Yoni, Mabayani, and With Love, FMB projects',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-ebooks',path:'/ebooks/',label:'Reading',purpose:'Open and member reading library',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-music',path:'/music/',label:'Music',purpose:'FMB music library and playback',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-withlove',path:'/withlovefmb/',label:'With Love, FMB',purpose:'Advocacy, community, wellbeing, and social impact',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-community',path:'/communityengagements/',label:'Community Record',purpose:'Published community photographs and participation inquiry route',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-volunteer',path:'/volunteer.html',label:'Volunteer',purpose:'Volunteer roles and application',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-help',path:'/gethelp/',label:'Get Help',purpose:'Verified crisis, health, safety, and assistance contacts',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-fmbco',path:'/fmbandco/',label:'FMB&CO.',purpose:'Company home of SENZ and Cognita',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-mabayani',path:'/mabayani/',label:'Mabayani',purpose:'Culture, history, heritage, and Sambal work',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-freedom',path:'/freedom-wall.html',label:'Freedom Wall',purpose:'Moderated positive community reflections',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-profile',path:'/profile/',label:'Member profile',purpose:'Private member tools and account access',automated:'not-run',human:'not-run',notes:''},
      {id:'qa-yoni',path:'https://yoni.francinemariebautista.com/',checkPath:'/app/index.html',label:'Yoni',purpose:'Official digital companion application',automated:'not-run',human:'not-run',notes:''}
    ];
  }
  function defaultManualQa(){
    return [
      {id:'manual-navigation',title:'Navigation and no dead ends',detail:'Every primary page offers a clear next action and a working way back.',done:false},
      {id:'manual-banner',title:'Moving top banner',detail:'The non-negotiable moving banner works without covering content.',done:false},
      {id:'manual-mobile',title:'Desktop and mobile parity',detail:'Layout, hierarchy, controls, and readable type work on phone and desktop.',done:false},
      {id:'manual-volunteer',title:'Volunteer content preserved',detail:'Volunteer roles, application, imagery, links, and community context remain available.',done:false},
      {id:'manual-brands',title:'Brand identities remain separate',detail:'SENZ, FMB&CO., With Love, FMB, Cognita, Mabayani, and Yoni keep their own visual language.',done:false},
      {id:'manual-access',title:'Member access and privacy',detail:'Public, member-only, and administrator areas display the correct access state.',done:false},
      {id:'manual-media',title:'Images, music, and eBooks',detail:'Approved assets load, crop correctly, play, open, and remain downloadable only where intended.',done:false},
      {id:'manual-accessibility',title:'Keyboard and accessibility',detail:'Focus states, labels, reduced motion, contrast, and touch targets remain usable.',done:false}
    ];
  }
  function createDefaultState(){
    return {
      version:SCHEMA_VERSION,
      meta:{modifiedAt:FIXED_DATE,cloudUpdatedAt:'',dataPolicy:'Store de-identified question patterns only. Keep raw inquiries and casual contacts outside Supabase.'},
      questions:[],
      knowledge:defaultKnowledge(),
      replySets:defaultReplySets(),
      contentPlan:[],
      checklist:defaultChecklist(),
      qaRoutes:defaultQaRoutes(),
      manualQa:defaultManualQa(),
      qaLastRun:''
    };
  }
  function mergeDefaults(candidate){
    const defaults=createDefaultState();
    const next=candidate&&typeof candidate==='object'?candidate:{};
    const mergeById=(current,seed)=>{
      const list=Array.isArray(current)?current.filter(item=>item&&item.id):[];
      const ids=new Set(list.map(item=>item.id));
      return [...list,...seed.filter(item=>!ids.has(item.id))];
    };
    return {
      ...defaults,
      ...next,
      version:SCHEMA_VERSION,
      meta:{...defaults.meta,...(next.meta||{})},
      questions:Array.isArray(next.questions)?next.questions:[],
      knowledge:mergeById(next.knowledge,defaults.knowledge),
      replySets:mergeById(next.replySets,defaults.replySets),
      contentPlan:Array.isArray(next.contentPlan)?next.contentPlan:[],
      checklist:mergeById(next.checklist,defaults.checklist),
      qaRoutes:mergeById(next.qaRoutes,defaults.qaRoutes),
      manualQa:mergeById(next.manualQa,defaults.manualQa)
    };
  }
  function loadLocal(){
    try{return mergeDefaults(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}
    catch{return createDefaultState()}
  }
  function writeLocal(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch{return false}
  }
  function setSync(message,syncState='local'){
    const element=$('#opsSyncState');if(!element)return;
    element.lastChild.textContent=message;element.dataset.state=syncState;
  }
  function persist(options={}){
    state.meta.modifiedAt=new Date().toISOString();
    if(!writeLocal())setSync('Browser storage unavailable','error');
    else if(!adminClient)setSync('Saved in this browser','local');
    renderAll();
    if(adminClient&&options.cloud!==false)scheduleCloudSave();
  }

  function classifyQuestion(text,preferredBrand=''){
    const value=normalize(text);
    let brand=preferredBrand;
    if(!brand){
      const brandRules=[
        ['Yoni',['yoni','companion app','safe space','journal','check in']],
        ['SENZ',['senz','marketing','digital solution','website service','consultation']],
        ['Cognita',['cognita','knowledge','learning','artificial intelligence']],
        ['Mabayani',['mabayani','sambal','masinloc history','heritage','dictionary','language preservation']],
        ['With Love, FMB',['volunteer','community','advocacy','lgbt','women','mental health','freedom wall']],
        ['FMB&CO.',['fmb co','partnership','company','ecosystem','francine']]
      ];
      brand=brandRules.find(([,words])=>words.some(word=>` ${value} `.includes(` ${word.trim()} `)||value.includes(word)))?.[0]||'FMB&CO.';
    }
    const intentRules=[
      ['Support and safety',['crisis','suicide','hurt myself','danger','emergency','therapist','mental health help']],
      ['Consultation',['book','consultation','hire','work with','service','proposal']],
      ['Pricing',['price','cost','rate','package','how much','payment']],
      ['Volunteer',['volunteer','help community','join project','contribute']],
      ['Partnership',['partner','sponsor','collaborate','collaboration','donation']],
      ['Membership',['member','membership','sign up','account','login']],
      ['App help',['install','download','app','password','technical','not working']],
      ['Media inquiry',['interview','press','media','feature','speaker']],
      ['Culture and heritage',['sambal','history','heritage','dictionary','language','mabayani']]
    ];
    const intent=intentRules.find(([,words])=>words.some(word=>value.includes(word)))?.[0]||'General';
    const tokens=new Set(value.split(' ').filter(word=>word.length>3));
    const covered=state.knowledge.some(item=>{
      if(item.status!=='approved')return false;
      if(item.brand!==brand&&item.brand!=='FMB&CO.')return false;
      if((item.intents||[]).includes(intent))return true;
      const source=new Set(normalize(`${item.question} ${item.answer}`).split(' ').filter(Boolean));
      return [...source].filter(word=>tokens.has(word)).length>=3;
    });
    return {brand,intent,status:covered?'covered':'uncovered'};
  }
  function recalculateCoverage(){
    state.questions=state.questions.map(item=>{
      if(item.status==='review')return item;
      const result=classifyQuestion(item.text,item.brand);
      return {...item,intent:item.intent||result.intent,status:result.status};
    });
  }

  function renderIcons(){
    $$('[data-icon]').forEach(icon=>{const path=iconPaths[icon.dataset.icon];if(path)icon.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`});
  }
  function fillSelect(id,values){
    const element=document.getElementById(id);if(!element)return;
    const current=element.value;const first=element.options[0]?.outerHTML||'';
    element.innerHTML=first+values.map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    if(values.includes(current))element.value=current;
  }
  function prepareFilters(){
    ['questionBrandFilter','knowledgeBrandFilter','contentBrandFilter'].forEach(id=>fillSelect(id,BRANDS));
    fillSelect('questionChannelFilter',CHANNELS);fillSelect('contentChannelFilter',CONTENT_CHANNELS);
  }
  function renderOverview(){
    const unknown=state.questions.filter(item=>item.status==='uncovered');
    const replyReview=state.replySets.filter(item=>item.status!=='approved');
    const qaIssues=state.qaRoutes.filter(item=>item.automated==='issue'||item.human==='issue');
    $('#opsUnknownTotal').textContent=String(unknown.length);
    $('#opsReplyReviewTotal').textContent=String(replyReview.length);
    $('#opsQaIssueTotal').textContent=String(qaIssues.length);
    $('#navUnknownCount').textContent=String(unknown.length);$('#navUnknownCount').classList.toggle('is-visible',unknown.length>0);
    $('#navIssueCount').textContent=String(qaIssues.length);$('#navIssueCount').classList.toggle('is-visible',qaIssues.length>0);
    const recent=state.questions.toSorted((a,b)=>new Date(b.lastSeen||b.createdAt)-new Date(a.lastSeen||a.createdAt)).slice(0,5);
    $('#opsOverviewQuestions').innerHTML=recent.length?recent.map(item=>`<tr><td><strong>${escapeHtml(item.text)}</strong><small>${escapeHtml(item.channel)}</small></td><td>${escapeHtml(item.brand)}</td><td>${escapeHtml(item.intent)}</td><td>${Number(item.seen)||1}</td><td>${statusBadge(item.status)}</td></tr>`).join(''):emptyRow('No question patterns yet',5);
    const planned=state.contentPlan.toSorted((a,b)=>(a.publishDate||'9999').localeCompare(b.publishDate||'9999')).slice(0,5);
    $('#opsOverviewContent').innerHTML=planned.length?planned.map(item=>`<article class="ops-content-item"><time>${escapeHtml(item.publishDate?formatDate(item.publishDate):'No date')}</time><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.brand)} · ${escapeHtml(item.channel)}</small></div>${statusBadge(item.status)}</article>`).join(''):emptyBlock('No content scheduled','Add only real ideas or commitments. The planner starts clean.');
    const done=state.checklist.filter(item=>item.done).length;
    $('#opsAutomationProgressText').textContent=`${done} of ${state.checklist.length} tasks ready`;
    $('#opsChecklistPreview').innerHTML=state.checklist.slice(0,5).map(item=>`<label><input type="checkbox" data-checklist-id="${escapeHtml(item.id)}"${item.done?' checked':''}><span>${escapeHtml(item.title)}</span></label>`).join('');
    $('#opsRoutePreview').innerHTML=state.qaRoutes.slice(0,6).map(item=>`<div><i class="${escapeHtml(item.automated)}"></i><span>${escapeHtml(item.label)}</span><small>${escapeHtml(statusLabel(item.automated))}</small></div>`).join('');
  }
  function questionFilters(){return {search:normalize($('#questionSearch')?.value),brand:$('#questionBrandFilter')?.value||'',channel:$('#questionChannelFilter')?.value||'',status:$('#questionStatusFilter')?.value||''}}
  function renderQuestions(){
    const filters=questionFilters();
    const items=state.questions.filter(item=>(!filters.search||normalize(`${item.text} ${item.intent} ${item.notes}`).includes(filters.search))&&(!filters.brand||item.brand===filters.brand)&&(!filters.channel||item.channel===filters.channel)&&(!filters.status||item.status===filters.status)).toSorted((a,b)=>new Date(b.lastSeen||b.createdAt)-new Date(a.lastSeen||a.createdAt));
    $('#questionRows').innerHTML=items.length?items.map(item=>`<tr data-question-id="${escapeHtml(item.id)}"><td><strong>${escapeHtml(item.text)}</strong><small>${escapeHtml(item.notes||'No internal note')}</small></td><td><strong>${escapeHtml(item.brand)}</strong><small>${escapeHtml(item.intent)}</small></td><td>${escapeHtml(item.channel)}</td><td>${Number(item.seen)||1}<small>${escapeHtml(formatDate(item.lastSeen||item.createdAt))}</small></td><td>${statusBadge(item.status)}</td><td><div class="ops-row-actions"><button type="button" data-question-action="knowledge">Build answer</button><button type="button" data-question-action="edit">Edit</button></div></td></tr>`).join(''):emptyRow('No questions match these filters',6);
  }
  function knowledgeFilters(){return {search:normalize($('#knowledgeSearch')?.value),brand:$('#knowledgeBrandFilter')?.value||'',status:$('#knowledgeStatusFilter')?.value||''}}
  function renderKnowledge(){
    const filters=knowledgeFilters();
    const items=state.knowledge.filter(item=>(!filters.search||normalize(`${item.question} ${item.answer} ${item.source}`).includes(filters.search))&&(!filters.brand||item.brand===filters.brand)&&(!filters.status||item.status===filters.status)).toSorted((a,b)=>a.brand.localeCompare(b.brand)||a.question.localeCompare(b.question));
    $('#knowledgeList').innerHTML=items.length?items.map(item=>`<article class="ops-knowledge-card" data-knowledge-id="${escapeHtml(item.id)}"><div class="ops-knowledge-meta">${statusBadge(item.status)}<small>${escapeHtml(item.brand)}</small><small>Reviewed ${escapeHtml(formatDate(item.reviewedAt))}</small></div><h3>${escapeHtml(item.question)}</h3><div><p>${escapeHtml(item.answer)}</p><p class="ops-knowledge-source">Source: ${escapeHtml(item.source||'Not recorded')}</p></div><button type="button" data-knowledge-edit>Edit</button></article>`).join(''):emptyBlock('No knowledge matches these filters','Clear the filters or add a verified answer.');
  }
  function renderReplyStudio(){
    if(!state.replySets.some(item=>item.id===selectedReplySetId))selectedReplySetId=state.replySets[0]?.id||'';
    $('#replySetList').innerHTML=state.replySets.length?state.replySets.map(item=>`<button class="ops-reply-set-button${item.id===selectedReplySetId?' active':''}" type="button" data-reply-select="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><span><i>${escapeHtml(item.brand)}</i>${statusBadge(item.status)}</span></button>`).join(''):emptyBlock('No reply sets yet','Create a set with at least two reviewed variants.');
    const item=state.replySets.find(entry=>entry.id===selectedReplySetId);
    if(!item){$('#replyEditor').innerHTML=emptyBlock('Select a reply set','Review its wording, rotate the next version, or create a new set.');return}
    const cursor=Math.min(Math.max(Number(item.cursor)||0,0),Math.max(item.variants.length-1,0));
    $('#replyEditor').innerHTML=`<div class="ops-reply-head"><div><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.brand)} · ${escapeHtml(item.intent)} · ${item.variants.length} rotational versions</p></div><div><button class="ops-button secondary" type="button" data-reply-edit="${escapeHtml(item.id)}">Edit set</button><button class="ops-button" type="button" data-reply-next="${escapeHtml(item.id)}"${item.variants.length?'':' disabled'}>Copy next reply</button></div></div><div class="ops-reply-variants">${item.variants.map((variant,index)=>`<article class="ops-reply-variant${index===cursor?' is-next':''}"><span>${String(index+1).padStart(2,'0')}</span><p>${escapeHtml(variant)}</p><button type="button" data-reply-copy="${escapeHtml(item.id)}" data-variant-index="${index}">Copy</button></article>`).join('')}</div><div class="ops-reply-note">This workspace can select and copy an approved variation. It has no send control and does not connect directly to a public conversation.</div>`;
  }
  function contentFilters(){return {brand:$('#contentBrandFilter')?.value||'',channel:$('#contentChannelFilter')?.value||'',status:$('#contentStatusFilterOps')?.value||''}}
  function renderContentPlan(){
    const filters=contentFilters();
    const items=state.contentPlan.filter(item=>(!filters.brand||item.brand===filters.brand)&&(!filters.channel||item.channel===filters.channel)&&(!filters.status||item.status===filters.status)).toSorted((a,b)=>(a.publishDate||'9999').localeCompare(b.publishDate||'9999'));
    $('#contentPlanRows').innerHTML=items.length?items.map(item=>`<tr data-content-plan-id="${escapeHtml(item.id)}"><td>${escapeHtml(item.publishDate?formatDate(item.publishDate):'Not scheduled')}</td><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.format||'Post')} · ${escapeHtml(item.notes||'No internal note')}</small></td><td>${escapeHtml(item.brand)}</td><td>${escapeHtml(item.channel)}</td><td>${statusBadge(item.status)}</td><td><div class="ops-row-actions"><button type="button" data-content-plan-edit>Edit</button></div></td></tr>`).join(''):emptyRow('No content records match these filters',6);
  }
  function aggregateBy(items,key){
    return items.reduce((map,item)=>{const label=item[key]||'Unclassified';map.set(label,(map.get(label)||0)+(Number(item.seen)||1));return map},new Map());
  }
  function renderBars(elementId,map){
    const element=document.getElementById(elementId);const entries=[...map.entries()].toSorted((a,b)=>b[1]-a[1]);const max=Math.max(...entries.map(([,value])=>value),1);
    element.innerHTML=entries.length?entries.map(([label,value])=>`<div class="ops-bar"><span>${escapeHtml(label)}</span><div class="ops-bar-track"><i style="width:${Math.max(4,Math.round(value/max*100))}%"></i></div><strong>${value}</strong></div>`).join(''):emptyBlock('No evidence yet','Analytics begins when real question patterns are added.');
  }
  function renderAnalytics(){
    const total=state.questions.length;const seen=state.questions.reduce((sum,item)=>sum+(Number(item.seen)||1),0);const covered=state.questions.filter(item=>item.status==='covered').length;const unknown=state.questions.filter(item=>item.status==='uncovered');
    $('#analyticsQuestions').textContent=String(total);$('#analyticsSeen').textContent=String(seen);$('#analyticsCoverage').textContent=`${total?Math.round(covered/total*100):0}%`;$('#analyticsUnknown').textContent=String(unknown.length);
    renderBars('brandAnalytics',aggregateBy(state.questions,'brand'));renderBars('channelAnalytics',aggregateBy(state.questions,'channel'));
    $('#unknownQuestionList').innerHTML=unknown.length?unknown.map(item=>`<article class="ops-unknown-item"><div><strong>${escapeHtml(item.text)}</strong><p>${escapeHtml(item.brand)} · ${escapeHtml(item.intent)} · seen ${Number(item.seen)||1} time${Number(item.seen)===1?'':'s'}</p></div>${statusBadge(item.status)}</article>`).join(''):emptyBlock('No unknown questions','Every saved question pattern currently has approved knowledge coverage.');
  }
  function renderAutomation(){
    const groups=new Map();state.checklist.forEach(item=>{if(!groups.has(item.group))groups.set(item.group,[]);groups.get(item.group).push(item)});
    const done=state.checklist.filter(item=>item.done).length;const percent=state.checklist.length?Math.round(done/state.checklist.length*100):0;
    $('#automationPercent').textContent=`${percent}%`;$('#automationSummaryText').textContent=percent===100?'The checklist is complete. Run a controlled private test before connecting public traffic.':`${state.checklist.length-done} tasks remain. Finish privacy, routing, human review, recovery, and launch checks before activation.`;
    $('#automationChecklist').innerHTML=[...groups.entries()].map(([group,items])=>`<section class="ops-checklist-group"><header><h2>${escapeHtml(group)}</h2><p>${items.filter(item=>item.done).length} of ${items.length} complete</p></header>${items.map(item=>`<label class="ops-check-item${item.done?' is-done':''}"><input type="checkbox" data-checklist-id="${escapeHtml(item.id)}"${item.done?' checked':''}><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></label>`).join('')}</section>`).join('');
  }
  function renderQa(){
    $('#qaLastRun').textContent=state.qaLastRun?`Last run ${formatDate(state.qaLastRun,true)}`:'Not run yet';
    $('#qaRouteRows').innerHTML=state.qaRoutes.map(item=>`<tr data-qa-route-id="${escapeHtml(item.id)}"><td><a class="ops-route-link" href="${escapeHtml(item.path)}" target="_blank" rel="noopener"><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.path)}</small></a></td><td>${escapeHtml(item.purpose)}</td><td>${statusBadge(item.automated)}</td><td><select class="ops-inline-select" data-qa-human><option value="not-run"${item.human==='not-run'?' selected':''}>Not reviewed</option><option value="passed"${item.human==='passed'?' selected':''}>Passed</option><option value="issue"${item.human==='issue'?' selected':''}>Issue</option></select></td><td><input class="ops-inline-select ops-qa-note" data-qa-notes value="${escapeHtml(item.notes||'')}" placeholder="Add note"></td></tr>`).join('');
    $('#manualQaList').innerHTML=state.manualQa.map(item=>`<label class="${item.done?'is-done':''}"><input type="checkbox" data-manual-qa-id="${escapeHtml(item.id)}"${item.done?' checked':''}><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></label>`).join('');
  }
  function renderAll(){renderOverview();renderQuestions();renderKnowledge();renderReplyStudio();renderContentPlan();renderAnalytics();renderAutomation();renderQa()}

  function openPanel(id){
    const button=document.querySelector(`[data-admin-panel="${CSS.escape(id)}"]`);if(button)button.click();
  }
  function openDialog(label,title,body,onSubmit){
    const dialog=$('#opsDialog');$('#opsDialogLabel').textContent=label;$('#opsDialogTitle').textContent=title;$('#opsDialogBody').innerHTML=body;
    const form=$('#opsDialogBody form');
    form?.addEventListener('submit',event=>{event.preventDefault();const result=onSubmit(new FormData(form),form);if(result!==false)dialog.close()},{once:true});
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
    requestAnimationFrame(()=>form?.querySelector('input,textarea,select')?.focus());
  }
  function questionForm(item=null,knowledgeSeed=null){
    const current=item||{text:knowledgeSeed?.question||'',brand:knowledgeSeed?.brand||'',channel:'Manual',seen:1,status:'',notes:'',intent:knowledgeSeed?.intent||''};
    openDialog('Question intelligence',item?'Edit question pattern':'Add question pattern',`<form class="ops-form-grid"><label class="ops-field full"><span>Question pattern</span><textarea name="text" required maxlength="1000" placeholder="Paste the reusable question only. Remove the sender’s identity.">${escapeHtml(current.text||'')}</textarea><small>Email addresses, phone numbers, and social handles are removed before saving. Raw conversations do not belong here.</small></label><label class="ops-field"><span>Channel</span><select name="channel">${makeOptions(CHANNELS,current.channel||'Manual')}</select></label><label class="ops-field"><span>Brand</span><select name="brand">${makeOptions(BRANDS,current.brand||'',true)}</select></label><label class="ops-field"><span>Times seen</span><input name="seen" type="number" min="1" max="99999" value="${Number(current.seen)||1}"></label><label class="ops-field"><span>Coverage state</span><select name="status"><option value="">Decide from knowledge</option><option value="covered"${current.status==='covered'?' selected':''}>Covered</option><option value="uncovered"${current.status==='uncovered'?' selected':''}>Needs coverage</option><option value="review"${current.status==='review'?' selected':''}>Needs review</option></select></label><label class="ops-field full"><span>Internal note</span><textarea name="notes" maxlength="500" placeholder="Context without personal information">${escapeHtml(current.notes||'')}</textarea></label><div class="ops-form-actions">${item?'<button class="ops-danger" type="button" data-dialog-delete>Delete record</button>':'<span></span>'}<div><button class="ops-button secondary" type="button" data-ops-dialog-cancel>Cancel</button><button class="ops-button" type="submit">Save question</button></div></div></form>`,data=>{
      const text=redactQuestion(data.get('text'));if(text.length<4)return false;
      const preferredBrand=cleanText(data.get('brand'),80);const classification=classifyQuestion(text,preferredBrand);const manualStatus=cleanText(data.get('status'),30);
      const payload={text,brand:classification.brand,intent:current.intent||classification.intent,channel:cleanText(data.get('channel'),40)||'Manual',seen:Math.max(1,Number(data.get('seen'))||1),status:manualStatus||classification.status,notes:redactQuestion(data.get('notes')),lastSeen:new Date().toISOString()};
      if(item){Object.assign(item,payload)}
      else{
        const duplicate=state.questions.find(existing=>normalize(existing.text)===normalize(text));
        if(duplicate){duplicate.seen=(Number(duplicate.seen)||1)+payload.seen;duplicate.lastSeen=payload.lastSeen;duplicate.channel=payload.channel;duplicate.brand=payload.brand;duplicate.intent=payload.intent;duplicate.status=payload.status;if(payload.notes)duplicate.notes=payload.notes}
        else state.questions.unshift({id:uid('q'),createdAt:new Date().toISOString(),...payload});
      }
      persist();return true;
    });
    const deleteButton=$('#opsDialogBody [data-dialog-delete]');deleteButton?.addEventListener('click',()=>{if(confirm('Delete this de-identified question record?')){state.questions=state.questions.filter(entry=>entry.id!==item.id);persist();$('#opsDialog').close()}});
    bindDialogCancel();
  }
  function knowledgeForm(item=null,seed=null){
    const current=item||{question:seed?.text||'',answer:'',brand:seed?.brand||'FMB&CO.',intents:[seed?.intent||'General'],status:'draft',source:'',reviewedAt:isoDate(new Date())};
    openDialog('Approved knowledge',item?'Edit knowledge':'Add knowledge',`<form class="ops-form-grid"><label class="ops-field full"><span>Question</span><input name="question" required maxlength="250" value="${escapeHtml(current.question||'')}"></label><label class="ops-field full"><span>Canonical answer</span><textarea name="answer" required maxlength="4000" placeholder="Write one factual answer that every reply variation must preserve.">${escapeHtml(current.answer||'')}</textarea></label><label class="ops-field"><span>Brand</span><select name="brand">${makeOptions(BRANDS,current.brand)}</select></label><label class="ops-field"><span>Primary intent</span><select name="intent">${makeOptions(INTENTS,current.intents?.[0]||'General')}</select></label><label class="ops-field"><span>Approval</span><select name="status"><option value="draft"${current.status==='draft'?' selected':''}>Draft</option><option value="review"${current.status==='review'?' selected':''}>Needs review</option><option value="approved"${current.status==='approved'?' selected':''}>Approved</option></select></label><label class="ops-field"><span>Last reviewed</span><input name="reviewedAt" type="date" value="${escapeHtml(isoDate(current.reviewedAt)||isoDate(new Date()))}"></label><label class="ops-field full"><span>Source or owner</span><input name="source" maxlength="500" value="${escapeHtml(current.source||'')}" placeholder="Official page, document, or approved FMB decision"></label><div class="ops-form-actions">${item?'<button class="ops-danger" type="button" data-dialog-delete>Delete knowledge</button>':'<span></span>'}<div><button class="ops-button secondary" type="button" data-ops-dialog-cancel>Cancel</button><button class="ops-button" type="submit">Save knowledge</button></div></div></form>`,data=>{
      const payload={question:cleanText(data.get('question'),250),answer:cleanText(data.get('answer'),4000),brand:cleanText(data.get('brand'),80),intents:[cleanText(data.get('intent'),80)],status:cleanText(data.get('status'),30),source:cleanText(data.get('source'),500),reviewedAt:data.get('reviewedAt')?new Date(`${data.get('reviewedAt')}T00:00:00`).toISOString():new Date().toISOString()};
      if(payload.question.length<4||payload.answer.length<10)return false;
      if(item)Object.assign(item,payload);else state.knowledge.unshift({id:uid('kb'),...payload});
      recalculateCoverage();persist();return true;
    });
    $('#opsDialogBody [data-dialog-delete]')?.addEventListener('click',()=>{if(confirm('Delete this knowledge entry? Question coverage may change.')){state.knowledge=state.knowledge.filter(entry=>entry.id!==item.id);recalculateCoverage();persist();$('#opsDialog').close()}});
    bindDialogCancel();
  }
  function replySetForm(item=null){
    const current=item||{name:'',brand:'FMB&CO.',intent:'General',status:'draft',variants:[]};
    openDialog('Human-approved replies',item?'Edit reply set':'Create reply set',`<form class="ops-form-grid"><label class="ops-field full"><span>Reply set name</span><input name="name" required maxlength="140" value="${escapeHtml(current.name||'')}"></label><label class="ops-field"><span>Brand</span><select name="brand">${makeOptions(BRANDS,current.brand)}</select></label><label class="ops-field"><span>Intent</span><select name="intent">${makeOptions(INTENTS,current.intent)}</select></label><label class="ops-field"><span>Approval</span><select name="status"><option value="draft"${current.status==='draft'?' selected':''}>Draft</option><option value="review"${current.status==='review'?' selected':''}>Needs review</option><option value="approved"${current.status==='approved'?' selected':''}>Approved</option></select></label><div></div><label class="ops-field full"><span>Rotational variants</span><textarea name="variants" required maxlength="12000" placeholder="Separate each complete reply with a blank line.">${escapeHtml((current.variants||[]).join('\n\n'))}</textarea><small>Every variation must preserve the same facts. Keep at least two versions before approval.</small></label><div class="ops-form-actions">${item?'<button class="ops-danger" type="button" data-dialog-delete>Delete set</button>':'<span></span>'}<div><button class="ops-button secondary" type="button" data-ops-dialog-cancel>Cancel</button><button class="ops-button" type="submit">Save reply set</button></div></div></form>`,data=>{
      const variants=String(data.get('variants')||'').split(/\n\s*\n/).map(value=>cleanText(value,2000)).filter(Boolean).slice(0,12);const status=cleanText(data.get('status'),30);
      if(!cleanText(data.get('name'),140)||!variants.length)return false;
      const payload={name:cleanText(data.get('name'),140),brand:cleanText(data.get('brand'),80),intent:cleanText(data.get('intent'),80),status:status==='approved'&&variants.length<2?'review':status,variants,cursor:Math.min(Number(current.cursor)||0,Math.max(variants.length-1,0)),updatedAt:new Date().toISOString()};
      if(item)Object.assign(item,payload);else{const created={id:uid('reply'),...payload};state.replySets.unshift(created);selectedReplySetId=created.id}
      persist();return true;
    });
    $('#opsDialogBody [data-dialog-delete]')?.addEventListener('click',()=>{if(confirm('Delete this reply set?')){state.replySets=state.replySets.filter(entry=>entry.id!==item.id);selectedReplySetId='';persist();$('#opsDialog').close()}});
    bindDialogCancel();
  }
  function contentPlanForm(item=null){
    const current=item||{title:'',brand:'FMB&CO.',channel:'Facebook',format:'Post',status:'idea',publishDate:'',notes:''};
    openDialog('Content operations',item?'Edit content plan':'Plan content',`<form class="ops-form-grid"><label class="ops-field full"><span>Working title</span><input name="title" required maxlength="220" value="${escapeHtml(current.title||'')}"></label><label class="ops-field"><span>Brand</span><select name="brand">${makeOptions(BRANDS,current.brand)}</select></label><label class="ops-field"><span>Channel</span><select name="channel">${makeOptions(CONTENT_CHANNELS,current.channel)}</select></label><label class="ops-field"><span>Format</span><select name="format">${makeOptions(['Post','Reel','Story','Article','Video','Carousel','Announcement','Campaign'],current.format)}</select></label><label class="ops-field"><span>Status</span><select name="status">${makeOptions(['idea','drafting','review','scheduled','published'],current.status)}</select></label><label class="ops-field"><span>Publish date</span><input name="publishDate" type="date" value="${escapeHtml(current.publishDate||'')}"></label><label class="ops-field full"><span>Internal note</span><textarea name="notes" maxlength="1000">${escapeHtml(current.notes||'')}</textarea></label><div class="ops-form-actions">${item?'<button class="ops-danger" type="button" data-dialog-delete>Delete plan</button>':'<span></span>'}<div><button class="ops-button secondary" type="button" data-ops-dialog-cancel>Cancel</button><button class="ops-button" type="submit">Save plan</button></div></div></form>`,data=>{
      const payload={title:cleanText(data.get('title'),220),brand:cleanText(data.get('brand'),80),channel:cleanText(data.get('channel'),80),format:cleanText(data.get('format'),80),status:cleanText(data.get('status'),30),publishDate:cleanText(data.get('publishDate'),20),notes:redactQuestion(data.get('notes')),updatedAt:new Date().toISOString()};if(!payload.title)return false;
      if(item)Object.assign(item,payload);else state.contentPlan.unshift({id:uid('plan'),createdAt:new Date().toISOString(),...payload});persist();return true;
    });
    $('#opsDialogBody [data-dialog-delete]')?.addEventListener('click',()=>{if(confirm('Delete this planning record?')){state.contentPlan=state.contentPlan.filter(entry=>entry.id!==item.id);persist();$('#opsDialog').close()}});
    bindDialogCancel();
  }
  function bindDialogCancel(){$('#opsDialogBody [data-ops-dialog-cancel]')?.addEventListener('click',()=>$('#opsDialog').close())}

  async function copyText(value){
    try{await navigator.clipboard.writeText(value);return true}catch{
      const area=document.createElement('textarea');area.value=value;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();return ok;
    }
  }
  function notify(message,type='success'){
    if(window.FMB?.showToast)window.FMB.showToast(message,type);
    else{const status=$('#adminStatus');status.textContent=message;status.className=`status show ${type}`;setTimeout(()=>status.className='status',2800)}
  }

  async function runRouteChecks(){
    const button=$('#runRouteChecks');button.disabled=true;button.textContent='Checking routes';
    state.qaRoutes.forEach(route=>route.automated='not-run');renderQa();
    await Promise.all(state.qaRoutes.map(async route=>{
      try{
        const checkPath=route.checkPath||route.path;
        const url=/^https?:\/\//i.test(checkPath)?checkPath:`https://www.francinemariebautista.com${checkPath.startsWith('/')?'':'/'}${checkPath}`;
        const response=await fetch(url,{cache:'no-store',redirect:'follow'});
        const text=await response.text();
        route.automated=response.ok&&text.length>120&&/(<!doctype|<html)/i.test(text)?'passed':'issue';
        if(route.automated==='issue'&&!route.notes)route.notes=`HTTP ${response.status}; content check ${text.length>120?'received':'too short'}`;
      }catch(error){route.automated='issue';if(!route.notes)route.notes=cleanText(error.message||'Request failed',180)}
    }));
    state.qaLastRun=new Date().toISOString();persist();button.disabled=false;button.textContent='Run route checks';notify('Route checks completed. Human visual review is still required.');
  }

  function buildSearchIndex(){
    return [
      ...state.questions.map(item=>({type:'Question',title:item.text,meta:`${item.brand} · ${item.intent}`,panel:'inboxPanel'})),
      ...state.knowledge.map(item=>({type:'Knowledge',title:item.question,meta:item.brand,panel:'knowledgePanel'})),
      ...state.replySets.map(item=>({type:'Reply set',title:item.name,meta:`${item.brand} · ${item.intent}`,panel:'replyPanel',id:item.id})),
      ...state.contentPlan.map(item=>({type:'Content',title:item.title,meta:`${item.brand} · ${item.channel}`,panel:'plannerPanel'}))
    ];
  }
  function renderGlobalSearch(query){
    const value=normalize(query);if(!searchResults){searchResults=document.createElement('div');searchResults.className='ops-search-results';$('.orchestrator-search').appendChild(searchResults)}
    if(value.length<2){searchResults.hidden=true;searchResults.innerHTML='';return}
    const matches=buildSearchIndex().filter(item=>normalize(`${item.title} ${item.meta} ${item.type}`).includes(value)).slice(0,10);
    searchResults.innerHTML=matches.length?matches.map((item,index)=>`<button type="button" data-search-result="${index}"><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.meta)}</small></button>`).join(''):emptyBlock('No workspace result','Try a brand, question, answer, reply set, or content title.');
    searchResults.hidden=false;searchResults._matches=matches;
  }

  function exportJson(){
    const payload={documentType:'fmbco-orchestrator-export',exportedAt:new Date().toISOString(),workspaceKey:WORKSPACE_KEY,state};downloadBlob(`fmbco-orchestrator-${isoDate(new Date())}.json`,JSON.stringify(payload,null,2),'application/json');notify('Workspace export downloaded.');
  }
  function csvCell(value){return `"${String(value??'').replaceAll('"','""')}"`}
  function exportQuestionsCsv(){
    const rows=[['Question pattern','Brand','Intent','Channel','Times seen','Coverage','Last seen','Internal note'],...state.questions.map(item=>[item.text,item.brand,item.intent,item.channel,item.seen,item.status,item.lastSeen||item.createdAt,item.notes||''])];
    downloadBlob(`fmbco-question-insights-${isoDate(new Date())}.csv`,rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');notify('Question insight CSV downloaded.');
  }
  function downloadBlob(name,content,type){
    const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function importJson(file){
    try{
      const parsed=JSON.parse(await file.text());if(parsed.documentType!=='fmbco-orchestrator-export'||!parsed.state)throw new Error('This is not an FMB&CO. Orchestrator export.');
      if(!confirm('Replace the workspace saved in this browser with this import? Export the current workspace first if you need a recovery copy.'))return;
      state=mergeDefaults(parsed.state);persist();notify('Workspace import completed.');
    }catch(error){notify(error.message||'The import could not be read.','error')}
  }

  function scheduleCloudSave(){clearTimeout(cloudTimer);setSync('Saving secure workspace','loading');cloudTimer=setTimeout(saveCloud,900)}
  async function saveCloud(){
    if(!adminClient||!adminUser)return;
    const now=new Date().toISOString();
    const payload={...state,meta:{...state.meta,cloudUpdatedAt:now}};
    const {error}=await adminClient.from('orchestrator_workspaces').upsert({workspace_key:WORKSPACE_KEY,owner_id:adminUser.id,payload,updated_at:now},{onConflict:'workspace_key'});
    if(error){setSync(/does not exist|schema cache|PGRST205|42P01/i.test(`${error.code} ${error.message}`)?'Saved locally; cloud table pending':'Secure sync needs attention','error');return}
    state=payload;writeLocal();setSync('Securely synced','synced');
  }
  async function loadCloud(){
    if(!adminClient||!adminUser){setSync('Saved in this browser','local');return}
    setSync('Checking secure sync','loading');
    const {data,error}=await adminClient.from('orchestrator_workspaces').select('payload,updated_at').eq('workspace_key',WORKSPACE_KEY).maybeSingle();
    if(error){setSync(/does not exist|schema cache|PGRST205|42P01/i.test(`${error.code} ${error.message}`)?'Saved locally; cloud table pending':'Secure sync unavailable','error');return}
    if(!data){await saveCloud();return}
    const server=mergeDefaults(data.payload);const serverTime=new Date(server.meta?.modifiedAt||data.updated_at||0).getTime();const localTime=new Date(state.meta?.modifiedAt||0).getTime();
    if(serverTime>localTime){state=server;state.meta.cloudUpdatedAt=data.updated_at||server.meta.cloudUpdatedAt;writeLocal();renderAll()}
    else if(localTime>serverTime){await saveCloud();return}
    setSync('Securely synced','synced');
  }

  function bindEvents(){
    ['questionSearch','questionBrandFilter','questionChannelFilter','questionStatusFilter'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderQuestions));
    ['knowledgeSearch','knowledgeBrandFilter','knowledgeStatusFilter'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderKnowledge));
    ['contentBrandFilter','contentChannelFilter','contentStatusFilterOps'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderContentPlan));
    $$('[data-ops-action="add-question"]').forEach(button=>button.addEventListener('click',()=>questionForm()));
    $('[data-ops-action="add-knowledge"]')?.addEventListener('click',()=>knowledgeForm());
    $('[data-ops-action="add-reply-set"]')?.addEventListener('click',()=>replySetForm());
    $('[data-ops-action="add-content"]')?.addEventListener('click',()=>contentPlanForm());
    $('#questionRows')?.addEventListener('click',event=>{const button=event.target.closest('[data-question-action]');if(!button)return;const item=state.questions.find(entry=>entry.id===button.closest('[data-question-id]').dataset.questionId);if(!item)return;if(button.dataset.questionAction==='edit')questionForm(item);else knowledgeForm(null,item)});
    $('#knowledgeList')?.addEventListener('click',event=>{const button=event.target.closest('[data-knowledge-edit]');if(!button)return;const item=state.knowledge.find(entry=>entry.id===button.closest('[data-knowledge-id]').dataset.knowledgeId);if(item)knowledgeForm(item)});
    $('#replySetList')?.addEventListener('click',event=>{const button=event.target.closest('[data-reply-select]');if(!button)return;selectedReplySetId=button.dataset.replySelect;renderReplyStudio()});
    $('#replyEditor')?.addEventListener('click',async event=>{
      const edit=event.target.closest('[data-reply-edit]');if(edit){const item=state.replySets.find(entry=>entry.id===edit.dataset.replyEdit);if(item)replySetForm(item);return}
      const next=event.target.closest('[data-reply-next]');const copy=event.target.closest('[data-reply-copy]');const target=next||copy;if(!target)return;const id=next?.dataset.replyNext||copy.dataset.replyCopy;const item=state.replySets.find(entry=>entry.id===id);if(!item?.variants.length)return;const index=next?Math.min(Number(item.cursor)||0,item.variants.length-1):Number(copy.dataset.variantIndex);const ok=await copyText(item.variants[index]);if(ok){item.cursor=(index+1)%item.variants.length;persist();notify('Reply copied. Review it in the conversation before sending.')}else notify('The reply could not be copied.','error');
    });
    $('#contentPlanRows')?.addEventListener('click',event=>{const button=event.target.closest('[data-content-plan-edit]');if(!button)return;const item=state.contentPlan.find(entry=>entry.id===button.closest('[data-content-plan-id]').dataset.contentPlanId);if(item)contentPlanForm(item)});
    document.addEventListener('change',event=>{
      const checklist=event.target.closest('[data-checklist-id]');if(checklist){const item=state.checklist.find(entry=>entry.id===checklist.dataset.checklistId);if(item){item.done=checklist.checked;persist()}return}
      const manual=event.target.closest('[data-manual-qa-id]');if(manual){const item=state.manualQa.find(entry=>entry.id===manual.dataset.manualQaId);if(item){item.done=manual.checked;persist()}return}
      const human=event.target.closest('[data-qa-human]');if(human){const item=state.qaRoutes.find(entry=>entry.id===human.closest('[data-qa-route-id]').dataset.qaRouteId);if(item){item.human=human.value;persist()}return}
    });
    document.addEventListener('input',event=>{const note=event.target.closest('[data-qa-notes]');if(!note)return;const item=state.qaRoutes.find(entry=>entry.id===note.closest('[data-qa-route-id]').dataset.qaRouteId);if(item){item.notes=cleanText(note.value,400);clearTimeout(note._saveTimer);note._saveTimer=setTimeout(()=>persist(),500)}});
    $('#runRouteChecks')?.addEventListener('click',runRouteChecks);
    $('#resetQa')?.addEventListener('click',()=>{if(!confirm('Reset automated and human website QA states? Notes will be kept.'))return;state.qaRoutes.forEach(item=>{item.automated='not-run';item.human='not-run'});state.manualQa.forEach(item=>item.done=false);state.qaLastRun='';persist()});
    $('#resetAutomationChecklist')?.addEventListener('click',()=>{if(!confirm('Reset every automation checklist item?'))return;state.checklist.forEach(item=>item.done=false);persist()});
    $('#analyticsExportCsv')?.addEventListener('click',exportQuestionsCsv);$('#opsExport')?.addEventListener('click',exportJson);
    $('#opsImport')?.addEventListener('click',()=>$('#opsImportFile').click());$('#opsImportFile')?.addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importJson(file);event.target.value=''});
    $('[data-ops-dialog-close]')?.addEventListener('click',()=>$('#opsDialog').close());
    const menu=$('#orchestratorMenu'),sidebar=$('#orchestratorSidebar');const closeSidebar=()=>{sidebar.classList.remove('is-open');document.body.classList.remove('orchestrator-sidebar-open');menu?.setAttribute('aria-expanded','false')};
    menu?.addEventListener('click',()=>{const open=!sidebar.classList.contains('is-open');sidebar.classList.toggle('is-open',open);document.body.classList.toggle('orchestrator-sidebar-open',open);menu.setAttribute('aria-expanded',String(open))});
    $('#orchestratorMobileMore')?.addEventListener('click',()=>menu?.click());
    document.addEventListener('click',event=>{if(event.target.closest('[data-admin-open],[data-admin-panel]')&&innerWidth<=1020)closeSidebar();if(document.body.classList.contains('orchestrator-sidebar-open')&&!event.target.closest('#orchestratorSidebar,#orchestratorMenu,#orchestratorMobileMore'))closeSidebar()});
    const search=$('#opsGlobalSearch');search?.addEventListener('input',()=>renderGlobalSearch(search.value));search?.addEventListener('keydown',event=>{if(event.key==='Enter'&&searchResults?._matches?.[0]){event.preventDefault();const item=searchResults._matches[0];if(item.id)selectedReplySetId=item.id;openPanel(item.panel);searchResults.hidden=true}});
    $('.orchestrator-search')?.addEventListener('click',event=>{const button=event.target.closest('[data-search-result]');if(!button)return;const item=searchResults?._matches?.[Number(button.dataset.searchResult)];if(!item)return;if(item.id)selectedReplySetId=item.id;openPanel(item.panel);renderReplyStudio();searchResults.hidden=true});
    document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!/input|textarea|select/i.test(document.activeElement?.tagName)){event.preventDefault();search?.focus()}if(event.key==='Escape'&&searchResults)searchResults.hidden=true});
  }

  async function start(detail={}){
    if(initialized)return;initialized=true;
    adminClient=detail.client||null;adminUser=detail.user||null;state=loadLocal();renderIcons();prepareFilters();bindEvents();renderAll();
    if(detail.preview)setSync('Local preview; secure sync paused','local');else await loadCloud();
  }

  window.addEventListener('fmb:admin-ready',event=>start(event.detail||{}),{once:true});
  renderIcons();
})();
