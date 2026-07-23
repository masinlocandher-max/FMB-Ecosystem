import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const profiles=[
  {name:'desktop',viewport:{width:1440,height:1100},isMobile:false},
  {name:'iphone',viewport:{width:390,height:844},isMobile:true}
];
const results=[];
try{
  for(const profile of profiles){
    const context=await browser.newContext({viewport:profile.viewport,isMobile:profile.isMobile,hasTouch:profile.isMobile,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:4173/news/',{waitUntil:'domcontentloaded',timeout:10000});
    await page.waitForTimeout(500);
    const result=await page.evaluate(({isMobile})=>{
      const inspect=selector=>{
        const element=document.querySelector(selector);
        if(!element)return {selector,exists:false};
        const style=getComputedStyle(element);
        const rect=element.getBoundingClientRect();
        return {
          selector,
          exists:true,
          display:style.display,
          visibility:style.visibility,
          opacity:Number(style.opacity),
          width:Math.round(rect.width),
          height:Math.round(rect.height),
          naturalWidth:'naturalWidth' in element?element.naturalWidth:null,
          naturalHeight:'naturalHeight' in element?element.naturalHeight:null,
          src:'currentSrc' in element?(element.currentSrc||element.getAttribute('src')||''):''
        };
      };
      const nav=inspect('.nc-publication-brand>img');
      const hero=inspect('.nc-channel-lockup>img');
      const footer=inspect('.nc-footer-brand>img');
      const dock=isMobile?inspect('.nc-mobile-dock'):null;
      const visible=item=>item.exists&&item.display!=='none'&&item.visibility!=='hidden'&&item.opacity>0&&item.width>=80&&item.height>=24&&(item.naturalWidth==null||item.naturalWidth>0);
      return {nav,hero,footer,dock,passed:visible(nav)&&visible(hero)&&visible(footer)&&(!isMobile||visible(dock))};
    },{isMobile:profile.isMobile});
    results.push({profile:profile.name,...result});
    await context.close();
  }
}finally{
  await browser.close();
}
console.log(JSON.stringify(results,null,2));
if(results.some(result=>!result.passed))throw new Error('FMB News exact logo or mobile dock is loaded but not visibly rendered.');
