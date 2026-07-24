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

let css=await readFile(cssFile,'utf8');
if(!css.includes(marker)){
  css=`${css.trim()}\n\n${polish.trim()}\n`;
  await writeFile(cssFile,css,'utf8');
}

let home=await readFile(homeFile,'utf8');
const oldGalleryPortrait='<img src="/assets/images/fmb-approved/francine-standing-landscape.webp" width="1364" height="768" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved standing portrait">';
const newGalleryPortrait='<img src="/assets/images/fmb-approved/francine-portrait-front.webp" width="922" height="1152" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved front portrait">';
if(home.includes('id="fmb-visual-ecosystem"')&&home.includes(oldGalleryPortrait)){
  home=home.replace(oldGalleryPortrait,newGalleryPortrait);
  await writeFile(homeFile,home,'utf8');
}

const finalHome=await readFile(homeFile,'utf8');
if(!finalHome.includes(newGalleryPortrait))throw new Error('Homepage editorial gallery is missing the approved front portrait.');
console.log('Applied the compact, image-led FMB editorial gallery using the approved front portrait.');
