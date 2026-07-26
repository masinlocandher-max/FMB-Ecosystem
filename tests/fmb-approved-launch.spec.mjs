import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const baseURL = 'http://127.0.0.1:4173';
const artifactDirectory = 'qa-artifacts';
const fullPageEvidenceStyle = `
  main, main *, main *::before, main *::after { content-visibility: visible !important; }
  .fmb-reveal, .reveal, .network-reveal, .about-reveal, .nc-reveal {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    transition: none !important;
  }
  .fmb-shell-rail, .fmb-shell-header, .fmb-mobile-dock,
  .pearly-lazy-trigger, .az-help-trigger, .az-help-layer { display: none !important; }
`;

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

async function hydratePage(page) {
  const metrics = await page.evaluate(() => ({
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
    viewport: window.innerHeight,
  }));
  const increment = Math.max(420, Math.round(metrics.viewport * 0.72));
  for (let y = 0; y < metrics.height; y += increment) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(180);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
}

async function hydrateImages(page, selector) {
  const images = page.locator(selector);
  const count = await images.count();
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);
    await expect(image).toHaveJSProperty('complete', true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
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
  const viewport = page.viewportSize();
  await page.mouse.move(Math.round((viewport?.width || 800) / 2), Math.max(1, (viewport?.height || 600) - 2));
  await page.waitForTimeout(100);
  const before = await locator.evaluate((node) => {
    const style = getComputedStyle(node);
    const animation = node.getAnimations().find((item) => item.animationName === style.animationName) || node.getAnimations()[0];
    return {
      animationName: style.animationName,
      playState: animation?.playState || style.animationPlayState,
      currentTime: Number(animation?.currentTime || 0),
    };
  });
  expect(before.animationName).toContain(animationName);
  expect(before.playState).toBe('running');
  await page.waitForTimeout(350);
  const after = await locator.evaluate((node) => Number(node.getAnimations()[0]?.currentTime || 0));
  expect(after).toBeGreaterThan(before.currentTime + 50);
}

async function openReady(page, route) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toHaveAttribute('data-fmb-approved-launch-ready', 'true');
  await expect(page.locator('.fmb-shell-header')).toHaveCount(1);
  await expect(page.locator('.fmb-shell-footer')).toHaveCount(1);
  await expect(page.locator('.fmb-announcement-track')).toHaveCount(1);
}

async function captureEvidence(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${artifactDirectory}/${name}-viewport.png`, animations: 'disabled' });
  await page.screenshot({
    path: `${artifactDirectory}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
    style: fullPageEvidenceStyle,
  });
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
    await expect(page.locator('#fmb-visual-ecosystem')).toHaveCount(1);
    await hydratePage(page);
    await hydrateImages(page, '#fmb-visual-ecosystem img');
    await assertImagesLoaded(page, '#fmb-visual-ecosystem img');

    const sectionTreatments = await page.locator('main > section').evaluateAll((sections) => sections.slice(0, 5).map((section) => {
      const style = getComputedStyle(section);
      return `${style.backgroundColor}|${style.backgroundImage}`;
    }));
    expect(new Set(sectionTreatments).size).toBeGreaterThan(1);

    await captureEvidence(page, 'home-desktop');
    expect(errors).toEqual([]);
  });

  test('newsroom has PST, moving headlines, loaded news images, and channel treatment', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/news/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-news-livebar')).toBeVisible();
    await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
    await assertAnimated(page, '.fmb-news-ticker-track', 'fmb-headline-motion');
    await hydratePage(page);
    await hydrateImages(page, 'main .news-visual img');
    await assertImagesLoaded(page, 'main .news-visual img');
    await captureEvidence(page, 'news-desktop');
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

  test('homepage is safe, responsive, image-led, and uses hamburger navigation', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-mobile-dock')).toHaveCount(0);
    await expect(page.locator('.fmb-editorial-gallery')).toHaveCSS('overflow-x', 'auto');
    await hydratePage(page);
    await hydrateImages(page, '#fmb-visual-ecosystem img');
    await assertImagesLoaded(page, '#fmb-visual-ecosystem img');

    const menuButton = page.locator('.fmb-shell-menu');
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.fmb-shell-nav')).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await captureEvidence(page, 'home-iphone');
    expect(errors).toEqual([]);
  });

  test('newsroom keeps PST and headline motion on iPhone', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/news/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-mobile-dock')).toHaveCount(0);
    await expect(page.locator('[data-fmb-pst]')).toContainText('PST');
    await assertAnimated(page, '.fmb-news-ticker-track', 'fmb-headline-motion');
    await hydratePage(page);
    await captureEvidence(page, 'news-iphone');
    expect(errors).toEqual([]);
  });

  test('About FMB remains cohesive and responsive on iPhone', async ({ page }) => {
    const errors = observeErrors(page);
    await openReady(page, '/aboutfmb/');
    await assertNoHorizontalOverflow(page);
    await expect(page.locator('.fmb-mobile-dock')).toHaveCount(0);
    await hydratePage(page);
    await expect(page.locator('main img').first()).toBeVisible();
    await captureEvidence(page, 'about-iphone');
    expect(errors).toEqual([]);
  });
});
