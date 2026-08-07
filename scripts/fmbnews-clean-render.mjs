import { esc, colorLogo, whiteLogo, logo } from './fmbnews-clean-lib.mjs';

const css = '/assets/css/fmbnews-clean-v1.css?v=20260807-production-v2';
const heroArtwork = '/assets/images/news/fmb-news-purple-network-hero.webp';
const outlineLogo = '/assets/images/news/fmb-news-outline-logo-2026.webp';
const newsCategories = [
  ['all', 'All news'],
  ['national', 'Nation'],
  ['world', 'World'],
  ['business', 'Business'],
  ['technology', 'Technology'],
  ['culture', 'Life and culture'],
  ['environment', 'Environment'],
  ['health', 'Health'],
];

const defaultTickerItems = [
  { title: 'Important news, made clear for Filipinos', route: '/fmbnews/#reports' },
  { title: 'Evidence first, with sources kept visible', route: '/fmbnews/about/#standards' },
  { title: 'Context, Filipino relevance, and what comes next', route: '/fmbnews/about/#method' },
];

function ticker(items = defaultTickerItems) {
  const headlines = items.length ? items.slice(0, 6) : defaultTickerItems;
  const repeated = [...headlines, ...headlines];
  const links = repeated.map((item, index) => {
    const duplicate = index >= headlines.length ? ' aria-hidden="true" tabindex="-1"' : '';
    return `<a href="${esc(item.route)}"${duplicate}>${esc(item.title)}</a>`;
  }).join('');

  return `<div class="fnc-livebar" aria-label="Moving headlines and Philippine time"><div class="fnc-live-label"><i aria-hidden="true"></i>Moving headlines</div><div class="fnc-ticker"><div class="fnc-ticker-track">${links}</div></div><div class="fnc-pht"><span>Philippine time</span><time data-pht-time data-fmb-hq-clock data-news-updated datetime="2026-08-07T00:00:00+08:00">--:--:--</time></div></div>`;
}

