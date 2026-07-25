import { test, expect } from '@playwright/test';

const baseURL='http://127.0.0.1:4173';

async function open(page,route){
  await page.goto(`${baseURL}${route}`,{waitUntil:'networkidle'});
  await expect(page.locator('body')).toHaveClass(/fmb-corporate-luxury-v2/);
  await expect(page.locator('link[href*="fmb-corporate-luxury-v2.css"]')).toHaveCount(1);
}

async function noOverflow(page){
  const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(width.scroll).toBeLessThanOrEqual(width.client+2);
}

async function assertImage(page,selector){
  const image=page.locator(selector).first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  const result=await image.evaluate(node=>({complete:node.complete,width:node.naturalWidth,height:node.naturalHeight}));
  expect(result.complete).toBeTruthy();
  expect(result.width).toBeGreaterThan(400);
  expect(result.height).toBeGreaterThan(400);
}

for(const project of ['chromium','webkit']){
  test.describe(`${project} corporate luxury experience`,()=>{
    test.use(project==='webkit'?{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{browserName:'chromium',viewport:{width:1440,height:1000}});

    test('homepage answers why FMB and presents three proof stories',async({page})=>{
      await open(page,'/');
      await noOverflow(page);
      await expect(page.locator('#why-fmb')).toBeVisible();
      await expect(page.locator('#whyFmbTitle')).toContainText('You do not need more noise');
      await expect(page.locator('#signature-projects')).toBeVisible();
      await expect(page.locator('.fmb-v2-project.yoni')).toBeVisible();
      await expect(page.locator('.fmb-v2-project.mabayani')).toBeVisible();
      await expect(page.locator('.fmb-v2-project.volunteer')).toBeVisible();
      await assertImage(page,'.fmb-v2-why-portrait img');
      await assertImage(page,'.fmb-v2-project.volunteer img');
      await page.locator('[data-fmb-v2-open="yoni"]').first().click();
      await expect(page.locator('[data-fmb-v2-modal]')).toHaveClass(/is-open/);
      await expect(page.locator('[data-fmb-v2-modal-title]')).toHaveText('Yoni');
      await page.locator('[data-fmb-v2-modal-close]').click();
      await expect(page.locator('[data-fmb-v2-modal]')).not.toHaveClass(/is-open/);
    });

    test('news reads as a live news center',async({page})=>{
      await open(page,'/news/');
      await noOverflow(page);
      await expect(page.locator('.fmb-v2-news-command')).toContainText('FMB News Center');
      await expect(page.locator('.fmb-news-livebar')).toBeVisible();
      await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
      await expect(page.locator('.fmb-news-ticker-track')).toBeVisible();
      await expect(page.locator('.nc-rundown-panel')).toBeVisible();
    });

    test('music uses a Spotify-inspired library layout without losing playback controls',async({page})=>{
      await open(page,'/music/');
      await noOverflow(page);
      await expect(page.locator('.music-sidebar')).toBeVisible();
      await expect(page.locator('.music-main')).toBeVisible();
      await expect(page.locator('.music-hero')).toBeVisible();
      await expect(page.locator('#mainPlayButton')).toBeVisible();
      await expect(page.locator('.music-mini-player')).toBeAttached();
      await expect(page.locator('.music-collection-card')).toHaveCount(4);
    });

    test('eBooks have visible subject and access categories',async({page})=>{
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

    test('Mabayani and the original volunteer record remain separate truthful destinations',async({page})=>{
      await open(page,'/mabayani/');
      await expect(page.locator('main')).toContainText('No invented history');
      await open(page,'/communityengagements/');
      await expect(page.locator('.volunteer-photo-grid img')).toHaveCount(7);
      await assertImage(page,'.volunteer-hero-figure img');
    });
  });
}
