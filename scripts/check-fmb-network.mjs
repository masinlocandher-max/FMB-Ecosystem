import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
const vercel=JSON.parse(await readFile(path.join(sourceRoot,'vercel.json'),'utf8'));
const byKey=new Map(manifest.assets.map(asset=>[asset.key,asset]));
const asset=key=>`/assets/images/fmb-approved/${byKey.get(key).file}`;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

if(manifest.policy?.fallbacksAllowed!==false)fail('asset manifest allows fallbacks');
for(const item of manifest.assets){
  const relative=`assets/images/fmb-approved/${item.file}`;
  const file=path.join(root,relative);
  const info=await stat(file);
  if(!info.isFile()||info.size<100)fail(`${relative} is missing`);
  if(hash(await readFile(file))!==item.sha256)fail(`${relative} is not byte-identical to the uploaded master`);
}

const retired=['/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','/assets/images/news/fmb-news-official.svg','/assets/images/channels/fmb-music-official.svg','/assets/images/channels/fmb-ebook-official.svg','https://at.adobe.com/'];
const pages={
  'index.html':[asset('masterTransparent'),asset('standingLandscape'),asset('seatedLandscape'),'Official Digital Headquarters','Mabayani','/assets/js/az-assistant.js'],
  'aboutfmb/index.html':[asset('standingLandscape'),asset('portraitFront'),'data-fmb-signature="about"'],
  'withlovefmb/index.html':['data-fmb-signature="withlove"','/assets/images/volunteer/francine-leading-with-love-fmb.webp','/assets/images/volunteer/francine-serving-with-volunteers.webp'],
  'news/index.html':[asset('news'),asset('portraitFront'),'data-fmb-signature="news"'],
  'music/index.html':[asset('music'),asset('portraitAngleLeft'),'data-fmb-signature="music"','id="audioPlayer"','id="playlistGrid"'],
  'ebooks/index.html':[asset('ebook'),asset('portraitAngleRight'),'data-fmb-signature="ebook"','data-ebook-filter="open"','data-ebook-filter="preview"'],
  'fmbandco/index.html':[asset('standingLandscape'),asset('portraitFront'),'data-fmb-signature="fmbandco"'],
  'fmbandco/senz/index.html':[asset('portraitAngleLeft'),'data-fmb-signature="senz"'],
  'fmbandco/cognita/index.html':[asset('portraitAngleRight'),'data-fmb-signature="cognita"']
};
for(const [relative,markers] of Object.entries(pages)){
  const html=await read(relative);
  for(const marker of markers)if(!html.includes(marker))fail(`${relative} is missing ${marker}`);
  for(const marker of retired)if(html.includes(marker))fail(`${relative} still renders retired asset ${marker}`);
  if(!html.includes('viewport-fit=cover'))fail(`${relative} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${relative} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${relative} has no canonical URL`);
  if(/<(?:audio|video)\b[^>]*\bautoplay\b/i.test(html))fail(`${relative} contains autoplay media`);
}

const canonicalNavigation=[
  '<a href="/">Home</a>',
  'About FMB</a>',
  '<a href="/news/">News</a>',
  '<a href="/projects/">Projects</a>',
  '<a href="/ebooks/">Reading</a>',
  '<a href="/music/">Music</a>',
  '<a href="/withlovefmb/#volunteer">Get Involved</a>',
  '<a href="/gethelp/">Get Help</a>',
  'FMB&amp;CO.</a>',
  'Work with FMB</a>',
  'Open Yoni</a>',
];
for(const relative of ['aboutfmb/index.html','fmbandco/index.html','fmbandco/senz/index.html','fmbandco/cognita/index.html']){
  const html=await read(relative);
  for(const marker of canonicalNavigation)if(!html.includes(marker))fail(`${relative} canonical navigation is missing ${marker}`);
}
for(const relative of ['assets/js/aboutfmb-corporate.js','assets/js/fmbandco-motion.js']){
  const script=await read(relative);
  if(script.includes('navigation.innerHTML'))fail(`${relative} still replaces canonical navigation at runtime`);
}

const home=await read('index.html');
for(const marker of [
  'data-fmb-host-router',
  "host === 'data.francinemariebautista.com'",
  "host === 'app.francinemariebautista.com'",
  'window.location.replace(`/admin.html${suffix}`)',
  'https://yoni.francinemariebautista.com${targetPath}${suffix}',
])if(!home.includes(marker))fail(`homepage host router is missing ${marker}`);
for(const domain of [
  'www.francinemariebautista.com',
  'francinemariebautista.com',
  'yoni.francinemariebautista.com',
  'app.francinemariebautista.com',
  'data.francinemariebautista.com',
  'senzpr.com',
  'www.senzpr.com',
  'thecognitainstitute.com',
  'www.thecognitainstitute.com',
])if(!vercel.alias?.includes(domain))fail(`production alias is missing ${domain}`);
if((home.match(/fetchpriority=["']high["']/g)||[]).length>1)fail('homepage has more than one high-priority image');
if(!/<img\b(?=[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'])(?=[^>]*loading=["']lazy["'])[^>]*>/i.test(home))fail('Yoni homepage art is not lazy-loaded');
const news=await read('news/index.html');
if((news.match(/<figcaption/g)||[]).length<7)fail('News image credits are incomplete');
const css=await read('assets/css/fmb-network-optimized.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important','content-visibility:auto','backdrop-filter:none!important'])if(!css.includes(marker))fail(`portrait protection is missing ${marker}`);
if(/(?:data-fmb-portrait|fmb-official-(?:landscape|portrait))[^}]*object-fit\s*:\s*cover/is.test(css))fail('founder photography can still be cropped');
const interactions=await read('assets/js/fmb-network-optimized.js');
for(const marker of ['FMB Network','Search full articles, FAQs and brands'])if(!interactions.includes(marker))fail(`optimized interaction bundle is missing ${marker}`);
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(interactions))fail('optimized motion still distorts founder photography');
const reception=await read('assets/js/az-assistant.js');
if(!reception.includes(asset('masterTransparent')))fail('Reception Desk is missing the exact FMB master');
console.log(`FMB Network exact-asset gate passed ${manifest.assets.length} uploaded masters across ${Object.keys(pages).length} principal pages.`);
