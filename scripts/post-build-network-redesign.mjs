import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const cssOutput='/assets/css/fmb-network-optimized.css?v=20260722-official-assets-v3';
const jsOutput='/assets/js/fmb-network-optimized.js?v=20260722-network-fast-v1';
const assets={
  masterSquare:'/assets/images/fmb-official-2026/fmb-master-square.webp',
  masterTransparent:'/assets/images/fmb-official-2026/fmb-master-transparent.webp',
  news:'/assets/images/fmb-official-2026/fmb-news-official.webp',
  music:'/assets/images/fmb-official-2026/fmb-music-official.webp',
  ebook:'/assets/images/channels/fmb-ebook-official.svg',
  standing:'/assets/images/home/francine-home-hero-hd.webp',
  seated:'/assets/images/home/francine-home-founder-hd.webp',
};
const cssSources=[
  'assets/css/fmb-luxury-tokens.css',
  'assets/css/fmb-network-core.css',
  'assets/css/fmb-network-pages.css',
  'assets/css/fmb-network-channels.css',
  'assets/css/fmb-network-reception.css',
  'assets/css/fmb-network-responsive.css',
  'assets/css/fmb-identity-v3.css',
];
const jsSources=['assets/js/fmb-network-motion.js','assets/js/fmb-reception-search.js'];
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

async function buildOptimizedBundles(){
  const cssParts=await Promise.all(cssSources.map(async relative=>{
    const css=await readFile(path.join(root,relative),'utf8');
    return css.replace(/^\s*@import\s+url\([^\n]+fmb-luxury-tokens\.css[^\n]+\);?\s*$/gmi,'');
  }));
  await writeFile(path.join(root,'assets/css/fmb-network-optimized.css'),cssParts.join('\n\n'),'utf8');
  const jsParts=await Promise.all(jsSources.map(relative=>readFile(path.join(root,relative),'utf8')));
  await writeFile(path.join(root,'assets/js/fmb-network-optimized.js'),jsParts.join('\n\n'),'utf8');
}

