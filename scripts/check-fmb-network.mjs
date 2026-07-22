import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const readBytes=relative=>readFile(path.join(root,relative));
const requiredPages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const sharedMarkers=['/assets/css/fmb-network-optimized.css?v=20260722-enterprise-v4','/assets/js/fmb-network-optimized.js?v=20260722-enterprise-v4','/assets/js/az-assistant.js','data-fmb-network-schema','fmb-identity-v3'];
const retiredDeliveryMarkers=['/assets/css/fmb-network-core.css','/assets/css/fmb-network-pages.css','/assets/css/fmb-network-channels.css','/assets/css/fmb-network-reception.css','/assets/css/fmb-network-responsive.css','/assets/js/fmb-network-motion.js','/assets/js/fmb-reception-search.js','/assets/css/az-assistant.css'];

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

for(const page of requiredPages){
  const html=await read(page);
  for(const marker of sharedMarkers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);
  for(const marker of retiredDeliveryMarkers)if(html.includes(marker))fail(`${page} still loads retired render-blocking asset ${marker}`);
  if((html.match(/fmb-network-optimized\.css/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network stylesheet`);
  if((html.match(/fmb-network-optimized\.js/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network script`);
  if(!html.includes('viewport-fit=cover'))fail(`${page} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${page} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${page} has no canonical URL`);
}

const home=await read('index.html');
for(const marker of ['/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','data-fmb-portrait="landscape-standing"','/assets/images/home/francine-home-founder-hd.webp','data-fmb-portrait="landscape-seated"','Yoni, our complete companion app','Digital Space for Rent','Institute Qualifying Test','@bb.fmb','/BinibiningFrancineMarie','withlovefmb@gmail.com'])if(!home.includes(marker))fail(`homepage is missing ${marker}`);
if(!/<img\b[^>]*loading=["']lazy["'][^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp/i.test(home))fail('homepage still downloads the below-fold Yoni artwork eagerly');

const about=await read('aboutfmb/index.html');
for(const marker of ['/assets/images/home/francine-home-hero-hd.webp','data-fmb-portrait="landscape-standing"','/assets/images/home/francine-home-founder-hd.webp','data-fmb-portrait="landscape-seated"'])if(!about.includes(marker))fail(`About FMB is missing ${marker}`);

const withLove=await read('withlovefmb/index.html');
for(const marker of ['/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp'])if(!withLove.includes(marker))fail(`With Love, FMB is missing protected asset ${marker}`);

const company=await read('fmb&co/index.html');
for(const marker of ['/assets/images/home/francine-home-hero-hd.webp','data-fmb-portrait="landscape-standing"','/assets/images/home/francine-home-founder-hd.webp','data-fmb-portrait="landscape-seated"'])if(!company.includes(marker))fail(`FMB&Co. is missing ${marker}`);

const news=await read('news/index.html');
if(!news.includes('/assets/images/news/fmb-news-official.svg'))fail('News does not use the official FMB News identity');
if((news.match(/<figcaption/g)||[]).length<7)fail('News visual credits are incomplete');
if(!news.includes('data-fmb-signature="news"'))fail('News is missing the designated founder section');
const music=await read('music/index.html');
if(!music.includes('/assets/images/channels/fmb-music-official.svg'))fail('Music does not use the official FMB Music identity');
if(!music.includes('data-fmb-signature="music"'))fail('Music is missing the designated founder section');
const ebooks=await read('ebooks/index.html');
if(!ebooks.includes('/assets/images/channels/fmb-ebook-official.svg'))fail('eBook does not use the official FMB eBook identity');
if(!ebooks.includes('data-fmb-signature="ebook"'))fail('eBook is missing the designated founder section');

for(const [asset,width,height] of [['assets/images/home/francine-home-hero-hd.webp',1364,768],['assets/images/home/francine-home-founder-hd.webp',1364,768]]){
  const dimensions=webpDimensions(await readBytes(asset),asset);
  if(dimensions.width!==width||dimensions.height!==height)fail(`${asset} must remain ${width}x${height}; found ${dimensions.width}x${dimensions.height}`);
}
for(const asset of ['assets/images/news/fmb-news-official.svg','assets/images/channels/fmb-music-official.svg','assets/images/channels/fmb-ebook-official.svg']){
  const svg=await read(asset);
  if(!svg.includes('<svg')||!svg.includes('viewBox='))fail(`${asset} is not scalable`);
}

const optimizedCss=await read('assets/css/fmb-network-optimized.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important','aspect-ratio:1364/768!important','content-visibility:auto','backdrop-filter:none!important'])if(!optimizedCss.includes(marker))fail(`optimized design bundle is missing ${marker}`);
if(/\.final-home-hero\s+\.hero-photo\s+img\s*\{[^}]*object-fit\s*:\s*cover/is.test(optimizedCss))fail('homepage hero still crops the approved founder portrait');
const optimizedJs=await read('assets/js/fmb-network-optimized.js');
for(const marker of ['FMB Network','Search full articles, FAQs and brands'])if(!optimizedJs.includes(marker))fail(`optimized interaction bundle is missing ${marker}`);
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(optimizedJs))fail('optimized motion still distorts founder photography');

const receptionLoader=await read('assets/js/az-assistant.js');
for(const marker of ['pearly-lazy-trigger','requestIdleCallback','prefetchReception','pearly:ready'])if(!receptionLoader.includes(marker))fail(`Pearly lazy loader is missing ${marker}`);
if(/observer\.observe\(document\.documentElement|script\.defer=false/.test(receptionLoader))fail('Pearly still blocks the page with a document-wide observer or synchronous core load');
const receptionSearch=await read('assets/js/fmb-reception-search.js');
for(const marker of ['Search full articles, FAQs and brands','Women’s Health Matters','Pax Silica','Cognita Institute of AI'])if(!receptionSearch.includes(marker))fail(`Reception Desk search is missing ${marker}`);
if(receptionSearch.includes('observe(document.documentElement'))fail('Reception search still watches the complete document');
const builtSiteScript=await read('assets/js/site.js');
if(builtSiteScript.includes("ensureStylesheet('/assets/css/az-assistant.css")||builtSiteScript.includes("loadScript('/assets/js/az-assistant.js"))fail('legacy site.js still starts a duplicate eager Reception load');

const redesignSource=await readFile(path.join(sourceRoot,'scripts/post-build-network-redesign.mjs'),'utf8');
if(redesignSource.includes('francine-serving-with-volunteers.webp')||redesignSource.includes('wlf-volunteer-photo'))fail('redesign script attempts to replace protected volunteer imagery');
console.log(`FMB principal-page identity, portraits, protected volunteer assets, SEO, performance and interaction checks passed for ${requiredPages.length} pages.`);
