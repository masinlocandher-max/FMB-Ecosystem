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
      const menu=await firstVisible(page,'.fmb-shell-menu,#menuButton,.menu-button,[aria-label*="Open navigation" i]');
      if(menu){
        await menu.click();
        await page.waitForTimeout(80);
        const expanded=await menu.getAttribute('aria-expanded');
        const sharedNavOpen=await page.locator('.fmb-shell-nav.is-open').count();
        return {name:'mobile-navigation',status:expanded==='true'||sharedNavOpen===1?'passed':'failed',proof:`aria-expanded=${expanded}; shared-nav-open=${sharedNavOpen}`};
      }
      const dock=await firstVisible(page,'.fmb-mobile-dock,.mobile-dock,.mobile-bar');
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
    if(!filter)return {name:'ebook-filter',status:'failed',proof:'Open-book filter is visible.'};
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
    const header=await firstVisible(page,'.fmb-shell-header,.fco-header');
    const logo=await firstVisible(page,'.fmb-shell-brand img,.fco-header-logo img');
    const sharedLinks=await page.locator('.fmb-shell-nav a').count();
    const legacyLinks=await page.locator('.fco-nav-links a').count();
    const links=Math.max(sharedLinks,legacyLinks);
    const headerHeight=header?await header.evaluate(element=>Math.round(element.getBoundingClientRect().height)):0;
    const valid=Boolean(header&&logo)&&headerHeight>=60&&(profile.isMobile||links>=9);
    return {
      name:'company-navigation',
      status:valid?'passed':'failed',
      proof:`header=${Boolean(header)}; logo=${Boolean(logo)}; height=${headerHeight}; links=${links}`
    };
  }

  if(item.name==='senz-site'||item.name==='cognita-site'){
    const text=((await page.locator('body').innerText())||'').replace(/\s+/g,' ').trim();
    const required=item.name==='senz-site'
      ? [
          'SENZ is the marketing and digital solutions business of FMB&CO.',
          'No service package, price, division, product, client result, or availability claim is published'
        ]
      : [
          'Cognita is the knowledge and learning arm of FMB&CO.',
          'No public registration, paid enrollment, course, credential, or accreditation claim is active'
        ];
    const forbidden=item.name==='senz-site'
      ? [
          'Six specialist divisions',
          'Strategic communications, PR, and brand strategy for people and organizations that need to be understood.',
          'Explore SENZ Strategic Communications, six specialist divisions, and digital products'
        ]
      : [
          'Cognita Institute is currently under maintenance',
          'Join the waitlist'
        ];
    const missing=required.filter(marker=>!text.includes(marker));
    const normalized=text.toLowerCase();
    const found=forbidden.filter(marker=>normalized.includes(marker.toLowerCase()));
    return {
      name:'standalone-publication-status',
      status:missing.length===0&&found.length===0?'passed':'failed',
      proof:`missing=${missing.length?missing.join(' | '):'none'}; forbidden=${found.length?found.join(' | '):'none'}`
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
const failures=[...staticFailures];
let captureIndex=0;
for(const profile of profiles){
  for(const item of routes){
    captureIndex+=1;
    const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.isMobile,hasTouch:profile.isMobile,deviceScaleFactor:1});
    const page=await context.newPage();
    const consoleErrors=[];
    const runtimeErrors=[];
    const failedRequests=[];
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    page.on('pageerror',error=>runtimeErrors.push(error.message));
    page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText||'request failed',resourceType:request.resourceType()}));
    const started=Date.now();
    let status=0;
    try{
      const response=await page.goto(`${item.origin}${item.route}`,{waitUntil:'networkidle',timeout:30000});
      status=response?.status()||0;
      await page.waitForTimeout(150);
      const interaction=await exercise(page,item,profile);
      const broken=await page.locator('img').evaluateAll(images=>images.filter(image=>image.complete&&image.naturalWidth===0).map(image=>image.currentSrc||image.src));
      const allLocalFailedRequests=failedRequests.filter(request=>request.url.startsWith(primaryOrigin)||request.url.startsWith(cognitaOrigin));
      const canceledMediaWarnings=allLocalFailedRequests.filter(request=>request.error==='net::ERR_ABORTED'&&(request.resourceType==='media'||/\.(?:mp3|m4a|wav|ogg|aac)(?:$|[?#])/i.test(request.url)));
      const localFailedRequests=allLocalFailedRequests.filter(request=>!canceledMediaWarnings.includes(request));
      const externalFailedRequests=failedRequests.filter(request=>!allLocalFailedRequests.includes(request));
      const localFailures=localFailedRequests.map(request=>`${request.url} (${request.error})`);
      const backendWarnings=canceledMediaWarnings.map(request=>`Optional media request canceled by browser: ${request.url}`);
      const backendFailedRequests=[];
      const health=status>=200&&status<400&&interaction.status==='passed'&&broken.length===0&&localFailures.length===0&&consoleErrors.length===0&&runtimeErrors.length===0?'passed':'failed';
      const screenshot=`${String(captureIndex).padStart(2,'0')}-${item.name}-${profile.name}.png`;
      await page.screenshot({path:path.join(evidenceDirectory,screenshot),fullPage:true});
      const record={page:item.name,profile:profile.name,route:item.route,origin:item.origin,title:await page.title(),status,durationMs:Date.now()-started,health,interaction,broken,localFailures,localFailedRequests,backendWarnings,backendFailedRequests,externalFailedRequests,consoleErrors,runtimeErrors,screenshot};
      records.push(record);
      if(health!=='passed')failures.push(record);
    }catch(error){
      const screenshot=`${String(captureIndex).padStart(2,'0')}-${item.name}-${profile.name}.png`;
      await page.screenshot({path:path.join(evidenceDirectory,screenshot),fullPage:true}).catch(()=>{});
      const record={page:item.name,profile:profile.name,route:item.route,origin:item.origin,status,durationMs:Date.now()-started,health:'failed',error:error.message,consoleErrors,runtimeErrors,failedRequests,screenshot};
      records.push(record);
      failures.push(record);
    }
    await context.close();
  }
}
await browser.close();
const summary={routes:routes.length,captures:records.length,passed:records.filter(record=>record.health==='passed').length,staticFailures,failures,backendWarnings:records.flatMap(record=>record.backendWarnings||[]),slowest:[...records].sort((a,b)=>b.durationMs-a.durationMs).slice(0,10).map(record=>({page:record.page,profile:record.profile,durationMs:record.durationMs,health:record.health})),records};
await writeFile(path.join(evidenceDirectory,'summary.json'),JSON.stringify(summary,null,2));
console.log(`Final whole-site audit checked ${routes.length} routes across ${profiles.length} profiles (${records.length} captures): ${summary.passed} passed, ${failures.length} failed.`);
if(failures.length)throw new Error(`Browser audit found ${failures.length} failure(s).`);
