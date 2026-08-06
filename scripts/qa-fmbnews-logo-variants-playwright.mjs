import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.FMBNEWS_QA_URL||'http://127.0.0.1:4173';
const evidenceDir=path.resolve(process.env.FMBNEWS_QA_EVIDENCE||'fmbnews-logo-variants-evidence');
const colorLogo='/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo='/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const expectedEmail='withlovefmb@gmail.com';
const articlePath='/news/world-bank-philippines-growth-forecast-2026/';

await mkdir(evidenceDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const results={baseUrl,checks:{},screenshots:[],console:[]};

function requireCheck(name,value,details=value){results.checks[name]={passed:Boolean(value),details};if(!value)throw new Error(`FMB News supplied-logo browser check failed: ${name} (${JSON.stringify(details)})`)}
function watchConsole(page,label){page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')results.console.push({page:label,type:message.type(),text:message.text()})});page.on('pageerror',error=>results.console.push({page:label,type:'pageerror',text:error.message}))}
async function settle(page){await page.waitForLoadState('domcontentloaded');await page.evaluate(()=>document.fonts?.ready);await page.waitForTimeout(600)}
async function screenshot(page,name,options={}){await page.screenshot({path:path.join(evidenceDir,name),...options});results.screenshots.push(name)}

const pageState=()=>{
  const visible=element=>{if(!element)return false;const style=getComputedStyle(element),rect=element.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&rect.width>0&&rect.height>0};
  const light=document.querySelector('[data-fmb-news-logo-light]');
  const dark=document.querySelector('[data-fmb-news-logo-dark]');
  const desktopSubmit=document.querySelector('.fnc-submit[data-fmb-story-submission]');
  const mobileSubmit=document.querySelector('.fnc-mobile-submit[data-fmb-story-submission]');
  const submitIcon=desktopSubmit?.querySelector('.fnc-submit-icon');
  const iconRect=submitIcon?.getBoundingClientRect();
  const iconStyle=submitIcon?getComputedStyle(submitIcon):null;
  return {
    clean:document.body.classList.contains('fmb-news-clean'),
    headerCount:document.querySelectorAll('.fnc-header').length,
    footerCount:document.querySelectorAll('.fnc-footer').length,
    livebarCount:document.querySelectorAll('.fnc-livebar').length,
    updateCount:document.querySelectorAll('[data-news-updated]').length,
    phtText:document.querySelector('[data-pht-time]')?.textContent?.trim()||'',
    lightCount:document.querySelectorAll('[data-fmb-news-logo-light]').length,
    darkCount:document.querySelectorAll('[data-fmb-news-logo-dark]').length,
    lightVisible:visible(light),darkVisible:visible(dark),
    lightLoaded:Boolean(light?.complete&&light.naturalWidth>0&&light.naturalHeight>0),
    darkLoaded:Boolean(dark?.complete&&dark.naturalWidth>0&&dark.naturalHeight>0),
    lightSrc:light?.getAttribute('src')||'',darkSrc:dark?.getAttribute('src')||'',
    lightFilter:light?getComputedStyle(light).filter:'',darkFilter:dark?getComputedStyle(dark).filter:'',
    desktopSubmitVisible:visible(desktopSubmit),desktopSubmitHref:desktopSubmit?.getAttribute('href')||'',
    mobileSubmitVisible:visible(mobileSubmit),mobileSubmitHref:mobileSubmit?.getAttribute('href')||'',
    submitIcon:{width:iconRect?.width||0,height:iconRect?.height||0,fill:iconStyle?.fill||'',stroke:iconStyle?.stroke||''},
    watchLiveVisible:[...document.querySelectorAll('a,button')].some(element=>visible(element)&&/watch\s+live/i.test(element.textContent||'')),
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  };
};

try{
  const desktop=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  watchConsole(desktop,'desktop landing');
  await desktop.goto(`${baseUrl}/fmbnews/`,{waitUntil:'domcontentloaded'});await settle(desktop);
  const landing=await desktop.evaluate(pageState);
  requireCheck('desktop uses one approved clean newsroom shell',landing.clean&&landing.headerCount===1&&landing.footerCount===1&&landing.livebarCount===1,landing);
  requireCheck('newsroom update contract is present',landing.updateCount===1,landing.updateCount);
  requireCheck('Philippine clock is running',landing.phtText&&!landing.phtText.includes('--'),landing.phtText);
  requireCheck('desktop has one exact supplied color logo',landing.lightCount===1&&landing.lightLoaded&&landing.lightVisible&&landing.lightSrc===colorLogo&&landing.lightFilter==='none',landing);
  requireCheck('desktop has one exact supplied white footer logo',landing.darkCount===1&&landing.darkLoaded&&landing.darkSrc===whiteLogo&&landing.darkFilter==='none',landing);
  requireCheck('desktop story submission is visible and addressed correctly',landing.desktopSubmitVisible&&landing.desktopSubmitHref.startsWith(`mailto:${expectedEmail}`),landing);
  requireCheck('desktop envelope icon stays compact and stroked',landing.submitIcon.width>=17&&landing.submitIcon.width<=19&&landing.submitIcon.height>=17&&landing.submitIcon.height<=19&&landing.submitIcon.fill==='none'&&landing.submitIcon.stroke!=='none',landing.submitIcon);
  requireCheck('desktop has no retired Watch Live control',!landing.watchLiveVisible,landing.watchLiveVisible);
  requireCheck('desktop has no horizontal overflow',landing.overflow<=1,landing.overflow);
  await screenshot(desktop,'fmbnews-approved-desktop-first-view.png');

  const totalCards=await desktop.locator('[data-fnc-card]').count();
  await desktop.locator('[data-fnc-search]').fill('Katrina');await desktop.waitForTimeout(120);
  const visibleAfterSearch=await desktop.locator('[data-fnc-card]:visible').count();
  requireCheck('desktop search filters the report desk',totalCards>1&&visibleAfterSearch>=1&&visibleAfterSearch<totalCards,{totalCards,visibleAfterSearch});
  await desktop.locator('[data-fnc-search]').fill('');
  await desktop.locator('[data-fnc-filter="world"]').click();await desktop.waitForTimeout(120);
  const visibleWorld=await desktop.locator('[data-fnc-card]:visible').count();
  requireCheck('desktop category filtering works',visibleWorld>=1&&visibleWorld<totalCards,{totalCards,visibleWorld});

  const footerLogo=desktop.locator('[data-fmb-news-logo-dark]').first();await footerLogo.scrollIntoViewIfNeeded();await desktop.waitForTimeout(150);
  const footerState=await desktop.evaluate(pageState);
  requireCheck('desktop supplied white footer logo is visible',footerState.darkVisible&&footerState.darkLoaded&&footerState.darkSrc===whiteLogo,footerState);
  await footerLogo.screenshot({path:path.join(evidenceDir,'fmbnews-approved-desktop-footer.png')});results.screenshots.push('fmbnews-approved-desktop-footer.png');

  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  watchConsole(mobile,'mobile landing');
  await mobile.goto(`${baseUrl}/fmbnews/`,{waitUntil:'domcontentloaded'});await settle(mobile);
  const mobileClosed=await mobile.evaluate(pageState);
  requireCheck('mobile uses exact supplied color logo',mobileClosed.lightVisible&&mobileClosed.lightLoaded&&mobileClosed.lightSrc===colorLogo,mobileClosed);
  requireCheck('mobile has no horizontal overflow',mobileClosed.overflow<=1,mobileClosed.overflow);
  await screenshot(mobile,'fmbnews-approved-mobile-first-view.png');

  await mobile.locator('[data-fnc-menu]').click();await mobile.waitForTimeout(150);
  const mobileOpen=await mobile.evaluate(pageState);
  const menuMeta=await mobile.evaluate(()=>({open:document.body.classList.contains('fnc-menu-open'),expanded:document.querySelector('[data-fnc-menu]')?.getAttribute('aria-expanded')||''}));
  requireCheck('mobile menu opens',menuMeta.open&&menuMeta.expanded==='true',menuMeta);
  requireCheck('mobile menu exposes story submission email',mobileOpen.mobileSubmitVisible&&mobileOpen.mobileSubmitHref.startsWith(`mailto:${expectedEmail}`),mobileOpen);
  await screenshot(mobile,'fmbnews-approved-mobile-menu.png');

  await mobile.locator('[data-fmb-news-logo-dark]').scrollIntoViewIfNeeded();await mobile.waitForTimeout(150);
  const mobileFooter=await mobile.evaluate(pageState);
  requireCheck('mobile exact white footer logo is visible',mobileFooter.darkVisible&&mobileFooter.darkLoaded&&mobileFooter.darkSrc===whiteLogo,mobileFooter);
  await mobile.locator('[data-fmb-news-logo-dark]').screenshot({path:path.join(evidenceDir,'fmbnews-approved-mobile-footer.png')});results.screenshots.push('fmbnews-approved-mobile-footer.png');

  const article=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  watchConsole(article,'mobile current article');
  await article.goto(`${baseUrl}${articlePath}`,{waitUntil:'domcontentloaded'});await settle(article);
  const articleState=await article.evaluate(()=>{
    const image=document.querySelector('.nc-story-media img,article img');const light=document.querySelector('[data-fmb-news-logo-light]');const dark=document.querySelector('[data-fmb-news-logo-dark]');
    return {clean:document.body.classList.contains('fmb-news-clean'),lightSrc:light?.getAttribute('src')||'',darkSrc:dark?.getAttribute('src')||'',lightLoaded:Boolean(light?.complete&&light.naturalWidth>0),darkLoaded:Boolean(dark?.complete&&dark.naturalWidth>0),imageLoaded:Boolean(image?.complete&&image.naturalWidth>0&&image.naturalHeight>0),submissionLinks:document.querySelectorAll('[data-fmb-story-submission]').length,sharePanels:document.querySelectorAll('[data-fmb-share-ready]').length,shareIcons:document.querySelectorAll('[data-fmb-share-ready] .fnc-share-icon').length,socialLinks:document.querySelectorAll('[data-fmb-share-ready] a').length,nativeButtons:document.querySelectorAll('[data-fnc-native-share]').length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  requireCheck('current report uses clean publication chrome',articleState.clean&&articleState.lightLoaded&&articleState.darkLoaded,articleState);
  requireCheck('current report uses exact supplied logo pair',articleState.lightSrc===colorLogo&&articleState.darkSrc===whiteLogo,articleState);
  requireCheck('current report retains its editorial image',articleState.imageLoaded,articleState);
  requireCheck('current report has desktop and mobile submission access',articleState.submissionLinks>=2,articleState.submissionLinks);
  requireCheck('current report has four functional sharing controls',articleState.sharePanels===1&&articleState.shareIcons===4&&articleState.socialLinks===3&&articleState.nativeButtons===1,articleState);
  requireCheck('current report has no horizontal overflow',articleState.overflow<=1,articleState.overflow);
  await screenshot(article,'fmbnews-approved-mobile-article-first-view.png');
  const sharePanel=article.locator('[data-fmb-share-ready]');await sharePanel.scrollIntoViewIfNeeded();await article.waitForTimeout(120);
  await sharePanel.screenshot({path:path.join(evidenceDir,'fmbnews-approved-mobile-article-share.png')});results.screenshots.push('fmbnews-approved-mobile-article-share.png');
  await article.locator('[data-fnc-native-share]').click();await article.waitForTimeout(150);
  const status=await article.locator('[data-fnc-share-status]').textContent();
  requireCheck('device share control responds without an error',Boolean(status?.trim()),status);
  requireCheck('no relevant browser console errors',results.console.length===0,results.console);
}finally{await writeFile(path.join(evidenceDir,'report.json'),JSON.stringify(results,null,2));await browser.close()}

console.log(`FMB News approved supplied-logo browser QA passed with ${Object.keys(results.checks).length} checks.`);
