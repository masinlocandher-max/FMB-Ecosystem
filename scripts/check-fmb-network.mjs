import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const readBytes=relative=>readFile(path.join(root,relative));
const requiredPages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const sharedMarkers=['/assets/css/fmb-network-optimized.css?v=20260722-enterprise-v5-exact-assets','/assets/js/fmb-network-optimized.js?v=20260722-enterprise-v5-exact-assets','/assets/js/az-assistant.js','data-fmb-network-schema','fmb-identity-v3'];
const retiredDeliveryMarkers=['/assets/css/fmb-network-core.css','/assets/css/fmb-network-pages.css','/assets/css/fmb-network-channels.css','/assets/css/fmb-network-reception.css','/assets/css/fmb-network-responsive.css','/assets/js/fmb-network-motion.js','/assets/js/fmb-reception-search.js','/assets/css/az-assistant.css'];
const prohibitedDependencies=['https://at.adobe.com/','/assets/images/fmb-approved/fmb-master-purple-square.webp','/assets/images/fmb-approved/fmb-master-transparent.webp','/assets/images/fmb-approved/francine-standing-landscape.webp','/assets/images/fmb-approved/francine-seated-landscape.webp','/assets/images/fmb-approved/francine-portrait-angle-left.webp','/assets/images/fmb-approved/francine-portrait-angle-right.webp','/assets/images/fmb-approved/francine-portrait-front.webp'];
const requiredAssets=[
  'assets/images/home/fmb-home-logo.webp',
  'assets/images/home/francine-home-hero-hd.webp',
  'assets/images/home/francine-home-founder-hd.webp',
  'assets/images/news/fmb-news-official.svg',
  'assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
];

function isWebP(bytes){return bytes.length>20&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP';}
function requireMarkers(html,page,markers){for(const marker of markers)if(!html.includes(marker))fail(`${page} is missing current marker ${marker}`);}
async function requireAsset(relative){
  const file=path.join(root,relative);
  const info=await stat(file);
  if(!info.isFile()||info.size<100)fail(`${relative} is missing or empty`);
  if(relative.endsWith('.webp')&&!isWebP(await readBytes(relative)))fail(`${relative} is not a valid WebP`);
  if(relative.endsWith('.svg')&&!(await read(relative)).includes('<svg'))fail(`${relative} is not a valid SVG`);
}

for(const asset of requiredAssets)await requireAsset(asset);

for(const page of requiredPages){
  const html=await read(page);
  for(const marker of sharedMarkers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);
  for(const marker of retiredDeliveryMarkers)if(html.includes(marker))fail(`${page} still loads retired render-blocking asset ${marker}`);
  for(const marker of prohibitedDependencies)if(html.includes(marker))fail(`${page} still depends on unavailable asset ${marker}`);
  if((html.match(/fmb-network-optimized\.css/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network stylesheet`);
  if((html.match(/fmb-network-optimized\.js/g)||[]).length!==1)fail(`${page} must load exactly one FMB Network script`);
  if(!html.includes('viewport-fit=cover'))fail(`${page} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${page} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${page} has no canonical URL`);
  if(/<(?:audio|video)\b[^>]*\bautoplay\b/i.test(html))fail(`${page} contains autoplay media`);
}

const home=await read('index.html');
requireMarkers(home,'Home',['/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-portrait="repository-founder"']);
if(!/<img\b[^>]*loading=["']lazy["'][^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp/i.test(home))fail('homepage still downloads the below-fold Yoni artwork eagerly');

const about=await read('aboutfmb/index.html');
requireMarkers(about,'About FMB',['/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="about"']);

const withLove=await read('withlovefmb/index.html');
requireMarkers(withLove,'With Love FMB',['/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="withlove"','/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp']);

const news=await read('news/index.html');
requireMarkers(news,'FMB News',['/assets/images/news/fmb-news-official.svg','/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="news"']);
if((news.match(/<figcaption/g)||[]).length<7)fail('News visual credits are incomplete');

const music=await read('music/index.html');
requireMarkers(music,'FMB Music',['/assets/images/fmb-approved/fmb-music-official-transparent.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="music"','id="audioPlayer"','id="playlistGrid"']);

const ebooks=await read('ebooks/index.html');
requireMarkers(ebooks,'FMB eBook',['/assets/images/fmb-approved/fmb-ebook-official-transparent.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="ebook"','data-ebook-filter="open"','data-ebook-filter="preview"']);

const company=await read('fmb&co/index.html');
requireMarkers(company,'FMB&CO.',['/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="fmbandco"']);
const senz=await read('fmb&co/senz/index.html');
requireMarkers(senz,'SENZ gateway',['/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="senz"']);
const cognita=await read('fmb&co/cognita/index.html');
requireMarkers(cognita,'Cognita gateway',['/assets/images/home/francine-home-founder-hd.webp','data-fmb-signature="cognita"']);

const optimizedCss=await read('assets/css/fmb-network-optimized.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important','content-visibility:auto','backdrop-filter:none!important'])if(!optimizedCss.includes(marker))fail(`optimized design bundle is missing ${marker}`);
if(/(?:data-fmb-portrait|fmb-official-(?:landscape|portrait))[^}]*object-fit\s*:\s*cover/is.test(optimizedCss))fail('founder photography can still be destructively cropped');
const optimizedJs=await read('assets/js/fmb-network-optimized.js');
for(const marker of ['FMB Network','Search full articles, FAQs and brands'])if(!optimizedJs.includes(marker))fail(`optimized interaction bundle is missing ${marker}`);
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(optimizedJs))fail('optimized motion still distorts founder photography');

const receptionLoader=await read('assets/js/az-assistant.js');
requireMarkers(receptionLoader,'Reception Desk',['/assets/images/home/fmb-home-logo.webp','width="512" height="512"']);
for(const marker of prohibitedDependencies)if(receptionLoader.includes(marker))fail(`Reception Desk still depends on ${marker}`);

console.log('FMB Network repository-contained quality check passed.');
