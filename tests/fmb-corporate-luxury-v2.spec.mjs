import { chromium, webkit, test as baseTest, expect } from '@playwright/test';

const baseURL='http://127.0.0.1:4173';

async function open(page,route){
  await page.goto(`${baseURL}${route}`,{waitUntil:'networkidle'});
  await expect(page.locator('body')).toHaveClass(/fmb-corporate-luxury-v2/);
  await expect(page.locator('link[href*="fmb-corporate-luxury-v2.css"]')).toHaveCount(1);
  await expect(page.locator('link[href*="fmb-corporate-luxury-approved.css"]')).toHaveCount(1);
}

async function noOverflow(page){
  const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(width.scroll).toBeLessThanOrEqual(width.client+2);
}

async function assertImage(page,selector,minWidth=400,minHeight=400){
  const image=page.locator(selector).first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  const result=await image.evaluate(node=>({complete:node.complete,width:node.naturalWidth,height:node.naturalHeight}));
  expect(result.complete).toBeTruthy();
  expect(result.width).toBeGreaterThanOrEqual(minWidth);
  expect(result.height).toBeGreaterThanOrEqual(minHeight);
}

for(const project of [
  {name:'chromium',engine:chromium,context:{viewport:{width:1440,height:1000}}},
  {name:'webkit',engine:webkit,context:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}}
]){
  const projectTest=baseTest.extend({
    page:async({},use)=>{
      const browser=await project.engine.launch({headless:true});
      const context=await browser.newContext(project.context);
      const page=await context.newPage();
      try{await use(page)}
      finally{await context.close();await browser.close()}
    }
  });

  projectTest.describe(`${project.name} approved corporate luxury experience`,()=>{
    projectTest('homepage matches the approved headquarters dashboard',async({page})=>{
      await open(page,'/');
      await noOverflow(page);
      await expect(page.locator('body')).toHaveClass(/fmb-approved-dashboard/);
      await expect(page.locator('#heroTitle')).toContainText('Direction');
      await expect(page.locator('#heroTitle')).toContainText('noise');
      await assertImage(page,'.hero-portrait img',900,1100);
      await expect(page.locator('.fmb-approved-hero-stack')).toBeVisible();
      await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
      await expect(page.locator('.fmb-approved-brand-row img')).toHaveCount(3);
      await assertImage(page,'.fmb-approved-quote img',500,700);
      await expect(page.locator('.fmb-approved-capability')).toHaveCount(6);
      await expect(page.locator('.fmb-approved-project')).toHaveCount(3);
      await expect(page.locator('.fmb-approved-project.yoni')).toBeVisible();
      await expect(page.locator('.fmb-approved-project.mabayani')).toBeVisible();
      await expect(page.locator('.fmb-approved-project.volunteer')).toBeVisible();
      await assertImage(page,'.fmb-approved-project.volunteer img');
      await expect(page.locator('.fmb-approved-library-panel')).toHaveCount(3);
      await expect(page.locator('.fmb-approved-album')).toHaveCount(4);
      await expect(page.locator('.fmb-approved-book')).toHaveCount(4);
      await page.locator('[data-fmb-v2-open="yoni"]').first().click();
      await expect(page.locator('[data-fmb-v2-modal]')).toHaveClass(/is-open/);
      await expect(page.locator('[data-fmb-v2-modal-title]')).toHaveText('Yoni');
      await page.locator('[data-fmb-v2-modal-close]').click();
      await expect(page.locator('[data-fmb-v2-modal]')).not.toHaveClass(/is-open/);
    });

    projectTest('news reads as a live corporate news center',async({page})=>{
      await open(page,'/news/');
      await noOverflow(page);
      await expect(page.locator('.fmb-v2-news-command')).toContainText('FMB News Center');
      await expect(page.locator('.fmb-news-livebar')).toBeVisible();
      await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
      await expect(page.locator('.fmb-news-ticker-track')).toBeVisible();
      await expect(page.locator('.nc-rundown-panel')).toBeVisible();
      await expect(page.locator('.nc-index-list li')).toHaveCount(7);
    });

    projectTest('music uses a Spotify-inspired real library with playback controls',async({page})=>{
      await open(page,'/music/');
      await noOverflow(page);
      await expect(page.locator('.music-sidebar')).toBeVisible();
      await expect(page.locator('.music-main')).toBeVisible();
      await expect(page.locator('.music-hero')).toBeVisible();
      await expect(page.locator('#mainPlayButton')).toBeVisible();
      await expect(page.locator('.music-mini-player')).toBeAttached();
      await expect(page.locator('.music-collection-card')).toHaveCount(4);
      await expect(page.locator('[data-music-filter]')).toHaveCount(5);
    });

    projectTest('eBooks have subject and access categories without inventing books',async({page})=>{
      await open(page,'/ebooks/');
      await noOverflow(page);
      await expect(page.locator('.fmb-v2-book-categories')).toBeVisible();
      await expect(page.locator('[data-fmb-v2-book-category="wellbeing"]')).toBeVisible();
      await expect(page.locator('[data-fmb-v2-book-category="identity"]')).toBeVisible();
      await expect(page.locator('[data-ebook-card]')).toHaveCount(6);
      await page.locator('[data-fmb-v2-book-category="identity"]').click();
      const visible=await page.locator('[data-ebook-card]:visible').count();
      expect(visible).toBeGreaterThan(0);
      expect(visible).toBeLessThan(6);
    });

    projectTest('Mabayani and original volunteer photographs remain truthful destinations',async({page})=>{
      await open(page,'/mabayani/');
      await expect(page.locator('main')).toContainText('No invented history');
      await open(page,'/communityengagements/');
      await expect(page.locator('.volunteer-photo-grid img')).toHaveCount(7);
      await assertImage(page,'.volunteer-hero-figure img');
    });
  });
}
