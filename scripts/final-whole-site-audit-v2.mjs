import { chromium } from 'playwright';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('dist');
const evidenceDirectory=path.resolve('final-whole-site-audit');
const primaryOrigin='http://127.0.0.1:4173';
const cognitaOrigin='http://127.0.0.1:4174';
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
    const target=raw.startsWith('/')?raw.slice(1):path.posix.normalize(path.posix.join(path.posix.dirname(name),raw));
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

const groups=[
  {name:'home',required:true,origin:primaryOrigin,options:[['index.html','/']]},
  {name:'about-fmb',required:true,origin:primaryOrigin,options:[['aboutfmb/index.html','/aboutfmb/']]},
  {name:'with-love-fmb',required:true,origin:primaryOrigin,options:[['withlovefmb/index.html','/withlovefmb/'],['with-love-fmb/index.html','/with-love-fmb/']]},
  {name:'news',required:true,origin:primaryOrigin,options:[['news/index.html','/news/']]},
  {name:'music',required:true,origin:primaryOrigin,options:[['music/index.html','/music/']]},
  {name:'ebooks',required:true,origin:primaryOrigin,options:[['ebooks/index.html','/ebooks/']]},
  {name:'fmbandco',required:true,origin:primaryOrigin,options:[['fmbandco/index.html','/fmbandco/'],['fmb&co/index.html','/fmb&co/']]},
  {name:'senz-gateway',required:true,origin:primaryOrigin,options:[['fmbandco/senz/index.html','/fmbandco/senz/'],['fmb&co/senz/index.html','/fmb&co/senz/']]},
  {name:'cognita-gateway',required:true,origin:primaryOrigin,options:[['fmbandco/cognita/index.html','/fmbandco/cognita/'],['fmb&co/cognita/index.html','/fmb&co/cognita/']]},
  {name:'projects',required:true,origin:primaryOrigin,options:[['projects/index.html','/projects/']]},
  {name:'get-help',required:true,origin:primaryOrigin,options:[['gethelp/index.html','/gethelp/'],['get-help/index.html','/get-help/']]},
  {name:'community',required:true,origin:primaryOrigin,options:[['communityengagements/index.html','/communityengagements/']]},
  {name:'yoni',required:true,origin:primaryOrigin,options:[['app/index.html','/app/']]},
  {name:'yoni-install',required:true,origin:primaryOrigin,options:[['app/install/index.html','/app/install/']]},
  {name:'terms',required:true,origin:primaryOrigin,options:[['terms/index.html','/terms/']]},
  {name:'privacy',required:true,origin:primaryOrigin,options:[['privacy/index.html','/privacy/']]},
  {name:'data-deletion',required:true,origin:primaryOrigin,options:[['data-deletion/index.html','/data-deletion/']]},
  {name:'senz-site',required:true,origin:primaryOrigin,options:[['_sites/senz/index.html','/_sites/senz/']]},
  {name:'cognita-site',required:true,origin:cognitaOrigin,options:[['_sites/cognita/index.html','/']]},
  {name:'data-center',required:false,origin:primaryOrigin,options:[['data/index.html','/data/'],['data-center/index.html','/data-center/'],['_sites/data/index.html','/_sites/data/']]}
];
const routes=[];
for(const group of groups){
  const selected=group.options.find(([file])=>fileSet.has(file));
  if(selected)routes.push({...group,file:selected[0],route:selected[1]});
  else if(group.required)staticFailures.push({page:group.name,type:'missing-required-route',options:group.options.map(option=>option[0])});
}
await writeFile(path.join(evidenceDirectory,'static-summary.json'),JSON.stringify({htmlPages:htmlFiles.length,totalFiles:files.length,failures:staticFailures},null,2));

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
      return {name:'mobile-navigation',status:dock?'passed':'failed',proof:`dock visible=${Boolean(dock)}`};
    }
    const anchor=await firstVisible(page,'a[href="#bulletin"],a[href="#ecosystem"],a[href="#work"]');
    if(!anchor)return {name:'home-anchor',status:'failed',proof:'No principal homepage anchor is visible.'};
    const target=await anchor.getAttribute('href');
    await anchor.click();
    const reached=await page.waitForFunction(expected=>location.hash===expected,target,{timeout:3000}).then(()=>true).catch(()=>false);
    return {name:'home-anchor',status:reached?'passed':'failed',proof:`target=${target}; hash=${await page.evaluate(()=>location.hash)}`};
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
    if(!trigger)return {name:'reception',status:'failed',proof:'Reception trigger is not visible.'};
    await trigger.click();
    const opened=await page.locator('.az-help-panel').first().waitFor({state:'visible',timeout:6000}).then(()=>true).catch(()=>false);
    return {name:'reception',status:opened?'passed':'failed',proof:`panel visible=${opened}`};
  }

  if(item.name==='music'){
    const filter=await firstVisible(page,'[data-music-filter]:not([data-music-filter="all"])');
    if(!filter)return {name:'music-filter',status:'failed',proof:'No collection filter is visible.'};
    await filter.click();
    const pressed=await filter.getAttribute('aria-pressed');
    return {name:'music-filter',status:pressed==='true'?'passed':'failed',proof:`aria-pressed=${pressed}`};
  }

  if(item.name==='ebooks'){
    const filter=await firstVisible(page,'[data-ebook-filter="open"]');
    if(!filter)return {name:'ebook-filter',status:'failed',proof:'Open-book filter is not visible.'};
    await filter.click();
    const pressed=await filter.getAttribute('aria-pressed');
    return {name:'ebook-filter',status:pressed==='true'?'passed':'failed',proof:`aria-pressed=${pressed}`};
  }

  if(item.name==='yoni'){
    const signIn=await firstVisible(page,'#appSigninTab,#signinTab,[data-auth-tab="signin"]');
    if(signIn){
      await signIn.click();
      const selected=await signIn.getAttribute('aria-selected');
      const active=await signIn.evaluate(element=>element.classList.contains('active'));
      return {name:'yoni-access',status:selected==='true'||active?'passed':'failed',proof:`selected=${selected}; active=${active}`};
    }
    const gate=await firstVisible(page,'#accessGate,.access-gate');
    return {name:'yoni-access',status:gate?'passed':'failed',proof:`gate visible=${Boolean(gate)}`};
  }

  if(item.name==='yoni-install'){
    const button=await firstVisible(page,'#installNow');
    if(!button)return {name:'yoni-install',status:'failed',proof:'Install button is missing.'};
    const before=(await page.locator('#installStatus').textContent().catch(()=>''))||'';
    await button.click();
    await page.waitForTimeout(250);
    const after=(await page.locator('#installStatus').textContent().catch(()=>''))||'';
    const guide=await firstVisible(page,'#installGuide');
    return {name:'yoni-install',status:guide&&after.trim()!==before.trim()?'passed':'failed',proof:`guide=${Boolean(guide)}; status changed=${after.trim()!==before.trim()}`};
  }

  if(item.name==='data-center'){
    const email=await firstVisible(page,'input[type="email"],input[name="email"]');
    const submit=await firstVisible(page,'button[type="submit"],.primary-button');
    return {name:'data-center-login',status:email&&submit?'passed':'failed',proof:`email=${Boolean(email)}; submit=${Boolean(submit)}`};
  }

  if(['fmbandco','senz-gateway','cognita-gateway'].includes(item.name)){
    const header=await firstVisible(page,'.fco-header');
    const logo=await firstVisible(page,'.fco-header-logo img');
    const links=await page.locator('.fco-nav-links a').count();
    const headerHeight=header?await header.evaluate(element=>Math.round(element.getBoundingClientRect().height)):0;
    const valid=Boolean(header&&logo)&&headerHeight>=60&&(profile.isMobile||links>=11);
    return {
      name:'company-navigation',
      status:valid?'passed':'failed',
      proof:`header=${Boolean(header)}; logo=${Boolean(logo)}; height=${headerHeight}; links=${links}`
    };
  }

  return {name:'route-smoke',status:'passed',proof:'First meaningful screen rendered.'};
}

