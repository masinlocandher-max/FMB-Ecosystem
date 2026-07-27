import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dist=path.join(root,'dist');

const publicSection=`
  <!-- FMB_NEWS_AUTOMATION_START -->
  <section class="news-auto-section" id="automated-desk" aria-labelledby="automatedDeskTitle">
    <div class="wrap">
      <div class="news-auto-head nc-reveal">
        <div><p class="nc-kicker">Filipino-first live desk</p><h2 id="automatedDeskTitle">Every story must answer: what is in it for Filipinos?</h2><p>Approved factual reports publish automatically when they pass the source, safety, and Filipino-impact rules. Sensitive or weakly supported stories stop for human review.</p></div>
        <div class="news-auto-pulse" aria-live="polite"><span id="automatedNewsStatus">Connecting to the desk</span><time id="automatedNewsUpdated">Philippine Standard Time</time></div>
      </div>
      <div class="news-auto-grid" id="automatedNewsGrid" aria-live="polite"><div class="news-auto-empty"><strong>Loading the Filipino-first desk.</strong><p>Checking published newsroom records.</p></div></div>
    </div>
  </section>
  <!-- FMB_NEWS_AUTOMATION_END -->
`;

const adminPanel=`
<section class="admin-panel orchestrator-panel" id="newsroomPanel" hidden>
  <header class="orchestrator-page-head"><div><h1>Newsroom Automation</h1><p>Approved factual sources publish automatically when the story has a complete Filipino public-interest structure and passes the risk rules.</p></div><div class="orchestrator-head-actions"><button class="ops-button secondary" id="newsRefresh" type="button">Refresh</button><button class="ops-button" id="newsRunImport" type="button">Run import now</button></div></header>
  <div class="ops-news-status" id="newsroomStatus" role="status" aria-live="polite"></div>
  <div class="ops-newsroom-metrics"><article><strong id="newsMetricSources">0</strong><span>Active sources</span></article><article><strong id="newsMetricPending">0</strong><span>Stopped for review</span></article><article><strong id="newsMetricPublished">0</strong><span>Published briefs</span></article><article><strong id="newsMetricCorrections">0</strong><span>Corrections</span></article></div>
  <div class="ops-newsroom-grid">
    <div>
      <section class="ops-surface"><div class="ops-section-head"><div><h2>Exception queue</h2><p>Only stories that fail a safeguard, lack evidence, or involve a sensitive subject should appear here.</p></div><label><span>View</span><select id="newsReviewFilter"><option value="pending_review">Stopped for review</option><option value="published">Published</option><option value="needs_correction">Needs correction</option><option value="rejected">Rejected</option><option value="all">All</option></select></label></div><div class="ops-news-reviews" id="newsReviewList"><div class="ops-news-empty">Loading exception queue…</div></div></section>
      <section class="ops-surface"><div class="ops-section-head"><div><h2>Ingestion history</h2><p>Each scheduled or manual check records what happened.</p></div></div><div class="ops-news-runs" id="newsRunList"><div class="ops-news-empty">Loading run history…</div></div></section>
    </div>
    <aside>
      <section class="ops-surface"><div class="ops-section-head"><div><h2>Approved source</h2><p>Use a publisher's official RSS, Atom, or JSON feed. Approval applies to the source, not to every individual factual story.</p></div></div>
        <form class="ops-news-source-form" id="newsSourceForm" novalidate>
          <input id="newsSourceId" type="hidden">
          <label><span>Source name</span><input id="newsSourceName" maxlength="160" required></label>
          <label><span>Feed type</span><select id="newsSourceType"><option value="rss">RSS</option><option value="atom">Atom</option><option value="json_feed">JSON Feed</option></select></label>
          <label class="full"><span>Official feed URL</span><input id="newsSourceFeed" type="url" inputmode="url" placeholder="https://publisher.example/feed.xml" required></label>
          <label class="full"><span>Publisher homepage</span><input id="newsSourceHomepage" type="url" inputmode="url"></label>
          <label><span>Category</span><input id="newsSourceCategory" maxlength="80" value="Philippines"></label>
          <label><span>Region or locality</span><input id="newsSourceRegion" maxlength="120" placeholder="Zambales"></label>
          <label><span>Default risk</span><select id="newsSourceRisk"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></label>
          <label><span>Rights or usage note</span><input id="newsSourceRights" maxlength="1000" placeholder="Headlines and summaries only; link to original"></label>
          <div class="ops-news-checks"><label><input id="newsSourceActive" type="checkbox" checked><span>Active</span></label><label><input id="newsSourceAuto" type="checkbox" checked><span>Publish automatically when safeguards pass</span></label></div>
          <div class="ops-news-form-actions"><button class="ops-button" id="newsSaveSource" type="submit">Save source</button><button class="ops-button secondary" id="newsNewSource" type="button">New</button></div>
        </form>
      </section>
      <section class="ops-surface"><div class="ops-section-head"><div><h2>Connected feeds</h2><p>Pause a feed immediately when its quality, ownership, or terms change.</p></div></div><div class="ops-news-sources" id="newsSourceList"><div class="ops-news-empty">Loading sources…</div></div></section>
      <section class="ops-guardrail"><strong>Base rule: publish facts by safeguards.</strong><p>Every factual story requires a Filipino impact, affected groups, everyday-life effect, and public-interest next step. Ordinary news carries no FMB personal opinion. An FMB Perspective appears only on explicitly approved Analysis or Opinion. Official public-affairs facts may publish automatically; allegations, crime, legal disputes, sensitive health claims, violence, deaths, weak sourcing, and low-confidence impacts stop for review.</p></section>
    </aside>
  </div>
</section>
`;

