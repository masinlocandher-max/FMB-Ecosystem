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
  ['ebook','ebooks/index.html','/ebooks/'],
  ['fmbandco','fmb&co/index.html','/fmb&co/'],
  ['senz-gateway','fmb&co/senz/index.html','/fmb&co/senz/'],
  ['cognita-gateway','fmb&co/cognita/index.html','/fmb&co/cognita/'],
  ['projects','projects/index.html','/projects/'],
  ['get-help','gethelp/index.html','/gethelp/'],
  ['get-help','get-help/index.html','/get-help/'],
  ['community','communityengagements/index.html','/communityengagements/'],
  ['yoni','app/index.html','/app/'],
  ['yoni-install','app/install/index.html','/app/install/'],
  ['senz-site','_sites/senz/index.html','/_sites/senz/'],
  ['cognita-site','_sites/cognita/index.html','/_sites/cognita/']
];
const seen=new Set();
const routes=[];
for(const [name,file,route] of candidates){
  if(!existsSync(path.join('dist',file))||seen.has(name))continue;
  seen.add(name);
  routes.push({name,route,file});
}

const profiles=[
  {name:'desktop',viewport:{width:1440,height:1100},isMobile:false},
  {name:'iphone',viewport:{width:390,height:844},isMobile:true}
];
const manifest=[];
const persist=()=>writeFileSync(path.join(evidenceDirectory,'manifest.json'),JSON.stringify(manifest,null,2));
const browser=await chromium.launch({headless:true});

function visibleLocator(locator){
  return locator.count().then(async count=>{
    for(let index=0;index<count;index+=1){
      const candidate=locator.nth(index);
      if(await candidate.isVisible().catch(()=>false))return candidate;
    }
    return null;
  });
}

async function exercise(page,item,profile){
  const result={name:'route-smoke',status:'passed',proof:'First meaningful screen rendered.'};
  if(item.name==='home'){
    if(profile.isMobile){
      const menu=await visibleLocator(page.locator('#menuButton'));
      if(!menu)return {name:'mobile-navigation',status:'failed',proof:'Menu button was not visible.'};
      await menu.click();
      const expanded=await menu.getAttribute('aria-expanded');
      const navVisible=await page.locator('#bulletinNav').isVisible().catch(()=>false);
      if(expanded!=='true'||!navVisible)return {name:'mobile-navigation',status:'failed',proof:`expanded=${expanded}; navVisible=${navVisible}`};
      await page.keyboard.press('Escape');
      return {name:'mobile-navigation',status:'passed',proof:'Menu opened, exposed the primary navigation, and closed with Escape.'};
    }
    const action=page.locator('a[href="#bulletin"]').first();
    await action.click();
    await page.waitForFunction(()=>location.hash==='#bulletin');
    const headingVisible=await page.locator('#bulletinTitle').isVisible();
    await page.evaluate(()=>scrollTo(0,0));
    return {name:'homepage-anchor',status:headingVisible?'passed':'failed',proof:`hash=${await page.evaluate(()=>location.hash)}; bulletin heading visible=${headingVisible}`};
  }
  if(item.name==='news'&&profile.isMobile){
    const menu=await visibleLocator(page.locator('[data-news-menu]'));
    if(menu){
      await menu.click();
      const expanded=await menu.getAttribute('aria-expanded');
      const navVisible=await page.locator('#newsNav').isVisible().catch(()=>false);
      await page.keyboard.press('Escape').catch(()=>{});
      return {name:'news-mobile-navigation',status:expanded==='true'&&navVisible?'passed':'failed',proof:`menu expanded=${expanded}; nav visible=${navVisible}`};
    }
    const dock=await visibleLocator(page.locator('.nc-mobile-dock'));
    const links=dock?await dock.locator('a').count():0;
    return {name:'news-mobile-navigation',status:dock&&links>=3?'passed':'failed',proof:`Dedicated mobile dock visible=${Boolean(dock)}; links=${links}`};
  }
  if(item.name==='about-fmb'&&profile.isMobile){
    await page.waitForTimeout(900);
    const trigger=await visibleLocator(page.locator('.pearly-lazy-trigger,.az-help-trigger'));
    if(!trigger)return {name:'reception-desk',status:'failed',proof:'Reception trigger was not visible.'};
    await trigger.click();
    const panel=page.locator('.az-help-panel').first();
    const opened=await panel.waitFor({state:'visible',timeout:6000}).then(()=>true).catch(()=>false);
    await page.keyboard.press('Escape').catch(()=>{});
    return {name:'reception-desk',status:opened?'passed':'failed',proof:`Reception panel visible=${opened}`};
  }
  if(item.name==='yoni'){
    const guest=page.locator('#guestAccess');
    const available=await guest.waitFor({state:'visible',timeout:7000}).then(()=>true).catch(()=>false);
    if(!available)return {name:'yoni-guest-access',status:'failed',proof:'Explore without an account was not available.'};
    await guest.click();
    const entered=await page.waitForFunction(()=>document.body.dataset.yoniAccess==='guest'&&!document.querySelector('#appShell')?.hidden&&location.hash==='#home',null,{timeout:5000}).then(()=>true).catch(()=>false);
    return {name:'yoni-guest-access',status:entered?'passed':'failed',proof:`Guest mode entered=${entered}; hash=${await page.evaluate(()=>location.hash)}`};
  }
  if(item.name==='yoni-install'){
    const install=page.locator('#installNow');
    await install.click();
    const guideFocused=await page.waitForFunction(()=>document.activeElement?.id==='installGuide',null,{timeout:2500}).then(()=>true).catch(()=>false);
    const statusText=(await page.locator('#installStatus').textContent()||'').trim();
    return {name:'yoni-install-guide',status:guideFocused&&/steps below|add Yoni/i.test(statusText)?'passed':'failed',proof:`guide focused=${guideFocused}; status=${statusText}`};
  }
  return result;
}

