import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:4173';
const artifactDirectory = 'qa-artifacts';
const publicRoutes = [
  '/',
  '/aboutfmb/',
  '/news/',
  '/projects/',
  '/ebooks/',
  '/music/',
  '/mabayani/',
  '/withlovefmb/',
  '/get-involved/',
  '/gethelp/',
  '/fmbandco/',
  '/work-with-fmb/',
];

await mkdir(artifactDirectory, { recursive: true });

test.use({
  browserName: 'webkit',
  viewport: { width: 390, height: 844 },
  screen: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'en-PH',
  timezoneId: 'Asia/Manila',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
  reducedMotion: 'no-preference',
});

test.setTimeout(45_000);

function observeErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

async function openReady(page, route) {
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  expect(response?.status(), route).toBeGreaterThanOrEqual(200);
  expect(response?.status(), route).toBeLessThan(400);
  await expect(page.locator('body')).toHaveAttribute('data-fmb-approved-launch-ready', 'true');
  await expect(page.locator('.fmb-shell-header')).toHaveCount(1);
  await expect(page.locator('.fmb-mobile-dock')).toHaveCount(0);
  await expect(page.locator('.fmb-shell-menu')).toBeVisible();
}

async function assertNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.clientWidth + 2);
}

async function assertAnimationRunning(page, selector, expectedName) {
  const locator = page.locator(selector).first();
  await expect(locator).toBeVisible();
  await page.mouse.move(195, 842);
  await page.waitForTimeout(120);
  const state = await locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      animationName: style.animationName,
      playState: style.animationPlayState,
      transform: style.transform,
      x: node.getBoundingClientRect().x,
    };
  });
  expect(state.animationName).toContain(expectedName);
  expect(state.playState).toBe('running');
  await page.waitForTimeout(700);
  const later = await locator.evaluate((node) => ({
    transform: getComputedStyle(node).transform,
    x: node.getBoundingClientRect().x,
  }));
  const moved = Math.abs(later.x - state.x) > 0.5 || later.transform !== state.transform;
  expect(moved, JSON.stringify({ state, later })).toBeTruthy();
}

async function assertHomepageImagesLoaded(page) {
  const images = page.locator('.hero-portrait img, .fmb-approved-quote img, .fmb-approved-project img');
  await expect(images).toHaveCount(5);
  for (let index = 0; index < await images.count(); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect(image).toHaveJSProperty('complete', true);
    const size = await image.evaluate((node) => ({
      src: node.getAttribute('src'),
      complete: node.complete,
      width: node.naturalWidth,
      height: node.naturalHeight,
    }));
    expect(size.complete, JSON.stringify(size)).toBeTruthy();
    expect(size.width, JSON.stringify(size)).toBeGreaterThan(100);
    expect(size.height, JSON.stringify(size)).toBeGreaterThan(100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test.describe('Safari-engine iPhone release gate', () => {
  test('homepage uses iPhone-safe navigation, motion, real images, and restored Mabayani', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-approved-project.mabayani')).toBeVisible();

    const safariReadiness = await page.evaluate(() => ({
      viewportFitCover: document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover') || false,
      safeAreaSupported: CSS.supports('padding-bottom: env(safe-area-inset-bottom)'),
      touchTargetHeight: Math.round(document.querySelector('.fmb-shell-menu')?.getBoundingClientRect().height || 0),
    }));
    expect(safariReadiness.viewportFitCover).toBeTruthy();
    expect(safariReadiness.safeAreaSupported).toBeTruthy();
    expect(safariReadiness.touchTargetHeight).toBeGreaterThanOrEqual(44);

    await assertAnimationRunning(page, '.fmb-announcement-track', 'fmb-announcement-motion');
    await assertHomepageImagesLoaded(page);

    const menu = page.locator('.fmb-shell-menu');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.fmb-shell-nav')).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${artifactDirectory}/safari-iphone-home.png`, animations: 'disabled' });
    expect(errors).toEqual([]);
  });

  test('FMB News keeps Philippine time and moving headlines in WebKit', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/news/');
    await assertNoHorizontalOverflow(page);

    const clock = page.locator('[data-fmb-pst]').first();
    await expect(clock).toContainText('PST');
    const before = await clock.textContent();
    await page.waitForTimeout(1150);
    const after = await clock.textContent();
    expect(after).not.toBe(before);

    await assertAnimationRunning(page, '.fmb-news-ticker-track', 'fmb-headline-motion');
    await page.screenshot({ path: `${artifactDirectory}/safari-iphone-news.png`, fullPage: true, animations: 'disabled' });
    expect(errors).toEqual([]);
  });

  test('every current public route is reachable and responsive in WebKit', async ({ page }) => {
    const errors = observeErrors(page);
    for (const route of publicRoutes) {
      await openReady(page, route);
      await assertNoHorizontalOverflow(page);
    }
    expect(errors).toEqual([]);
  });

  test('the restored Mabayani public route states its truthful scope', async ({ page }) => {
    await openReady(page, '/mabayani/');
    await expect(page.locator('main')).toContainText('No invented history');
  });
});