function write(file,content){fs.writeFileSync(file,content,'utf8');console.log(`[news-automation] updated ${path.relative(root,file)}`)}

for(const relative of ['news/index.html','news.html']){
  const file=path.join(dist,relative);if(!fs.existsSync(file))continue;
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('newsroom-automation.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/newsroom-automation.css?v=20260727c">\n</head>');
  if(!html.includes('FMB_NEWS_AUTOMATION_START'))html=html.replace('<section class="nc-context-feature"',`${publicSection}\n<section class="nc-context-feature"`);
  if(!html.includes('/assets/js/news-feed.js'))html=html.replace('<script defer src="/assets/js/news-channel.js',`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script src="/assets/js/config.js?v=20260715-member-launch"></script>\n<script src="/assets/js/supabase-client.js"></script>\n<script defer src="/assets/js/news-feed.js?v=20260727c"></script>\n<script defer src="/assets/js/news-channel.js`);
  write(file,html);
}

const adminFile=path.join(dist,'admin.html');
if(fs.existsSync(adminFile)){
  let html=fs.readFileSync(adminFile,'utf8');
  if(!html.includes('newsroom-automation.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/newsroom-automation.css?v=20260727c">\n</head>');
  if(!html.includes('data-admin-panel="newsroomPanel"'))html=html.replace('<button data-admin-only data-admin-panel="analyticsPanel"', '<button data-admin-only data-admin-panel="newsroomPanel" data-panel-title="Newsroom Automation"><i data-icon="content"></i>Newsroom Automation <b id="navNewsPending">0</b></button><button data-admin-only data-admin-panel="analyticsPanel"');
  if(!html.includes('id="newsroomPanel"'))html=html.replace('<section class="admin-panel" id="membersPanel" hidden>',`${adminPanel}\n<section class="admin-panel" id="membersPanel" hidden>`);
  if(!html.includes('/assets/js/newsroom-admin.js'))html=html.replace('</body>','<script src="/assets/js/newsroom-admin.js?v=20260727c"></script>\n</body>');
  write(adminFile,html);
}