async function capture(item,profile,index){
  const startedAt=Date.now();
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
  const localHttpFailures=[];
  const failedRequests=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,300));});
  page.on('response',response=>{
    try{
      const url=new URL(response.url());
      if(url.origin==='http://127.0.0.1:4173'&&response.status()>=400)localHttpFailures.push({url:url.pathname,status:response.status()});
    }catch{}
  });
  page.on('requestfailed',request=>{
    try{
      const url=new URL(request.url());
      failedRequests.push({url:url.href,local:url.origin==='http://127.0.0.1:4173',error:request.failure()?.errorText||'request failed'});
    }catch{}
  });
  try{
    const response=await page.goto(`http://127.0.0.1:4173${item.route}`,{waitUntil:'domcontentloaded',timeout:9000});
    await page.evaluate(async()=>{
      if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]);
      window.scrollTo(0,0);
      const visibleImages=[...document.images].filter(image=>{
        const style=getComputedStyle(image);
        const rect=image.getBoundingClientRect();
        return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;
      });
      await Promise.race([
        Promise.all(visibleImages.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{
          image.addEventListener('load',resolve,{once:true});
          image.addEventListener('error',resolve,{once:true});
        }))),
        new Promise(resolve=>setTimeout(resolve,2800))
      ]);
    });
    await page.waitForTimeout(250);
    const evidence=await page.evaluate(()=>{
      const visible=element=>{
        const style=getComputedStyle(element);
        const rect=element.getBoundingClientRect();
        return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&rect.width>20&&rect.height>20;
      };
      const visibleInViewport=element=>{
        if(!visible(element))return false;
        const rect=element.getBoundingClientRect();
        return rect.bottom>0&&rect.top<innerHeight;
      };
      const meaningfulText=(document.body.innerText||'').replace(/\s+/g,' ').trim();
      const fixedElements=[...document.querySelectorAll('body *')]
        .filter(element=>{
          const position=getComputedStyle(element).position;
          return (position==='fixed'||position==='sticky')&&visible(element);
        })
        .slice(0,40)
        .map(element=>({
          tag:element.tagName.toLowerCase(),
          id:element.id||'',
          className:typeof element.className==='string'?element.className:'',
          text:(element.textContent||'').trim().replace(/\s+/g,' ').slice(0,140)
        }));
      const imageStates=[...document.images]
        .filter(visibleInViewport)
        .slice(0,50)
        .map(image=>({src:image.getAttribute('src')||'',currentSrc:image.currentSrc||'',alt:image.alt||'',complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,loading:image.loading||'',local:new URL(image.currentSrc||image.src,location.href).origin===location.origin}));
      const brokenImages=imageStates.filter(image=>image.complete&&image.naturalWidth===0);
      const pendingImages=imageStates.filter(image=>!image.complete);
      const overlay=Boolean(document.querySelector('vite-error-overlay,nextjs-portal,[data-nextjs-dialog-overlay],#webpack-dev-server-client-overlay'))||/Unhandled Runtime Error|Internal Server Error|Failed to compile/i.test(meaningfulText.slice(0,1200));
      return {fixedElements,imageStates,brokenImages,pendingImages,bodyClasses:document.body.className,meaningfulTextLength:meaningfulText.length,overlay};
    });
    const interaction=await exercise(page,item,profile).catch(error=>({name:'interaction',status:'failed',proof:error instanceof Error?error.message:String(error)}));
    await page.evaluate(()=>scrollTo(0,0)).catch(()=>{});
    await page.waitForTimeout(100);
    await page.screenshot({path:screenshot,animations:'disabled',timeout:8000});
    const localBroken=evidence.brokenImages.filter(image=>image.local);
    const blank=evidence.meaningfulTextLength<80;
    const critical=blank||evidence.overlay||localBroken.length>0||localHttpFailures.length>0||failedRequests.some(request=>request.local)||interaction.status==='failed'||!response||response.status()>=400;
    return {
      page:item.name,
      profile:profile.name,
      route:item.route,
      sourceFile:item.file,
      durationMs:Date.now()-startedAt,
      status:response?.status()??null,
      title:await page.title(),
      health:critical?'failed':evidence.brokenImages.length?'captured-with-external-broken-images':evidence.pendingImages.length?'captured-with-pending-images':'passed',
      blank,
      interaction,
      localHttpFailures,
      failedRequests:failedRequests.slice(0,12),
      ...evidence,
      consoleErrors:consoleErrors.slice(0,15),
      screenshot
    };
  }catch(error){
    return {
      page:item.name,
      profile:profile.name,
      route:item.route,
      sourceFile:item.file,
      durationMs:Date.now()-startedAt,
      health:'blocked',
      error:error instanceof Error?error.message:String(error),
      localHttpFailures,
      failedRequests:failedRequests.slice(0,12),
      consoleErrors:consoleErrors.slice(0,15),
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
      new Promise(resolve=>setTimeout(()=>resolve({page:item.name,profile:profile.name,route:item.route,sourceFile:item.file,health:'blocked',error:'Route exceeded the 40-second frontend QA budget.',screenshot:null}),40000))
    ]);
    manifest.push({step:index,...record});
    persist();
    index+=1;
  }
}

