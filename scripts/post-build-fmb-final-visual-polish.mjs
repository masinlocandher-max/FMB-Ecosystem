import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(repositoryRoot,'dist');
const cssFile=path.join(dist,'assets','css','fmb-unified-system.css');
const homeFile=path.join(dist,'index.html');
const marker='FMB final visual polish';

const polish=`
/* FMB final visual polish: compact, image-led editorial gallery. */
.fmb-editorial-gallery{
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  grid-template-rows:auto auto!important;
  align-items:stretch;
}
.fmb-editorial-card,
.fmb-editorial-card:first-child,
.fmb-editorial-card:nth-child(4){
  grid-row:auto!important;
  grid-column:auto!important;
  min-height:0;
}
.fmb-editorial-card:nth-child(-n+3){
  aspect-ratio:4/5;
}
.fmb-editorial-card:nth-child(4){
  grid-column:1/-1!important;
  aspect-ratio:12/5;
}
.fmb-editorial-card:first-child img{
  object-fit:contain!important;
  object-position:center bottom!important;
  background:linear-gradient(155deg,#27065c,#100027);
}
body.fmb-approved-launch .brand-card.fco-card{
  background:linear-gradient(145deg,#16002f,#35106c)!important;
}
body.fmb-approved-launch .brand-card.senz-card,
body.fmb-approved-launch .brand-card.cognita-card{
  background:#fff!important;
}
body.fmb-approved-launch .brand-card.wlf-card{
  background:linear-gradient(145deg,#fff,#f0e1fb)!important;
}
body.fmb-approved-launch .brand-card.yoni-card{
  background:linear-gradient(145deg,#fffdf8,#fff0ca)!important;
}
body.fmb-approved-launch .brand-card.mabayani-card{
  background:linear-gradient(145deg,#1d0d12,#45201e)!important;
  color:#f4dcc1!important;
}
body.fmb-approved-launch .brand-card img{
  max-width:82%!important;
  max-height:68%!important;
  object-fit:contain!important;
}
body.fmb-approved-launch .featured{
  background:
    radial-gradient(circle at 78% 35%,rgba(226,170,85,.22),transparent 24rem),
    radial-gradient(circle at 12% 82%,rgba(125,72,206,.25),transparent 28rem),
    linear-gradient(145deg,#150027,#2d0a4f 58%,#11001f)!important;
  color:#fff!important;
}
body.fmb-approved-launch .featured :is(h2,h3,p,a){
  color:#fff!important;
}
body.fmb-approved-launch .featured .kicker{
  color:#e0ad54!important;
}
body.fmb-approved-launch .featured-art{
  background:
    radial-gradient(circle at 50% 50%,rgba(224,173,84,.2),transparent 35%),
    radial-gradient(circle at 50% 50%,rgba(130,80,223,.22),transparent 62%)!important;
}
body.fmb-approved-launch .featured .heritage-line{
  border-color:rgba(224,173,84,.55)!important;
  box-shadow:0 0 45px rgba(224,173,84,.16);
}
body.fmb-approved-launch .work-card img{
  object-fit:cover!important;
  object-position:center!important;
  background:#16002f!important;
}
body.fmb-approved-launch .work-card:first-child img{
  object-fit:contain!important;
  object-position:center bottom!important;
  background:linear-gradient(155deg,#27065c,#100027)!important;
}
@media(max-width:960px){
  .fmb-editorial-card,
  .fmb-editorial-card:first-child,
  .fmb-editorial-card:nth-child(4){
    flex:0 0 min(78vw,410px)!important;
    aspect-ratio:auto!important;
    min-height:500px!important;
    grid-row:auto!important;
    grid-column:auto!important;
  }
}
@media(max-width:600px){
  .fmb-editorial-card,
  .fmb-editorial-card:first-child,
  .fmb-editorial-card:nth-child(4){
    flex-basis:84vw!important;
    min-height:460px!important;
  }
}
`;

function setAttribute(tag,name,value){
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(`\\s${escaped}=(["'])[^"']*\\1`,'i');
  return pattern.test(tag)
    ? tag.replace(pattern,` ${name}="${value}"`)
    : tag.replace(/\s*\/?\>$/,match=>` ${name}="${value}"${match}`);
}

function replaceImage(html,oldSource,{src,width,height,alt}){
  const escaped=oldSource.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(`<img\\b[^>]*src=["']${escaped}["'][^>]*>`,'i');
  return html.replace(pattern,tag=>{
    let next=setAttribute(tag,'src',src);
    next=setAttribute(next,'width',String(width));
    next=setAttribute(next,'height',String(height));
    next=setAttribute(next,'alt',alt);
    next=setAttribute(next,'loading','lazy');
    next=setAttribute(next,'decoding','async');
    return next.replace(/\sfetchpriority=(["'])high\1/i,' fetchpriority="low"');
  });
}

let css=await readFile(cssFile,'utf8');
if(!css.includes(marker)){
  css=`${css.trim()}\n\n${polish.trim()}\n`;
  await writeFile(cssFile,css,'utf8');
}

let home=await readFile(homeFile,'utf8');
const oldGalleryPortrait='<img src="/assets/images/fmb-approved/francine-standing-landscape.webp" width="1364" height="768" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved standing portrait">';
const newGalleryPortrait='<img src="/assets/images/fmb-approved/francine-portrait-front.webp" width="922" height="1152" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved front portrait">';
if(home.includes('id="fmb-visual-ecosystem"')&&home.includes(oldGalleryPortrait))home=home.replace(oldGalleryPortrait,newGalleryPortrait);

home=replaceImage(home,'/assets/images/home/work/founder-work.svg',{
  src:'/assets/images/fmb-approved/francine-portrait-front.webp',width:922,height:1152,alt:'Francine Marie Bautista in the approved front portrait'
});
home=replaceImage(home,'/assets/images/home/work/community-projects.svg',{
  src:'/assets/images/volunteer/francine-leading-with-love-fmb.webp',width:1023,height:1537,alt:'Francine Marie Bautista leading a With Love, FMB community activity'
});
home=replaceImage(home,'/assets/images/home/work/fmb-news.svg',{
  src:'/assets/images/news/subic-aeta-dumpsite-iwitness.jpg',width:800,height:533,alt:'FMB News reporting image from the Subic Aeta dumpsite investigation'
});
home=replaceImage(home,'/assets/images/home/work/fmb-music.svg',{
  src:'/assets/images/music/fmb-ost-with-love-fmb-cover.png',width:1254,height:1254,alt:'With Love, FMB original soundtrack cover'
});
home=replaceImage(home,'/assets/images/home/work/fmb-ebooks.svg',{
  src:'/assets/images/reading/07883274-1340-48DC-A112-C4AD44B5ABD1.png',width:1086,height:1448,alt:'Pride. Identity. Love. reading cover by Francine Marie Bautista'
});
await writeFile(homeFile,home,'utf8');

const finalHome=await readFile(homeFile,'utf8');
for(const required of [
  newGalleryPortrait,
  '/assets/images/volunteer/francine-leading-with-love-fmb.webp',
  '/assets/images/news/subic-aeta-dumpsite-iwitness.jpg',
  '/assets/images/music/fmb-ost-with-love-fmb-cover.png',
  '/assets/images/reading/07883274-1340-48DC-A112-C4AD44B5ABD1.png'
]){
  if(!finalHome.includes(required))throw new Error(`Homepage final visual polish is missing ${required}`);
}
console.log('Applied the compact FMB gallery, real work imagery, brand-specific logo surfaces, and a dark Mabayani feature.');
