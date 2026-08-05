import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.FMB_QA_ORIGIN || 'http://127.0.0.1:4173';
const output = path.resolve('fmbnews-editorial-audit');
await mkdir(output, { recursive: true });
const failures = [];
const checks = [];
const screenshots = [];
const record = (name, passed, detail = '') => { checks.push({ name, passed, detail }); if (!passed) failures.push({ name, detail }); };
const snap = async (page, name, fullPage = false) => { await page.screenshot({ path: path.join(output, name), fullPage, animations: 'disabled' }); screenshots.push(name); };
const noOverflow = async (page, label) => { const value = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, body: document.body.scrollWidth })); record(`${label}: no horizontal overflow`, value.scroll <= value.client + 2 && value.body <= value.client + 2, JSON.stringify(value)); };
const waitForContent = async (page) => { await page.waitForSelector('[data-fmbn-main]', { state: 'visible' }); await page.waitForFunction(() => !document.querySelector('.fmbn-loading') && (document.querySelector('[data-fmbn-main]')?.innerText.length || 0) > 80); };

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const response = await page.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  record('desktop: response', response?.ok(), `status=${response?.status()}`);
  await waitForContent(page);
  record('desktop: approved logo', await page.locator('img[src="/assets/images/fmb-approved/fmb-news-official-transparent.webp"]').count() >= 3, 'logo count');
  record('desktop: PHT clock', /PHT/.test(await page.locator('[data-fmbn-time]').first().innerText()), await page.locator('[data-fmbn-time]').first().innerText());
  record('desktop: moving headlines', (await page.locator('[data-fmbn-wire] span').count()) >= 2, `headlines=${await page.locator('[data-fmbn-wire] span').count()}`);
  record('desktop: editorial hero', await page.locator('.fmbn-lead').isVisible(), 'lead visible');
  record('desktop: no permanent sidebar', !(await page.locator('[data-fmbn-drawer]').isVisible()), 'drawer hidden');
  record('desktop: no bottom navigation', await page.locator('.bottom-nav,.tab-bar,.mobile-dock,.fmbn-bottom-nav').count() === 0, 'none');
  await noOverflow(page, 'desktop');
  await snap(page, 'desktop-home.png');

  for (const [view, marker] of [['alam-mo-ba', '.fmbn-fact'], ['lotto', '.fmbn-game-row'], ['horoscope', '[data-fmbn-sign]'], ['about', '.fmbn-copy-section'], ['fmb-message', '.fmbn-content-block'], ['submit', '.fmbn-submit-box']]) {
    await page.goto(`${origin}/fmbnews/?view=${view}`, { waitUntil: 'domcontentloaded' });
    await waitForContent(page);
    record(`${view}: complete page`, await page.locator(marker).count() > 0, `count=${await page.locator(marker).count()}`);
    await noOverflow(page, view);
  }
  await page.goto(`${origin}/fmbnews/?view=horoscope`, { waitUntil: 'domcontentloaded' });
  await waitForContent(page);
  await page.locator('[data-fmbn-sign="taurus"]').click();
  await page.locator('[data-fmbn-period="week"]').click();
  record('horoscope: interactions', /Taurus · This Week/.test(await page.locator('[data-fmbn-reading]').innerText()), await page.locator('[data-fmbn-reading]').innerText());
  await snap(page, 'desktop-horoscope.png');

  await page.goto(`${origin}/fmbnews/?archive=all`, { waitUntil: 'domcontentloaded' });
  await waitForContent(page);
  const manifest = await page.evaluate(async () => (await fetch('/assets/data/fmbnews-editorial-manifest.json')).json());
  record('archives: route manifest', manifest.total === manifest.articles.length && manifest.total > 0, `total=${manifest.total}`);
  record('archives: HD images', manifest.articles.every((article) => /\.svg(?:\?|$)/i.test(article.image) || (Number(article.imageWidth) >= 1200 && Number(article.imageHeight) >= 600)), 'all images pass');
  const firstRoute = manifest.articles[0]?.route;
  if (firstRoute) {
    await page.goto(`${origin}${firstRoute}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-fmbnews-editorial-shell]', { state: 'visible' });
    record('article: one publication shell', await page.locator('[data-fmbnews-editorial-shell]').count() === 1, `count=${await page.locator('[data-fmbnews-editorial-shell]').count()}`);
    record('article: PHT and wire', /PHT/.test(await page.locator('[data-fmbn-article-time]').innerText()) && await page.locator('[data-fmbn-article-wire] span').count() >= 2, 'present');
    record('article: body preserved', (await page.locator('main').innerText()).length > 400, `length=${(await page.locator('main').innerText()).length}`);
    await noOverflow(page, 'article desktop');
    await snap(page, 'desktop-article.png');
  }
  record('desktop: console', errors.length === 0, errors.join(' | '));
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  await phone.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await waitForContent(phone);
  record('mobile: masthead', await phone.locator('.fmbn-mobile-bar').isVisible(), 'visible');
  record('mobile: no bottom navigation', await phone.locator('.bottom-nav,.tab-bar,.mobile-dock,.fmbn-bottom-nav').count() === 0, 'none');
  await noOverflow(phone, 'mobile');
  await snap(phone, 'mobile-home.png');
  const open = phone.locator('[data-fmbn-menu-open]');
  await open.click();
  await phone.waitForTimeout(250);
  const close = phone.locator('[data-fmbn-menu-close]');
  record('mobile: drawer opens', await phone.locator('body').evaluate((node) => node.classList.contains('fmbn-drawer-open')) && await close.isVisible(), 'open');
  const closeStyle = await close.evaluate((node) => ({ background: getComputedStyle(node).backgroundColor, before: getComputedStyle(node, '::before').height, after: getComputedStyle(node, '::after').height }));
  record('mobile: close control is not blank white square', closeStyle.background !== 'rgb(255, 255, 255)' && parseFloat(closeStyle.before) >= 18 && parseFloat(closeStyle.after) >= 18, JSON.stringify(closeStyle));
  record('mobile: drawer navigation complete', await phone.locator('.fmbn-drawer-nav a').count() >= 7, `count=${await phone.locator('.fmbn-drawer-nav a').count()}`);
  await snap(phone, 'mobile-drawer.png');
  await close.click();
  await mobile.close();
} finally {
  await browser.close();
}

const report = { generatedAt: new Date().toISOString(), origin, checks, failures, screenshots };
await writeFile(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
