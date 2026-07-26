(function(){
  'use strict';

  const $=selector=>document.querySelector(selector);
  const $$=selector=>Array.from(document.querySelectorAll(selector));
  const BRANDS=['FMB&CO.','SENZ','With Love, FMB','Yoni','Cognita','Mabayani'];
  const ACTIVE_STATUSES=new Set(['draft','assigned','acknowledged','in_progress','blocked','submitted','changes_requested']);
  const CONNECTION_CATALOG=[
    {key:'main_website',name:'Official FMB website',group:'Owned platforms',type:'native',capabilities:['Public route checks','Website task targets','Publication evidence']},
    {key:'supabase_workspace',name:'Supabase operations database',group:'Owned platforms',type:'native',capabilities:['Authentication','Instructions','Assignments','Evidence','Approvals','Realtime']},
    {key:'facebook_page',name:'Facebook Page',group:'Meta',type:'oauth',capabilities:['Posts','Comments','Page insights']},
    {key:'instagram_business',name:'Instagram Business',group:'Meta',type:'oauth',capabilities:['Posts','Reels','Comments','Insights']},
    {key:'messenger',name:'Messenger',group:'Meta',type:'webhook',capabilities:['Message intake','Question routing','Human handoff']},
    {key:'linkedin_page',name:'LinkedIn Page',group:'Social publishing',type:'oauth',capabilities:['Company posts','Performance evidence']},
    {key:'youtube_channel',name:'YouTube Channel',group:'Social publishing',type:'oauth',capabilities:['Videos','Comments','Analytics']},
    {key:'canva',name:'Canva',group:'Creative production',type:'oauth',capabilities:['Design handoff','Creative links','Approval evidence']},
    {key:'google_drive',name:'Google Drive',group:'Creative production',type:'oauth',capabilities:['Source files','Deliverables','Evidence files']},
    {key:'gmail',name:'Gmail',group:'Communications',type:'oauth',capabilities:['Approved email handoff','Inquiry routing']},
    {key:'github',name:'GitHub',group:'Technology',type:'oauth',capabilities:['Repository work','Issue handoff','Release evidence']},
    {key:'chatgpt_handoff',name:'ChatGPT and Codex handoff',group:'Technology',type:'webhook',capabilities:['Instruction intake','Research handoff','Human approval queue']}
  ];
  const STATUS_LABELS={
    draft:'Draft',
    assigned:'Assigned',
    acknowledged:'Acknowledged',
    in_progress:'In progress',
    blocked:'Blocked',
    submitted:'For approval',
    changes_requested:'Changes requested',
    approved:'Approved',
    cancelled:'Cancelled',
    pending:'Pending review',
    accepted:'Accepted',
    rejected:'Rejected',
    setup_required:'Setup required',
    authorizing:'Authorizing',
    verified_manual:'Verified manually',
    connected_api:'API connected',
    paused:'Paused',
    error:'Connection error'
  };

  let client=null;
  let user=null;
  let profile=null;
  let preview=false;
  let isAdmin=false;
  let initialized=false;
  let workOrders=[];
  let evidence=[];
  let connections=[];
  let staff=[];
  let signedEvidenceUrls=new Map();
  let realtimeChannel=null;
  let refreshTimer=null;
  let nextPreviewTicket=1;

  function escapeHtml(value){
    if(window.FMB?.escapeHtml)return window.FMB.escapeHtml(value);
    const node=document.createElement('div');node.textContent=value==null?'':String(value);return node.innerHTML;
  }
  function cleanText(value,max=5000){
    if(window.FMB?.cleanText)return window.FMB.cleanText(value,max);
    return String(value||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max);
  }
  function safeUrl(value){
    const raw=cleanText(value,1000);
    if(!raw)return '';
    try{const url=new URL(raw);return /^https?:$/.test(url.protocol)?url.href:''}catch{return ''}
  }
  function statusLabel(value){return STATUS_LABELS[value]||String(value||'').replaceAll('_',' ')}
  function statusBadge(value){return `<span class="ops-status ${escapeHtml(value)}">${escapeHtml(statusLabel(value))}</span>`}
  function formatDate(value,withTime=false){
    if(!value)return 'Not set';
    const date=new Date(value);if(Number.isNaN(date.getTime()))return 'Not set';
    return new Intl.DateTimeFormat('en-PH',withTime?{dateStyle:'medium',timeStyle:'short'}:{dateStyle:'medium'}).format(date);
  }
  function datetimeLocal(value){
    if(!value)return '';
    const date=new Date(value);if(Number.isNaN(date.getTime()))return '';
    const offset=date.getTimezoneOffset()*60000;
    return new Date(date.getTime()-offset).toISOString().slice(0,16);
  }
  function taskCode(item){return `FMB-${String(item.ticket_number||'NEW').padStart(4,'0')}`}
  function assignee(item){
    const match=staff.find(entry=>entry.id===item.assigned_to);
    if(match)return match.full_name||match.username||'Assigned staff';
    if(item.assigned_to===user?.id)return profile?.full_name||'Assigned to you';
    return item.assigned_to?'Assigned staff':'Unassigned';
  }
  function isMine(item){return Boolean(user?.id&&item.assigned_to===user.id)}
  function workEvidence(id){return evidence.filter(item=>item.work_order_id===id)}
  function emptyState(title,message){return `<div class="ops-empty"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div></div>`}
  function metric(label,value,detail,tone=''){
    return `<article class="${escapeHtml(tone)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(detail)}</small></article>`;
  }
  function notify(message,type='success'){
    if(window.FMB?.showToast){window.FMB.showToast(message,type);return}
    const element=$('#adminStatus');if(!element)return;
    element.textContent=message;element.className=`status show ${type}`;
    clearTimeout(notify.timer);notify.timer=setTimeout(()=>{element.textContent='';element.className='status'},3600);
  }
  function setBusy(button,busy,label='Working'){
    if(!button)return;
    button.disabled=busy;
    if(busy){button.dataset.originalLabel=button.textContent;button.textContent=label}
    else if(button.dataset.originalLabel){button.textContent=button.dataset.originalLabel;delete button.dataset.originalLabel}
  }
  function openPanel(id){
    const button=document.querySelector(`[data-admin-panel="${CSS.escape(id)}"]`);
    if(button){button.click();scrollTo({top:0,behavior:'smooth'})}
  }

  function renderMetrics(){
    const active=workOrders.filter(item=>ACTIVE_STATUSES.has(item.status));
    const mine=active.filter(isMine);
    const awaiting=workOrders.filter(item=>item.status==='submitted');
    const overdue=active.filter(item=>item.due_at&&new Date(item.due_at)<new Date()&&!['submitted','approved'].includes(item.status));
    const approved=workOrders.filter(item=>item.status==='approved');
    const accepted=evidence.filter(item=>item.review_status==='accepted');
    const pending=evidence.filter(item=>item.review_status==='pending');
    const rejected=evidence.filter(item=>item.review_status==='rejected');
    const api=connections.filter(item=>item.status==='connected_api').length;
    const manual=connections.filter(item=>item.status==='verified_manual').length;
    const catalogKeys=new Set(connections.map(item=>item.provider_key));
    const setup=CONNECTION_CATALOG.filter(item=>!catalogKeys.has(item.key)).length+connections.filter(item=>['setup_required','authorizing','error'].includes(item.status)).length;

    const commandMetrics=[
      metric(isAdmin?'Active team work':'Assigned to me',isAdmin?active.length:mine.length,'Not yet approved'),
      metric('For approval',awaiting.length,'Submitted with evidence','warning'),
      metric('Overdue',overdue.length,'Past the agreed deadline',overdue.length?'danger':''),
      metric('Approved',approved.length,'Completed after review','success')
    ].join('');
    if($('#opsCommandMetrics'))$('#opsCommandMetrics').innerHTML=commandMetrics;
    if($('#workOrderMetrics'))$('#workOrderMetrics').innerHTML=commandMetrics;
    if($('#evidenceMetrics'))$('#evidenceMetrics').innerHTML=[
      metric('Pending review',pending.length,'Requires an administrator decision','warning'),
      metric('Accepted',accepted.length,'Approved proof','success'),
      metric('Rejected',rejected.length,'Needs correction',rejected.length?'danger':''),
      metric('Submitted work',awaiting.length,'Waiting for final approval')
    ].join('');
    if($('#connectionMetrics'))$('#connectionMetrics').innerHTML=[
      metric('API connected',api,'System-verified connections','success'),
      metric('Manual verification',manual,'Human-verified account access'),
      metric('Needs setup',setup,'Not yet connected',setup?'warning':''),
      metric('Registered services',CONNECTION_CATALOG.length,'Visible connection targets')
    ].join('');

    const workBadge=$('#navWorkCount');if(workBadge){const count=isAdmin?active.length:mine.length;workBadge.textContent=String(count);workBadge.classList.toggle('is-visible',count>0)}
    const evidenceBadge=$('#navEvidenceCount');if(evidenceBadge){evidenceBadge.textContent=String(pending.length);evidenceBadge.classList.toggle('is-visible',pending.length>0)}
  }

  function sortedWork(items){
    const priority={urgent:0,high:1,normal:2,low:3};
    return items.toSorted((a,b)=>{
      const statusWeight=value=>value==='submitted'?0:value==='changes_requested'?1:value==='blocked'?2:3;
      return statusWeight(a.status)-statusWeight(b.status)
        ||(priority[a.priority]??9)-(priority[b.priority]??9)
        ||(a.due_at||'9999').localeCompare(b.due_at||'9999')
        ||new Date(b.created_at)-new Date(a.created_at);
    });
  }
  function overviewWorkCard(item){
    const proofs=workEvidence(item.id);
    return `<button class="ops-overview-work-item" type="button" data-work-open="${escapeHtml(item.id)}"><span>${escapeHtml(taskCode(item))} · ${escapeHtml(item.brand)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(assignee(item))} · due ${escapeHtml(formatDate(item.due_at))} · ${proofs.length} evidence item${proofs.length===1?'':'s'}</small>${statusBadge(item.status)}</button>`;
  }
  function renderOverviewWork(){
    const visible=sortedWork(workOrders.filter(item=>ACTIVE_STATUSES.has(item.status))).slice(0,6);
    const element=$('#opsOverviewWork');if(!element)return;
    element.innerHTML=visible.length?visible.map(overviewWorkCard).join(''):emptyState('No active instructions','Create the first real instruction when there is work to assign. This queue never invents activity.');
  }

  function availableActions(item){
    const actions=[];
    if(isAdmin)actions.push(`<button type="button" data-work-edit="${escapeHtml(item.id)}">Edit instruction</button>`);
    if(isMine(item)||isAdmin){
      if(item.status==='assigned')actions.push(`<button class="primary" type="button" data-work-transition="acknowledged" data-work-id="${escapeHtml(item.id)}">Acknowledge</button>`);
      if(['acknowledged','changes_requested','blocked'].includes(item.status))actions.push(`<button class="primary" type="button" data-work-transition="in_progress" data-work-id="${escapeHtml(item.id)}">${item.status==='blocked'?'Resume work':'Start work'}</button>`);
      if(item.status==='in_progress')actions.push(`<button class="primary" type="button" data-work-transition="submitted" data-work-id="${escapeHtml(item.id)}">Submit for approval</button>`);
      if(['assigned','acknowledged','in_progress','changes_requested'].includes(item.status))actions.push(`<button type="button" data-work-transition="blocked" data-work-id="${escapeHtml(item.id)}">Report blocker</button>`);
      if(['assigned','acknowledged','in_progress','blocked','changes_requested'].includes(item.status))actions.push(`<button type="button" data-evidence-add="${escapeHtml(item.id)}">Add evidence</button>`);
    }
    if(isAdmin&&item.status==='submitted')actions.push(`<button class="primary" type="button" data-work-review="${escapeHtml(item.id)}">Review work</button>`);
    actions.push(`<button type="button" data-evidence-view="${escapeHtml(item.id)}">View evidence</button>`);
    return actions.join('');
  }
  function workCard(item){
    const proofs=workEvidence(item.id);
    const accepted=proofs.filter(entry=>entry.review_status==='accepted').length;
    const dueClass=item.due_at&&new Date(item.due_at)<new Date()&&ACTIVE_STATUSES.has(item.status)?' overdue':'';
    return `<article class="ops-work-card${dueClass}" data-work-order-id="${escapeHtml(item.id)}">
      <header><div><span>${escapeHtml(taskCode(item))} · ${escapeHtml(item.task_type)} · ${escapeHtml(item.priority)} priority</span><h2>${escapeHtml(item.title)}</h2></div>${statusBadge(item.status)}</header>
      <div class="ops-work-brief"><div><strong>Instruction</strong><p>${escapeHtml(item.instruction)}</p></div><div><strong>Definition of done</strong><p>${escapeHtml(item.success_definition)}</p></div></div>
      <dl><div><dt>Brand</dt><dd>${escapeHtml(item.brand)}</dd></div><div><dt>Channels</dt><dd>${escapeHtml((item.channels||[]).join(', ')||'Not specified')}</dd></div><div><dt>Assigned to</dt><dd>${escapeHtml(assignee(item))}</dd></div><div><dt>Due</dt><dd>${escapeHtml(formatDate(item.due_at,true))}</dd></div><div><dt>Evidence</dt><dd>${proofs.length} submitted · ${accepted} accepted</dd></div><div><dt>Approval</dt><dd>FMB approval required</dd></div></dl>
      ${item.block_reason?`<div class="ops-work-alert"><strong>Blocker</strong><p>${escapeHtml(item.block_reason)}</p></div>`:''}
      ${item.review_note?`<div class="ops-work-alert review"><strong>Review direction</strong><p>${escapeHtml(item.review_note)}</p></div>`:''}
      ${item.completion_notes?`<div class="ops-work-note"><strong>Completion note</strong><p>${escapeHtml(item.completion_notes)}</p></div>`:''}
      <footer>${availableActions(item)}</footer>
    </article>`;
  }
  function renderWorkOrders(){
    const assigneeFilter=$('#workAssigneeFilter')?.value||'mine';
    const statusFilter=$('#workStatusFilter')?.value||'';
    const brandFilter=$('#workBrandFilter')?.value||'';
    const search=cleanText($('#workSearch')?.value,500).toLowerCase();
    let items=workOrders.filter(item=>{
      const assigneeMatch=assigneeFilter==='all'||(assigneeFilter==='mine'&&isMine(item))||(assigneeFilter==='unassigned'&&!item.assigned_to);
      const statusMatch=statusFilter?item.status===statusFilter:ACTIVE_STATUSES.has(item.status);
      const brandMatch=!brandFilter||item.brand===brandFilter;
      const haystack=`${item.title} ${item.instruction} ${item.success_definition} ${item.brand} ${(item.channels||[]).join(' ')}`.toLowerCase();
      return assigneeMatch&&statusMatch&&brandMatch&&(!search||haystack.includes(search));
    });
    items=sortedWork(items);
    const element=$('#workOrderList');if(!element)return;
    element.innerHTML=items.length?items.map(workCard).join(''):emptyState('No work matches this view',isAdmin?'Create a real instruction or change the filters.':'No instruction is assigned to this account in the selected state.');
  }

  function evidenceLink(item){
    const url=signedEvidenceUrls.get(item.id)||safeUrl(item.evidence_url);
    return url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open evidence</a>`:'';
  }
  function evidenceCard(item){
    const task=workOrders.find(entry=>entry.id===item.work_order_id);
    return `<article class="ops-evidence-card" data-evidence-id="${escapeHtml(item.id)}">
      <header><div><span>${escapeHtml(item.evidence_type.replaceAll('_',' '))} · ${escapeHtml(task?taskCode(task):'Work order')}</span><h2>${escapeHtml(item.title)}</h2></div>${statusBadge(item.review_status)}</header>
      <p>${escapeHtml(item.description||'No additional description.')}</p>
      <dl><div><dt>Instruction</dt><dd>${escapeHtml(task?.title||'Unavailable')}</dd></div><div><dt>Submitted</dt><dd>${escapeHtml(formatDate(item.created_at,true))}</dd></div><div><dt>Review note</dt><dd>${escapeHtml(item.review_note||'Not reviewed yet')}</dd></div></dl>
      <footer>${evidenceLink(item)}${isAdmin&&item.review_status==='pending'?`<button type="button" data-evidence-review="accepted" data-evidence-id="${escapeHtml(item.id)}">Accept evidence</button><button type="button" data-evidence-review="rejected" data-evidence-id="${escapeHtml(item.id)}">Reject</button>`:''}</footer>
    </article>`;
  }
  function renderEvidence(){
    const status=$('#evidenceStatusFilter')?.value||'';
    const type=$('#evidenceTypeFilter')?.value||'';
    const search=cleanText($('#evidenceSearch')?.value,500).toLowerCase();
    const items=evidence.filter(item=>{
      const task=workOrders.find(entry=>entry.id===item.work_order_id);
      const haystack=`${item.title} ${item.description||''} ${task?.title||''} ${task?.instruction||''}`.toLowerCase();
      return (!status||item.review_status===status)&&(!type||item.evidence_type===type)&&(!search||haystack.includes(search));
    }).toSorted((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    const element=$('#evidenceList');if(!element)return;
    element.innerHTML=items.length?items.map(evidenceCard).join(''):emptyState('No evidence matches this view','Evidence appears only after an assigned person submits a real link, note, analytics record, screenshot, or file.');
  }

  function connectionStatus(record){
    return record?.status||'setup_required';
  }
  function connectionCard(catalog){
    const record=connections.find(item=>item.provider_key===catalog.key);
    const status=connectionStatus(record);
    const capabilities=record?.capabilities?.length?record.capabilities:catalog.capabilities;
    const systemVerified=status==='connected_api';
    const detail=status==='connected_api'
      ?`Verified ${formatDate(record?.last_checked_at||record?.verified_at,true)}`
      :status==='verified_manual'
        ?`Human verification recorded ${formatDate(record?.verified_at,true)}`
        :status==='error'
          ?(record?.last_error||'Connection needs attention')
          :'No verified connection has been recorded.';
    return `<article class="ops-connection-card ${escapeHtml(status)}" data-provider-key="${escapeHtml(catalog.key)}">
      <header><div><span>${escapeHtml(catalog.group)}</span><h3>${escapeHtml(record?.display_name||catalog.name)}</h3></div><i aria-hidden="true"></i></header>
      <div class="ops-connection-state">${statusBadge(status)}<small>${escapeHtml(record?.account_label||'No account selected')}</small></div>
      <p>${escapeHtml(detail)}</p>
      <ul>${capabilities.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>
      <footer>${isAdmin&&!systemVerified?`<button type="button" data-connection-manage="${escapeHtml(catalog.key)}">${record?'Manage connection':'Configure connection'}</button>`:`<span>${systemVerified?'System verified':'Visible to staff'}</span>`}</footer>
    </article>`;
  }
  function renderConnections(){
    const element=$('#connectionGrid');if(!element)return;
    element.innerHTML=CONNECTION_CATALOG.map(connectionCard).join('');
  }
  function publishSearchIndex(){
    const items=[
      ...workOrders.map(item=>({
        type:'Instruction',
        title:item.title,
        meta:`${taskCode(item)} · ${item.brand} · ${statusLabel(item.status)} · ${assignee(item)}`,
        panel:'workQueuePanel',
        filterId:'workSearch',
        statusFilterId:'workStatusFilter',
        status:item.status,
        query:item.title
      })),
      ...evidence.map(item=>{
        const task=workOrders.find(entry=>entry.id===item.work_order_id);
        return {
          type:'Evidence',
          title:item.title,
          meta:`${task?.title||'Work order'} · ${statusLabel(item.review_status)}`,
          panel:'evidencePanel',
          filterId:'evidenceSearch',
          statusFilterId:'evidenceStatusFilter',
          status:item.review_status,
          query:item.title
        };
      }),
      ...CONNECTION_CATALOG.map(catalog=>{
        const record=connections.find(item=>item.provider_key===catalog.key);
        return {
          type:'Connection',
          title:record?.display_name||catalog.name,
          meta:`${record?.account_label||catalog.group} · ${statusLabel(connectionStatus(record))}`,
          panel:'automationPanel'
        };
      })
    ];
    window.dispatchEvent(new CustomEvent('fmb:ops-search-index',{detail:{items}}));
  }
  function renderAll(){
    renderMetrics();
    renderOverviewWork();
    renderWorkOrders();
    renderEvidence();
    renderConnections();
    publishSearchIndex();
  }

  async function createSignedEvidenceUrls(){
    signedEvidenceUrls=new Map();
    if(!client||preview)return;
    const files=evidence.filter(item=>item.storage_path).slice(0,100);
    await Promise.all(files.map(async item=>{
      const {data,error}=await client.storage.from('work-evidence').createSignedUrl(item.storage_path,3600);
      if(!error&&data?.signedUrl)signedEvidenceUrls.set(item.id,data.signedUrl);
    }));
  }
  async function loadOperations(){
    if(preview){renderAll();return}
    if(!client)return;
    const [workResult,evidenceResult,connectionResult,staffResult]=await Promise.all([
      client.from('work_orders').select('*').order('created_at',{ascending:false}).limit(500),
      client.from('work_evidence').select('*').order('created_at',{ascending:false}).limit(500),
      client.from('automation_connections').select('*').order('display_name').limit(100),
      isAdmin
        ?client.from('profiles').select('id,full_name,username,role,status').in('role',['admin','moderator']).eq('status','active').order('full_name')
        :Promise.resolve({data:[{id:user.id,full_name:profile.full_name,username:profile.username,role:profile.role,status:profile.status}],error:null})
    ]);
    const error=workResult.error||evidenceResult.error||connectionResult.error||staffResult.error;
    if(error){notify(error.message||'The operations workspace could not be loaded.','error');return}
    workOrders=workResult.data||[];
    evidence=evidenceResult.data||[];
    connections=connectionResult.data||[];
    staff=staffResult.data||[];
    await createSignedEvidenceUrls();
    renderAll();
  }
  function scheduleRefresh(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(loadOperations,300);
  }
  function subscribeRealtime(){
    if(!client||preview||realtimeChannel)return;
    realtimeChannel=client.channel('fmb-operations-command-center')
      .on('postgres_changes',{event:'*',schema:'public',table:'work_orders'},scheduleRefresh)
      .on('postgres_changes',{event:'*',schema:'public',table:'work_evidence'},scheduleRefresh)
      .on('postgres_changes',{event:'*',schema:'public',table:'automation_connections'},scheduleRefresh)
      .subscribe();
  }

  function dialog(){
    return $('#opsWorkflowDialog');
  }
  function closeDialog(){const element=dialog();if(element?.open)element.close()}
  function openDialog(label,title,body,onSubmit){
    const element=dialog();if(!element)return;
    $('#opsWorkflowDialogLabel').textContent=label;
    $('#opsWorkflowDialogTitle').textContent=title;
    $('#opsWorkflowDialogBody').innerHTML=body;
    const form=$('#opsWorkflowDialogBody form');
    form?.addEventListener('submit',async event=>{
      event.preventDefault();
      const submitter=event.submitter;
      setBusy(submitter,true,'Saving');
      try{
        const close=await onSubmit(new FormData(form),event,form);
        if(close!==false)closeDialog();
      }catch(error){notify(error.message||'The operation could not be completed.','error')}
      finally{setBusy(submitter,false)}
    });
    if(typeof element.showModal==='function')element.showModal();else element.setAttribute('open','');
    requestAnimationFrame(()=>form?.querySelector('input,textarea,select')?.focus());
  }
  function staffOptions(selected=''){
    return `<option value="">Leave as draft</option>`+staff.map(item=>`<option value="${escapeHtml(item.id)}"${item.id===selected?' selected':''}>${escapeHtml(item.full_name||item.username)} · ${escapeHtml(item.role)}</option>`).join('');
  }
  function workOrderForm(item=null,seed=null){
    if(!isAdmin){notify('Only an administrator can create or change FMB instructions.','error');return}
    const current=item||{
      title:seed?.title||'',
      instruction:seed?.notes||'',
      success_definition:'',
      brand:seed?.brand||'FMB&CO.',
      channels:seed?.channel?[seed.channel]:[],
      task_type:'content',
      priority:'normal',
      assigned_to:'',
      due_at:seed?.publishDate?`${seed.publishDate}T09:00:00`:'',
      evidence_required:true,
      target_url:'',
      source_plan_ref:seed?.id||''
    };
    openDialog('Founder instruction',item?'Edit instruction':'Give an instruction',`<form class="ops-form-grid">
      <label class="ops-field full"><span>Instruction title</span><input name="title" required maxlength="220" value="${escapeHtml(current.title||'')}" placeholder="A clear action, not a vague topic"></label>
      <label class="ops-field full"><span>Exact instruction</span><textarea name="instruction" required maxlength="8000" placeholder="State what needs to be done, the context, non-negotiables, and what must not happen.">${escapeHtml(current.instruction||'')}</textarea></label>
      <label class="ops-field full"><span>Definition of done</span><textarea name="success_definition" required maxlength="4000" placeholder="Describe the result that FMB will review.">${escapeHtml(current.success_definition||'')}</textarea></label>
      <label class="ops-field"><span>Brand</span><select name="brand">${BRANDS.map(value=>`<option${value===current.brand?' selected':''}>${escapeHtml(value)}</option>`).join('')}</select></label>
      <label class="ops-field"><span>Task type</span><select name="task_type">${['content','community','campaign','website','research','reply','analytics','administration','other'].map(value=>`<option value="${value}"${value===current.task_type?' selected':''}>${escapeHtml(value.replaceAll('_',' '))}</option>`).join('')}</select></label>
      <label class="ops-field"><span>Priority</span><select name="priority">${['low','normal','high','urgent'].map(value=>`<option value="${value}"${value===current.priority?' selected':''}>${escapeHtml(value)}</option>`).join('')}</select></label>
      <label class="ops-field"><span>Assign to</span><select name="assigned_to">${staffOptions(current.assigned_to||'')}</select></label>
      <label class="ops-field"><span>Due date and time</span><input name="due_at" type="datetime-local" value="${escapeHtml(datetimeLocal(current.due_at))}"></label>
      <label class="ops-field"><span>Channels, comma separated</span><input name="channels" maxlength="500" value="${escapeHtml((current.channels||[]).join(', '))}" placeholder="Facebook, Instagram, Website"></label>
      <label class="ops-field full"><span>Target or reference URL</span><input name="target_url" type="url" maxlength="1000" value="${escapeHtml(current.target_url||'')}" placeholder="https://"></label>
      <label class="ops-check-field"><input name="evidence_required" type="checkbox"${current.evidence_required!==false?' checked':''}><span>Evidence is required before submission</span></label>
      <div class="ops-form-context"><strong>Founder approval</strong><p>Every completed instruction must pass evidence review and final FMB approval.</p></div>
      <div class="ops-form-warning full"><strong>This sends a real assignment.</strong><p>The assignee will see this wording exactly. Edit the instruction before they begin if the direction changes.</p></div>
      <div class="ops-form-actions"><span></span><div><button class="ops-button secondary" type="button" data-workflow-cancel>Cancel</button><button class="ops-button" type="submit">${item?'Save changes':'Assign instruction'}</button></div></div>
    </form>`,async data=>{
      const assignedTo=cleanText(data.get('assigned_to'),80)||null;
      const targetRaw=cleanText(data.get('target_url'),1000);
      const targetUrl=targetRaw?safeUrl(targetRaw):null;
      if(targetRaw&&!targetUrl)throw new Error('Use a valid HTTPS or HTTP target URL.');
      const payload={
        title:cleanText(data.get('title'),220),
        instruction:cleanText(data.get('instruction'),8000),
        success_definition:cleanText(data.get('success_definition'),4000),
        brand:cleanText(data.get('brand'),80),
        task_type:cleanText(data.get('task_type'),40),
        priority:cleanText(data.get('priority'),20),
        assigned_to:assignedTo,
        channels:String(data.get('channels')||'').split(',').map(value=>cleanText(value,80)).filter(Boolean).slice(0,12),
        due_at:data.get('due_at')?new Date(String(data.get('due_at'))).toISOString():null,
        target_url:targetUrl,
        evidence_required:data.get('evidence_required')==='on',
        source_plan_ref:item?.source_plan_ref||seed?.id||null
      };
      if(payload.title.length<3||payload.instruction.length<10||payload.success_definition.length<5)throw new Error('The instruction, title, and definition of done need more detail.');
      if(item){
        if(item.status==='draft'&&assignedTo)payload.status='assigned';
        else if(item.status!=='draft'&&!assignedTo)throw new Error('An active instruction must remain assigned.');
      }else{
        payload.created_by=user.id;
        payload.status=assignedTo?'assigned':'draft';
      }
      if(preview){
        if(item)Object.assign(item,payload,{updated_at:new Date().toISOString()});
        else workOrders.unshift({id:`preview-${Date.now()}`,ticket_number:nextPreviewTicket++,...payload,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
        renderAll();notify('Preview instruction saved locally.','success');return true;
      }
      const result=item
        ?await client.from('work_orders').update(payload).eq('id',item.id).select().single()
        :await client.from('work_orders').insert(payload).select().single();
      if(result.error)throw result.error;
      await loadOperations();notify(item?'Instruction updated.':'Instruction assigned to the work queue.','success');return true;
    });
    $('#opsWorkflowDialogBody [data-workflow-cancel]')?.addEventListener('click',closeDialog);
  }

  function evidenceForm(workOrder){
    if(!workOrder)return;
    if(!isMine(workOrder)&&!isAdmin){notify('Evidence can only be added to work assigned to this account.','error');return}
    openDialog('Proof of work',`Add evidence to ${taskCode(workOrder)}`,`<form class="ops-form-grid">
      <div class="ops-form-context full"><strong>${escapeHtml(workOrder.title)}</strong><p>${escapeHtml(workOrder.success_definition)}</p></div>
      <label class="ops-field"><span>Evidence type</span><select name="evidence_type"><option value="published_post">Published post</option><option value="screenshot">Screenshot</option><option value="analytics">Analytics</option><option value="file">File</option><option value="link">Link</option><option value="note">Completion note</option></select></label>
      <label class="ops-field"><span>Evidence title</span><input name="title" required maxlength="180" placeholder="What this proves"></label>
      <label class="ops-field full"><span>Description</span><textarea name="description" maxlength="4000" placeholder="Explain how this evidence satisfies the instruction."></textarea></label>
      <label class="ops-field full"><span>Public or review URL</span><input name="evidence_url" type="url" maxlength="1000" placeholder="https://"></label>
      <label class="ops-field full"><span>Optional file, maximum 25 MB</span><input name="evidence_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,video/mp4,video/quicktime"><small>Uploaded evidence remains private and is opened through a temporary signed link.</small></label>
      <div class="ops-form-actions"><span></span><div><button class="ops-button secondary" type="button" data-workflow-cancel>Cancel</button><button class="ops-button" type="submit">Submit evidence</button></div></div>
    </form>`,async(data,event,form)=>{
      const file=form.elements.evidence_file.files?.[0]||null;
      const urlRaw=cleanText(data.get('evidence_url'),1000);
      const url=urlRaw?safeUrl(urlRaw):null;
      const description=cleanText(data.get('description'),4000)||null;
      if(urlRaw&&!url)throw new Error('Use a valid HTTPS or HTTP evidence URL.');
      if(!file&&!url&&!description)throw new Error('Add a link, file, or written evidence note.');
      if(file&&file.size>25*1024*1024)throw new Error('The evidence file must be 25 MB or smaller.');
      let storagePath=null;
      if(preview){
        evidence.unshift({id:`preview-evidence-${Date.now()}`,work_order_id:workOrder.id,evidence_type:cleanText(data.get('evidence_type'),40),title:cleanText(data.get('title'),180),description,evidence_url:url,storage_path:file?`preview/${file.name}`:null,submitted_by:user.id,review_status:'pending',created_at:new Date().toISOString()});
        renderAll();notify('Preview evidence added locally.','success');return true;
      }
      if(file){
        const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(-120)||'evidence-file';
        storagePath=`${workOrder.id}/${user.id}/${Date.now()}-${safeName}`;
        const upload=await client.storage.from('work-evidence').upload(storagePath,file,{contentType:file.type,cacheControl:'3600',upsert:false});
        if(upload.error)throw upload.error;
      }
      const result=await client.from('work_evidence').insert({
        work_order_id:workOrder.id,
        evidence_type:cleanText(data.get('evidence_type'),40),
        title:cleanText(data.get('title'),180),
        description,
        evidence_url:url,
        storage_path:storagePath,
        submitted_by:user.id
      }).select().single();
      if(result.error){
        if(storagePath)await client.storage.from('work-evidence').remove([storagePath]);
        throw result.error;
      }
      await loadOperations();notify('Evidence submitted for review.','success');return true;
    });
    $('#opsWorkflowDialogBody [data-workflow-cancel]')?.addEventListener('click',closeDialog);
  }

  async function transitionWorkOrder(item,nextStatus,note=null){
    if(preview){
      if(nextStatus==='submitted'&&item.evidence_required&&!workEvidence(item.id).length){notify('Evidence is required before this work can be submitted.','error');return}
      item.status=nextStatus;
      if(nextStatus==='blocked')item.block_reason=note;
      else item.block_reason=null;
      if(nextStatus==='submitted')item.completion_notes=note;
      item.updated_at=new Date().toISOString();
      renderAll();notify(`Work moved to ${statusLabel(nextStatus)}.`);return;
    }
    const result=await client.rpc('transition_work_order',{p_work_order_id:item.id,p_status:nextStatus,p_note:note});
    if(result.error){notify(result.error.message||'The work status could not be changed.','error');return}
    await loadOperations();notify(`Work moved to ${statusLabel(nextStatus)}.`);
  }
  function transitionDialog(item,nextStatus){
    const isBlock=nextStatus==='blocked';
    const isSubmit=nextStatus==='submitted';
    if(!isBlock&&!isSubmit){transitionWorkOrder(item,nextStatus);return}
    openDialog('Work status',isBlock?'Report a blocker':'Submit for approval',`<form class="ops-form-grid">
      <div class="ops-form-context full"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(isBlock?'Explain exactly what is preventing progress and what decision or resource is needed.':'Summarize what was completed. Required evidence must already be attached.')}</p></div>
      <label class="ops-field full"><span>${isBlock?'Block reason':'Completion note'}</span><textarea name="note" ${isBlock?'required':''} maxlength="${isBlock?'2000':'4000'}"></textarea></label>
      <div class="ops-form-actions"><span></span><div><button class="ops-button secondary" type="button" data-workflow-cancel>Cancel</button><button class="ops-button" type="submit">${isBlock?'Mark blocked':'Submit work'}</button></div></div>
    </form>`,async data=>{
      const note=cleanText(data.get('note'),isBlock?2000:4000)||null;
      if(isBlock&&!note)throw new Error('A block reason is required.');
      await transitionWorkOrder(item,nextStatus,note);return true;
    });
    $('#opsWorkflowDialogBody [data-workflow-cancel]')?.addEventListener('click',closeDialog);
  }

  function reviewEvidence(item,decision){
    const needsNote=decision==='rejected';
    const run=async note=>{
      if(preview){
        Object.assign(item,{review_status:decision,review_note:note,reviewed_at:new Date().toISOString(),reviewed_by:user.id});renderAll();notify(`Evidence ${decision}.`);return;
      }
      const result=await client.rpc('review_work_evidence',{p_evidence_id:item.id,p_decision:decision,p_note:note});
      if(result.error){notify(result.error.message||'Evidence review could not be saved.','error');return}
      await loadOperations();notify(`Evidence ${decision}.`);
    };
    if(!needsNote){run(null);return}
    openDialog('Evidence review','Reject evidence',`<form class="ops-form-grid"><label class="ops-field full"><span>Correction required</span><textarea name="note" required maxlength="2000"></textarea></label><div class="ops-form-actions"><span></span><div><button class="ops-button secondary" type="button" data-workflow-cancel>Cancel</button><button class="ops-button" type="submit">Send correction</button></div></div></form>`,async data=>{const note=cleanText(data.get('note'),2000);if(!note)throw new Error('A correction note is required.');await run(note);return true});
    $('#opsWorkflowDialogBody [data-workflow-cancel]')?.addEventListener('click',closeDialog);
  }
  function reviewWorkOrder(item){
    openDialog('Founder approval',`Review ${taskCode(item)}`,`<form class="ops-form-grid">
      <div class="ops-form-context full"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.success_definition)}</p><small>${workEvidence(item.id).filter(entry=>entry.review_status==='accepted').length} accepted evidence item(s)</small></div>
      <label class="ops-field full"><span>Approval or revision note</span><textarea name="note" maxlength="2000" placeholder="Required when requesting changes"></textarea></label>
      <div class="ops-form-actions"><span></span><div><button class="ops-button secondary" type="submit" name="decision" value="changes_requested">Request changes</button><button class="ops-button" type="submit" name="decision" value="approved">Approve work</button></div></div>
    </form>`,async(data,event)=>{
      const decision=event.submitter?.value;
      const note=cleanText(data.get('note'),2000)||null;
      if(decision==='changes_requested'&&!note)throw new Error('Revision instructions are required.');
      if(preview){
        item.status=decision;item.review_note=note;item.approved_at=decision==='approved'?new Date().toISOString():null;renderAll();notify(decision==='approved'?'Work approved.':'Changes requested.');return true;
      }
      const result=await client.rpc('review_work_order',{p_work_order_id:item.id,p_decision:decision,p_note:note});
      if(result.error)throw result.error;
      await loadOperations();notify(decision==='approved'?'Work approved.':'Changes requested.');return true;
    });
  }

  function connectionForm(catalog,record=null){
    if(!isAdmin)return;
    const current=record||{connection_type:catalog.type,status:'setup_required',display_name:catalog.name,account_label:'',management_url:'',verification_note:'',last_error:'',capabilities:catalog.capabilities};
    openDialog('Connection registry',`Configure ${catalog.name}`,`<form class="ops-form-grid">
      <div class="ops-form-warning full"><strong>Never paste a password, access token, API secret, or recovery code here.</strong><p>This record documents connection state and ownership. OAuth credentials and webhook secrets belong in the provider or secure server environment.</p></div>
      <label class="ops-field"><span>Display name</span><input name="display_name" required maxlength="120" value="${escapeHtml(current.display_name||catalog.name)}"></label>
      <label class="ops-field"><span>Connection method</span><select name="connection_type">${['manual','oauth','webhook','api','native'].map(value=>`<option value="${value}"${value===current.connection_type?' selected':''}>${escapeHtml(value)}</option>`).join('')}</select></label>
      <label class="ops-field"><span>Honest connection state</span><select name="status"><option value="setup_required"${current.status==='setup_required'?' selected':''}>Setup required</option><option value="authorizing"${current.status==='authorizing'?' selected':''}>Authorizing</option><option value="verified_manual"${current.status==='verified_manual'?' selected':''}>Verified manually</option><option value="paused"${current.status==='paused'?' selected':''}>Paused</option><option value="error"${current.status==='error'?' selected':''}>Connection error</option></select></label>
      <label class="ops-field"><span>Account or workspace label</span><input name="account_label" maxlength="180" value="${escapeHtml(current.account_label||'')}" placeholder="The exact Page, account, or workspace"></label>
      <label class="ops-field full"><span>Provider management URL</span><input name="management_url" type="url" maxlength="1000" value="${escapeHtml(current.management_url||'')}" placeholder="https://"></label>
      <label class="ops-field full"><span>Capabilities, comma separated</span><input name="capabilities" maxlength="1000" value="${escapeHtml((current.capabilities||catalog.capabilities).join(', '))}"></label>
      <label class="ops-field full"><span>Verification note</span><textarea name="verification_note" maxlength="2000" placeholder="What was tested, by whom, and what succeeded?">${escapeHtml(current.verification_note||'')}</textarea><small>Required when the state is Verified manually.</small></label>
      <label class="ops-field full"><span>Connection error</span><textarea name="last_error" maxlength="2000">${escapeHtml(current.last_error||'')}</textarea></label>
      <div class="ops-form-actions"><span></span><div><button class="ops-button secondary" type="button" data-workflow-cancel>Cancel</button><button class="ops-button" type="submit">Save connection record</button></div></div>
    </form>`,async data=>{
      const status=cleanText(data.get('status'),40);
      const accountLabel=cleanText(data.get('account_label'),180)||null;
      const verificationNote=cleanText(data.get('verification_note'),2000)||null;
      const managementRaw=cleanText(data.get('management_url'),1000);
      const managementUrl=managementRaw?safeUrl(managementRaw):null;
      if(managementRaw&&!managementUrl)throw new Error('Use a valid HTTPS or HTTP provider management URL.');
      if(status==='verified_manual'&&(!accountLabel||!verificationNote||verificationNote.length<8))throw new Error('Manual verification requires the exact account label and a specific verification note.');
      const payload={
        provider_key:catalog.key,
        display_name:cleanText(data.get('display_name'),120),
        connection_type:cleanText(data.get('connection_type'),30),
        status,
        account_label:accountLabel,
        management_url:managementUrl,
        capabilities:String(data.get('capabilities')||'').split(',').map(value=>cleanText(value,100)).filter(Boolean).slice(0,20),
        verification_note:verificationNote,
        verified_at:status==='verified_manual'?new Date().toISOString():null,
        verified_by:status==='verified_manual'?user.id:null,
        last_checked_at:status==='verified_manual'?new Date().toISOString():null,
        last_error:status==='error'?cleanText(data.get('last_error'),2000)||'Connection requires review.':null,
        created_by:record?.created_by||user.id
      };
      if(preview){
        const index=connections.findIndex(item=>item.provider_key===catalog.key);
        if(index>=0)connections[index]={...connections[index],...payload};else connections.push(payload);
        renderAll();notify('Preview connection record saved locally.');return true;
      }
      const result=await client.from('automation_connections').upsert(payload,{onConflict:'provider_key'}).select().single();
      if(result.error)throw result.error;
      await loadOperations();notify('Connection record saved.');return true;
    });
    $('#opsWorkflowDialogBody [data-workflow-cancel]')?.addEventListener('click',closeDialog);
  }

  function bindEvents(){
    $('#createWorkOrder')?.addEventListener('click',()=>workOrderForm());
    $('#opsCreateInstructionTop')?.addEventListener('click',()=>workOrderForm());
    $('#refreshWorkOrders')?.addEventListener('click',loadOperations);
    $('#refreshEvidence')?.addEventListener('click',loadOperations);
    $('#refreshConnections')?.addEventListener('click',loadOperations);
    ['workAssigneeFilter','workStatusFilter','workBrandFilter','workSearch'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderWorkOrders));
    ['evidenceStatusFilter','evidenceTypeFilter','evidenceSearch'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderEvidence));
    $('#workOrderList')?.addEventListener('click',event=>{
      const edit=event.target.closest('[data-work-edit]');
      const transition=event.target.closest('[data-work-transition]');
      const addEvidence=event.target.closest('[data-evidence-add]');
      const viewEvidence=event.target.closest('[data-evidence-view]');
      const review=event.target.closest('[data-work-review]');
      if(edit){workOrderForm(workOrders.find(item=>item.id===edit.dataset.workEdit));return}
      if(transition){const item=workOrders.find(entry=>entry.id===transition.dataset.workId);if(item)transitionDialog(item,transition.dataset.workTransition);return}
      if(addEvidence){evidenceForm(workOrders.find(item=>item.id===addEvidence.dataset.evidenceAdd));return}
      if(viewEvidence){const item=workOrders.find(entry=>entry.id===viewEvidence.dataset.evidenceView);if(item){$('#evidenceSearch').value=item.title;renderEvidence();openPanel('evidencePanel')}return}
      if(review){const item=workOrders.find(entry=>entry.id===review.dataset.workReview);if(item)reviewWorkOrder(item)}
    });
    $('#opsOverviewWork')?.addEventListener('click',event=>{const button=event.target.closest('[data-work-open]');if(!button)return;openPanel('workQueuePanel');$('#workSearch').value=workOrders.find(item=>item.id===button.dataset.workOpen)?.title||'';renderWorkOrders()});
    $('#evidenceList')?.addEventListener('click',event=>{const button=event.target.closest('[data-evidence-review]');if(!button)return;const item=evidence.find(entry=>entry.id===button.dataset.evidenceId);if(item)reviewEvidence(item,button.dataset.evidenceReview)});
    $('#connectionGrid')?.addEventListener('click',event=>{const button=event.target.closest('[data-connection-manage]');if(!button)return;const catalog=CONNECTION_CATALOG.find(item=>item.key===button.dataset.connectionManage);if(catalog)connectionForm(catalog,connections.find(item=>item.provider_key===catalog.key)||null)});
    $('[data-workflow-dialog-close]')?.addEventListener('click',closeDialog);
    window.addEventListener('fmb:ops-create-from-plan',event=>workOrderForm(null,event.detail||{}));
  }

  async function start(detail={}){
    if(initialized)return;initialized=true;
    client=detail.client||null;
    user=detail.user||{id:'preview-admin'};
    profile=detail.profile||{full_name:'Francine Marie Bautista',username:'fmb',role:'admin',status:'active'};
    preview=Boolean(detail.preview);
    isAdmin=profile.role==='admin';
    document.body.dataset.opsRole=profile.role;
    if(!isAdmin){
      $$('[data-admin-only]').forEach(element=>element.hidden=true);
      const filter=$('#workAssigneeFilter');if(filter)filter.value='mine';
    }else{
      const filter=$('#workAssigneeFilter');if(filter)filter.value='all';
    }
    staff=[{id:user.id,full_name:profile.full_name,username:profile.username,role:profile.role,status:profile.status}];
    if(preview){
      connections=[
        {provider_key:'main_website',display_name:'Official FMB website',connection_type:'native',status:'connected_api',account_label:'www.francinemariebautista.com',capabilities:CONNECTION_CATALOG[0].capabilities,verification_note:'Production domain verified.',verified_at:new Date().toISOString(),last_checked_at:new Date().toISOString()},
        {provider_key:'supabase_workspace',display_name:'Supabase operations database',connection_type:'native',status:'connected_api',account_label:'withlovefmb',capabilities:CONNECTION_CATALOG[1].capabilities,verification_note:'Operations database verified.',verified_at:new Date().toISOString(),last_checked_at:new Date().toISOString()}
      ];
    }
    bindEvents();
    await loadOperations();
    subscribeRealtime();
  }

  window.addEventListener('fmb:admin-ready',event=>start(event.detail||{}),{once:true});
})();