const profiles=[
  {name:'desktop',viewport:{width:1440,height:1000},isMobile:false},
  {name:'iphone',viewport:{width:390,height:844},isMobile:true}
];
const browser=await chromium.launch({headless:true});
const records=[];
let sequence=1;

for(const profile of profiles){
  for(const item of routes){
    const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.isMobile,hasTouch:profile.isMobile,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.setDefaultTimeout(8000);
    const consoleErrors=[];
    const localFailures=[];
    const backendWarnings=[];
    const failedRequests=[];
    const started=Date.now();
    const screenshot=`${String(sequence).padStart(2,'0')}-${item.name}-${profile.name}.png`;

    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,300));});
    page.on('response',response=>{
      try{
        const url=new URL(response.url());
        if(url.origin!==item.origin||response.status()<400)return;
        if(item.name==='cognita-site'&&url.pathname.startsWith('/api/'))backendWarnings.push({path:url.pathname,status:response.status()});
        else localFailures.push({path:url.pathname,status:response.status()});
      }catch{}
    });
    page.on('requestfailed',request=>{
      try{
        const url=new URL(request.url());
        const backend=item.name==='cognita-site'&&url.origin===item.origin&&url.pathname.startsWith('/api/');
        failedRequests.push({url:url.href,local:url.origin===item.origin&&!backend,backend,error:request.failure()?.errorText||'failed'});
      }catch{}
    });

    try{
      const response=await page.goto(`${item.origin}${item.route}`,{waitUntil:'domcontentloaded',timeout:12000});
      await page.evaluate(async()=>{
        if(document.fonts?.ready)await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1500))]);
        scrollTo(0,0);
        const images=[...document.images].filter(image=>{
          const rect=image.getBoundingClientRect();
          const style=getComputedStyle(image);
          return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;
        });
        await Promise.race([
          Promise.all(images.map(image=>image.complete?Promise.resolve():new Promise(resolve=>{
            image.addEventListener('load',resolve,{once:true});
            image.addEventListener('error',resolve,{once:true});
          }))),
          new Promise(resolve=>setTimeout(resolve,3500))
        ]);
      });

      const state=await page.evaluate(()=>{
        const text=(document.body.innerText||'').replace(/\s+/g,' ').trim();
        const images=[...document.images].filter(image=>{
          const rect=image.getBoundingClientRect();
          const style=getComputedStyle(image);
          return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight;
        }).map(image=>({src:image.currentSrc||image.src,complete:image.complete,naturalWidth:image.naturalWidth,local:new URL(image.currentSrc||image.src,location.href).origin===location.origin}));
        const overlay=Boolean(document.querySelector('vite-error-overlay,nextjs-portal,[data-nextjs-dialog-overlay],#webpack-dev-server-client-overlay'))||/Unhandled Runtime Error|Internal Server Error|Failed to compile/i.test(text.slice(0,1500));
        return {textLength:text.length,images,overlay};
      });

      const interaction=await exercise(page,item,profile).catch(error=>({name:'interaction',status:'failed',proof:error instanceof Error?error.message:String(error)}));
      await page.evaluate(()=>scrollTo(0,0)).catch(()=>{});
      await page.screenshot({path:path.join(evidenceDirectory,screenshot),animations:'disabled',timeout:10000});

      const broken=state.images.filter(image=>image.local&&image.complete&&image.naturalWidth===0);
      const runtimeErrors=consoleErrors.filter(message=>/Uncaught|ReferenceError|TypeError|SyntaxError/i.test(message));
      const localFailedRequests=failedRequests.filter(request=>request.local);
      const critical=!response||response.status()>=400||state.textLength<80||state.overlay||broken.length>0||localFailures.length>0||localFailedRequests.length>0||runtimeErrors.length>0||interaction.status==='failed';

      records.push({
        page:item.name,
        profile:profile.name,
        route:item.route,
        origin:item.origin,
        title:await page.title(),
        status:response?.status()??null,
        durationMs:Date.now()-started,
        health:critical?'failed':'passed',
        interaction,
        broken,
        localFailures,
        localFailedRequests,
        backendWarnings,
        backendFailedRequests:failedRequests.filter(request=>request.backend),
        externalFailedRequests:failedRequests.filter(request=>!request.local&&!request.backend).slice(0,8),
        consoleErrors:consoleErrors.slice(0,12),
        runtimeErrors,
        screenshot
      });
    }catch(error){
      records.push({page:item.name,profile:profile.name,route:item.route,origin:item.origin,durationMs:Date.now()-started,health:'blocked',error:error instanceof Error?error.message:String(error),localFailures,backendWarnings,failedRequests,consoleErrors,screenshot:null});
    }

    await context.close().catch(()=>{});
    sequence+=1;
  }
}

await browser.close();
const failures=records.filter(record=>record.health!=='passed');
const summary={
  routes:routes.length,
  captures:records.length,
  passed:records.length-failures.length,
  staticFailures,
  failures,
  backendWarnings:records.flatMap(record=>record.backendWarnings||[]),
  slowest:[...records].sort((a,b)=>b.durationMs-a.durationMs).slice(0,10).map(record=>({page:record.page,profile:record.profile,durationMs:record.durationMs,health:record.health})),
  records
};
await writeFile(path.join(evidenceDirectory,'summary.json'),JSON.stringify(summary,null,2));

if(staticFailures.length)throw new Error(`Static audit found ${staticFailures.length} failure(s).`);
if(failures.length)throw new Error(`Browser audit found ${failures.length} failure(s).`);
console.log(`Final whole-site QA passed ${htmlFiles.length} HTML pages and ${records.length} desktop/iPhone captures across ${routes.length} principal routes.`);
