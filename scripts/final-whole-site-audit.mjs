import { chromium } from 'playwright';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('dist');
const evidence=path.resolve('final-whole-site-audit');
await mkdir(evidence,{recursive:true});

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}
const normalize=file=>path.relative(root,file).replaceAll(path.sep,'/');
const allFiles=await walk(root);
const fileSet=new Set(allFiles.map(normalize));
const htmlFiles=allFiles.filter(file=>file.endsWith('.html'));

function cleanReference(value){
  return String(value||'').trim().replaceAll('&amp;','&').replaceAll('&#38;','&');
}
function candidatesFor(reference,htmlRelative){
  const cleaned=cleanReference(reference);
  if(!cleaned||cleaned.startsWith('#')||cleaned.startsWith('//')||/^[a-z][a-z0-9+.-]*:/i.test(cleaned)||cleaned.startsWith('?'))return [];
  let pathname=cleaned.split('#')[0].split('?')[0];
  try{pathname=decodeURIComponent(pathname);}catch{}
  if(!pathname)return [];
  const base=pathname.startsWith('/')?'':path.posix.dirname(htmlRelative);
  const joined=path.posix.normalize(path.posix.join(base,pathname.replace(/^\//,'')));
  if(joined.startsWith('../'))return [`!outside:${joined}`];
  if(joined.endsWith('/'))return [`${joined}index.html`];
  const result=[joined];
  if(!path.posix.extname(joined))result.push(`${joined}.html`,`${joined}/index.html`);
  return result;
}

const staticFailures=[];
const staticWarnings=[];
let checkedReferences=0;
for(const file of htmlFiles){
  const relative=normalize(file);
  const html=await readFile(file,'utf8');
  if(!/<title>\s*[^<]+\s*<\/title>/i.test(html))staticWarnings.push({page:relative,type:'missing-title'});
  if(!/<meta\s+name=["']viewport["']/i.test(html))staticWarnings.push({page:relative,type:'missing-viewport'});
  const ids=[...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
  if(duplicates.length)staticFailures.push({page:relative,type:'duplicate-ids',values:duplicates});
  for(const match of html.matchAll(/\s(?:src|href|poster)=["']([^"']+)["']/gi)){
    const reference=match[1];
    const candidates=candidatesFor(reference,relative);
    if(!candidates.length)continue;
    checkedReferences+=1;
    if(candidates.some(candidate=>candidate.startsWith('!outside:'))){
      staticFailures.push({page:relative,type:'path-escapes-dist',reference});
      continue;
    }
    if(!candidates.some(candidate=>fileSet.has(candidate))){
      staticFailures.push({page:relative,type:'missing-local-reference',reference,candidates});
    }
  }
}

const exactBrandAssignments={
  'index.html':['/assets/images/fmb-approved/fmb-master-transparent.webp','/assets/images/fmb-approved/francine-standing-landscape.webp','/assets/images/fmb-approved/francine-seated-landscape.webp'],
  'news/index.html':['/assets/images/fmb-approved/fmb-news-official-transparent.webp'],
  'music/index.html':['/assets/images/fmb-approved/fmb-music-official-transparent.webp'],
  'ebooks/index.html':['/assets/images/fmb-approved/fmb-ebook-official-transparent.webp']
};
for(const [relative,markers] of Object.entries(exactBrandAssignments)){
  if(!fileSet.has(relative)){staticFailures.push({page:relative,type:'missing-principal-page'});continue;}
  const html=await readFile(path.join(root,relative),'utf8');
  for(const marker of markers)if(!html.includes(marker))staticFailures.push({page:relative,type:'missing-exact-brand-asset',marker});
}

const staticSummary={htmlPages:htmlFiles.length,files:allFiles.length,checkedReferences,failures:staticFailures,warnings:staticWarnings};
await writeFile(path.join(evidence,'static-summary.json'),JSON.stringify(staticSummary,null,2));

const groups=[
  {name:'home',required:true,options:[['index.html','/']]},
  {name:'about-fmb',required:true,options:[['aboutfmb/index.html','/aboutfmb/']]},
  {name:'with-love-fmb',required:true,options:[['withlovefmb/index.html','/withlovefmb/'],['with-love-fmb/index.html','/with-love-fmb/']]},
  {name:'news',required:true,options:[['news/index.html','/news/']]},
  {name:'music',required:true,options:[['music/index.html','/music/']]},
  {name:'ebooks',required:true,options:[['ebooks/index.html','/ebooks/']]},
  {name:'fmbandco',required:true,options:[['fmb&co/index.html','/fmb&co/'],['fmbandco/index.html','/fmbandco/']]},
  {name:'senz-gateway',required:true,options:[['fmb&co/senz/index.html','/fmb&co/senz/']]},
  {name:'cognita-gateway',required:true,options:[['fmb&co/cognita/index.html','/fmb&co/cognita/']]},
  {name:'projects',required:true,options:[['projects/index.html','/projects/']]},
  {name:'get-help',required:true,options:[['gethelp/index.html','/gethelp/'],['get-help/index.html','/get-help/']]},
  {name:'community',required:true,options:[['communityengagements/index.html','/communityengagements/']]},
  {name:'yoni',required:true,options:[['app/index.html','/app/']]},
  {name:'yoni-install',required:true,options:[['app/install/index.html','/app/install/']]},
  {name:'senz-site',required:true,options:[['_sites/senz/index.html','/_sites/senz/']]},
  {name:'cognita-site',required:true,options:[['_sites/cognita/index.html','/_sites/cognita/']]},
  {name:'data-center',required:false,options:[['data/index.html','/data/'],['data-center/index.html','/data-center/'],['_sites/data/index.html','/_sites/data/'],['_sites/data-center/index.html','/_sites/data-center/']]}
];
const routes=[];
for(const group of groups){
  const selected=group.options.find(([file])=>fileSet.has(file));
  if(selected)routes.push({name:group.name,file:selected[0],route:selected[1]});
  else if(group.required)staticFailures.push({page:group.name,type:'missing-required-route',options:group.options.map(item=>item[0])});
}
await writeFile(path.join(evidence,'static-summary.json'),JSON.stringify({...staticSummary,failures:staticFailures},null,2));

const profiles=[
  {name:'desktop',viewport:{width:1440,height:1000},isMobile:false},
  {name:'iphone',viewport:{width:390,height:844},isMobile:true}
];

async function firstVisible(page,selector){
  const locator=page.locator(selector);
  for(let index=0;index<await locator.count();index+=1){
    const candidate=locator.nth(index);
    if(await candidate.isVisible().catch(()=>false))return candidate;
  }
  return null;
}

async function exercise(page,item,profile){
  if(item.name==='home'){
    if(profile.isMobile){
      const menu=await firstVisible(page,'#menuButton,.menu-button,[aria-label*="Open navigation" i]');
      if(menu){
        await menu.click();
        const expanded=await menu.getAttribute('aria-expanded');
        return {name:'mobile-navigation',status:expanded==='true'?'passed':'failed',proof:`aria-expanded=${expanded}`};
      }
      const dock=await firstVisible(page,'.mobile-dock,.mobile-bar');
      return {name:'mobile-navigation',status:dock?'passed':'failed',proof:`mobile dock visible=${Boolean(dock)}`};
    }
    const anchor=await firstVisible(page,'a[href="#bulletin"],a[href="#ecosystem"],a[href="#work"]');
    if(!anchor)return {name:'homepage-anchor',status:'failed',proof:'No principal homepage anchor was visible.'};
    const href=await anchor.getAttribute('href');
    await anchor.click();
    const reached=await page.waitForFunction(expected=>location.hash===expected,href,{timeout:3000}).then(()=>true).catch(()=>false);
    return {name:'homepage-anchor',status:reached?'passed':'failed',proof:`target=${href}; hash=${await page.evaluate(()=>location.hash)}`};
  }
  if(item.name==='news'&&profile.isMobile){
    const menu=await firstVisible(page,'[data-news-menu],.nc-menu-toggle');
    if(menu){
      await menu.click();
      const expanded=await menu.getAttribute('aria-expanded');
      return {name:'news-navigation',status:expanded==='true'?'passed':'failed',proof:`aria-expanded=${expanded}`};
    }
    const dock=await firstVisible(page,'.nc-mobile-dock');
    const links=dock?await dock.locator('a').count():0;
    return {name:'news-navigation',status:dock&&links>=3?'passed':'failed',proof:`dock=${Boolean(dock)}; links=${links}`};
  }
  if(item.name==='about-fmb'&&profile.isMobile){
    await page.waitForTimeout(1000);
    const trigger=await firstVisible(page,'.pearly-lazy-trigger,.az-help-trigger');
    if(!trigger)return {name:'reception-desk',status:'failed',proof:'Reception trigger was not visible.'};
    await trigger.click();
    const opened=await page.locator('.az-help-panel').first().waitFor({state:'visible',timeout:6000}).then(()=>true).catch(()=>false);
    return {name:'reception-desk',status:opened?'passed':'failed',proof:`panel visible=${opened}`};
  }
  if(item.name==='music'){
    const filter=await firstVisible(page,'[data-music-filter]:not([data-music-filter="all"])');
    if(!filter)return {name:'music-filter',status:'failed',proof:'Music filter was not visible.'};
    await filter.click();
    const pressed=await filter.getAttribute('aria-pressed');
    return {name:'music-filter',status:pressed==='true'?'passed':'failed',proof:`aria-pressed=${pressed}`};
  }
  if(item.name==='ebooks'){
    const filter=await firstVisible(page,'[data-ebook-filter="open"]');
    if(!filter)return {name:'ebook-filter',status:'failed',proof:'eBook access filter was not visible.'};
    await filter.click();
    const pressed=await filter.getAttribute('aria-pressed');
    return {name:'ebook-filter',status:pressed==='true'?'passed':'failed',proof:`aria-pressed=${pressed}`};
  }
  if(item.name==='yoni'){
    const signIn=await firstVisible(page,'#appSigninTab,#signinTab,[data-auth-tab="signin"]');
    if(signIn){
      await signIn.click();
      const selected=await signIn.getAttribute('aria-selected');
      return {name:'yoni-access-tabs',status:selected==='true'||await signIn.evaluate(element=>element.classList.contains('active'))?'passed':'failed',proof:`aria-selected=${selected}`};
    }
    const gate=await firstVisible(page,'#accessGate,.access-gate');
    return {name:'yoni-access-gate',status:gate?'passed':'failed',proof:`access gate visible=${Boolean(gate)}`};
  }
  if(item.name==='yoni-install'){
    const button=await firstVisible(page,'#installNow');
    if(!button)return {name:'yoni-install',status:'failed',proof:'Install button was not visible.'};
    const before=(await page.locator('#installStatus').textContent().catch(()=>''))||'';
    await button.click();
    await page.waitForTimeout(250);
    const after=(await page.locator('#installStatus').textContent().catch(()=>''))||'';
    const guide=await firstVisible(page,'#installGuide');
    return {name:'yoni-install',status:guide&&after.trim()!==before.trim()?'passed':'failed',proof:`guide=${Boolean(guide)}; status changed=${after.trim()!==before.trim()}`};
  }
  if(item.name==='data-center'){
    const email=await firstVisible(page,'input[type="email"],input[name="email"]');
    const button=await firstVisible(page,'button[type="submit"],.primary-button');
    return {name:'data-center-login',status:email&&button?'passed':'failed',proof:`email=${Boolean(email)}; submit=${Boolean(button)}`};
  }
  return {name:'route-smoke',status:'passed',proof:'First meaningful screen rendered.'};
}

const browser=await chromium.launch({headless:true});
const records=[];
let sequence=1;
for(const profile of profiles){
  for(const item of routes){
    const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.isMobile,hasTouch:profile.isMobile,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.setDefaultTimeout(8000);
    const screenshot=`${String(sequence).padStart(2,'0')}-${item.name}-${profile.name}.png`;
    const consoleErrors=[];
    const localFailures=[];
    const failedRequests=[];
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,300));});
    page.on('response',response=>{try{const url=new URL(response.url());if(url.origin==='http://127.0.0.1:4173'&&response.status()>=400)localFailures.push({path:url.pathname,status:response.status()});}catch{}});
    page.on('requestfailed',request=>{try{const url=new URL(request.url());failedRequests.push({url:url.href,local:url.origin==='http://127.0.0.1:4173',error:request.failure()?.errorText||'request failed'});}catch{}});
    const started=Date.now();
    try{
      const response=await page.goto(`http://127.0.0.1:4173${item.route}`,{waitUntil:'domcontentloaded',timeout:12000});
      await page.evaluate(async()=>{
        if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1500))]);
        scrollTo(0,0);
        const visible=[...document.images].filter(image=>{const rect=image.getBoundingClientRect();const style=getComputedStyle(image);return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;});
        await Promise.race([Promise.all(visible.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true});}))),new Promise(resolve=>setTimeout(resolve,3500))]);
      });
      await page.waitForTimeout(200);
      const evidenceState=await page.evaluate(()=>{
        const meaningful=(document.body.innerText||'').replace(/\s+/g,' ').trim();
        const images=[...document.images].filter(image=>{const rect=image.getBoundingClientRect();const style=getComputedStyle(image);return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;}).map(image=>({src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,local:new URL(image.currentSrc||image.src,location.href).origin===location.origin}));
        const overlay=Boolean(document.querySelector('vite-error-overlay,nextjs-portal,[data-nextjs-dialog-overlay],#webpack-dev-server-client-overlay'))||/Unhandled Runtime Error|Internal Server Error|Failed to compile/i.test(meaningful.slice(0,1500));
        return {meaningfulLength:meaningful.length,images,overlay};
      });
      const interaction=await exercise(page,item,profile).catch(error=>({name:'interaction',status:'failed',proof:error instanceof Error?error.message:String(error)}));
      await page.evaluate(()=>scrollTo(0,0)).catch(()=>{});
      await page.screenshot({path:path.join(evidence,screenshot),animations:'disabled',timeout:10000});
      const localBroken=evidenceState.images.filter(image=>image.local&&image.complete&&image.naturalWidth===0);
      const runtimeErrors=consoleErrors.filter(message=>/Uncaught|ReferenceError|TypeError|SyntaxError/i.test(message));
      const critical=!response||response.status()>=400||evidenceState.meaningfulLength<80||evidenceState.overlay||localBroken.length>0||localFailures.length>0||failedRequests.some(request=>request.local)||runtimeErrors.length>0||interaction.status==='failed';
      records.push({page:item.name,profile:profile.name,route:item.route,title:await page.title(),status:response?.status()??null,durationMs:Date.now()-started,health:critical?'failed':'passed',interaction,localBroken,localFailures,localFailedRequests:failedRequests.filter(request=>request.local),externalFailedRequests:failedRequests.filter(request=>!request.local).slice(0,8),consoleErrors:consoleErrors.slice(0,12),runtimeErrors,screenshot});
    }catch(error){
      records.push({page:item.name,profile:profile.name,route:item.route,durationMs:Date.now()-started,health:'blocked',error:error instanceof Error?error.message:String(error),localFailures,failedRequests,consoleErrors,screenshot:null});
    }finally{
      await context.close().catch(()=>{});
    }
    sequence+=1;
  }
}
await browser.close();

const visualFailures=records.filter(record=>record.health!=='passed');
const summary={routes:routes.length,captures:records.length,passed:records.filter(record=>record.health==='passed').length,static:staticSummary,visualFailures,slowest:[...records].sort((a,b)=>b.durationMs-a.durationMs).slice(0,10).map(record=>({page:record.page,profile:record.profile,durationMs:record.durationMs,health:record.health})),records};
await writeFile(path.join(evidence,'summary.json'),JSON.stringify(summary,null,2));

if(staticFailures.length)throw new Error(`Final static audit found ${staticFailures.length} failure(s).`);
if(visualFailures.length)throw new Error(`Final Playwright audit found ${visualFailures.length} failed or blocked capture(s).`);
console.log(`Final whole-site QA passed ${htmlFiles.length} HTML pages, ${checkedReferences} local references, ${routes.length} principal routes, and ${records.length} desktop/iPhone captures.`);
