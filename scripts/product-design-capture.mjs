import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const evidenceDirectory='product-design-audit';
mkdirSync(evidenceDirectory,{recursive:true});
const routes=[
  {name:'home',route:'/'},
  {name:'about-fmb',route:'/aboutfmb/'},
  {name:'news',route:'/news/'},
  {name:'music',route:'/music/'},
  {name:'ebook',route:'/ebooks/'},
  {name:'yoni',route:'/app/'},
  {name:'cognita-site',route:'/_sites/cognita/'}
];
const profiles=[
  {name:'desktop',viewport:{width:1440,height:1100},isMobile:false},
  {name:'iphone',viewport:{width:390,height:844},isMobile:true}
];
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const browser=await chromium.launch({headless:true});
const results=[];
const persist=()=>writeFileSync(path.join(evidenceDirectory,'manifest.json'),JSON.stringify(results,null,2));

async function bounded(promise,milliseconds,fallback){return Promise.race([promise,wait(milliseconds).then(()=>fallback)]);}

async function exercise(page,item,profile){
  if(item.name==='home'){
    if(profile.isMobile){
      const menu=page.locator('#menuButton');
      await menu.click();
      const expanded=await menu.getAttribute('aria-expanded');
      const visible=await page.locator('#bulletinNav').isVisible().catch(()=>false);
      await page.keyboard.press('Escape');
      return {name:'mobile-menu',passed:expanded==='true'&&visible,proof:`expanded=${expanded}; visible=${visible}`};
    }
    await page.locator('a[href="#bulletin"]').first().click();
    await page.waitForFunction(()=>location.hash==='#bulletin');
    const visible=await page.locator('#bulletinTitle').isVisible();
    return {name:'bulletin-anchor',passed:visible,proof:`bulletin visible=${visible}`};
  }
  if(item.name==='about-fmb'&&profile.isMobile){
    await page.waitForTimeout(900);
    const trigger=page.locator('.pearly-lazy-trigger,.az-help-trigger').first();
    const triggerVisible=await trigger.isVisible().catch(()=>false);
    if(!triggerVisible)return {name:'reception',passed:false,proof:'Reception trigger is hidden.'};
    await trigger.click();
    const panelVisible=await page.locator('.az-help-panel').first().waitFor({state:'visible',timeout:5000}).then(()=>true).catch(()=>false);
    await page.keyboard.press('Escape').catch(()=>{});
    return {name:'reception',passed:panelVisible,proof:`panel visible=${panelVisible}`};
  }
  if(item.name==='news'){
    const brandImages=page.locator('img[src="/assets/images/news/fmb-news-official.svg"]');
    const count=await brandImages.count();
    let decoded=count>0;
    for(let index=0;index<count;index+=1){const image=await brandImages.nth(index).evaluate(element=>({complete:element.complete,width:element.naturalWidth}));if(!image.complete||image.width===0)decoded=false;}
    if(profile.isMobile){
      const rail=page.locator('.nc-topic-rail');
      const visible=await rail.isVisible().catch(()=>false);
      const links=await rail.locator('a').count().catch(()=>0);
      return {name:'news-brand-and-navigation',passed:decoded&&visible&&links>=5,proof:`brand images=${count}; decoded=${decoded}; topic rail=${visible}; links=${links}`};
    }
    return {name:'news-brand',passed:decoded,proof:`brand images=${count}; decoded=${decoded}`};
  }
  if(item.name==='music'){
    const ready=await page.waitForFunction(()=>{const grid=document.querySelector('#playlistGrid');return grid&&grid.textContent&&!/Preparing the listening space/i.test(grid.textContent)&&grid.textContent.trim().length>80;},null,{timeout:7000}).then(()=>true).catch(()=>false);
    const controls=await page.locator('#mainPlayButton,#audioPlayer,#playlistGrid').count();
    const logoDecoded=await page.locator('img[src="/assets/images/channels/fmb-music-official.svg"]').first().evaluate(image=>image.complete&&image.naturalWidth>0).catch(()=>false);
    return {name:'music-library-shell',passed:ready&&controls===3&&logoDecoded,proof:`catalog ready=${ready}; controls=${controls}; logo decoded=${logoDecoded}`};
  }
  if(item.name==='ebook'){
    const logoDecoded=await page.locator('img[src="/assets/images/channels/fmb-ebook-official.svg"]').first().evaluate(image=>image.complete&&image.naturalWidth>0).catch(()=>false);
    const titleVisible=await page.locator('h1,h2').filter({hasText:/Read|Words built/i}).first().isVisible().catch(()=>false);
    return {name:'ebook-brand',passed:logoDecoded&&titleVisible,proof:`logo decoded=${logoDecoded}; title visible=${titleVisible}`};
  }
  if(item.name==='yoni'){
    const guest=page.locator('#guestAccess');
    const available=await guest.waitFor({state:'visible',timeout:6000}).then(()=>true).catch(()=>false);
    if(!available)return {name:'yoni-guest-access',passed:false,proof:'Guest access button unavailable.'};
    await guest.click();
    const entered=await page.waitForFunction(()=>document.body.dataset.yoniAccess==='guest'&&!document.querySelector('#appShell')?.hidden&&location.hash==='#home',null,{timeout:5000}).then(()=>true).catch(()=>false);
    return {name:'yoni-guest-access',passed:entered,proof:`guest mode=${entered}`};
  }
  if(item.name==='cognita-site'){
    const meaningful=(await page.locator('body').innerText()).replace(/\s+/g,' ').trim();
    const shell=meaningful.length>=150&&!/Unhandled Runtime Error|Failed to compile/i.test(meaningful);
    return {name:'cognita-static-shell',passed:shell,environmentDependency:'Base44 app credentials and API are not available in the static combined preview.',proof:`meaningful text length=${meaningful.length}`};
  }
  return {name:'route-smoke',passed:true,proof:'First meaningful screen rendered.'};
}

