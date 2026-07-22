import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const evidenceDirectory='product-design-audit';
mkdirSync(evidenceDirectory,{recursive:true});
const wait=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const bounded=(promise,milliseconds,fallback)=>Promise.race([promise,wait(milliseconds).then(()=>fallback)]);
const variants=[
  {name:'baseline'},
  {name:'no-music-js',block:'music.js'},
  {name:'no-email-access',block:'product-email-access.js'},
  {name:'no-live-hotfix',block:'live-hotfix.js'},
  {name:'no-news-channel',block:'news-channel.js'},
  {name:'no-site-js',block:'site.js'},
  {name:'no-network-js',block:'fmb-network-optimized.js'},
  {name:'no-reception',block:'az-assistant.js'},
  {name:'javascript-disabled',javaScriptEnabled:false}
];
const browser=await chromium.launch({headless:true});
const results=[];

async function testVariant(variant,index){
  const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce',javaScriptEnabled:variant.javaScriptEnabled!==false});
  const page=await context.newPage();
  page.setDefaultTimeout(4000);
  if(variant.block){
    await page.route('**/*',route=>{
      const url=route.request().url();
      if(url.includes(variant.block))return route.fulfill({status:200,contentType:'application/javascript',body:'/* isolated by Build Web Apps QA */'});
      return route.continue();
    });
  }
  const started=Date.now();
  const screenshot=`${evidenceDirectory}/${String(index).padStart(2,'0')}-music-${variant.name}.png`;
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,240));});
  try{
    const response=await page.goto('http://127.0.0.1:4173/music/',{waitUntil:'domcontentloaded',timeout:7000});
    await page.waitForTimeout(500);
    const bodyText=await page.locator('body').innerText({timeout:3000});
    const state=await page.evaluate(()=>({
      readyState:document.readyState,
      bodyClasses:document.body.className,
      playlistText:(document.querySelector('#playlistGrid')?.textContent||'').replace(/\s+/g,' ').trim().slice(0,240),
      scriptSources:[...document.scripts].map(script=>script.src||'[inline]').slice(0,30),
      images:[...document.images].filter(image=>image.getBoundingClientRect().width>0).map(image=>({src:image.getAttribute('src')||'',complete:image.complete,width:image.naturalWidth})).slice(0,20)
    }));
    await page.screenshot({path:screenshot,animations:'disabled',timeout:5000});
    return {variant:variant.name,block:variant.block||null,status:response?.status()??null,passed:bodyText.trim().length>120,durationMs:Date.now()-started,textLength:bodyText.trim().length,state,consoleErrors,screenshot};
  }catch(error){
    return {variant:variant.name,block:variant.block||null,passed:false,durationMs:Date.now()-started,error:error instanceof Error?error.message:String(error),consoleErrors,screenshot:null};
  }finally{
    await bounded(page.close({runBeforeUnload:false}).catch(()=>{}),800,null);
    await bounded(context.close().catch(()=>{}),800,null);
  }
}

let index=1;
for(const variant of variants){
  const timeout={variant:variant.name,block:variant.block||null,passed:false,error:'Variant exceeded the 12-second diagnostic budget.',screenshot:null};
  const result=await bounded(testVariant(variant,index),12000,timeout);
  results.push(result);
  writeFileSync(path.join(evidenceDirectory,'manifest.json'),JSON.stringify(results,null,2));
  index+=1;
}
const responsive=results.filter(result=>result.passed).map(result=>result.variant);
writeFileSync(path.join(evidenceDirectory,'summary.json'),JSON.stringify({variants:results.length,responsive,results},null,2));
await bounded(browser.close().catch(()=>{}),2000,null);
process.exit(0);