await browser.close();
const broken=manifest.flatMap(item=>(item.brokenImages||[]).map(image=>({...image,page:item.page,profile:item.profile})));
const pending=manifest.flatMap(item=>(item.pendingImages||[]).map(image=>({...image,page:item.page,profile:item.profile})));
const failures=manifest.filter(item=>['failed','blocked'].includes(item.health));
const interactionFailures=manifest.filter(item=>item.interaction?.status==='failed');
const summary={
  routes:routes.length,
  captures:manifest.length,
  passed:manifest.filter(item=>item.health==='passed').length,
  warnings:manifest.filter(item=>item.health.startsWith('captured-with-')).length,
  slowest:[...manifest].filter(item=>Number.isFinite(item.durationMs)).sort((a,b)=>b.durationMs-a.durationMs).slice(0,8).map(item=>({page:item.page,profile:item.profile,durationMs:item.durationMs,health:item.health})),
  failures:failures.map(item=>({page:item.page,profile:item.profile,route:item.route,health:item.health,error:item.error||'',interaction:item.interaction,localHttpFailures:item.localHttpFailures||[],localFailedRequests:(item.failedRequests||[]).filter(request=>request.local)})),
  interactionFailures:interactionFailures.map(item=>({page:item.page,profile:item.profile,interaction:item.interaction})),
  brokenImages:broken,
  pendingImages:pending
};
writeFileSync(path.join(evidenceDirectory,'summary.json'),JSON.stringify(summary,null,2));
if(!manifest.some(item=>item.health==='passed'))throw new Error('No valid frontend screenshots were captured.');
if(failures.length)throw new Error(`Frontend QA found ${failures.length} critical route or interaction failure(s). See product-design-audit/summary.json.`);
