import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const readBytes=relative=>readFile(path.join(root,relative));
const sharedPages=['aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const sharedMarkers=['/assets/css/fmb-network-optimized.css?v=20260722-enterprise-v5-exact-assets','/assets/js/fmb-network-optimized.js?v=20260722-enterprise-v5-exact-assets','/assets/js/az-assistant.js','data-fmb-network-schema','fmb-identity-v3'];
const retiredDeliveryMarkers=['/assets/css/fmb-network-core.css','/assets/css/fmb-network-pages.css','/assets/css/fmb-network-channels.css','/assets/css/fmb-network-reception.css','/assets/css/fmb-network-responsive.css','/assets/js/fmb-network-motion.js','/assets/js/fmb-reception-search.js','/assets/css/az-assistant.css'];
const retiredAssets=['/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','/assets/images/news/fmb-news-official.svg','/assets/images/channels/fmb-music-official.svg','/assets/images/channels/fmb-ebook-official.svg','https://at.adobe.com/'];
const approved='/assets/images/fmb-approved/';
const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
const manifestByKey=new Map(manifest.assets.map(asset=>[asset.key,asset]));
const assetPath=key=>`${approved}${manifestByKey.get(key).file}`;
const relativeAsset=key=>`assets/images/fmb-approved/${manifestByKey.get(key).file}`;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

function isWebP(bytes){return bytes.length>20&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP';}
function requireMarkers(html,page,markers){for(const marker of markers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);}
async function requireAsset(key){
  const relative=relativeAsset(key);
  const file=path.join(root,relative);
  const info=await stat(file);
  if(!info.isFile()||info.size<100)fail(`${relative} is missing or empty`);
  const bytes=await readBytes(relative);
  if(!isWebP(bytes))fail(`${relative} is not a valid WebP`);
  const expected=manifestByKey.get(key);
  if(sha256(bytes)!==expected.sha256)fail(`${relative} does not match the exact uploaded master`);
}

if(manifest.policy?.fallbacksAllowed!==false)fail('approved asset manifest permits fallbacks');
for(const key of manifestByKey.keys())await requireAsset(key);

for(const page of sharedPages){
  const html=await read(page);
  for(const marker of sharedMarkers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);
  for(const marker of retiredDeliveryMarkers)if(html.includes(marker))fail(`${page} still loads retired render-blocking asset ${marker}`);
  for(const marker of retiredAssets)if(html.includes(marker))fail(`${page} still renders retired substitute asset ${marker}`);
  if((html.match(/fmb-network-optimized\.css/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network stylesheet`);
  if((html.match(/fmb-network-optimized\.js/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network script`);
  if(!html.includes('viewport-fit=cover'))fail(`${page} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${page} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${page} has no canonical URL`);
  if(/<(?:audio|video)\b[^>]*\bautoplay\b/i.test(html))fail(`${page} contains autoplay media`);
}

const home=await read('index.html');
requireMarkers(home,'Home',[assetPath('masterTransparent'),assetPath('standingLandscape'),assetPath('seatedLandscape'),'Official Digital Headquarters','Yoni App 2.0','One Direction.','Ideas Turned','Mabayani','/assets/js/fmb-home-approved.js','/assets/js/az-assistant.js']);
for(const marker of retiredAssets)if(home.includes(marker))fail(`Home still renders retired substitute asset ${marker}`);
if((home.match(/fetchpriority=["']high["']/g)||[]).length>1)fail('Home has more than one high-priority image');
if(!/<img\b(?=[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'])(?=[^>]*loading=["']lazy["'])[^>]*>/i.test(home))fail('homepage still downloads below-fold Yoni artwork eagerly');

const about=await read('aboutfmb/index.html');
requireMarkers(about,'About FMB',[assetPath('standingLandscape'),assetPath('seatedLandscape'),assetPath('portraitFront'),'data-fmb-signature="about"']);
const withLove=await read('withlovefmb/index.html');
requireMarkers(withLove,'With Love FMB',[assetPath('seatedLandscape'),assetPath('portraitAngleRight'),'data-fmb-signature="withlove"','/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp']);
const news=await read('news/index.html');
requireMarkers(news,'FMB News',[assetPath('news'),assetPath('portraitFront'),'data-fmb-signature="news"']);
if((news.match(/<figcaption/g)||[]).length<7)fail('News visual credits are incomplete');
const music=await read('music/index.html');
requireMarkers(music,'FMB Music',[assetPath('music'),assetPath('portraitAngleLeft'),'data-fmb-signature="music"','id="audioPlayer"']);
const ebooks=await read('ebooks/index.html');
requireMarkers(ebooks,'FMB eBook',[assetPath('ebook'),assetPath('portraitAngleRight'),'data-fmb-signature="ebook"','data-ebook-filter="open"','data-ebook-filter="preview"']);
const company=await read('fmb&co/index.html');
requireMarkers(company,'FMB&CO.',[assetPath('standingLandscape'),assetPath('portraitFront'),'data-fmb-signature="fmbandco"']);
const senz=await read('fmb&co/senz/index.html');
requireMarkers(senz,'SENZ gateway',[assetPath('portraitAngleLeft'),'data-fmb-signature="senz"']);
const cognita=await read('fmb&co/cognita/index.html');
requireMarkers(cognita,'Cognita gateway',[assetPath('portraitAngleRight'),'data-fmb-signature="cognita"']);

const optimizedCss=await read('assets/css/fmb-network-optimized.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important','content-visibility:auto','backdrop-filter:none!important'])if(!optimizedCss.includes(marker))fail(`optimized design bundle is missing ${marker}`);
if(/(?:data-fmb-portrait|fmb-official-(?:landscape|portrait))[^}]*object-fit\s*:\s*cover/is.test(optimizedCss))fail('approved founder photography can still be destructively cropped');
const optimizedJs=await read('assets/js/fmb-network-optimized.js');
for(const marker of ['FMB Network','Search full articles, FAQs and brands'])if(!optimizedJs.includes(marker))fail(`optimized interaction bundle is missing ${marker}`);
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(optimizedJs))fail('optimized motion still distorts founder photography');

const receptionLoader=await read('assets/js/az-assistant.js');
if(!receptionLoader.includes(assetPath('masterTransparent'))&&!receptionLoader.includes(assetPath('masterSquare')))fail('Reception Desk is missing an approved FMB identity');
for(const marker of retiredAssets)if(receptionLoader.includes(marker))fail(`Reception Desk still renders retired substitute asset ${marker}`);

console.log(`FMB Network exact-asset gate passed for ${manifest.assets.length} uploaded masters, the final custom homepage, and ${sharedPages.length} shared ecosystem pages.`);
