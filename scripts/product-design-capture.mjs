import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const evidenceDirectory='product-design-audit';
mkdirSync(evidenceDirectory,{recursive:true});

const candidates=[
  ['home','index.html','/'],
  ['about-fmb','aboutfmb/index.html','/aboutfmb/'],
  ['with-love-fmb','withlovefmb/index.html','/withlovefmb/'],
  ['with-love-fmb','with-love-fmb/index.html','/with-love-fmb/'],
  ['news','news/index.html','/news/'],
  ['music','music/index.html','/music/'],
  ['ebook','ebooks/index.html','/ebooks/']
];
const seen=new Set();
const routes=[];
for(const [name,file,route] of candidates){
  if(!existsSync(path.join('dist',file))||seen.has(name))continue;
  seen.add(name);
  routes.push({name,route});
}

const profiles=[
  {name:'desktop',viewport:{width:1440,height:1100},isMobile:false},
  {name:'iphone',viewport:{width:390,height:844},isMobile:true}
];
const manifest=[];
const persist=()=>writeFileSync(path.join(evidenceDirectory,'manifest.json'),JSON.stringify(manifest,null,2));
const browser=await chromium.launch({headless:true});

async function capture(item,profile,index){
  const context=await browser.newContext({
    viewport:profile.viewport,
    isMobile:profile.isMobile,
    hasTouch:profile.isMobile,
    reducedMotion:'reduce'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  const screenshot=`${evidenceDirectory}/${String(index).padStart(2,'0')}-${item.name}-${profile.name}.png`;
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,240));});
  try{
    const response=await page.goto(`http://127.0.0.1:4173${item.route}`,{waitUntil:'domcontentloaded',timeout:9000});
    await page.evaluate(async()=>{
      if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1500))]);
      window.scrollTo(0,0);
      const visibleImages=[...document.images].filter(image=>{
        const style=getComputedStyle(image);
        const rect=image.getBoundingClientRect();
        return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
      });
      await Promise.race([
        Promise.all(visibleImages.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{
          image.addEventListener('load',resolve,{once:true});
          image.addEventListener('error',resolve,{once:true});
        }))),
        new Promise(resolve=>setTimeout(resolve,4500))
      ]);
    });
    await page.waitForTimeout(250);
    const evidence=await page.evaluate(()=>{
      const visible=element=>{
        const style=getComputedStyle(element);
        const rect=element.getBoundingClientRect();
        return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>20&&rect.height>20;
      };
      const fixedElements=[...document.querySelectorAll('body *')]
        .filter(element=>{
          const position=getComputedStyle(element).position;
          return (position==='fixed'||position==='sticky')&&visible(element);
        })
        .slice(0,30)
        .map(element=>({
          tag:element.tagName.toLowerCase(),
          id:element.id||'',
          className:typeof element.className==='string'?element.className:'',
          text:(element.textContent||'').trim().replace(/\s+/g,' ').slice(0,120)
        }));
      const imageStates=[...document.images]
        .filter(visible)
        .slice(0,40)
        .map(image=>({src:image.getAttribute('src')||'',currentSrc:image.currentSrc||'',alt:image.alt||'',complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,loading:image.loading||''}));
      const brokenImages=imageStates.filter(image=>image.complete&&image.naturalWidth===0);
      const pendingImages=imageStates.filter(image=>!image.complete);
      return {fixedElements,imageStates,brokenImages,pendingImages,bodyClasses:document.body.className};
    });
    await page.screenshot({path:screenshot,animations:'disabled',timeout:8000});
    return {
      page:item.name,
      profile:profile.name,
      route:item.route,
      status:response?.status()??null,
      title:await page.title(),
      health:evidence.brokenImages.length?'captured-with-broken-images':evidence.pendingImages.length?'captured-with-pending-images':'captured',
      ...evidence,
      consoleErrors:consoleErrors.slice(0,10),
      screenshot
    };
  }catch(error){
    return {
      page:item.name,
      profile:profile.name,
      route:item.route,
      health:'blocked',
      error:error instanceof Error?error.message:String(error),
      consoleErrors:consoleErrors.slice(0,10),
      screenshot:null
    };
  }finally{
    await context.close().catch(()=>{});
  }
}

let index=1;
for(const profile of profiles){
  for(const item of routes){
    const record=await Promise.race([
      capture(item,profile,index),
      new Promise(resolve=>setTimeout(()=>resolve({page:item.name,profile:profile.name,route:item.route,health:'blocked',error:'Route exceeded the 24-second Product Design capture budget.',screenshot:null}),24000))
    ]);
    manifest.push({step:index,...record});
    persist();
    index+=1;
  }
}

await browser.close();
if(!manifest.some(item=>item.health.startsWith('captured')))throw new Error('No valid Product Design screenshots were captured.');
const broken=manifest.flatMap(item=>(item.brokenImages||[]).map(image=>({...image,page:item.page,profile:item.profile})));
const pending=manifest.flatMap(item=>(item.pendingImages||[]).map(image=>({...image,page:item.page,profile:item.profile})));
writeFileSync(path.join(evidenceDirectory,'summary.json'),JSON.stringify({routes:routes.length,captures:manifest.length,blocked:manifest.filter(item=>item.health==='blocked').length,brokenImages:broken,pendingImages:pending},null,2));
