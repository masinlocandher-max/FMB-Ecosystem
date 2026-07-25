import { copyFile, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(repositoryRoot,'dist');
const source=path.join(repositoryRoot,'apps','withlovefmb');
const cssSource=path.join(source,'assets','css','fmb-corporate-luxury-approved.css');
const cssTarget=path.join(dist,'assets','css','fmb-corporate-luxury-approved.css');
const purplePortrait='/assets/images/fmb-approved/fmb-purple-identity.svg';

for(const file of [cssSource,path.join(source,purplePortrait.replace(/^\/assets\//,'assets/'))]){
  const info=await stat(file);
  if(!info.isFile()||info.size<500)throw new Error(`Approved dashboard dependency is missing: ${file}`);
}
await copyFile(cssSource,cssTarget);

const fontLinks='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
const cssLink='<link rel="stylesheet" href="/assets/css/fmb-corporate-luxury-approved.css?v=20260725-approved-v1">';

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

const dashboard=`<section class="fmb-approved-control-center" aria-label="FMB corporate headquarters overview">
  <section class="fmb-approved-capabilities fmb-approved-glass" aria-labelledby="approvedWhyTitle">
    <header class="fmb-approved-cap-head"><h2 id="approvedWhyTitle">Why work with FMB?</h2><button type="button" data-fmb-v2-open="strategy">View full capabilities →</button></header>
    <div class="fmb-approved-cap-grid">${capabilityMarkup}</div>
  </section>

  <section class="fmb-approved-projects fmb-approved-glass" aria-labelledby="approvedProjectsTitle">
    <header class="fmb-approved-section-head"><h2 id="approvedProjectsTitle">My Projects</h2><a href="/projects/">View all projects →</a></header>
    <div class="fmb-approved-project-grid">
      <article class="fmb-approved-project yoni"><img src="/app/assets/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="Yoni, the digital companion of With Love, FMB"><div class="fmb-approved-project-copy"><small>With Love, FMB</small><h3>Yoni</h3><p>Your digital companion for wellbeing, identity, reflection, reading, listening, and personal growth.</p><button type="button" data-fmb-v2-open="yoni">Explore Yoni →</button></div></article>
      <article class="fmb-approved-project mabayani"><div class="fmb-approved-project-copy"><small>History. Expression. Remembrance.</small><h3>Mabayani</h3><p>A developing cultural and historical research project preserving stories, identity, and heritage of the Sambal people.</p><button type="button" data-fmb-v2-open="mabayani">Learn more →</button></div></article>
      <article class="fmb-approved-project volunteer"><img src="/assets/images/volunteer/francine-leading-with-love-fmb.webp" width="1023" height="1537" loading="lazy" decoding="async" alt="Francine Marie Bautista in a community setting"><div class="fmb-approved-project-copy"><small>On the ground. With people.</small><h3>Volunteer Activities</h3><p>Published community photographs showing participation, leadership, and responsibility.</p><button type="button" data-fmb-v2-open="volunteer">See our impact →</button></div></article>
    </div>
  </section>

  <div class="fmb-approved-library-grid">
    <section class="fmb-approved-library-panel fmb-approved-glass" aria-labelledby="approvedNewsTitle">
      <header class="fmb-approved-section-head"><h2 id="approvedNewsTitle">FMB News Center</h2><a href="/news/">View all news →</a></header>
      <article class="fmb-approved-news-lead"><img src="/assets/images/news/subic-aeta-dumpsite-iwitness.jpg" width="800" height="533" loading="lazy" decoding="async" alt="FMB News reporting image from the Subic Aeta dumpsite investigation"><div><small>Live Desk</small><h3>The Dumping Stopped. Subic’s Duty to Restore Has Not.</h3></div></article>
      <div class="fmb-approved-news-list"><a href="/news/remembering-amor-deloso/"><span>Remembering Amor Deloso, former governor of Zambales</span><time>Latest</time></a><a href="/news/pax-silica-water/"><span>Pax Silica will need a lot of water</span><time>Analysis</time></a><a href="/news/binibining-pilipinas-2026/"><span>North Luzon takes both Binibining Pilipinas crowns</span><time>Culture</time></a></div>
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
</section>`;

const heroStack=`<aside class="fmb-approved-hero-stack" aria-label="Live FMB headquarters information">
  <section class="fmb-approved-time fmb-approved-glass"><small>Philippine Standard Time · Live</small><time data-fmb-pst>Philippine Standard Time</time><span>Asia/Manila</span></section>
  <section class="fmb-approved-ecosystem fmb-approved-glass"><div class="fmb-approved-panel-head"><small>FMB&CO. Ecosystem</small><a href="/fmbandco/">All brands →</a></div><div class="fmb-approved-brand-row"><img src="/assets/images/projects/senz-logo-clean.png" width="1080" height="416" alt="SENZ"><img src="/assets/images/projects/cognita-logo-clean.png" width="1359" height="491" alt="Cognita"><img src="/assets/images/signature-transparent.png" width="981" height="441" alt="With Love, FMB"></div></section>
  <section class="fmb-approved-quote fmb-approved-glass"><blockquote>“Giving back is not separate from the business. It is the reason we build.”</blockquote><img src="${purplePortrait}" width="600" height="750" alt="Francine Marie Bautista purple identity portrait"></section>
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
if(!home.includes('class="fmb-approved-hero-stack"'))home=home.replace(/(<\/picture>)/i,`$1\n${heroStack}`);
if(!home.includes('class="fmb-approved-control-center"'))home=home.replace(/(<\/section>\s*)(?=\s*<section[^>]*class="bottom-grid)/i,`${dashboard}\n$1`);
if(!home.includes('class="fmb-approved-control-center"'))home=home.replace('</main>',`${dashboard}\n</main>`);
await writeFile(homeFile,home,'utf8');

for(const page of ['news/index.html','music/index.html','ebooks/index.html']){
  const file=path.join(dist,page);
  let html=await readFile(file,'utf8');
  html=injectAssets(html);
  await writeFile(file,html,'utf8');
}

for(const required of ['fmb-approved-dashboard','fmb-approved-control-center','fmb-approved-hero-stack','Direction<br>before <em>noise.</em>',purplePortrait]){
  if(!home.includes(required))throw new Error(`Approved homepage is missing ${required}`);
}
console.log('Built the approved FMB corporate luxury dashboard, project stories, News Center, Music Library, categorized eBook Library, and uploaded portrait placement.');
