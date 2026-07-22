import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const requiredPages=[
  'index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'
];
const sharedMarkers=[
  '/assets/css/fmb-network-core.css?v=20260722-network-v2',
  '/assets/css/fmb-network-responsive.css?v=20260722-network-v2',
  '/assets/js/fmb-network-motion.js?v=20260722-network-v2',
  '/assets/js/fmb-reception-search.js?v=20260722-network-v2',
  'data-fmb-network-schema'
];

for(const page of requiredPages){
  const html=await read(page);
  for(const marker of sharedMarkers)if(!html.includes(marker))fail(`${page} is missing ${marker}`);
  if(!html.includes('viewport-fit=cover'))fail(`${page} is not safe-area optimized`);
  if(!/<meta\s+name=["']description["']/i.test(html))fail(`${page} has no SEO description`);
  if(!/<link\s+rel=["']canonical["']/i.test(html))fail(`${page} has no canonical URL`);
}

const home=await read('index.html');
for(const marker of [
  '/assets/images/home/francine-home-hero-hd.webp',
  '/assets/images/home/francine-home-founder-hd.webp',
  'Yoni, our complete companion app',
  'Digital Space for Rent',
  'Institute Qualifying Test',
  '@bb.fmb','/BinibiningFrancineMarie','withlovefmb@gmail.com'
])if(!home.includes(marker))fail(`homepage is missing ${marker}`);

const about=await read('aboutfmb/index.html');
if(!about.includes('/assets/images/home/francine-home-hero-hd.webp')||!about.includes('/assets/images/home/francine-home-founder-hd.webp'))fail('About FMB does not use the approved HD founder pair');

const company=await read('fmb&co/index.html');
if(!company.includes('/assets/images/home/francine-home-hero-hd.webp')||!company.includes('/assets/images/home/francine-home-founder-hd.webp'))fail('FMB&Co. does not use the approved HD founder pair');

const news=await read('news/index.html');
if(!news.includes('/assets/images/news/fmb-news-official.svg'))fail('News does not use the official FMB News identity');
if((news.match(/<figcaption/g)||[]).length<7)fail('News visual credits are incomplete');

const music=await read('music/index.html');
if(!music.includes('/assets/images/channels/fmb-music-official.svg'))fail('Music does not use the official scalable channel identity');
const ebooks=await read('ebooks/index.html');
if(!ebooks.includes('/assets/images/channels/fmb-ebook-official.svg'))fail('eBook does not use the official scalable channel identity');

for(const asset of ['assets/images/channels/fmb-music-official.svg','assets/images/channels/fmb-ebook-official.svg']){
  const svg=await read(asset);
  if(!svg.includes('viewBox="0 0 1400 320"'))fail(`${asset} is not HD-scalable`);
  if(!svg.includes('fill="#fff"')||!svg.includes('linearGradient id="gold"'))fail(`${asset} is missing the approved white and gold treatment`);
  if(/<rect[^>]+width="1400"[^>]+height="320"/i.test(svg))fail(`${asset} contains a flattened background`);
}

for(const asset of ['assets/images/home/francine-home-hero-hd.webp','assets/images/home/francine-home-founder-hd.webp']){
  const details=await stat(path.join(root,asset));
  if(details.size<100000)fail(`${asset} is unexpectedly small for the approved HD source`);
}

const photoCss=await read('assets/css/fmb-network-pages.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important'])if(!photoCss.includes(marker))fail(`photo protection is missing ${marker}`);
const motion=await read('assets/js/fmb-network-motion.js');
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(motion))fail('motion system still distorts founder photography');
const reception=await read('assets/js/fmb-reception-search.js');
for(const marker of ['Search full articles, FAQs and brands','Women’s Health Matters','Pax Silica','Cognita Institute of AI'])if(!reception.includes(marker))fail(`Reception Desk search is missing ${marker}`);

console.log(`FMB Network quality check passed for ${requiredPages.length} public pages.`);
