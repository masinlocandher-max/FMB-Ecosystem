import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:4173';
const artifactDirectory = 'qa-artifacts';

await mkdir(artifactDirectory, { recursive: true });

function observeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth + 2);
}

async function assertImagesLoaded(page, selector) {
  const images = await page.locator(selector).evaluateAll((nodes) => nodes.map((image) => ({
    src: image.getAttribute('src'),
    complete: image.complete,
    width: image.naturalWidth,
    height: image.naturalHeight,
  })));
  expect(images.length).toBeGreaterThan(0);
  for (const image of images) {
    expect(image.complete, JSON.stringify(image)).toBeTruthy();
    expect(image.width, JSON.stringify(image)).toBeGreaterThan(40);
    expect(image.height, JSON.stringify(image)).toBeGreaterThan(40);
  }
}

async function assertAnimated(page, selector, animationName) {
  const locator = page.locator(selector).first();
  await expect(locator).toBeVisible();
  const before = await locator.evaluate((node) => ({
    animation: getComputedStyle(node).animationName,
    transform: getComputedStyle(node).transform,
  }));
  expect(before.animation).toContain(animationName);
  await page.waitForTimeout(350);
  const after = await locator.evaluate((node) => getComputedStyle(node).transform);
  expect(after).not.toBe(before.transform);
}

async function openReady(page, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toHaveAttribute('data-fmb-approved-launch-ready', 'true');
  await expect(page.locator('.fmb-shell-header')).toHaveCount(1);
  await expect(page.locator('.fmb-shell-footer')).toHaveCount(1);
  await expect(page.locator('.fmb-announcement-track')).toHaveCount(1);
}

test.describe('FMB approved desktop makeover', () => {
  test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });

  test('homepage uses the approved system, real assets, and moving announcements', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/');
    await assertNoHorizontalOverflow(page);
    await assertAnimated(page, '.fmb-announcement-track', 'fmb-announcement-motion');
    await expect(page.locator('#bulletin')).toHaveCount(1);
    await expect(page.locator('#how-fmb-can-help')).toHaveCount(1);
    await expect(page.locator('#fmb-visual-ecosystem')).toBeVisible();
    await assertImagesLoaded(page, '#fmb-visual-ecosystem img');

    const sectionColors = await page.locator('main > section').evaluateAll((sections) => sections.slice(0, 4).map((section) => getComputedStyle(section).backgroundColor));
    expect(new Set(sectionColors).size).toBeGreaterThan(1);

    await page.screenshot({ path: `${artifactDirectory}/home-desktop.png`, fullPage: true });
    expect(errors).toEqual([]);
  });

  test('newsroom has PST, moving headlines, loaded news images, and channel treatment', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/news/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-news-livebar')).toBeVisible();
    await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
    await assertAnimated(page, '.fmb-news-ticker-track', 'fmb-headline-motion');
    await assertImagesLoaded(page, 'main .news-visual img');
    await page.screenshot({ path: `${artifactDirectory}/news-desktop.png`, fullPage: true });
    expect(errors).toEqual([]);
  });

  test('principal public routes share one shell and remain reachable', async ({ page }) => {
    const routes = ['/aboutfmb/', '/projects/', '/ebooks/', '/music/', '/withlovefmb/', '/get-involved/', '/gethelp/', '/fmbandco/', '/work-with-fmb/'];
    for (const route of routes) {
      await openReady(page, route);
      await assertNoHorizontalOverflow(page);
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('FMB approved iPhone experience', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  });

  test('homepage is safe, responsive, image-led, and uses the iPhone dock', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-mobile-dock')).toBeVisible();
    await expect(page.locator('.fmb-editorial-gallery')).toHaveCSS('overflow-x', 'auto');
    await assertImagesLoaded(page, '#fmb-visual-ecosystem img');

    const menuButton = page.locator('[data-fmb-dock-menu]');
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.fmb-shell-nav')).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');

    await page.screenshot({ path: `${artifactDirectory}/home-iphone.png`, fullPage: true });
    expect(errors).toEqual([]);
  });

  test('newsroom keeps PST and headline motion on iPhone', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/news/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-mobile-dock')).toBeVisible();
    await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
    await assertAnimated(page, '.fmb-news-ticker-track', 'fmb-headline-motion');
    await page.screenshot({ path: `${artifactDirectory}/news-iphone.png`, fullPage: true });
    expect(errors).toEqual([]);
  });

  test('About FMB remains cohesive and responsive on iPhone', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/aboutfmb/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-mobile-dock')).toBeVisible();
    await expect(page.locator('main img').first()).toBeVisible();
    await page.screenshot({ path: `${artifactDirectory}/about-iphone.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
});
