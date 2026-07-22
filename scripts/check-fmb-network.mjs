import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const readBytes=relative=>readFile(path.join(root,relative));
const requiredPages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const sharedMarkers=['/assets/css/fmb-network-optimized.css?v=20260722-enterprise-v5-exact-assets','/assets/js/fmb-network-optimized.js?v=20260722-enterprise-v5-exact-assets','/assets/js/az-assistant.js','data-fmb-network-schema','fmb-identity-v3'];
const retiredDeliveryMarkers=['/assets/css/fmb-network-core.css','/assets/css/fmb-network-pages.css','/assets/css/fmb-network-channels.css','/assets/css/fmb-network-reception.css','/assets/css/fmb-network-responsive.css','/assets/js/fmb-network-motion.js','/assets/js/fmb-reception-search.js','/assets/css/az-assistant.css'];
const prohibitedBrandFallbacks=['/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','/assets/images/news/fmb-news-official.svg','/assets/images/channels/fmb-music-official.svg','/assets/images/fmb-official-2026/fmb-master-square.webp'];
const exactChannels={
  news:{relative:'assets/images/fmb-official-2026/fmb-news-official.webp',publicPath:'/assets/images/fmb-official-2026/fmb-news-official.webp',manifestKey:'newsLogo'},
  music:{relative:'assets/images/fmb-official-2026/fmb-music-official.webp',publicPath:'/assets/images/fmb-official-2026/fmb-music-official.webp',manifestKey:'musicLogo'},
  ebook:{relative:'assets/images/channels/fmb-ebook-official.svg',publicPath:'/assets/images/channels/fmb-ebook-official.svg',manifestKey:'ebookLogo'}
};

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
function sha256(bytes){return createHash('sha256').update(bytes).digest('hex');}
function requireMarkers(html,page,markers){for(const marker of markers)if(!html.includes(marker))fail(`${page} is missing exact asset marker ${marker}`);}

const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
if(manifest.policy.fallbacksAllowed!==false)fail('approved asset manifest permits fallbacks');
const manifestByKey=new Map(manifest.assets.map(asset=>[asset.key,asset]));
for(const asset of manifest.assets){
  const relative=`assets/images/fmb-approved/${asset.file}`;
  const bytes=await readBytes(relative);
  const dimensions=webpDimensions(bytes,relative);
  if(dimensions.width!==asset.width||dimensions.height!==asset.height)fail(`${relative} must be ${asset.width}x${asset.height}; found ${dimensions.width}x${dimensions.height}`);
  const receivedHash=sha256(bytes);
  if(receivedHash!==asset.sha256)fail(`${relative} does not match the exact uploaded master. Expected ${asset.sha256}, received ${receivedHash}`);
}
for(const channel of Object.values(exactChannels)){
  const expected=manifestByKey.get(channel.manifestKey);
  if(!expected)fail(`approved asset manifest is missing ${channel.manifestKey}`);
  if(channel.relative.endsWith('.webp')){
    const bytes=await readBytes(channel.relative);
    const dimensions=webpDimensions(bytes,channel.relative);
    if(dimensions.width!==expected.width||dimensions.height!==expected.height)fail(`${channel.relative} must be ${expected.width}x${expected.height}`);
    if(sha256(bytes)!==expected.sha256)fail(`${channel.relative} is not byte-identical to the uploaded ${channel.manifestKey} master`);
  }
}

