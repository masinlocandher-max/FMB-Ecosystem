import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const cssHrefs=[
  '/assets/css/fmb-network-core.css?v=20260722-network-v2',
  '/assets/css/fmb-network-pages.css?v=20260722-network-v2',
  '/assets/css/fmb-network-channels.css?v=20260722-network-v2',
  '/assets/css/fmb-network-reception.css?v=20260722-network-v2',
  '/assets/css/fmb-network-responsive.css?v=20260722-network-v2',
];
const jsSrcs=[
  '/assets/js/fmb-network-motion.js?v=20260722-network-v2',
  '/assets/js/fmb-reception-search.js?v=20260722-network-v2',
];

const pages=[
  {file:'index.html',key:'home'},
  {file:'aboutfmb/index.html',key:'about'},
  {file:'withlovefmb/index.html',key:'withlove'},
  {file:'news/index.html',key:'news'},
  {file:'music/index.html',key:'music'},
  {file:'ebooks/index.html',key:'ebook'},
  {file:'fmb&co/index.html',key:'fmbandco'},
  {file:'fmb&co/senz/index.html',key:'senz'},
  {file:'fmb&co/cognita/index.html',key:'cognita'},
];

function injectAssets(html){
  for(const href of cssHrefs){
    if(!html.includes(href))html=html.replace('</head>',`<link rel="stylesheet" href="${href}">\n</head>`);
  }
  const schema={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebSite','@id':'https://www.francinemariebautista.com/#website','url':'https://www.francinemariebautista.com/','name':'Francine Marie Bautista FMB Network','publisher':{'@id':'https://www.francinemariebautista.com/#francine'}},
      {'@type':'Person','@id':'https://www.francinemariebautista.com/#francine','name':'Francine Marie Bautista','alternateName':['FMB','Binibining Francine Marie Bautista'],'url':'https://www.francinemariebautista.com/aboutfmb/','email':'mailto:withlovefmb@gmail.com','sameAs':['https://www.instagram.com/bb.fmb/','https://www.facebook.com/BinibiningFrancineMarie']},
      {'@type':'Organization','@id':'https://www.francinemariebautista.com/#fmbandco','name':'FMB&Co.','url':'https://www.francinemariebautista.com/fmb&co/','founder':{'@id':'https://www.francinemariebautista.com/#francine'},'email':'mailto:withlovefmb@gmail.com'}
    ]
  };
  if(!html.includes('data-fmb-network-schema'))html=html.replace('</head>',`<script type="application/ld+json" data-fmb-network-schema>${JSON.stringify(schema)}</script>\n</head>`);
  for(const src of jsSrcs){
    if(!html.includes(src))html=html.replace('</body>',`<script src="${src}" defer></script>\n</body>`);
  }
  return html;
}

