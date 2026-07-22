import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB Network quality check: ${message}`)};
const read=relative=>readFile(path.join(root,relative),'utf8');
const readBytes=relative=>readFile(path.join(root,relative));
const requiredPages=[
  'index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'
];
const sharedMarkers=[
  '/assets/css/fmb-network-core.css?v=20260722-network-v2',
  '/assets/css/fmb-network-responsive.css?v=20260722-network-v2',
  '/assets/js/fmb-network-motion.js?v=20260722-network-v2',
  '/assets/js/fmb-reception-search.js?v=20260722-network-v2',
  '/assets/css/az-assistant.css',
  '/assets/js/az-assistant.js',
  'data-fmb-network-schema'
];

function webpDimensions(bytes,name){
  if(bytes.subarray(0,4).toString('ascii')!=='RIFF'||bytes.subarray(8,12).toString('ascii')!=='WEBP')fail(`${name} is not a valid WebP`);
  let offset=12;
  while(offset+8<=bytes.length){
    const type=bytes.subarray(offset,offset+4).toString('ascii');
    const size=bytes.readUInt32LE(offset+4);
    const data=offset+8;
    if(type==='VP8X')return {width:1+bytes[data+4]+(bytes[data+5]<<8)+(bytes[data+6]<<16),height:1+bytes[data+7]+(bytes[data+8]<<8)+(bytes[data+9]<<16)};
    if(type==='VP8 '&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a)return {width:bytes.readUInt16LE(data+6)&0x3fff,height:bytes.readUInt16LE(data+8)&0x3fff};
    if(type==='VP8L'&&bytes[data]===0x2f){
      const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];
      return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};
    }
    offset=data+size+(size%2);
  }
  fail(`${name} has unreadable WebP dimensions`);
}

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
  const dimensions=webpDimensions(await readBytes(asset),asset);
  if(dimensions.width!==1364||dimensions.height!==768)fail(`${asset} must remain the approved 1364x768 HD composition; found ${dimensions.width}x${dimensions.height}`);
}

const photoCss=await read('assets/css/fmb-network-pages.css');
for(const marker of ['object-fit:contain!important','filter:none!important','transform:none!important'])if(!photoCss.includes(marker))fail(`photo protection is missing ${marker}`);
const motion=await read('assets/js/fmb-network-motion.js');
if(/hero\.style\.transform|founder\.style\.transform|scale\(1\.0[2-9]/.test(motion))fail('motion system still distorts founder photography');
const newsMotion=await read('assets/js/news-channel.js');
if(/lead\.style\.transform|scale\(1\.0[2-9]/.test(newsMotion))fail('News motion system still distorts editorial photography');
const reception=await read('assets/js/fmb-reception-search.js');
for(const marker of ['Search full articles, FAQs and brands','Women’s Health Matters','Pax Silica','Cognita Institute of AI'])if(!reception.includes(marker))fail(`Reception Desk search is missing ${marker}`);

console.log(`FMB Network quality check passed for ${requiredPages.length} public pages.`);
