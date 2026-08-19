import { copyFile, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(repositoryRoot,'dist');
const source=path.join(repositoryRoot,'apps','withlovefmb');
const cssSource=path.join(source,'assets','css','fmb-corporate-luxury-v2.css');
const jsSource=path.join(source,'assets','js','fmb-corporate-luxury-v2.js');
const cssTarget=path.join(dist,'assets','css','fmb-corporate-luxury-v2.css');
const jsTarget=path.join(dist,'assets','js','fmb-corporate-luxury-v2.js');

for(const file of [cssSource,jsSource]){
  const info=await stat(file);
  if(!info.isFile()||info.size<500)throw new Error(`Corporate luxury dependency is missing: ${file}`);
}
await copyFile(cssSource,cssTarget);
await copyFile(jsSource,jsTarget);

const assetExists=async relativePath=>{
  try{return (await stat(path.join(dist,relativePath.replace(/^\//,'')))).isFile();}catch{return false;}
};
const requiredAssets=[
  '/assets/images/fmb-approved/francine-standing-landscape.webp',
  '/assets/images/fmb-approved/francine-portrait-front.webp',
  '/assets/images/yoni/yoni-hero.webp',
  '/assets/images/volunteer/francine-leading-with-love-fmb.webp',
  '/assets/images/volunteer/francine-serving-with-volunteers.webp',
  '/assets/images/volunteer/community-and-volunteer-team.webp',
  '/assets/images/volunteer/volunteers-serving-together.webp',
];
for(const asset of requiredAssets)if(!await assetExists(asset))throw new Error(`Required corporate luxury asset is missing: ${asset}`);

const fontLinks=`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;
const cssLink='<link rel="stylesheet" href="/assets/css/fmb-corporate-luxury-v2.css?v=20260725-v2">';
const jsLink='<script src="/assets/js/fmb-corporate-luxury-v2.js?v=20260725-v2" defer></script>';

function addBodyClass(html,className){
  return html.replace(/<body([^>]*)>/i,(match,attrs='')=>{
    if(/class=(['"])([^'"]*)\1/i.test(attrs)){
      attrs=attrs.replace(/class=(['"])([^'"]*)\1/i,(whole,quote,value)=>{
        const classes=new Set(value.split(/\s+/).filter(Boolean));
        classes.add('fmb-corporate-luxury-v2');
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    }else attrs+=` class="fmb-corporate-luxury-v2 ${className}"`;
    return `<body${attrs}>`;
  });
}

function injectAssets(html){
  if(!html.includes('family=DM+Serif+Display'))html=html.replace('</head>',`${fontLinks}\n${cssLink}\n</head>`);
  if(!html.includes('fmb-corporate-luxury-v2.js'))html=html.replace('</body>',`${jsLink}\n</body>`);
  return html;
}

const whySection=`<section class="fmb-v2-why" id="why-fmb" aria-labelledby="whyFmbTitle">
  <div class="fmb-v2-why-grid">
    <figure class="fmb-v2-why-portrait">
      <img src="/assets/images/fmb-approved/francine-portrait-front.webp" width="922" height="1152" loading="lazy" decoding="async" alt="Francine Marie Bautista in a corporate white-shirt portrait">
      <figcaption><strong>Francine Marie Bautista</strong><br>Creative director, brand strategist, entrepreneur, educator, storyteller, and founder.</figcaption>
    </figure>
    <div class="fmb-v2-why-copy">
      <h2 id="whyFmbTitle">You do not need more noise. You need direction.</h2>
      <p>Francine Marie Bautista brings strategy, communication, creativity, technology, learning, culture, and community into one clear system. The value is not simply producing a logo, campaign, website, photo, article, or event. It is understanding what the work must mean, how people should experience it, and what must happen next.</p>
      <div class="fmb-v2-value-list">
        <article class="fmb-v2-value"><span>01</span><div><h3>Turn complexity into a clear position</h3><p>Clarify the audience, message, public role, brand architecture, and decision-making direction before spending resources on execution.</p></div><button type="button" data-fmb-v2-open="strategy" aria-label="Learn about FMB strategy">↗</button></article>
        <article class="fmb-v2-value"><span>02</span><div><h3>Shape perception without losing substance</h3><p>Build a credible narrative, reputation, and communication system supported by proof rather than empty presentation.</p></div><button type="button" data-fmb-v2-open="perception" aria-label="Learn about public perception work">↗</button></article>
        <article class="fmb-v2-value"><span>03</span><div><h3>Direct creative work toward a real objective</h3><p>Connect photography, design, content, media, websites, digital products, campaigns, and public experiences to one strategic purpose.</p></div><button type="button" data-fmb-v2-open="creative" aria-label="Learn about creative direction">↗</button></article>
      </div>
      <div class="fmb-v2-actions" style="margin-top:34px"><a href="/work-with-fmb/" style="background:#21122d;color:#fff">Work with FMB</a><a href="/aboutfmb/" style="border:1px solid rgba(33,18,45,.2);color:#21122d">See the full profile</a></div>
    </div>
  </div>
</section>`;

const projectsSection=`<section class="fmb-v2-projects" id="signature-projects" aria-labelledby="signatureProjectsTitle">
  <header class="fmb-v2-projects-head"><h2 id="signatureProjectsTitle">Projects that show how the work becomes real.</h2><p>Each project has a different public role. They are presented through their purpose, current stage, and Francine’s responsibility rather than as interchangeable brand cards.</p></header>
  <div class="fmb-v2-project-grid">
    <article class="fmb-v2-project yoni" data-fmb-v2-open="yoni" tabindex="0" role="button" aria-label="Open the Yoni project story">
      <img src="/assets/images/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="Yoni, the digital companion of With Love, FMB">
      <div class="fmb-v2-project-copy"><small>Digital companion</small><h3>Yoni</h3><p>A warm private companion experience for reflection, reading, listening, and support-oriented tools.</p><button type="button" data-fmb-v2-open="yoni">View project story</button></div>
    </article>
    <article class="fmb-v2-project mabayani" data-fmb-v2-open="mabayani" tabindex="0" role="button" aria-label="Open the Mabayani project story">
      <div class="fmb-v2-project-copy"><small>Culture and historical research</small><h3>Mabayani</h3><p>History. Expression. Remembrance. A developing Sambal cultural and historical project built around careful research.</p><button type="button" data-fmb-v2-open="mabayani">View project story</button></div>
    </article>
    <article class="fmb-v2-project volunteer" data-fmb-v2-open="volunteer" tabindex="0" role="button" aria-label="Open the volunteer and community work story">
      <img src="/assets/images/volunteer/francine-leading-with-love-fmb.webp" width="1023" height="1537" loading="lazy" decoding="async" alt="Francine Marie Bautista in a community setting">
      <div class="fmb-v2-project-copy"><small>Community and advocacy</small><h3>Volunteer work</h3><p>Published community activities presented as evidence of participation, leadership, and responsibility.</p><button type="button" data-fmb-v2-open="volunteer">View community record</button></div>
    </article>
  </div>
</section>`;

const volunteerSection=`<section class="fmb-v2-volunteer-proof" aria-labelledby="volunteerProofTitle">
  <div class="fmb-v2-volunteer-grid">
    <div class="fmb-v2-volunteer-copy"><h2 id="volunteerProofTitle">Leadership should be visible in the work, not only in the title.</h2><p>The volunteer photographs already published by With Love, FMB remain unchanged. They are presented as a documentary record and are not given invented event names, dates, beneficiaries, or roles.</p><div class="fmb-v2-actions" style="margin-top:28px"><a href="/communityengagements/" style="background:#21122d;color:#fff">Open the community record</a><button type="button" data-fmb-v2-open="volunteer" style="border:1px solid rgba(33,18,45,.18);background:#fff;color:#21122d">Why this work matters</button></div></div>
    <div class="fmb-v2-volunteer-gallery">
      <figure><img src="/assets/images/volunteer/francine-serving-with-volunteers.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="People gathered at a community activity"></figure>
      <figure><img src="/assets/images/volunteer/community-and-volunteer-team.webp" width="1280" height="854" loading="lazy" decoding="async" alt="A group gathered for a community photograph"></figure>
      <figure><img src="/assets/images/volunteer/volunteers-serving-together.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="People working together at a community activity"></figure>
    </div>
  </div>
</section>`;

const modal=`<div class="fmb-v2-modal" data-fmb-v2-modal aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="fmbV2ModalTitle"><div class="fmb-v2-modal-panel fmb-v2-glass-dark"><button class="fmb-v2-modal-close" type="button" data-fmb-v2-modal-close aria-label="Close project story">×</button><small style="color:#d9bd83;text-transform:uppercase;letter-spacing:.14em;font-weight:800">FMB project story</small><h2 id="fmbV2ModalTitle" data-fmb-v2-modal-title></h2><p data-fmb-v2-modal-copy></p><div class="fmb-v2-modal-columns" data-fmb-v2-modal-columns></div><div class="fmb-v2-actions" style="margin-top:34px"><a data-fmb-v2-modal-link href="#" style="background:#fff;color:#170d20"></a></div></div></div>`;

const bookCategories=`<nav class="fmb-v2-book-categories" aria-label="Browse eBook categories"><button type="button" data-fmb-v2-book-category="all" aria-pressed="true">All books</button><button type="button" data-fmb-v2-book-category="wellbeing" aria-pressed="false">Wellbeing</button><button type="button" data-fmb-v2-book-category="identity" aria-pressed="false">Identity and belonging</button><button type="button" data-fmb-v2-book-category="open" aria-pressed="false">Fully open</button><button type="button" data-fmb-v2-book-category="preview" aria-pressed="false">First chapter</button></nav>`;

const newsCommand=`<section class="fmb-v2-news-command" aria-label="FMB News center overview" style="padding:18px clamp(18px,4vw,60px);background:#fff;border-bottom:1px solid rgba(40,20,29,.1)"><div style="max-width:1480px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap"><strong style="font-size:13px;letter-spacing:.12em;text-transform:uppercase">FMB News Center</strong><span style="color:#70636a;font-size:13px">Public-interest reporting · Context · Source visibility · Corrections</span><a href="#editorial-standard" style="font-weight:800;color:#8b1538;text-decoration:none">Editorial standards →</a></div></section>`;

const pages=[
  ['index.html','fmb-unified-home'],
  ['news/index.html','fmb-unified-news'],
  ['music/index.html','fmb-unified-music'],
  ['ebooks/index.html','fmb-unified-ebooks'],
  ['aboutfmb/index.html','fmb-unified-about'],
  ['projects/index.html','fmb-unified-projects'],
  ['mabayani/index.html','fmb-unified-mabayani'],
  ['communityengagements/index.html','fmb-unified-community'],
];
let changed=0;
for(const [name,className] of pages){
  const file=path.join(dist,name);
  let html=await readFile(file,'utf8');
  const before=html;
  html=injectAssets(addBodyClass(html,className));
  if(name==='index.html'&&!html.includes('id="why-fmb"')){
    html=html.replace(/(<section\b[^>]*class="bulletin[^>]*>)/i,`${whySection}\n${projectsSection}\n$1`);
    html=html.replace(/(<section\b[^>]*class="bottom-grid[^>]*>)/i,`${volunteerSection}\n$1`);
    html=html.replace('</body>',`${modal}\n</body>`);
    html=html.replace('<h1 id="heroTitle">Francine<br>Marie Bautista</h1>','<h1 id="heroTitle">Direction<br>before noise.</h1>');
    html=html.replace(/<p class="role-line">[\s\S]*?<\/p>/i,'<p class="role-line">Francine Marie Bautista · Creative Director · Brand Strategist · Entrepreneur · Educator · Storyteller · Founder</p>');
    html=html.replace(/<p class="hero-tagline">[\s\S]*?<\/p>/i,'<p class="hero-tagline">Why FMB? Because clarity changes what becomes possible.</p>');
    html=html.replace(/<p class="hero-lede">[\s\S]*?<\/p>/i,'<p class="hero-lede">For people and organizations that need a clearer position, stronger public meaning, disciplined creative direction, and one connected path from idea to execution.</p>');
  }
  if(name==='ebooks/index.html'&&!html.includes('data-fmb-v2-book-category'))html=html.replace(/(<div class="ebook-toolbar[^>]*>)/i,`${bookCategories}\n$1`);
  if(name==='news/index.html'&&!html.includes('fmb-v2-news-command'))html=html.replace(/(<main\b)/i,`${newsCommand}\n$1`);
  if(html!==before){await writeFile(file,html,'utf8');changed+=1;}
}

console.log(`Applied the FMB corporate luxury redesign to ${changed} generated pages with a Why FMB value story, transparent modals, project narratives, news-center treatment, Spotify-inspired music, categorized reading, and original volunteer photography.`);