function addBodyIdentity(html,key){
  return html.replace(/<body([^>]*)>/i,(match,attrs)=>{
    let next=attrs||'';
    if(/class=["'][^"']*["']/i.test(next)){
      next=next.replace(/class=(["'])([^"']*)\1/i,(m,q,value)=>`class=${q}${value} fmb-network-page fmb-network-${key}${q}`);
    }else next+=` class="fmb-network-page fmb-network-${key}"`;
    if(!/data-fmb-network-page=/i.test(next))next+=` data-fmb-network-page="${key}"`;
    return `<body${next}>`;
  });
}

function setMeta(html,attribute,key,content){
  const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(`<meta\\s+[^>]*${attribute}=["']${escaped}["'][^>]*>`,'i');
  const tag=`<meta ${attribute}="${key}" content="${content}">`;
  return pattern.test(html)?html.replace(pattern,tag):html.replace('</head>',`${tag}\n</head>`);
}

function replaceTitle(html,title){return html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${title}</title>`)}

function transformHome(html){
  html=html.replace(
    /<div class="wire-window"><div class="wire-track">[\s\S]*?<\/div><\/div>/i,
    `<div class="wire-window"><div class="wire-track"><span>Now leading: Yoni, our complete companion app</span><span>SENZ Digital Space for Rent is opening for inquiries</span><span>Cognita Institute Qualifying Test launches soon</span><span>FMB News, community work, music and original publications continue across the network</span><span aria-hidden="true">Now leading: Yoni, our complete companion app</span><span aria-hidden="true">SENZ Digital Space for Rent is opening for inquiries</span><span aria-hidden="true">Cognita Institute Qualifying Test launches soon</span><span aria-hidden="true">FMB News, community work, music and original publications continue across the network</span></div></div>`
  );
  if(!html.includes('id="network-now"')){
    const section=`
<section class="fmb-network-now" id="network-now" aria-labelledby="networkNowTitle">
  <div class="fmb-network-now-head network-reveal">
    <div><p class="eyebrow">Now across the FMB network</p><h2 id="networkNowTitle">The releases, opportunities and next moves that matter now.</h2></div>
    <p>The homepage is our official network desk. Yoni leads the current release cycle, followed by verified offers and launches from SENZ, Cognita, FMB News, community work and the woman behind the direction.</p>
  </div>
  <div class="fmb-network-now-grid">
    <a class="fmb-network-now-card primary network-reveal" href="https://yoni.francinemariebautista.com/">
      <span class="status">Now available</span><span class="mark"><img src="/app/assets/yoni/yoni-wordmark.png" width="1200" height="480" alt="Yoni"></span>
      <h3>Yoni, our complete companion app.</h3><p>Listen, read, write, check in and find practical support inside one warm, private mobile experience.</p><b>Open Yoni →</b>
    </a>
    <a class="fmb-network-now-card senz network-reveal network-stagger-1" href="https://senzpr.com/">
      <span class="status">Opening for inquiries</span><span class="mark"><img src="/assets/images/projects/senz-logo-clean.png" width="1080" height="416" alt="SENZ Marketing and Digital Solutions"></span>
      <h3>Digital Space for Rent.</h3><p>A SENZ digital visibility offer for brands and campaigns that need a polished public space with strategic presentation.</p><b>Visit SENZ →</b>
    </a>
    <a class="fmb-network-now-card cognita network-reveal network-stagger-2" href="https://thecognitainstitute.com/">
      <span class="status">Launching soon</span><span class="mark"><img src="/assets/images/projects/cognita-logo-clean.png" width="1359" height="491" alt="Cognita Institute of AI"></span>
      <h3>Institute Qualifying Test.</h3><p>A structured entry point for the Cognita learning pathway, designed to identify readiness and the right starting level.</p><b>Explore Cognita →</b>
    </a>
  </div>
</section>`;
    html=html.replace('<section class="offers-overview"',`${section}\n<section class="offers-overview"`);
  }
  return html;
}

function replaceFounderPicture(html,className,src,alt){
  const pattern=new RegExp(`<picture class="${className.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}">[\\s\\S]*?<\\/picture>`,'i');
  const replacement=`<picture class="${className}"><img src="${src}" width="1364" height="768" alt="${alt}" loading="eager" decoding="async"></picture>`;
  return pattern.test(html)?html.replace(pattern,replacement):html;
}

function transformAbout(html){
  html=replaceFounderPicture(html,'fco-founder-portrait','/assets/images/home/francine-home-hero-hd.webp','Francine Marie Bautista in the approved standing HD founder portrait');
  html=replaceFounderPicture(html,'fmb-about-portrait','/assets/images/home/francine-home-founder-hd.webp','Francine Marie Bautista in the approved seated HD founder portrait');
  html=setMeta(html,'property','og:image','https://www.francinemariebautista.com/assets/images/home/francine-home-hero-hd.webp');
  html=setMeta(html,'name','twitter:image','https://www.francinemariebautista.com/assets/images/home/francine-home-hero-hd.webp');
  return html;
}

function transformFmbCo(html){
  html=replaceFounderPicture(html,'fco-founder-portrait','/assets/images/home/francine-home-hero-hd.webp','Francine Marie Bautista in the approved standing HD founder portrait');
  html=replaceFounderPicture(html,'fco-founder-card-portrait','/assets/images/home/francine-home-founder-hd.webp','Francine Marie Bautista in the approved seated HD founder portrait');
  return html;
}

function transformMusic(html){
  html=replaceTitle(html,'FMB Music | Original Music and Digital Releases');
  html=setMeta(html,'property','og:site_name','FMB Music');
  html=setMeta(html,'property','og:title','FMB Music | Original Music and Digital Releases');
  html=setMeta(html,'property','og:image','https://www.francinemariebautista.com/assets/images/channels/fmb-music-official.webp');
  html=setMeta(html,'name','twitter:image','https://www.francinemariebautista.com/assets/images/channels/fmb-music-official.webp');
  html=html.replaceAll('/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-music-official.webp');
  html=html.replaceAll('width="1414" height="405"','width="1411" height="320"');
  html=html.replaceAll('alt="FMB&amp;CO."','alt="FMB Music"');
  html=html.replaceAll('FMB&amp;CO. Music','FMB Music');
  return html;
}

function transformEbook(html){
  html=replaceTitle(html,'FMB eBook | Digital Publications by Francine Marie Bautista');
  html=setMeta(html,'property','og:site_name','FMB eBook');
  html=setMeta(html,'property','og:title','FMB eBook | Digital Publications by Francine Marie Bautista');
  html=setMeta(html,'property','og:image','https://www.francinemariebautista.com/assets/images/channels/fmb-ebook-official.webp');
  html=setMeta(html,'name','twitter:image','https://www.francinemariebautista.com/assets/images/channels/fmb-ebook-official.webp');
  html=html.replaceAll('/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-ebook-official.webp');
  html=html.replaceAll('width="1414" height="405"','width="1398" height="315"');
  html=html.replaceAll('alt="FMB&amp;CO."','alt="FMB eBook"');
  html=html.replaceAll('FMB&amp;CO. eBooks','FMB eBook');
  return html;
}

for(const page of pages){
  const filePath=path.join(root,page.file);
  let html=await readFile(filePath,'utf8');
  html=injectAssets(html);
  html=addBodyIdentity(html,page.key);
  if(page.key==='home')html=transformHome(html);
  if(page.key==='about')html=transformAbout(html);
  if(page.key==='fmbandco')html=transformFmbCo(html);
  if(page.key==='music')html=transformMusic(html);
  if(page.key==='ebook')html=transformEbook(html);
  await writeFile(filePath,html,'utf8');
}

console.log(`Applied FMB Network redesign to ${pages.length} public pages.`);