for(const page of requiredPages){
  const html=await read(page);
  for(const marker of sharedMarkers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);
  for(const marker of retiredDeliveryMarkers)if(html.includes(marker))fail(`${page} still loads retired render-blocking asset ${marker}`);
  for(const marker of prohibitedBrandFallbacks)if(html.includes(marker))fail(`${page} still renders prohibited substitute asset ${marker}`);
  if((html.match(/fmb-network-optimized\.css/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network stylesheet`);
  if((html.match(/fmb-network-optimized\.js/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network script`);
  if(!html.includes('viewport-fit=cover'))fail(`${page} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${page} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${page} has no canonical URL`);
}

const approved='/assets/images/fmb-approved/';
const home=await read('index.html');
requireMarkers(home,'Home',[`${approved}fmb-master-transparent.webp`,`${approved}francine-standing-landscape.webp`,'data-fmb-portrait="standing-landscape-exact"',`${approved}francine-seated-landscape.webp`,'data-fmb-portrait="seated-landscape-exact"','Yoni, our complete companion app','Digital Space for Rent','Institute Qualifying Test','@bb.fmb','/BinibiningFrancineMarie','withlovefmb@gmail.com']);
if(!/<img\b[^>]*loading=["']lazy["'][^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp/i.test(home))fail('homepage still downloads the below-fold Yoni artwork eagerly');

const about=await read('aboutfmb/index.html');
requireMarkers(about,'About FMB',[`${approved}francine-standing-landscape.webp`,`${approved}francine-seated-landscape.webp`,`${approved}francine-portrait-front.webp`,'data-fmb-signature="about"']);

const withLove=await read('withlovefmb/index.html');
requireMarkers(withLove,'With Love FMB',[`${approved}francine-seated-landscape.webp`,`${approved}francine-portrait-angle-right.webp`,'data-fmb-signature="withlove"','/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp']);

const news=await read('news/index.html');
requireMarkers(news,'FMB News',[exactChannels.news.publicPath,`${approved}francine-portrait-front.webp`,'data-fmb-signature="news"']);
if((news.match(/<figcaption/g)||[]).length<7)fail('News visual credits are incomplete');

const music=await read('music/index.html');
requireMarkers(music,'FMB Music',[exactChannels.music.publicPath,`${approved}francine-portrait-angle-left.webp`,'data-fmb-signature="music"']);

const ebooks=await read('ebooks/index.html');
requireMarkers(ebooks,'FMB eBook',[exactChannels.ebook.publicPath,`${approved}francine-portrait-angle-right.webp`,'data-fmb-signature="ebook"']);

const company=await read('fmb&co/index.html');
requireMarkers(company,'FMB&CO.',[`${approved}francine-standing-landscape.webp`,`${approved}francine-portrait-front.webp`,'data-fmb-signature="fmbandco"']);
const senz=await read('fmb&co/senz/index.html');
requireMarkers(senz,'SENZ gateway',[`${approved}francine-portrait-angle-left.webp`,'data-fmb-signature="senz"']);
const cognita=await read('fmb&co/cognita/index.html');
requireMarkers(cognita,'Cognita gateway',[`${approved}francine-portrait-angle-right.webp`,'data-fmb-signature="cognita"']);

const optimizedCss=await read('assets/css/fmb-network-optimized.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important','content-visibility:auto','backdrop-filter:none!important'])if(!optimizedCss.includes(marker))fail(`optimized design bundle is missing ${marker}`);
if(/(?:data-fmb-portrait|fmb-official-(?:landscape|portrait))[^}]*object-fit\s*:\s*cover/is.test(optimizedCss))fail('approved founder photography can still be destructively cropped');
const optimizedJs=await read('assets/js/fmb-network-optimized.js');
for(const marker of ['FMB Network','Search full articles, FAQs and brands'])if(!optimizedJs.includes(marker))fail(`optimized interaction bundle is missing ${marker}`);
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(optimizedJs))fail('optimized motion still distorts founder photography');

const receptionLoader=await read('assets/js/az-assistant.js');
for(const marker of ['pearly-lazy-trigger','requestIdleCallback','prefetchReception','pearly:ready',`${approved}fmb-master-purple-square.webp`])if(!receptionLoader.includes(marker))fail(`Pearly lazy loader is missing ${marker}`);
if(/observer\.observe\(document\.documentElement|script\.defer=false/.test(receptionLoader))fail('Pearly still blocks the page with a document-wide observer or synchronous core load');
const receptionSearch=await read('assets/js/fmb-reception-search.js');
for(const marker of ['Search full articles, FAQs and brands','Women’s Health Matters','Pax Silica','Cognita Institute of AI'])if(!receptionSearch.includes(marker))fail(`Reception Desk search is missing ${marker}`);
if(receptionSearch.includes('observe(document.documentElement'))fail('Reception search still watches the complete document');
const builtSiteScript=await read('assets/js/site.js');
if(builtSiteScript.includes("ensureStylesheet('/assets/css/az-assistant.css")||builtSiteScript.includes("loadScript('/assets/js/az-assistant.js"))fail('legacy site.js still starts a duplicate eager Reception load');
if(!builtSiteScript.includes('hasDedicatedDock'))fail('site.js does not prevent duplicate mobile navigation on pages with a dedicated dock');

const redesignSource=await readFile(path.join(sourceRoot,'scripts/post-build-network-redesign.mjs'),'utf8');
if(redesignSource.includes('francine-serving-with-volunteers.webp')||redesignSource.includes('wlf-volunteer-photo'))fail('redesign script attempts to replace protected volunteer imagery');
for(const fallback of prohibitedBrandFallbacks)if(redesignSource.includes(`'${fallback}'`)&&!redesignSource.includes('replaceImagesUsing'))fail(`redesign source retains unsafe fallback ${fallback}`);
console.log(`FMB brand-accuracy gate verified ${manifest.assets.length} uploaded binaries, GitHub-owned channel lockups, collision-safe mobile navigation, and page assignments across ${requiredPages.length} principal pages.`);
