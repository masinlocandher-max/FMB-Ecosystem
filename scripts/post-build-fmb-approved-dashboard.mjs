import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(repositoryRoot,'dist');
const source=path.join(repositoryRoot,'apps','withlovefmb');
const cssSource=path.join(source,'assets','css','fmb-corporate-luxury-approved.css');
const cssTarget=path.join(dist,'assets','css','fmb-corporate-luxury-approved.css');
const quotePortrait='/assets/images/fmb-approved/francine-portrait-front.webp';

for(const file of [cssSource,path.join(source,quotePortrait.replace(/^\/assets\//,'assets/'))]){
  const info=await stat(file);
  if(!info.isFile()||info.size<500)throw new Error(`Approved dashboard dependency is missing: ${file}`);
}
await copyFile(cssSource,cssTarget);

const fontLinks='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
const cssLink='<link rel="stylesheet" href="/assets/css/fmb-corporate-luxury-approved.css?v=20260726-visual-fix-v3">';

function addBodyClass(html,className){
  return html.replace(/<body([^>]*)>/i,(match,attrs='')=>{
    if(/class=(['"])([^'"]*)\1/i.test(attrs)){
      attrs=attrs.replace(/class=(['"])([^'"]*)\1/i,(whole,quote,value)=>{
        const classes=new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    }else attrs+=` class="${className}"`;
    return `<body${attrs}>`;
  });
}

function injectAssets(html){
  const approvedCssLink=/<link\b[^>]*href=["'][^"']*fmb-corporate-luxury-approved\.css[^"']*["'][^>]*>/i;
  if(approvedCssLink.test(html))return html.replace(approvedCssLink,cssLink);
  if(!html.includes('family=Bodoni+Moda'))html=html.replace('</head>',`${fontLinks}\n${cssLink}\n</head>`);
  else if(!html.includes('fmb-corporate-luxury-approved.css'))html=html.replace('</head>',`${cssLink}\n</head>`);
  return html;
}

function findSectionEnd(html,start){
  const token=/<section\b|<\/section>/gi;
  token.lastIndex=start;
  let depth=0;
  let match;
  while((match=token.exec(html))){
    if(match[0].toLowerCase().startsWith('</')) depth-=1;
    else depth+=1;
    if(depth===0)return token.lastIndex;
  }
  return -1;
}

function removeSectionByMarker(html,markerPattern){
  const match=markerPattern.exec(html);
  if(!match)return html;
  const start=match.index;
  const end=findSectionEnd(html,start);
  return end>start?`${html.slice(0,start)}${html.slice(end)}`:html;
}

function removeHomeDuplicates(html){
  const patterns=[
    /<section\b[^>]*id=["']why-fmb["'][^>]*>/i,
    /<section\b[^>]*id=["']signature-projects["'][^>]*>/i,
    /<section\b[^>]*class=["'][^"']*fmb-v2-volunteer-proof[^"']*["'][^>]*>/i,
    /<section\b[^>]*id=["']bulletin["'][^>]*>/i,
    /<section\b[^>]*id=["']fmb-visual-ecosystem["'][^>]*>/i,
    /<section\b[^>]*id=["']how-fmb-can-help["'][^>]*>/i,
    /<section\b[^>]*id=["']fmb-authority["'][^>]*>/i,
    /<section\b[^>]*id=["']ecosystem["'][^>]*>/i,
    /<section\b[^>]*id=["']work["'][^>]*>/i,
    /<section\b[^>]*class=["'][^"']*\bfeatured\b[^"']*["'][^>]*>/i,
  ];
  for(const pattern of patterns)html=removeSectionByMarker(html,pattern);
  return html;
}

const capabilityItems=[
  ['01','Clarity First','Find the real story, the real problem, and the real opportunity.','strategy'],
  ['02','Strategy That Moves','Build direction that connects vision, positioning, and action.','strategy'],
  ['03','Creative With Purpose','Create ideas and experiences that are beautiful and effective.','creative'],
  ['04','Communications That Influence','Shape how people understand, remember, and respond.','perception'],
  ['05','Learning That Empowers','Teach, train, and build knowledge that creates growth.','strategy'],
  ['06','Impact That Lasts','Use platforms, influence, and resources to give back.','volunteer'],
];
const capabilityMarkup=capabilityItems.map(([number,title,copy,key])=>`<article class="fmb-approved-capability"><b>${number}</b><h3>${title}</h3><p>${copy}</p><button class="sr-only" type="button" data-fmb-v2-open="${key}">Open ${title}</button></article>`).join('');

const dashboard=`<section class="fmb-approved-control-center" aria-label="FMB authority and selected work">
  <section class="fmb-approved-capabilities fmb-approved-glass" aria-labelledby="approvedWhyTitle">
    <header class="fmb-approved-cap-head"><div><p class="fmb-approved-overline">Capabilities</p><h2 id="approvedWhyTitle">What FMB brings into the room.</h2></div><a href="/work-with-fmb/">Discuss your objective →</a></header>
    <div class="fmb-approved-cap-grid">${capabilityMarkup}</div>
  </section>

  <section class="fmb-approved-projects fmb-approved-glass" aria-labelledby="approvedProjectsTitle">
    <header class="fmb-approved-section-head"><div><p class="fmb-approved-overline">Selected work</p><h2 id="approvedProjectsTitle">Work that turns direction into something real.</h2></div><a href="/projects/">View all work →</a></header>
    <div class="fmb-approved-project-grid">
      <article class="fmb-approved-project yoni"><img src="/assets/images/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="Yoni, the digital companion of With Love, FMB"><div class="fmb-approved-project-index">01</div><div class="fmb-approved-project-copy"><small>Product and experience direction</small><h3>Yoni</h3><p>A private digital companion uniting reflection, reading, listening and support-oriented tools in one human-centered experience.</p><button type="button" data-fmb-v2-open="yoni">Read the project story →</button></div></article>
      <article class="fmb-approved-project mabayani"><div class="fmb-approved-project-index">02</div><div class="fmb-approved-project-copy"><small>Cultural research and storytelling</small><h3>Mabayani</h3><p>A source-first cultural project preserving Sambal identity, memory, language and heritage through research and editorial direction.</p><button type="button" data-fmb-v2-open="mabayani">Read the project story →</button></div></article>
      <article class="fmb-approved-project volunteer"><img src="/assets/images/volunteer/francine-leading-with-love-fmb.webp" width="1023" height="1537" loading="lazy" decoding="async" alt="Francine Marie Bautista working with a community"><div class="fmb-approved-project-index">03</div><div class="fmb-approved-project-copy"><small>Participation and public responsibility</small><h3>Community Work</h3><p>Real participation, facilitation and volunteer work documented with clarity, dignity and responsibility.</p><button type="button" data-fmb-v2-open="volunteer">See the work →</button></div></article>
    </div>
  </section>

  <section class="fmb-authority-map fmb-approved-glass" aria-labelledby="ecosystemMapTitle">
    <header class="fmb-approved-section-head"><div><p class="fmb-approved-overline">Structure</p><h2 id="ecosystemMapTitle">One direction. Clear boundaries.</h2></div><a href="/fmbandco/">Explore FMB&amp;CO. →</a></header>
    <div class="fmb-approved-map-grid"><article><small>Personal practice</small><h3>FMB</h3><p>Strategy, creative direction and storytelling for brands, organizations and communities.</p></article><article><small>Company</small><h3>FMB&amp;CO.</h3><p><a href="https://senzpr.com/">SENZ</a><span>Strategic communications and digital solutions</span><a href="https://thecognitainstitute.com/">Cognita</a><span>Learning, research and knowledge-building</span></p></article><article><small>Public projects and channels</small><h3>Independent platforms</h3><nav><a href="https://yoni.francinemariebautista.com/">Yoni</a><a href="/mabayani/">Mabayani</a><a href="/withlovefmb/">With Love, FMB</a><a href="/news/">FMB News</a></nav></article></div>
  </section>

  <div class="fmb-approved-library-grid fmb-approved-editorial-grid">
    <section class="fmb-approved-library-panel fmb-approved-glass" aria-labelledby="approvedNewsTitle">
      <header class="fmb-approved-section-head"><div><p class="fmb-approved-overline">Editorial platform</p><h2 id="approvedNewsTitle">FMB News</h2></div><a href="/news/">View all reports →</a></header>
      <article class="fmb-approved-news-lead"><img src="/assets/images/news/2026-08-08/cleopatra-barrera-reina-filipinas-2026.jpeg" width="1200" height="675" loading="lazy" decoding="async" alt="Cleopatra Barrera of Zambales"><div><small>Lead report</small><h3>Who Is Cleopatra Barrera? How Binibining Masinloc 2026 Rose to the Reina Filipinas National Stage</h3></div></article>
      <div class="fmb-approved-news-list"><a href="/news/who-is-lorna-kapunan-famous-cases-biography/"><span>Who Is Atty. Lorna Kapunan? Her famous cases, career and role in the Sara Duterte impeachment</span><time>Profile</time></a><a href="/news/cleopatra-barrera/"><span>Masinloc crowned her first. Months later, she carried Zambales to the national stage.</span><time>Pageantry</time></a></div>
    </section>

    <section class="fmb-approved-library-panel fmb-approved-glass" aria-labelledby="approvedMusicTitle">
      <header class="fmb-approved-section-head"><h2 id="approvedMusicTitle">Music Library</h2><a href="/music/">View all music →</a></header>
      <div class="fmb-approved-tags"><span>All</span><span>Calm</span><span>70s Feel Good</span><span>80s Feel Good</span><span>With Love OST</span></div>
      <div class="fmb-approved-albums"><a class="fmb-approved-album" href="/music/"><img src="/assets/images/music/fmb-calm-official-album-cover.jpg" loading="lazy" decoding="async" alt="FMB Calm album cover"><strong>Calm</strong><span>10 tracks</span></a><a class="fmb-approved-album" href="/music/"><img src="/assets/images/music/fmb-70s-feel-good-cover.svg" loading="lazy" decoding="async" alt="FMB 70s Feel Good album cover"><strong>70s Feel Good</strong><span>11 tracks</span></a><a class="fmb-approved-album" href="/music/"><img src="/assets/images/music/fmb-80s-feel-good-cover.svg" loading="lazy" decoding="async" alt="FMB 80s Feel Good album cover"><strong>80s Feel Good</strong><span>8 tracks</span></a><a class="fmb-approved-album" href="/music/"><img src="/assets/images/music/fmb-ost-with-love-fmb-cover.png" loading="lazy" decoding="async" alt="With Love, FMB original soundtrack cover"><strong>With Love OST</strong><span>2 tracks</span></a></div>
      <div class="fmb-approved-player"><div><strong>Quiet Enough to Breathe</strong><span>FMB Music</span></div><button type="button" aria-label="Open the FMB Music player" onclick="location.href='/music/'">▶</button></div>
    </section>

    <section class="fmb-approved-library-panel fmb-approved-glass" aria-labelledby="approvedBooksTitle">
      <header class="fmb-approved-section-head"><h2 id="approvedBooksTitle">eBook Library</h2><a href="/ebooks/">View all eBooks →</a></header>
      <div class="fmb-approved-tags"><span>All</span><span>Wellbeing</span><span>Identity and Belonging</span><span>Fully Open</span><span>First Chapter</span></div>
      <div class="fmb-approved-books"><a class="fmb-approved-book" href="/reading.html"><img src="/assets/images/reading/finding-your-way-back-cover.svg" loading="lazy" decoding="async" alt="Finding Your Way Back to Yourself cover"><strong>Finding Your Way Back</strong><span>Fully open</span></a><a class="fmb-approved-book" href="/coming-out-respect.html"><img src="/assets/images/reading/07883274-1340-48DC-A112-C4AD44B5ABD1.png" loading="lazy" decoding="async" alt="Pride. Identity. Love. cover"><strong>Pride. Identity. Love.</strong><span>Fully open</span></a><a class="fmb-approved-book" href="/men-can-cry.html"><img src="/assets/images/reading/E9562EB3-F505-4736-B5E8-E4D54C769059.png" loading="lazy" decoding="async" alt="Men Can Cry cover"><strong>Men Can Cry</strong><span>Fully open</span></a><a class="fmb-approved-book" href="/womens-health.html"><img src="/assets/images/reading/B4DDDB01-C125-4E08-8908-09A5FE5157E7.png" loading="lazy" decoding="async" alt="Women’s Health Matters cover"><strong>Women’s Health Matters</strong><span>First chapter</span></a></div>
    </section>
  </div>
  <section class="fmb-approved-inquiry" aria-labelledby="approvedInquiryTitle"><div><p class="fmb-approved-overline">Work with FMB</p><h2 id="approvedInquiryTitle">Bring us the real objective.</h2><p>Tell us what you are trying to achieve, who it needs to reach, and what decision must move next.</p></div><a href="/work-with-fmb/">Start a clear inquiry <span>→</span></a></section>
</section>`;

const heroStack=`<aside class="fmb-approved-hero-stack" aria-label="Live FMB headquarters information">
  <section class="fmb-approved-time fmb-approved-glass"><small>Philippine Standard Time · Live</small><time data-fmb-pst>Philippine Standard Time</time><span>Asia/Manila</span></section>
  <section class="fmb-approved-ecosystem fmb-approved-glass"><div class="fmb-approved-panel-head"><small>FMB&CO. Ecosystem</small><a href="/fmbandco/">All brands →</a></div><div class="fmb-approved-brand-row"><img src="/assets/images/projects/senz-logo-clean.png" width="1080" height="416" alt="SENZ"><img src="/assets/images/projects/cognita-logo-clean.png" width="1359" height="491" alt="Cognita"><img src="/assets/images/signature-transparent.png" width="981" height="441" alt="With Love, FMB"></div></section>
  <section class="fmb-approved-quote fmb-approved-glass"><blockquote>“Giving back is not separate from the business. It is the reason we build.”</blockquote><img src="${quotePortrait}" width="922" height="1152" alt="Francine Marie Bautista"></section>
</aside>`;

const homeFile=path.join(dist,'index.html');
let home=await readFile(homeFile,'utf8');
home=injectAssets(addBodyClass(home,'fmb-approved-dashboard'));
home=removeHomeDuplicates(home);
home=home.replace(/<h1 id="heroTitle">[\s\S]*?<\/h1>/i,'<h1 id="heroTitle">Direction<br>before <em>noise.</em></h1>');
home=home.replace(/<p class="role-line">[\s\S]*?<\/p>/i,'<p class="role-line">Strategist · Creative Director · Founder</p>');
home=home.replace(/<p class="hero-lede">[\s\S]*?<\/p>/i,'<p class="hero-lede">I help brands, organizations, and communities become clearer, stronger, and more intentional in how they show up and make impact.</p>');
home=home.replace(/<picture class="hero-portrait">[\s\S]*?<\/picture>/i,'<picture class="hero-portrait"><img id="homeHeroImage" src="/assets/images/fmb-approved/francine-portrait-front.webp" width="922" height="1152" alt="Francine Marie Bautista in the approved corporate portrait"></picture>');
home=home.replace(/(<\/section>\s*)(?=\s*<section[^>]*class="fmb-approved-control-center")/i,'$1');
home=home.replace(/<div class="hero-actions">[\s\S]*?<\/div>/i,'<div class="hero-actions"><a class="button primary" href="/work-with-fmb/">Work with FMB <span>→</span></a><a class="button secondary" href="#fmb-authority">Explore selected work</a></div>');
if(!home.includes('class="fmb-approved-control-center"'))home=home.replace(/(<\/section>\s*)(?=\s*<section[^>]*class="bottom-grid)/i,`$1\n${dashboard}\n`);
if(!home.includes('class="fmb-approved-control-center"'))home=home.replace('</main>',`${dashboard}\n</main>`);
await writeFile(homeFile,home,'utf8');

for(const page of ['news/index.html','music/index.html','ebooks/index.html']){
  const file=path.join(dist,page);
  let html=await readFile(file,'utf8');
  html=injectAssets(html);
  await writeFile(file,html,'utf8');
}

for(const required of ['fmb-approved-dashboard','fmb-approved-control-center','Direction<br>before <em>noise.</em>','fmb-approved-inquiry','fmb-authority-map']){
  if(!home.includes(required))throw new Error(`Approved homepage is missing ${required}`);
}
console.log('Built the approved FMB corporate luxury dashboard, project stories, News Center, Music Library, categorized eBook Library, and repaired homepage portrait placement.');
