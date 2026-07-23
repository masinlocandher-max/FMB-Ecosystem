import { chromium } from 'playwright';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('dist');
const evidenceDirectory=path.resolve('final-whole-site-audit');
await mkdir(evidenceDirectory,{recursive:true});

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');
const files=await walk(root);
const fileSet=new Set(files.map(relative));
const htmlFiles=files.filter(file=>file.endsWith('.html'));
const staticFailures=[];

for(const file of htmlFiles){
  const name=relative(file);
  const html=await readFile(file,'utf8');
  if(!/<title>\s*[^<]+\s*<\/title>/i.test(html))staticFailures.push({page:name,type:'missing-title'});
  if(!/<meta\s+name=["']viewport["']/i.test(html))staticFailures.push({page:name,type:'missing-viewport'});
  const ids=[...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
  if(duplicates.length)staticFailures.push({page:name,type:'duplicate-ids',values:duplicates});
  for(const match of html.matchAll(/\s(?:src|poster)=["']([^"']+)["']/gi)){
    const raw=match[1].split('#')[0].split('?')[0];
    if(!raw||/^(?:https?:|data:|blob:|\/\/)/i.test(raw))continue;
    let target;
    if(raw.startsWith('/'))target=raw.slice(1);
    else target=path.posix.normalize(path.posix.join(path.posix.dirname(name),raw));
    if(!fileSet.has(target))staticFailures.push({page:name,type:'missing-local-asset',reference:match[1],target});
  }
}

const exactAssignments={
  'index.html':['/assets/images/fmb-approved/fmb-master-transparent.webp','/assets/images/fmb-approved/francine-standing-landscape.webp','/assets/images/fmb-approved/francine-seated-landscape.webp'],
  'news/index.html':['/assets/images/fmb-approved/fmb-news-official-transparent.webp'],
  'music/index.html':['/assets/images/fmb-approved/fmb-music-official-transparent.webp'],
  'ebooks/index.html':['/assets/images/fmb-approved/fmb-ebook-official-transparent.webp']
};
for(const [name,markers] of Object.entries(exactAssignments)){
  if(!fileSet.has(name)){staticFailures.push({page:name,type:'missing-principal-page'});continue;}
  const html=await readFile(path.join(root,name),'utf8');
  for(const marker of markers)if(!html.includes(marker))staticFailures.push({page:name,type:'missing-exact-identity',marker});
}

const routeGroups=[
  ['home',true,[['index.html','/']]],
  ['about-fmb',true,[['aboutfmb/index.html','/aboutfmb/']]],
  ['with-love-fmb',true,[['withlovefmb/index.html','/withlovefmb/'],['with-love-fmb/index.html','/with-love-fmb/']]],
  ['news',true,[['news/index.html','/news/']]],
  ['music',true,[['music/index.html','/music/']]],
  ['ebooks',true,[['ebooks/index.html','/ebooks/']]],
  ['fmbandco',true,[['fmb&co/index.html','/fmb&co/'],['fmbandco/index.html','/fmbandco/']]],
  ['senz-gateway',true,[['fmb&co/senz/index.html','/fmb&co/senz/']]],
  ['cognita-gateway',true,[['fmb&co/cognita/index.html','/fmb&co/cognita/']]],
  ['projects',true,[['projects/index.html','/projects/']]],
  ['get-help',true,[['gethelp/index.html','/gethelp/'],['get-help/index.html','/get-help/']]],
  ['community',true,[['communityengagements/index.html','/communityengagements/']]],
  ['yoni',true,[['app/index.html','/app/']]],
  ['yoni-install',true,[['app/install/index.html','/app/install/']]],
  ['terms',true,[['terms/index.html','/terms/']]],
  ['privacy',true,[['privacy/index.html','/privacy/']]],
  ['data-deletion',true,[['data-deletion/index.html','/data-deletion/']]],
  ['senz-site',true,[['_sites/senz/index.html','/_sites/senz/']]],
  ['cognita-site',true,[['_sites/cognita/index.html','/_sites/cognita/']]],
  ['data-center',false,[['data/index.html','/data/'],['data-center/index.html','/data-center/'],['_sites/data/index.html','/_sites/data/']]]
];
const routes=[];
for(const [name,required,options] of routeGroups){
  const selected=options.find(([file])=>fileSet.has(file));
  if(selected)routes.push({name,file:selected[0],route:selected[1]});
  else if(required)staticFailures.push({page:name,type:'missing-required-route',options:options.map(option=>option[0])});
}
await writeFile(path.join(evidenceDirectory,'static-summary.json'),JSON.stringify({htmlPages:htmlFiles.length,totalFiles:files.length,failures:staticFailures},null,2));

async function firstVisible(page,selector){
  const locator=page.locator(selector);
  const count=await locator.count();
  for(let index=0;index<count;index+=1){const candidate=locator.nth(index);if(await candidate.isVisible().catch(()=>false))return candidate;}
  return null;
}

async function exercise(page,item,profile){
  if(item.name==='home'){
    if(profile.isMobile){
      const menu=await firstVisible(page,'#menuButton,.menu-button,[aria-label*="Open navigation" i]');
      if(menu){await menu.click();const expanded=await menu.getAttribute('aria-expanded');return {name:'mobile-navigation',status:expanded==='true'?'passed':'failed',proof:`aria-expanded=${expanded}`};}
      const dock=await firstVisible(page,'.mobile-dock,.mobile-bar');
      return {name:'mobile-navigation',status:dock?'passed':'failed',proof:`dock visible=${Boolean(dock)}`};
    }
    const anchor=await firstVisible(page,'a[href="#bulletin"],a[href="#ecosystem"],a[href="#work"]');
    if(!anchor)return {name:'home-anchor',status:'failed',proof:'No principal homepage anchor is visible.'};
    const target=await anchor.getAttribute('href');await anchor.click();
    const reached=await page.waitForFunction(expected=>location.hash===expected,target,{timeout:3000}).then(()=>true).catch(()=>false);
    return {name:'home-anchor',status:reached?'passed':'failed',proof:`target=${target}; hash=${await page.evaluate(()=>location.hash)}`};
  }
  if(item.name==='news'&&profile.isMobile){
    const menu=await firstVisible(page,'[data-news-menu],.nc-menu-toggle');
    if(menu){await menu.click();const expanded=await menu.getAttribute('aria-expanded');return {name:'news-navigation',status:expanded==='true'?'passed':'failed',proof:`aria-expanded=${expanded}`};}
    const dock=await firstVisible(page,'.nc-mobile-dock');const links=dock?await dock.locator('a').count():0;
    return {name:'news-navigation',status:dock&&links>=3?'passed':'failed',proof:`dock=${Boolean(dock)}; links=${links}`};
  }
  if(item.name==='about-fmb'&&profile.isMobile){
    await page.waitForTimeout(1000);const trigger=await firstVisible(page,'.pearly-lazy-trigger,.az-help-trigger');
    if(!trigger)return {name:'reception',status:'failed',proof:'Reception trigger is not visible.'};
    await trigger.click();const opened=await page.locator('.az-help-panel').first().waitFor({state:'visible',timeout:6000}).then(()=>true).catch(()=>false);
    return {name:'reception',status:opened?'passed':'failed',proof:`panel visible=${opened}`};
  }
  if(item.name==='music'){
    const filter=await firstVisible(page,'[data-music-filter]:not([data-music-filter="all"])');
    if(!filter)return {name:'music-filter',status:'failed',proof:'No collection filter is visible.'};
    await filter.click();return {name:'music-filter',status:(await filter.getAttribute('aria-pressed'))==='true'?'passed':'failed',proof:`aria-pressed=${await filter.getAttribute('aria-pressed')}`};
  }
  if(item.name==='ebooks'){
    const filter=await firstVisible(page,'[data-ebook-filter="open"]');
    if(!filter)return {name:'ebook-filter',status:'failed',proof:'Open-book filter is not visible.'};
    await filter.click();return {name:'ebook-filter',status:(await filter.getAttribute('aria-pressed'))==='true'?'passed':'failed',proof:`aria-pressed=${await filter.getAttribute('aria-pressed')}`};
  }
  if(item.name==='yoni'){
    const signIn=await firstVisible(page,'#appSigninTab,#signinTab,[data-auth-tab="signin"]');
    if(signIn){await signIn.click();const selected=await signIn.getAttribute('aria-selected');const active=await signIn.evaluate(element=>element.classList.contains('active'));return {name:'yoni-access',status:selected==='true'||active?'passed':'failed',proof:`selected=${selected}; active=${active}`};}
    const gate=await firstVisible(page,'#accessGate,.access-gate');return {name:'yoni-access',status:gate?'passed':'failed',proof:`gate visible=${Boolean(gate)}`};
  }
  if(item.name==='yoni-install'){
    const button=await firstVisible(page,'#installNow');if(!button)return {name:'yoni-install',status:'failed',proof:'Install button is missing.'};
    const before=(await page.locator('#installStatus').textContent().catch(()=>''))||'';await button.click();await page.waitForTimeout(250);const after=(await page.locator('#installStatus').textContent().catch(()=>''))||'';const guide=await firstVisible(page,'#installGuide');
    return {name:'yoni-install',status:guide&&after.trim()!==before.trim()?'passed':'failed',proof:`guide=${Boolean(guide)}; status changed=${after.trim()!==before.trim()}`};
  }
  if(item.name==='data-center'){
    const email=await firstVisible(page,'input[type="email"],input[name="email"]');const submit=await firstVisible(page,'button[type="submit"],.primary-button');
    return {name:'data-center-login',status:email&&submit?'passed':'failed',proof:`email=${Boolean(email)}; submit=${Boolean(submit)}`};
  }
  return {name:'route-smoke',status:'passed',proof:'First meaningful screen rendered.'};
}

const profiles=[{name:'desktop',viewport:{width:1440,height:1000},isMobile:false},{name:'iphone',viewport:{width:390,height:844},isMobile:true}];
const browser=await chromium.launch({headless:true});
const records=[];let sequence=1;
for(const profile of profiles){
  for(const item of routes){
    const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.isMobile,hasTouch:profile.isMobile,reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(8000);
    const consoleErrors=[];const localFailures=[];const failedRequests=[];const started=Date.now();const screenshot=`${String(sequence).padStart(2,'0')}-${item.name}-${profile.name}.png`;
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,300));});
    page.on('response',response=>{try{const url=new URL(response.url());if(url.origin==='http://127.0.0.1:4173'&&response.status()>=400)localFailures.push({path:url.pathname,status:response.status()});}catch{}});
    page.on('requestfailed',request=>{try{const url=new URL(request.url());failedRequests.push({url:url.href,local:url.origin==='http://127.0.0.1:4173',error:request.failure()?.errorText||'failed'});}catch{}});
    try{
      const response=await page.goto(`http://127.0.0.1:4173${item.route}`,{waitUntil:'domcontentloaded',timeout:12000});
      await page.evaluate(async()=>{if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1500))]);scrollTo(0,0);const images=[...document.images].filter(image=>{const rect=image.getBoundingClientRect();const style=getComputedStyle(image);return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;});await Promise.race([Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});}))),new Promise(resolve=>setTimeout(resolve,3500))]);});
      const state=await page.evaluate(()=>{const text=(document.body.innerText||'').replace(/\s+/g,' ').trim();const images=[...document.images].filter(image=>{const rect=image.getBoundingClientRect();const style=getComputedStyle(image);return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;}).map(image=>({src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,local:new URL(image.currentSrc||image.src,location.href).origin===location.origin}));const overlay=Boolean(document.querySelector('vite-error-overlay,nextjs-portal,[data-nextjs-dialog-overlay],#webpack-dev-server-client-overlay'))||/Unhandled Runtime Error|Internal Server Error|Failed to compile/i.test(text.slice(0,1500));return {textLength:text.length,images,overlay};});
      const interaction=await exercise(page,item,profile).catch(error=>({name:'interaction',status:'failed',proof:error instanceof Error?error.message:String(error)}));await page.evaluate(()=>scrollTo(0,0)).catch(()=>{});await page.screenshot({path:path.join(evidenceDirectory,screenshot),animations:'disabled',timeout:10000});
      const broken=state.images.filter(image=>image.local&&image.complete&&image.naturalWidth===0);const runtimeErrors=consoleErrors.filter(message=>/Uncaught|ReferenceError|TypeError|SyntaxError/i.test(message));const critical=!response||response.status()>=400||state.textLength<80||state.overlay||broken.length||localFailures.length||failedRequests.some(request=>request.local)||runtimeErrors.length||interaction.status==='failed';
      records.push({page:item.name,profile:profile.name,route:item.route,title:await page.title(),status:response?.status()??null,durationMs:Date.now()-started,health:critical?'failed':'passed',interaction,broken,localFailures,localFailedRequests:failedRequests.filter(request=>request.local),externalFailedRequests:failedRequests.filter(request=>!request.local).slice(0,8),consoleErrors:consoleErrors.slice(0,12),runtimeErrors,screenshot});
    }catch(error){records.push({page:item.name,profile:profile.name,route:item.route,durationMs:Date.now()-started,health:'blocked',error:error instanceof Error?error.message:String(error),localFailures,failedRequests,consoleErrors,screenshot:null});}
    await context.close().catch(()=>{});sequence+=1;
  }
}
await browser.close();
const failures=records.filter(record=>record.health!=='passed');
const summary={routes:routes.length,captures:records.length,passed:records.length-failures.length,staticFailures,failures,slowest:[...records].sort((a,b)=>b.durationMs-a.durationMs).slice(0,10).map(record=>({page:record.page,profile:record.profile,durationMs:record.durationMs,health:record.health})),records};
await writeFile(path.join(evidenceDirectory,'summary.json'),JSON.stringify(summary,null,2));
if(staticFailures.length)throw new Error(`Static audit found ${staticFailures.length} failure(s).`);
if(failures.length)throw new Error(`Browser audit found ${failures.length} failure(s).`);
console.log(`Final whole-site QA passed ${htmlFiles.length} HTML pages and ${records.length} desktop/iPhone captures across ${routes.length} principal routes.`);