function injectAssets(html){
  html=html
    .replace(/<link\s+[^>]*href=["'][^"']*fmb-network-(?:core|pages|channels|reception|responsive|optimized)\.css[^"']*["'][^>]*>\s*/gi,'')
    .replace(/<link\s+[^>]*href=["'][^"']*fmb-identity-v3\.css[^"']*["'][^>]*>\s*/gi,'')
    .replace(/<script\s+[^>]*src=["'][^"']*fmb-(?:network-motion|reception-search|network-optimized)\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  if(!html.includes(cssOutput))html=html.replace('</head>',`<link rel="stylesheet" href="${cssOutput}">\n</head>`);
  const schema={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebSite','@id':'https://www.francinemariebautista.com/#website','url':'https://www.francinemariebautista.com/','name':'Francine Marie Bautista FMB Network','publisher':{'@id':'https://www.francinemariebautista.com/#francine'}},
      {'@type':'Person','@id':'https://www.francinemariebautista.com/#francine','name':'Francine Marie Bautista','alternateName':['FMB','Binibining Francine Marie Bautista'],'url':'https://www.francinemariebautista.com/aboutfmb/','image':'https://www.francinemariebautista.com/assets/images/home/francine-home-hero-hd.webp','email':'mailto:withlovefmb@gmail.com','sameAs':['https://www.instagram.com/bb.fmb/','https://www.facebook.com/BinibiningFrancineMarie']},
      {'@type':'Organization','@id':'https://www.francinemariebautista.com/#fmbandco','name':'FMB&Co.','url':'https://www.francinemariebautista.com/fmb&co/','founder':{'@id':'https://www.francinemariebautista.com/#francine'},'email':'mailto:withlovefmb@gmail.com'}
    ]
  };
  if(!html.includes('data-fmb-network-schema'))html=html.replace('</head>',`<script type="application/ld+json" data-fmb-network-schema>${JSON.stringify(schema)}</script>\n</head>`);
  if(!html.includes(jsOutput))html=html.replace('</body>',`<script src="${jsOutput}" defer></script>\n</body>`);
  return html;
}

function addBodyIdentity(html,key){
  return html.replace(/<body([^>]*)>/i,(match,attrs)=>{
    let next=attrs||'';
    if(/class=["'][^"']*["']/i.test(next))next=next.replace(/class=(["'])([^"']*)\1/i,(m,q,value)=>`class=${q}${value} fmb-network-page fmb-network-${key} fmb-identity-v3${q}`);
    else next+=` class="fmb-network-page fmb-network-${key} fmb-identity-v3"`;
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
function addLazyAttributes(tag){
  let next=tag;
  if(!/\sloading=/i.test(next))next=next.replace(/<img/i,'<img loading="lazy"');
  if(!/\sdecoding=/i.test(next))next=next.replace(/<img/i,'<img decoding="async"');
  return next;
}
function optimiseKnownImages(html){
  for(const asset of ['/app/assets/yoni/yoni-hero.webp','/app/assets/yoni/yoni-wordmark.png','/assets/images/projects/senz-logo-clean.png','/assets/images/projects/cognita-logo-clean.png']){
    const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    html=html.replace(new RegExp(`<img\\b[^>]*src=["']${escaped}["'][^>]*>`,'gi'),tag=>addLazyAttributes(tag));
  }
  return html;
}
function markPortraitTag(tag,name,loading='lazy'){
  let next=tag.replace(/\sdata-fmb-portrait=["'][^"']*["']/i,'').replace(/\sloading=["'][^"']*["']/i,'').replace(/\sdecoding=["'][^"']*["']/i,'').replace(/\sfetchpriority=["'][^"']*["']/i,'');
  next=next.replace(/<img/i,`<img data-fmb-portrait="${name}" loading="${loading}" decoding="async"${loading==='eager'?' fetchpriority="high"':''}`);
  return next;
}
function markPortraitById(html,id,name,loading='lazy'){
  const escaped=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return html.replace(new RegExp(`<img\\b[^>]*id=["']${escaped}["'][^>]*>`,'i'),tag=>markPortraitTag(tag,name,loading));
}
function replaceFounderPicture(html,className,src,alt,name,loading='lazy'){
  const escaped=className.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(`<picture class=["']${escaped}["']>[\\s\\S]*?<\\/picture>`,'i');
  const priority=loading==='eager'?' fetchpriority="high"':'';
  const replacement=`<picture class="${className} fmb-official-landscape"><img data-fmb-portrait="${name}" src="${src}" width="1364" height="768" alt="${alt}" loading="${loading}" decoding="async"${priority}></picture>`;
  return pattern.test(html)?html.replace(pattern,replacement):html;
}
function insertSignature(html,key,portrait,name,eyebrow,title,body){
  if(html.includes(`data-fmb-signature="${key}"`))return html;
  const section=`\n<section class="fmb-identity-signature" data-fmb-signature="${key}" aria-label="Francine Marie Bautista founder profile">\n  <picture class="fmb-identity-signature-media"><img data-fmb-portrait="${name}" src="${portrait}" width="1364" height="768" loading="lazy" decoding="async" alt="Francine Marie Bautista in an approved landscape founder portrait"></picture>\n  <div class="fmb-identity-signature-copy"><small>${eyebrow}</small><h2>${title}</h2><p>${body}</p></div>\n</section>\n`;
  return html.replace('</main>',`${section}</main>`);
}

function transformHome(html){
  html=html.replaceAll('/assets/images/home/fmb-home-logo.webp',assets.masterSquare);
  html=markPortraitById(html,'homeHeroImage','landscape-standing','eager');
  html=markPortraitById(html,'homeFounderImage','landscape-seated','lazy');
  html=html.replace(/<div class="wire-window"><div class="wire-track">[\s\S]*?<\/div><\/div>/i,`<div class="wire-window"><div class="wire-track"><span>Now leading: Yoni, our complete companion app</span><span>SENZ Digital Space for Rent is opening for inquiries</span><span>Cognita Institute Qualifying Test launches soon</span><span>FMB News, community work, music and original publications continue across the network</span><span aria-hidden="true">Now leading: Yoni, our complete companion app</span><span aria-hidden="true">SENZ Digital Space for Rent is opening for inquiries</span><span aria-hidden="true">Cognita Institute Qualifying Test launches soon</span><span aria-hidden="true">FMB News, community work, music and original publications continue across the network</span></div></div>`);
  if(!html.includes('id="network-now"')){
    const section=`\n<section class="fmb-network-now" id="network-now" aria-labelledby="networkNowTitle"><div class="fmb-network-now-head network-reveal"><div><p class="eyebrow">Now across the FMB network</p><h2 id="networkNowTitle">The releases, opportunities and next moves that matter now.</h2></div><p>The homepage is our official network desk. Yoni leads the current release cycle, followed by verified offers and launches from SENZ, Cognita, FMB News, community work and the woman behind the direction.</p></div><div class="fmb-network-now-grid"><a class="fmb-network-now-card primary network-reveal" href="https://yoni.francinemariebautista.com/"><span class="status">Now available</span><span class="mark"><img loading="lazy" decoding="async" src="/app/assets/yoni/yoni-wordmark.png" width="1200" height="480" alt="Yoni"></span><h3>Yoni, our complete companion app.</h3><p>Listen, read, write, check in and find practical support inside one warm, private mobile experience.</p><b>Open Yoni →</b></a><a class="fmb-network-now-card senz network-reveal network-stagger-1" href="https://senzpr.com/"><span class="status">Opening for inquiries</span><span class="mark"><img loading="lazy" decoding="async" src="/assets/images/projects/senz-logo-clean.png" width="1080" height="416" alt="SENZ Marketing and Digital Solutions"></span><h3>Digital Space for Rent.</h3><p>A SENZ digital visibility offer for brands and campaigns that need a polished public space with strategic presentation.</p><b>Visit SENZ →</b></a><a class="fmb-network-now-card cognita network-reveal network-stagger-2" href="https://thecognitainstitute.com/"><span class="status">Launching soon</span><span class="mark"><img loading="lazy" decoding="async" src="/assets/images/projects/cognita-logo-clean.png" width="1359" height="491" alt="Cognita Institute of AI"></span><h3>Institute Qualifying Test.</h3><p>A structured entry point for the Cognita learning pathway, designed to identify readiness and the right starting level.</p><b>Explore Cognita →</b></a></div></section>`;
    html=html.replace('<section class="offers-overview"',`${section}\n<section class="offers-overview"`);
  }
  return optimiseKnownImages(html);
}
function transformAbout(html){
  html=replaceFounderPicture(html,'fco-founder-portrait',assets.standing,'Francine Marie Bautista in the supplied standing landscape portrait','landscape-standing','eager');
  html=replaceFounderPicture(html,'fmb-about-portrait',assets.seated,'Francine Marie Bautista in the supplied seated landscape portrait','landscape-seated','lazy');
  html=setMeta(html,'property','og:image',`https://www.francinemariebautista.com${assets.standing}`);
  return setMeta(html,'name','twitter:image',`https://www.francinemariebautista.com${assets.standing}`);
}
function transformWithLove(html){
  html=html.replace(/<img\b[^>]*class=["'][^"']*wlf-portrait[^"']*["'][^>]*>/i,`<img class="wlf-portrait" data-fmb-portrait="landscape-seated" src="${assets.seated}" width="1364" height="768" loading="eager" decoding="async" fetchpriority="high" alt="Francine Marie Bautista in the supplied seated landscape portrait">`);
  return html;
}
function transformNews(html){
  html=html.replaceAll('/assets/images/news/fmb-news-official.svg',assets.news).replaceAll('width="1500" height="620"','width="909" height="210"');
  html=html.replace(new RegExp(`<img\\b([^>]*src=["']${assets.news.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*)>`,'gi'),'<img class="fmb-channel-logo-v3"$1>');
  html=setMeta(html,'property','og:image',`https://www.francinemariebautista.com${assets.news}`);
  html=setMeta(html,'name','twitter:image',`https://www.francinemariebautista.com${assets.news}`);
  return insertSignature(html,'news',assets.seated,'landscape-seated','Founder and editor','The person behind the newsroom.','Francine Marie Bautista directs the editorial standard, public-interest framing and visual identity of FMB News. Reporting remains sourced, credited and clearly separated from commentary.');
}
function transformMusic(html){
  html=replaceTitle(html,'FMB Music | Original Music and Digital Releases');
  html=html.replaceAll('/assets/images/channels/fmb-music-official.svg',assets.music).replaceAll('/assets/images/fmbandco/fmbandco-primary-reversed.png',assets.music).replaceAll('width="1400" height="320"','width="916" height="212"').replaceAll('width="1414" height="405"','width="916" height="212"').replaceAll('alt="FMB&amp;CO."','alt="FMB Music"').replaceAll('FMB&amp;CO. Music','FMB Music');
  html=html.replace(new RegExp(`<img\\b([^>]*src=["']${assets.music.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*)>`,'gi'),'<img class="fmb-channel-logo-v3"$1>');
  html=setMeta(html,'property','og:image',`https://www.francinemariebautista.com${assets.music}`);
  html=setMeta(html,'name','twitter:image',`https://www.francinemariebautista.com${assets.music}`);
  return insertSignature(html,'music',assets.standing,'landscape-standing','FMB Music direction','Original sound with a clear point of view.','The music channel is directed by Francine Marie Bautista and organized as a premium listening library across calm, feel-good and official soundtrack collections.');
}
function transformEbook(html){
  html=replaceTitle(html,'FMB eBook | Digital Publications by Francine Marie Bautista');
  html=html.replaceAll('/assets/images/fmbandco/fmbandco-primary-reversed.png',assets.ebook).replaceAll('alt="FMB&amp;CO."','alt="FMB eBook"').replaceAll('FMB&amp;CO. eBooks','FMB eBook');
  html=html.replace(new RegExp(`<img\\b([^>]*src=["']${assets.ebook.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}["'][^>]*)>`,'gi'),'<img class="fmb-channel-logo-v3"$1>');
  return insertSignature(html,'ebook',assets.seated,'landscape-seated','FMB eBook direction','Reading with care and intention.','Francine Marie Bautista leads the original publication program across wellbeing, identity, health, care, confidence and practical self-development.');
}
function transformFmbCo(html){
  html=replaceFounderPicture(html,'fco-founder-portrait',assets.standing,'Francine Marie Bautista in the supplied standing landscape portrait','landscape-standing','eager');
  return replaceFounderPicture(html,'fco-founder-card-portrait',assets.seated,'Francine Marie Bautista in the supplied seated landscape portrait','landscape-seated','lazy');
}
function transformGateway(html,key){
  if(key==='senz')return insertSignature(html,'senz',assets.standing,'landscape-standing','Founder-led direction','Clarity is the operating standard.','Francine Marie Bautista founded the ecosystem and directs the strategic relationship between SENZ, its clients and the wider FMB network.');
  return insertSignature(html,'cognita',assets.seated,'landscape-seated','Founder-led learning','Practical, responsible and human-centered.','Francine Marie Bautista directs Cognita as the education and responsible AI learning company within the FMB network.');
}

await buildOptimizedBundles();
for(const page of pages){
  const filePath=path.join(root,page.file);
  let html=await readFile(filePath,'utf8');
  html=injectAssets(html);
  html=addBodyIdentity(html,page.key);
  if(page.key==='home')html=transformHome(html);
  if(page.key==='about')html=transformAbout(html);
  if(page.key==='withlove')html=transformWithLove(html);
  if(page.key==='news')html=transformNews(html);
  if(page.key==='music')html=transformMusic(html);
  if(page.key==='ebook')html=transformEbook(html);
  if(page.key==='fmbandco')html=transformFmbCo(html);
  if(page.key==='senz'||page.key==='cognita')html=transformGateway(html,page.key);
  html=optimiseKnownImages(html);
  await writeFile(filePath,html,'utf8');
}
console.log(`Applied the official FMB asset registry and portrait composition rules to ${pages.length} public pages without touching volunteer imagery.`);
