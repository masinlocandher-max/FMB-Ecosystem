import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB visual-integrity check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const readBytes=relative=>readFile(path.join(root,relative));
const requiredPages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const networkPages=requiredPages.filter(page=>page!=='index.html');
const sharedMarkers=['/assets/css/fmb-network-optimized.css?v=20260722-enterprise-v5-exact-assets','/assets/js/fmb-network-optimized.js?v=20260722-enterprise-v5-exact-assets','/assets/js/az-assistant.js','data-fmb-network-schema','fmb-identity-v3'];
const retiredDeliveryMarkers=['/assets/css/fmb-network-core.css','/assets/css/fmb-network-pages.css','/assets/css/fmb-network-channels.css','/assets/css/fmb-network-reception.css','/assets/css/fmb-network-responsive.css','/assets/js/fmb-network-motion.js','/assets/js/fmb-reception-search.js','/assets/css/az-assistant.css'];
const prohibitedFallbacks=['/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','/assets/images/fmb-official-2026/fmb-master-square.webp','/assets/images/fmb-official-2026/fmb-news-official.webp','/assets/images/fmb-official-2026/fmb-music-official.webp'];
const renderedChannels={news:'/assets/images/news/fmb-news-official.svg',music:'/assets/images/channels/fmb-music-official.svg',ebook:'/assets/images/channels/fmb-ebook-official.svg'};
const browserSafeNews='/assets/images/fmb-approved/fmb-news-browser-safe.png';

function webpDimensions(bytes,name){
  if(bytes.subarray(0,4).toString('ascii')!=='RIFF'||bytes.subarray(8,12).toString('ascii')!=='WEBP')fail(`${name} is not a valid WebP`);
  let offset=12;
  while(offset+8<=bytes.length){
    const type=bytes.subarray(offset,offset+4).toString('ascii');
    const size=bytes.readUInt32LE(offset+4);
    const data=offset+8;
    if(type==='VP8X')return {width:1+bytes[data+4]+(bytes[data+5]<<8)+(bytes[data+6]<<16),height:1+bytes[data+7]+(bytes[data+8]<<8)+(bytes[data+9]<<16)};
    if(type==='VP8 '&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a)return {width:bytes.readUInt16LE(data+6)&0x3fff,height:bytes.readUInt16LE(data+8)&0x3fff};
    if(type==='VP8L'&&bytes[data]===0x2f){const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};}
    offset=data+size+(size%2);
  }
  fail(`${name} has unreadable WebP dimensions`);
}
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const requireMarkers=(html,page,markers)=>{for(const marker of markers)if(!html.includes(marker))fail(`${page} is missing ${marker}`)};