export function shell(active = '', headlines = defaultTickerItems) {
  const primaryLinks = [
    ['Latest reports', '/fmbnews/', 'latest'],
    ['About FMB News', '/fmbnews/about/', 'about'],
    ['Editorial standards', '/fmbnews/about/#standards', 'standards'],
    ['Corrections', 'mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction', 'corrections'],
    ['Contact', 'mailto:withlovefmb@gmail.com?subject=FMB%20Newsroom%20Inquiry', 'contact'],
  ];
  const links = primaryLinks.map(([label, href, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const categories = newsCategories.map(([value, label]) => `<a href="/fmbnews/?section=${value}#reports" data-fnc-drawer-category="${value}">${label}</a>`).join('');
  return `<a class="fnc-skip" href="#main">Skip to the newsroom</a>${ticker(headlines)}<header class="fnc-header"><div class="fnc-shell fnc-header-row"><a class="fnc-brand" href="/fmbnews/" aria-label="FMB News home"><img src="${colorLogo}" width="1225" height="265" alt="FMB News, Filipino Media Bulletin"></a><nav class="fnc-nav" id="fncNav" aria-label="FMB News menu"><div class="fnc-nav-head"><div><span>FMB News</span><strong>News menu</strong></div><button class="fnc-nav-close" type="button" data-fnc-menu-close aria-label="Close FMB News menu"><i aria-hidden="true"></i></button></div><div class="fnc-nav-links">${links}</div><section class="fnc-nav-categories" aria-labelledby="fncDrawerCategories"><p id="fncDrawerCategories">News categories</p><div>${categories}</div></section><div class="fnc-nav-meta"><span>Edition <strong>Philippines</strong></span><span>Standard <strong>Evidence first</strong></span></div></nav><div class="fnc-actions"><a class="fnc-submit" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit story</a><button class="fnc-menu" type="button" aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fncNav"><span></span></button></div></div></header><div class="fnc-nav-backdrop" data-fnc-menu-close aria-hidden="true"></div>`;
}

export function foot() {
  return `<footer class="fnc-footer"><div class="fnc-footer-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="fnc-signal" aria-hidden="true"></div><div class="fnc-shell fnc-footer-grid"><div class="fnc-footer-brand"><span class="fnc-footer-logo-frame"><img src="${whiteLogo}" width="1133" height="243" alt="FMB News, Filipino Media Bulletin"></span><p>The news that matters.<br>Made clear for Filipinos.</p></div><div class="fnc-footer-statement"><span>Filipino news explainer</span><h2>We gather the facts, explain the context, and show why the story matters.</h2><p>Credible evidence, visible sources, original writing, and clear Filipino relevance.</p></div><nav aria-label="FMB News footer navigation"><a href="/fmbnews/">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbnews/about/#standards">Editorial standards</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">Send a correction</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20Newsroom%20Inquiry">Contact newsroom</a></nav></div><div class="fnc-shell fnc-footer-bottom"><span>© 2026 FMB News. All rights reserved.</span><a href="#top">Back to top</a></div></footer>`;
}

export function runtime() {
  return `<script>(()=>{
    const body=document.body,menu=document.querySelector('.fnc-menu'),nav=document.querySelector('#fncNav'),mobile=matchMedia('(max-width:1080px)');
    const closeControls=[...document.querySelectorAll('[data-fnc-menu-close]')];
    const focusable=()=>nav?[...nav.querySelectorAll('a[href],button:not([disabled])')].filter(node=>node.offsetParent!==null):[];
    const setMenu=open=>{
      if(!menu||!nav)return;
      const next=Boolean(open&&mobile.matches);
      body.classList.toggle('fnc-menu-open',next);
      body.classList.toggle('fnc-scroll-lock',next);
      menu.setAttribute('aria-expanded',String(next));
      menu.setAttribute('aria-label',next?'Close FMB News menu':'Open FMB News menu');
      nav.setAttribute('aria-hidden',String(mobile.matches&&!next));
      if(next)requestAnimationFrame(()=>focusable()[0]?.focus());
    };
    menu?.addEventListener('click',()=>setMenu(!body.classList.contains('fnc-menu-open')));
    closeControls.forEach(control=>control.addEventListener('click',()=>{setMenu(false);menu?.focus()}));
    nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&body.classList.contains('fnc-menu-open')){setMenu(false);menu?.focus();return}
      if(event.key!=='Tab'||!body.classList.contains('fnc-menu-open'))return;
      const nodes=focusable();if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });
    const syncMenu=()=>{if(!mobile.matches)setMenu(false);else nav?.setAttribute('aria-hidden',String(!body.classList.contains('fnc-menu-open')))};
    mobile.addEventListener?.('change',syncMenu);syncMenu();

    const search=document.querySelector('[data-fnc-search]'),cards=[...document.querySelectorAll('[data-fnc-card]')],archiveLinks=[...document.querySelectorAll('[data-fnc-archive-item]')],buttons=[...document.querySelectorAll('[data-fnc-filter]')],archive=document.querySelector('.fnc-archive'),empty=document.querySelector('[data-fnc-empty]'),status=document.querySelector('[data-fnc-filter-status]');
    const allowed=new Set(['all','national','world','business','technology','culture','environment','health']);
    let active=new URLSearchParams(location.search).get('section')||'all';if(!allowed.has(active))active='all';
    const matches=(node,term)=>{const category=node.dataset.category||'national';return(active==='all'||category===active)&&(!term||(node.textContent||'').toLowerCase().includes(term))};
    const apply=()=>{
      const term=(search?.value||'').trim().toLowerCase();let shown=0,archiveShown=0;
      cards.forEach(card=>{card.hidden=!matches(card,term);if(!card.hidden)shown++});
      archiveLinks.forEach(link=>{link.hidden=!matches(link,term);if(!link.hidden){shown++;archiveShown++}});
      buttons.forEach(button=>{const selected=button.dataset.fncFilter===active;button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected))});
      if(archive){archive.hidden=archiveShown===0;if((term||active!=='all')&&archiveShown)archive.open=true}
      if(empty)empty.hidden=shown!==0;if(status){status.textContent=shown===1?'1 report shown':shown+' reports shown';status.setAttribute('aria-live','polite')}
    };
    buttons.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.fncFilter||'all';const url=new URL(location.href);if(active==='all')url.searchParams.delete('section');else url.searchParams.set('section',active);history.replaceState({},'',url.pathname+url.search+'#reports');apply()}));
    search?.addEventListener('input',apply);apply();

    const clocks=[...document.querySelectorAll('[data-pht-time]')];
    const tick=()=>{const now=new Date(),label=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(now),iso=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now).replace(' ','T')+'+08:00';clocks.forEach(clock=>{clock.textContent=label;clock.setAttribute('datetime',iso)})};
    tick();setInterval(tick,1000);
  })();</script>`;
}

export function head(title, description, canonical, image = logo, type = 'website') {
  const absoluteImage = image.startsWith('http') ? image : `https://www.francinemariebautista.com${image}`;
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#12071f"><link rel="canonical" href="${canonical}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(absoluteImage)}"><meta property="og:image:alt" content="FMB News"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(absoluteImage)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap"><link rel="stylesheet" href="${css}"></head>`;
}

const card = (record) => `<article class="fnc-card" data-fnc-card data-category="${record.category}"><a href="${record.route}"><figure><img src="${esc(record.image)}" loading="lazy" alt="${esc(record.alt)}"><figcaption class="fnc-credit">${esc(record.credit)}</figcaption></figure><div class="fnc-card-copy"><p class="fnc-meta">${esc(record.kicker)}</p><h3>${esc(record.title)}</h3><small>${esc(record.published)}</small></div></a></article>`;

export function landingPage(records) {
  const lead = records[0];
  const visible = records.slice(1, 13);
  const archive = records.slice(13);
  const filters = newsCategories;
  const wire = records.slice(0, 6).map((record) => ({ title: record.title, route: record.route }));
  const method = [
    ['01', 'What happened?', 'The verified facts.'],
    ['02', 'What is the context?', 'The background and forces shaping the story.'],
    ['03', 'Why does it matter to Filipinos?', 'The possible effect on people, communities, rights, safety, and livelihoods.'],
    ['04', 'What should readers watch next?', 'The decisions, risks, and consequences that may follow.'],
  ];

  return `<!doctype html><html lang="en-PH">${head('FMB News | The News That Matters. Made Clear for Filipinos.', 'FMB News gathers credible facts, adds useful context, and explains why important stories matter to Filipino lives.', 'https://www.francinemariebautista.com/fmbnews/', heroArtwork)}<body id="top" class="fmb-news-clean fmb-news-landing">${shell('latest', wire)}<main id="main"><span id="rundown" hidden></span><span id="philippines" hidden></span><span id="world" hidden></span><span id="culture" hidden></span><section class="fnc-brand-hero" aria-labelledby="fmbNewsHeroTitle"><img class="fnc-brand-hero-media" src="${heroArtwork}" width="1536" height="768" fetchpriority="high" alt=""><div class="fnc-brand-hero-shade" aria-hidden="true"></div><div class="fnc-brand-hero-orbit" aria-hidden="true"><i></i><i></i><i></i><b></b></div><div class="fnc-shell fnc-brand-hero-grid"><div class="fnc-brand-hero-copy"><p class="fnc-brand-hero-kicker">FMB News | Filipino news explainer</p><h1 id="fmbNewsHeroTitle">The news that matters.<span>Made clear for Filipinos.</span></h1><p>We gather credible facts, add useful context, and explain why important stories matter to Filipino lives.</p><div class="fnc-brand-hero-actions"><a href="#reports">Read the latest reports</a><a href="/fmbnews/about/">How FMB News works</a></div><div class="fnc-brand-hero-proof"><span>Philippine edition</span><span>Sources visible</span><span>Evidence first</span></div></div><ol class="fnc-brand-hero-lens" aria-label="The FMB News reporting lens">${method.map(([number, question]) => `<li><span>${number}</span>${question}</li>`).join('')}</ol></div></section><section class="fnc-hero fnc-lead-desk" aria-labelledby="leadDeskTitle"><div class="fnc-shell"><header class="fnc-lead-desk-head"><div><p class="fnc-kicker">Lead report</p><h2 id="leadDeskTitle">What matters now</h2></div><p>Evidence, context, Filipino relevance, and what comes next.</p></header><article class="fnc-lead" data-category="${lead.category}"><figure class="fnc-lead-media"><img src="${esc(lead.image)}" alt="${esc(lead.alt)}"><figcaption class="fnc-credit">${esc(lead.credit)}</figcaption></figure><div class="fnc-lead-copy"><span class="fnc-top-story">Lead report</span><p class="fnc-kicker">${esc(lead.kicker)}</p><h3>${esc(lead.title)}</h3><p>${esc(lead.description)}</p><div class="fnc-lead-meta"><small>${esc(lead.published)}</small><a class="fnc-read" href="${lead.route}">Read full report</a></div></div></article></div></section><section class="fnc-explainer" id="editorial-standard" aria-labelledby="explainerTitle"><img class="fnc-explainer-watermark" src="${outlineLogo}" width="1133" height="243" alt="" aria-hidden="true"><div class="fnc-shell"><header class="fnc-explainer-head"><p class="fnc-kicker">The FMB News lens</p><h2 id="explainerTitle">Every important story must answer four questions.</h2></header><ol class="fnc-explainer-grid">${method.map(([number, question, answer]) => `<li><span>${number}</span><h3>${question}</h3><p>${answer}</p></li>`).join('')}</ol><a class="fnc-explainer-link" href="/fmbnews/about/#method">Read our editorial method</a></div></section><section class="fnc-tools" aria-label="Search and filter FMB News"><div class="fnc-shell fnc-tools-row"><div class="fnc-search-wrap"><label class="fnc-search-label"><span class="sr-only">Search FMB News</span><i aria-hidden="true"></i><input class="fnc-search" data-fnc-search type="search" placeholder="Search reports, people, places, or topics" autocomplete="off"></label><span class="fnc-filter-status" data-fnc-filter-status></span></div><div class="fnc-category-wrap"><p>News categories</p><div class="fnc-categories" aria-label="News categories">${filters.map(([value, label]) => `<button class="fnc-category" type="button" data-fnc-filter="${value}" aria-pressed="false">${label}</button>`).join('')}</div></div></div></section><section class="fnc-content" id="reports"><div class="fnc-shell"><div class="fnc-section-head"><div><i aria-hidden="true"></i><div><p class="fnc-kicker">Newsroom</p><h2>Latest reports</h2></div></div><p>${records.length} reports accessible</p></div><div class="fnc-grid">${visible.map(card).join('')}</div><p class="fnc-no-results" data-fnc-empty hidden>No reports match this search yet. Try another category or search term.</p>${archive.length ? `<details class="fnc-archive"><summary>View ${archive.length} more reports</summary><div class="fnc-archive-list">${archive.map((record) => `<a href="${record.route}" data-fnc-archive-item data-category="${record.category}"><span>${esc(record.kicker)}</span>${esc(record.title)}</a>`).join('')}</div></details>` : ''}</div></section></main>${foot()}${runtime()}</body></html>`;
}

export function aboutPage() {
  const questions = [
    ['01', 'What happened?', 'The verified facts.'],
    ['02', 'What is the context?', 'The background, institutions, history, and forces shaping the story.'],
    ['03', 'Why does it matter to Filipinos?', 'The possible effect on people, communities, livelihoods, rights, safety, culture, and opportunities.'],
    ['04', 'What should readers watch next?', 'The developments, decisions, risks, or consequences that may follow.'],
  ];
  const principles = [
    ['Evidence first', 'We use credible sources, official documents, primary records, and clear attribution.'],
    ['Context always', 'We do not publish isolated facts without explaining the larger situation.'],
    ['Filipino relevance', 'Every major story explains why it matters to Filipino readers.'],
    ['Original writing', 'We do not copy, lightly rewrite, or imitate source articles.'],
    ['Fact and analysis kept distinct', 'Readers should know what is verified and what is interpretation.'],
    ['Accountability stays visible', 'Sources, corrections, and editorial methods should be easy to find.'],
  ];

  return `<!doctype html><html lang="en-PH">${head('About FMB News | A Filipino News-Explainer Platform', 'FMB News gathers credible facts, adds useful context, and explains why important stories matter to Filipino lives.', 'https://www.francinemariebautista.com/fmbnews/about/', colorLogo)}<body class="fmb-news-clean fmb-news-about">${shell('about')}<main id="main"><section class="fmb-about-hero" aria-labelledby="aboutTitle"><div class="fnc-shell fmb-about-hero-grid"><div class="fmb-about-hero-copy"><p class="fmb-about-label">About FMB News</p><h1 id="aboutTitle">Clarity without making the story shallow.</h1></div><div class="fmb-about-hero-statement"><p>FMB News is a Filipino news-explainer platform built for people who deserve the full picture but do not always have hours to gather it themselves.</p><strong>The news that matters. Made clear for Filipinos.</strong></div></div></section><section class="fmb-about-purpose" aria-labelledby="purposeTitle"><div class="fnc-shell fmb-about-purpose-grid"><div class="fmb-about-purpose-title"><p class="fmb-about-label">What we do</p><h2 id="purposeTitle">We connect complex public information to Filipino life.</h2></div><div class="fmb-about-purpose-copy"><p>Important facts are often spread across credible reporting, official records, public documents, research, and direct statements. FMB News gathers that evidence, compares the available accounts, and produces original reports for Filipino readers.</p><p>We are the interpretation and relevance layer between complex public information and the reader. We make stories easier to follow while preserving their context, uncertainty, and consequence.</p><p>The problem is not a lack of intelligence. It is time, access, context, information overload, and the way many reports are written.</p></div></div></section><section class="fmb-about-mission-vision" aria-label="FMB News mission and vision"><div class="fnc-shell fmb-about-mv-grid"><article class="fmb-about-mv"><span>01</span><p class="fmb-about-label">Our mission</p><h2>Help Filipinos understand important local and global developments.</h2><p>We do this through verified facts, visible sources, meaningful context, and clear explanations.</p></article><article class="fmb-about-mv"><span>02</span><p class="fmb-about-label">Our vision</p><h2>Become one of the Philippines' most trusted digital news-explainer platforms.</h2><p>We want FMB News to be known for clarity, evidence, accountability, and Filipino relevance.</p></article></div></section><section class="fmb-about-method" id="method" aria-labelledby="methodTitle"><img class="fmb-about-method-watermark" src="${outlineLogo}" width="1133" height="243" alt="" aria-hidden="true"><div class="fnc-shell"><div class="fmb-about-method-head"><p class="fmb-about-label">The FMB News lens</p><h2 id="methodTitle">Four questions guide every major story.</h2></div><ol class="fmb-about-method-list">${questions.map(([number, question, answer]) => `<li><span>${number}</span><div><h3>${question}</h3><p>${answer}</p></div></li>`).join('')}</ol></div></section><section class="fmb-about-standards" id="standards" aria-labelledby="standardsTitle"><div class="fnc-shell fmb-about-standards-grid"><div class="fmb-about-standards-intro"><p class="fmb-about-label">Our editorial principles</p><h2 id="standardsTitle">Evidence before noise.</h2></div><div class="fmb-about-principles">${principles.map(([title, copy]) => `<article><span>${title}</span><p>${copy}</p></article>`).join('')}</div></div></section><section class="fmb-about-closing" aria-labelledby="closingTitle"><div class="fnc-shell fmb-about-closing-grid"><div><p class="fmb-about-label">The simplest definition</p><h2 id="closingTitle">We gather the facts, explain the context, and show Filipinos why the story matters.</h2></div><nav aria-label="Continue exploring FMB News"><a href="/fmbnews/">Read the latest reports</a><a href="#standards">Review our editorial principles</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a story or tip</a></nav></div></section></main>${foot()}${runtime()}</body></html>`;
}

export const redirectPage = (to) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="FMB News canonical newsroom redirect."><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="https://www.francinemariebautista.com${to}"><title>FMB News</title></head><body><p>FMB News has moved to <a href="${to}">${to}</a>.</p></body></html>`;
