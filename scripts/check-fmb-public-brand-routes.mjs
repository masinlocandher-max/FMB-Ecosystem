import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

await import('./post-build-fmbnews-preview.mjs');

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const fail=message=>{throw new Error(`FMB public-route brand audit: ${message}`)};
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const controlledReadingRoutes=['coming-out-respect.html','dress-with-intention.html','men-can-cry.html','reading.html','skin-care-makeup.html','womens-health.html'];
const retired=['https://at.adobe.com/','/assets/images/home/fmb-home-logo.webp','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','/assets/images/news/fmb-news-official.svg','/assets/images/channels/fmb-music-official.svg','/assets/images/channels/fmb-ebook-official.svg'];
const legacyNewsLogo='/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const suppliedColorNewsLogo='/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const suppliedWhiteNewsLogo='/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(entry.name.endsWith('.html'))files.push(full);
  }
  return files;
}
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');
let publicPages=0;
let newsPages=0;
for(const file of await walk(root)){
  const name=relative(file);
  if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  const html=await readFile(file,'utf8');
  publicPages+=1;
  for(const marker of retired)if(html.includes(marker))fail(`${name} still renders retired identity ${marker}`);
  if(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/i.test(html))fail(`${name} still renders a generic founder cutout`);
  if(name.startsWith('news/')){
    if(!/(?:FMB News Center|FMB(?:&amp;|&)CO\. News|FMB News|Francine Marie Bautista)/i.test(html))fail(`${name} has no visible publisher identity`);
    newsPages+=1;
  }
  if(controlledReadingRoutes.includes(name)&&!html.includes('membership-gate.js'))fail(`${name} is missing its controlled reading gate`);
}
const required={
  'index.html':'/assets/images/fmb-approved/fmb-master-transparent.webp',
  'music/index.html':'/assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'ebooks/index.html':'/assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
  'womens-health.html':'membership-gate.js'
};
for(const [relative,marker] of Object.entries(required)){
  const html=await readFile(path.join(root,relative),'utf8');
  if(!html.includes(marker))fail(`${relative} is missing ${marker}`);
}

const newsIndex=await readFile(path.join(root,'news/index.html'),'utf8');
if(newsIndex.includes('news-center-v2')){
  if(!newsIndex.includes('nc-text-masthead')||!newsIndex.includes('News Center</strong>')||!newsIndex.includes('Filipino ang Mismong Balita.'))fail('news/index.html is missing the approved FMB News Center compatibility masthead and tagline');
  if(!newsIndex.includes('news-channel-v4')||!newsIndex.includes('Live News Desk'))fail('news/index.html is missing the broadcast-channel compatibility record');
  if(!newsIndex.includes(`<meta name="fmb-news-identity-record" content="${legacyNewsLogo}">`))fail('news/index.html is missing its non-rendered identity record');

  const masthead=newsIndex.match(/<a\b[^>]*\bdata-fmb-news-logo\b[^>]*>[\s\S]*?<\/a>/i)?.[0]||'';
  const footer=newsIndex.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0]||'';
  const suppliedColorLockup=masthead.includes('data-fmb-news-logo-light')&&masthead.includes(`src="${suppliedColorNewsLogo}"`);
  const suppliedWhiteFooter=footer.includes('data-fmb-news-logo-dark')&&footer.includes(`src="${suppliedWhiteNewsLogo}"`);
  if(!suppliedColorLockup)fail('news/index.html is missing the exact supplied purple-and-gold FMB News masthead logo');
  if(!suppliedWhiteFooter)fail('news/index.html is missing the exact supplied white FMB News footer logo');
  if(/fn14-reference-logo|fmb-news-official-transparent\.webp/i.test(masthead))fail('news/index.html still renders a recreated or retired masthead logo');
}else if(!newsIndex.includes(legacyNewsLogo)&&!newsIndex.includes(suppliedColorNewsLogo)){
  fail('news/index.html is missing its approved FMB News identity');
}

console.log(`FMB public-route audit verified ${publicPages} public pages, ${newsPages} News routes, ${controlledReadingRoutes.length} controlled reading routes, and the exact supplied FMB News light/dark logo pair.`);
