const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { mkdir, readFile, stat } = require('node:fs/promises');
const path = require('node:path');

const base = process.env.FMB_QA_BASE || 'http://127.0.0.1:4173';
const output = path.resolve(process.env.FMB_QA_OUTPUT || 'artifacts/fmb-news-qa');
const dist = path.resolve('dist');
const viewports = [
  ['desktop', 1440, 1000],
  ['laptop', 1180, 900],
  ['tablet', 820, 1180],
  ['iphone', 390, 844],
  ['compact', 320, 700],
];

const fail = (message) => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

(async () => {
  await mkdir(output, { recursive: true });
  let server;
  if (!process.env.FMB_QA_BASE) {
    server = createServer(async (request, response) => {
      try {
        const pathname = decodeURIComponent(new URL(request.url, base).pathname);
        let file = path.resolve(dist, `.${pathname}`);
        if (!file.startsWith(`${dist}${path.sep}`) && file !== dist) throw new Error('Invalid path');
        if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
        const body = await readFile(file);
        const type = file.endsWith('.html') ? 'text/html; charset=utf-8'
          : file.endsWith('.css') ? 'text/css; charset=utf-8'
            : file.endsWith('.js') ? 'text/javascript; charset=utf-8'
              : file.endsWith('.svg') ? 'image/svg+xml'
                : file.endsWith('.webp') ? 'image/webp'
                  : file.endsWith('.png') ? 'image/png'
                    : file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg'
                      : 'application/octet-stream';
        response.writeHead(200, { 'content-type': type });
        response.end(body);
      } catch {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
      }
    });
    await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  }
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.FMB_QA_CHROMIUM || chromium.executablePath(),
  });
  const results = [];

  try {
    for (const [name, width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: name === 'iphone' ? 2 : 1 });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.goto(`${base}/fmbnews/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1400);

      const state = await page.evaluate(() => {
        const visible = (node) => {
          if (!node) return false;
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
        };
        const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
        const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
        const controls = [...document.querySelectorAll('.fnc-menu,.fnc-nav-close,.fnc-category,.fnc-submit,.fnc-search-jump')]
          .filter(visible)
          .map((node) => ({ label: node.textContent.trim() || node.getAttribute('aria-label'), width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
        const localBrokenImages = [...document.images]
          .filter((image) => image.currentSrc && new URL(image.currentSrc, location.href).origin === location.origin && image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc);
        const hero = document.querySelector('.fnc-identity-grid');
        const heroStyle = hero ? getComputedStyle(hero) : null;
        const reportCards = [...document.querySelectorAll('[data-fnc-result-card]')];
        const reportRoutes = new Set(reportCards.map((card) => card.querySelector('a')?.getAttribute('href')).filter(Boolean));
        const overflowing = [...document.querySelectorAll('body *')].filter((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          return style.display !== 'none' && (rect.right > innerWidth + 1 || rect.left < -1);
        }).slice(0, 12).map((node) => ({
          tag: node.tagName,
          className: node.className?.baseVal || node.className || '',
          left: Math.round(node.getBoundingClientRect().left),
          right: Math.round(node.getBoundingClientRect().right),
          width: Math.round(node.getBoundingClientRect().width),
        }));
        return {
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          duplicateIds,
          controls,
          localBrokenImages,
          reportCount: reportCards.length,
          uniqueReportCount: reportRoutes.size,
          overflowing,
          heroVisible: visible(hero),
          heroOpacity: heroStyle?.opacity,
          hasMenuLabel: document.body.textContent.includes('News menu'),
          hasCategoryLabel: document.body.textContent.includes('News categories'),
          whiteFooterLogo: document.querySelector('.fnc-footer-brand img')?.getAttribute('src'),
        };
      });

      assert(state.scrollWidth <= width, `${name}: document overflows ${state.scrollWidth - width}px`);
      assert(state.duplicateIds.length === 0, `${name}: duplicate IDs ${state.duplicateIds.join(', ')}`);
      assert(state.localBrokenImages.length === 0, `${name}: broken local images ${state.localBrokenImages.join(', ')}`);
      assert(state.heroVisible && state.heroOpacity !== '0', `${name}: hero copy is not visible`);
      assert(state.hasMenuLabel && state.hasCategoryLabel, `${name}: menu and categories are not clearly separated`);
      assert(state.whiteFooterLogo?.includes('fmb-news-white-transparent-2026.webp'), `${name}: footer is not using the supplied white identity`);
      assert(state.reportCount >= 81, `${name}: expected at least 81 reports, found ${state.reportCount}`);
      assert(state.uniqueReportCount === state.reportCount, `${name}: report index contains duplicate routes`);
      for (const control of state.controls) {
        assert(control.width >= 44 && control.height >= 44, `${name}: undersized control ${control.label} (${control.width}x${control.height})`);
      }
      assert(pageErrors.length === 0, `${name}: page errors: ${pageErrors.join(' | ')}`);

      if (['desktop', 'iphone'].includes(name)) {
        await page.screenshot({ path: path.join(output, `${name}-viewport.png`), fullPage: false });
      }

      if (width <= 1080) {
        const menu = page.locator('.fnc-menu');
        await menu.click();
        await page.waitForTimeout(520);
        assert(await menu.getAttribute('aria-expanded') === 'true', `${name}: menu did not open`);
        assert(await page.locator('body').evaluate((body) => body.classList.contains('fnc-menu-open')), `${name}: open menu state missing`);
        assert(await page.locator('#fncNav').evaluate((nav) => getComputedStyle(nav).visibility === 'visible'), `${name}: drawer is not visible`);
        const focusState = await page.evaluate(() => {
          const nav = document.querySelector('#fncNav');
          const close = document.querySelector('.fnc-nav-close');
          const state = {
            inside: nav?.contains(document.activeElement),
            active: `${document.activeElement?.tagName}.${document.activeElement?.className || ''}`,
            closeVisibility: getComputedStyle(close).visibility,
            closeDisplay: getComputedStyle(close).display,
            closeTabIndex: close?.tabIndex,
          };
          close?.focus();
          state.manualFocusInside = nav?.contains(document.activeElement);
          return state;
        });
        assert(focusState.inside, `${name}: focus did not enter drawer: ${JSON.stringify(focusState)}`);
        const drawerTargets = await page.locator('#fncNav a:visible,#fncNav button:visible').evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent.trim() || node.getAttribute('aria-label'), height: node.getBoundingClientRect().height })));
        for (const target of drawerTargets) assert(target.height >= 44, `${name}: drawer target ${target.text} is below 44px`);
        if (name === 'iphone') await page.screenshot({ path: path.join(output, 'iphone-menu-open.png'), fullPage: false });
        await page.keyboard.press('Escape');
        assert(await menu.getAttribute('aria-expanded') === 'false', `${name}: Escape did not close menu`);
        await menu.click();
        await page.locator('.fnc-nav-backdrop').click({ position: { x: 3, y: 3 } });
        assert(await menu.getAttribute('aria-expanded') === 'false', `${name}: backdrop did not close menu`);
      }

      await page.locator('[data-fnc-filter="business"]').click();
      const businessOnly = await page.locator('[data-fnc-result-card]:visible').evaluateAll((cards) => cards.length > 0 && cards.every((card) => card.dataset.category === 'business'));
      assert(businessOnly, `${name}: category filter left non-business cards visible`);
      assert((await page.locator('[data-fnc-filter-status]').textContent()).includes('reports found'), `${name}: category result status missing`);
      await page.locator('[data-fnc-filter="all"]').click();
      await page.locator('[data-fnc-search]').fill('Razon');
      assert(await page.locator('[data-fnc-result-card]:visible').filter({ hasText: 'Enrique Razon Tops Forbes Philippines 50 Richest List' }).count() === 1, `${name}: search did not reveal the Razon report`);
      await page.locator('[data-fnc-search]').fill('no-report-can-match-this-string');
      assert(await page.locator('[data-fnc-empty]').isVisible(), `${name}: empty search state missing`);
      await page.locator('[data-fnc-search]').fill('');

      if (['desktop', 'iphone', 'compact'].includes(name)) {
        await page.screenshot({ path: path.join(output, `${name}-newsroom.png`), fullPage: true });
      }

      results.push({ name, width, height, reports: state.reportCount, overflow: state.scrollWidth - width, controls: state.controls.length });
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${base}/news/magnitude-54-quake-hits-off-occidental-mindoro/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    assert(await page.locator('h1').first().textContent() === 'Magnitude 5.4 Quake Hits Off Occidental Mindoro', 'Article headline is incorrect');
    assert(await page.locator('.nc-sources a').count() === 2, 'Article sources are missing');
    assert((await page.locator('.fnc-footer-brand img').getAttribute('src')).includes('fmb-news-white-transparent-2026.webp'), 'Article footer logo is incorrect');
    assert(await page.locator('.fnc-search-jump').getAttribute('href') === '/fmbnews/#newsSearch', 'Article search does not return to newsroom search');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Article overflows horizontally');
    await page.locator('.fnc-menu').click();
    assert(await page.locator('.fnc-menu').getAttribute('aria-expanded') === 'true', 'Article menu did not open');
    await page.locator('.fnc-nav-close').click();
    assert(await page.locator('.fnc-menu').getAttribute('aria-expanded') === 'false', 'Article menu did not close');

    await page.goto(`${base}/fmbnews/about/#standards`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    assert(await page.locator('#standards').count() === 1, 'About editorial standards anchor is missing');
    assert(await page.locator('.fnc-search-jump').getAttribute('href') === '/fmbnews/#newsSearch', 'About search does not return to newsroom search');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'About page overflows horizontally');
    await context.close();
  } finally {
    await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }

  console.log(JSON.stringify({ base, output, results }, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