async function runCase(item,profile,step){
  const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.isMobile,hasTouch:profile.isMobile,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(7000);
  const screenshot=`${evidenceDirectory}/${String(step).padStart(2,'0')}-${item.name}-${profile.name}.png`;
  const localFailures=[];
  const consoleErrors=[];
  if(item.name==='music')await page.route(/\.(?:mp3|wav|m4a|ogg)(?:\?|$)/i,route=>route.fulfill({status:204,contentType:'audio/mpeg',body:''}));
  page.on('response',response=>{try{const url=new URL(response.url());if(url.origin==='http://127.0.0.1:4173'&&response.status()>=400){const expected=item.name==='cognita-site'&&(/^\/api\/apps\/null\//.test(url.pathname)||url.pathname.includes('/analytics/track/batch'));if(!expected)localFailures.push({url:url.pathname,status:response.status()});}}catch{}});
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,240));});
  const started=Date.now();
  try{
    const response=await page.goto(`http://127.0.0.1:4173${item.route}`,{waitUntil:'domcontentloaded',timeout:10000});
    await page.evaluate(async()=>{if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]);scrollTo(0,0);});
    await page.waitForTimeout(350);
    const imageAudit=await page.evaluate(()=>{const images=[...document.images].map(image=>({src:image.getAttribute('src')||'',complete:image.complete,width:image.naturalWidth,height:image.naturalHeight,local:new URL(image.currentSrc||image.src,location.href).origin===location.origin}));return {broken:images.filter(image=>image.complete&&image.width===0),pending:images.filter(image=>!image.complete)};});
    const interaction=await exercise(page,item,profile);
    if(item.name==='music')await page.evaluate(()=>document.querySelectorAll('audio').forEach(audio=>{audio.pause();audio.removeAttribute('src');audio.load();})).catch(()=>{});
    await page.evaluate(()=>scrollTo(0,0)).catch(()=>{});
    await page.screenshot({path:screenshot,animations:'disabled',timeout:8000});
    const localBroken=imageAudit.broken.filter(image=>image.local);
    const passed=Boolean(response&&response.status()<400&&interaction.passed&&localFailures.length===0&&localBroken.length===0);
    return {step,page:item.name,profile:profile.name,route:item.route,status:response?.status()??null,durationMs:Date.now()-started,passed,interaction,localFailures,brokenImages:imageAudit.broken,pendingImages:imageAudit.pending,consoleErrors:consoleErrors.slice(0,10),screenshot};
  }catch(error){
    return {step,page:item.name,profile:profile.name,route:item.route,durationMs:Date.now()-started,passed:false,error:error instanceof Error?error.message:String(error),localFailures,consoleErrors:consoleErrors.slice(0,10),screenshot:null};
  }finally{
    await bounded(page.close({runBeforeUnload:false}).catch(()=>{}),1000,null);
    await bounded(context.close().catch(()=>{}),1000,null);
  }
}

let step=1;
for(const profile of profiles){
  for(const item of routes){
    const timeoutResult={step,page:item.name,profile:profile.name,route:item.route,passed:false,error:'Focused route exceeded the 18-second browser budget.',screenshot:null};
    const result=await bounded(runCase(item,profile,step),18000,timeoutResult);
    results.push(result);
    persist();
    step+=1;
  }
}
const failures=results.filter(result=>!result.passed);
const summary={routes:routes.length,captures:results.length,passed:results.length-failures.length,failed:failures.length,slowest:[...results].filter(result=>Number.isFinite(result.durationMs)).sort((a,b)=>b.durationMs-a.durationMs).slice(0,8).map(result=>({page:result.page,profile:result.profile,durationMs:result.durationMs,passed:result.passed})),environmentDependencies:results.filter(result=>result.interaction?.environmentDependency).map(result=>({page:result.page,profile:result.profile,note:result.interaction.environmentDependency})),failures};
writeFileSync(path.join(evidenceDirectory,'summary.json'),JSON.stringify(summary,null,2));
await bounded(browser.close().catch(()=>{}),2500,null);
process.exit(failures.length?1:0);