const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
if(manifest.policy.fallbacksAllowed!==false)fail('the approved asset manifest permits fallbacks');
for(const asset of manifest.assets){
  const relative=`assets/images/fmb-approved/${asset.file}`;
  const bytes=await readBytes(relative);
  const dimensions=webpDimensions(bytes,relative);
  if(dimensions.width!==asset.width||dimensions.height!==asset.height)fail(`${relative} has incorrect dimensions`);
  if(sha256(bytes)!==asset.sha256)fail(`${relative} does not match the exact approved master`);
}
const safeNewsBytes=await readBytes(browserSafeNews.replace(/^\//,''));
if(safeNewsBytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail('the browser-safe News lockup is not a valid transparent PNG');
if(safeNewsBytes.readUInt32BE(16)!==909||safeNewsBytes.readUInt32BE(20)!==210)fail('the browser-safe News lockup has incorrect dimensions');
if(sha256(safeNewsBytes)!=='52daa8db5781512d49df51f5eef3ebdd6408f405ccc15f864a36c18d590bc2b8')fail('the browser-safe News lockup does not match the approved derived asset');
for(const rendered of Object.values(renderedChannels)){
  const svg=await read(rendered.replace(/^\//,''));
  if(!svg.includes('<svg')||!svg.includes('<title'))fail(`${rendered} is not an accessible SVG delivery wrapper`);
  if(/<rect\b[^>]*(?:fill=["'](?:#fff|white)|style=["'][^"']*fill:\s*(?:#fff|white))/i.test(svg))fail(`${rendered} introduces a white logo background`);
}

for(const page of requiredPages){
  const html=await read(page);
  for(const marker of retiredDeliveryMarkers)if(html.includes(marker))fail(`${page} still loads retired render-blocking asset ${marker}`);
  for(const marker of prohibitedFallbacks)if(html.includes(marker))fail(`${page} still renders prohibited fallback ${marker}`);
  if(!html.includes('viewport-fit=cover'))fail(`${page} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${page} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${page} has no canonical URL`);
}
for(const page of networkPages){
  const html=await read(page);
  for(const marker of sharedMarkers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);
  if((html.match(/fmb-network-optimized\.css/g)||[]).length!==1)fail(`${page} must load exactly one network stylesheet`);
  if((html.match(/fmb-network-optimized\.js/g)||[]).length!==1)fail(`${page} must load exactly one network script`);
}

const approved='/assets/images/fmb-approved/';
const home=await read('index.html');
requireMarkers(home,'Home',[`${approved}fmb-master-transparent.webp`,`${approved}fmb-master-purple-square.webp`,`${approved}francine-standing-landscape.webp`,`${approved}francine-seated-landscape.webp`,browserSafeNews,`${approved}fmb-music-official-transparent.webp`,`${approved}fmb-ebook-official-transparent.webp`,'/assets/js/fmb-home-approved.js','Official Digital Headquarters','Yoni App 2.0','One Direction.','Ideas Turned','Mabayani']);
if((home.match(/fetchpriority=["']high["']/g)||[]).length!==1)fail('homepage must have exactly one high-priority image');
const yoniArtwork=[...home.matchAll(/<img\b[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'][^>]*>/gi)].map(match=>match[0]);
if(!yoniArtwork.length||yoniArtwork.some(tag=>!(/\bloading=["']lazy["']/i.test(tag))))fail('homepage downloads below-fold Yoni artwork eagerly');
if(!home.includes('body{visibility:visible}')||home.includes('body{visibility:hidden}'))fail('homepage still depends on JavaScript to become visible');

const pageContracts=[
  ['aboutfmb/index.html','About FMB',[`${approved}francine-standing-landscape.webp`,`${approved}francine-seated-landscape.webp`,`${approved}francine-portrait-front.webp`,'data-fmb-signature="about"']],
  ['withlovefmb/index.html','With Love FMB',[`${approved}francine-seated-landscape.webp`,`${approved}francine-portrait-angle-right.webp`,'data-fmb-signature="withlove"','/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp']],
  ['news/index.html','FMB News',[browserSafeNews,`${approved}francine-portrait-front.webp`,'data-fmb-signature="news"','class="nc-mobile-dock"']],
  ['music/index.html','FMB Music',[`${approved}fmb-music-official-transparent.webp`,`${approved}francine-portrait-angle-left.webp`,'data-fmb-signature="music"','31 published tracks','fmb-product-menu']],
  ['ebooks/index.html','FMB eBook',[`${approved}fmb-ebook-official-transparent.webp`,`${approved}francine-portrait-angle-right.webp`,'data-fmb-signature="ebook"','Six books. Clear access.','fmb-product-menu']],
  ['fmb&co/index.html','FMB&CO.',[`${approved}francine-standing-landscape.webp`,`${approved}francine-portrait-front.webp`,'data-fmb-signature="fmbandco"']],
  ['fmb&co/senz/index.html','SENZ gateway',[`${approved}francine-portrait-angle-left.webp`,'data-fmb-signature="senz"']],
  ['fmb&co/cognita/index.html','Cognita gateway',[`${approved}francine-portrait-angle-right.webp`,'data-fmb-signature="cognita"']]
];
for(const [file,label,markers] of pageContracts)requireMarkers(await read(file),label,markers);
if(((await read('news/index.html')).match(/<figcaption/g)||[]).length<7)fail('News visual credits are incomplete');

for(const key of ['home','about','withlove','news','music','ebooks','company']){
  const css=await read(`assets/css/fmb-page-${key}.css`);
  for(const marker of ['background-color:transparent!important','border-color:transparent!important','/assets/images/fmb-approved/'])if(!css.includes(marker))fail(`page bundle ${key} is missing transparent-logo rule ${marker}`);
  if(/img\[src\*=["']\/assets\/images\/fmb-approved\/["']\][^{]*\{[^}]*background(?:-color)?\s*:\s*(?:#fff|white)/is.test(css))fail(`page bundle ${key} applies a white background to an approved logo`);
}
for(const [key,marker] of [['music','.music-layout'],['music','.fmb-product-header'],['ebooks','.ebook-library-grid'],['ebooks','body.fmb-ebooks-modern']]){
  const css=await read(`assets/css/fmb-page-${key}.css`);
  if(!css.includes(marker))fail(`page bundle ${key} did not inline required modern product CSS ${marker}`);
}

const optimizedCss=await read('assets/css/fmb-network-optimized.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important','content-visibility:auto'])if(!optimizedCss.includes(marker))fail(`optimized design bundle is missing ${marker}`);
if(/(?:data-fmb-portrait|fmb-official-(?:landscape|portrait))[^}]*object-fit\s*:\s*cover/is.test(optimizedCss))fail('approved founder photography can still be destructively cropped');
const optimizedJs=await read('assets/js/fmb-network-optimized.js');
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(optimizedJs))fail('optimized motion still distorts founder photography');

const redesignSource=await readFile(path.join(sourceRoot,'scripts/post-build-network-redesign.mjs'),'utf8');
if(redesignSource.includes('francine-serving-with-volunteers.webp')||redesignSource.includes('wlf-volunteer-photo'))fail('redesign script attempts to replace protected volunteer imagery');
console.log(`FMB visual-integrity gate verified ${manifest.assets.length} exact masters, the hashed transparent News derivative, clean product CSS, responsive page contracts, and ${requiredPages.length} principal pages.`);
