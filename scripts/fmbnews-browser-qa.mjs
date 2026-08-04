import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.FMB_QA_ORIGIN || 'http://127.0.0.1:4173';
const evidenceDirectory = path.resolve('final-whole-site-audit');
await mkdir(evidenceDirectory, { recursive: true });

const exactColorLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const exactWhiteLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const failures = [];
const checks = [];
const screenshots = [];

function record(name, passed, detail = '') {
  checks.push({ name, passed, detail });
  if (!passed) failures.push({ name, detail });
}
function assert(name, condition, detail = '') {
  record(name, Boolean(condition), detail);
}
async function visible(locator) {
  return locator.isVisible().catch(() => false);
}
async function screenshot(page, name, fullPage = false) {
  const file = path.join(evidenceDirectory, name);
  await page.screenshot({ path: file, fullPage, animations: 'disabled' });
  screenshots.push(name);
}
async function waitForNewsroom(page) {
  await page.waitForSelector('[data-main-content]', { state: 'visible' });
  await page.waitForFunction(() => {
    const main = document.querySelector('[data-main-content]');
    return main && !main.querySelector('.loading-state') && main.innerText.trim().length > 30;
  });
}
async function checkConsole(page, errors, label) {
  const relevant = errors.filter((message) => !/favicon|third-party|net::ERR_BLOCKED_BY_CLIENT/i.test(message));
  assert(`${label}: console health`, relevant.length === 0, relevant.join(' | ') || 'no relevant console errors');
}
async function checkNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(`${label}: no horizontal overflow`, metrics.scrollWidth <= metrics.clientWidth + 2 && metrics.bodyScrollWidth <= metrics.clientWidth + 2, JSON.stringify(metrics));
}
async function checkLandingIdentity(page, label) {
  const lightLogo = page.locator(`img[src="${exactColorLogo}"]`).first();
  const darkLogos = page.locator(`img[src="${exactWhiteLogo}"]`);
  assert(`${label}: supplied color logo`, await visible(lightLogo), `visible=${await visible(lightLogo)}`);
  assert(`${label}: supplied white logo`, await darkLogos.count() >= 2, `count=${await darkLogos.count()}`);
  const clock = page.locator('[data-pht-time]').first();
  const clockText = (await clock.textContent().catch(() => ''))?.trim() || '';
  assert(`${label}: Philippine time visible`, await visible(clock) && /PHT/i.test(clockText), clockText);
  const wire = page.locator('[data-wire-track]').first();
  const wireText = (await wire.textContent().catch(() => ''))?.trim() || '';
  assert(`${label}: moving headline wire`, await visible(wire) && wireText.length > 20, wireText.slice(0, 180));
  assert(`${label}: no bottom navigation`, await page.locator('.bottom-nav,.tab-bar,.nc-mobile-dock,.fmb-mobile-dock').filter({ visible: true }).count().catch(() => 0) === 0, 'no visible bottom navigation');
}

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const desktopPage = await desktop.newPage();
  const desktopErrors = [];
  desktopPage.on('console', (message) => { if (message.type() === 'error') desktopErrors.push(message.text()); });
  const response = await desktopPage.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  assert('desktop home: HTTP response', response?.ok(), `status=${response?.status()}`);
  await waitForNewsroom(desktopPage);
  assert('desktop home: correct title', /FMB News/i.test(await desktopPage.title()), await desktopPage.title());
  await checkLandingIdentity(desktopPage, 'desktop home');
  await checkNoOverflow(desktopPage, 'desktop home');
  const sidebar = desktopPage.locator('[data-sidebar]');
  assert('desktop home: ombré sidebar visible', await visible(sidebar), `visible=${await visible(sidebar)}`);
  const sidebarBackground = await sidebar.evaluate((node) => getComputedStyle(node).backgroundImage);
  assert('desktop home: navy-purple-plum gradient', /linear-gradient/i.test(sidebarBackground), sidebarBackground);
  const displayFont = await desktopPage.locator('.page-heading h1').first().evaluate((node) => getComputedStyle(node).fontFamily).catch(() => '');
  assert('desktop home: luxury display typography', /Iowan|Palatino|Book Antiqua|Georgia/i.test(displayFont), displayFont);
  const tickerButton = desktopPage.locator('[data-wire-toggle]');
  await tickerButton.click();
  assert('desktop home: ticker pause works', await tickerButton.getAttribute('aria-pressed') === 'true', `aria-pressed=${await tickerButton.getAttribute('aria-pressed')}`);
  await tickerButton.click();
  await screenshot(desktopPage, 'fmbnews-desktop-home.png');
  await checkConsole(desktopPage, desktopErrors, 'desktop home');

  await desktopPage.goto(`${origin}/fmbnews/?view=alam-mo-ba`, { waitUntil: 'domcontentloaded' });
  await waitForNewsroom(desktopPage);
  const factCards = desktopPage.locator('.fact-card');
  assert('Alam Mo Ba: complete fact desk', await factCards.count() >= 8, `fact cards=${await factCards.count()}`);
  const factSources = desktopPage.locator('.fact-source');
  const sourceCount = await factSources.count();
  const badSources = [];
  for (let index = 0; index < sourceCount; index += 1) {
    const href = await factSources.nth(index).getAttribute('href');
    if (!href?.startsWith('https://')) badSources.push(href || 'missing');
  }
  assert('Alam Mo Ba: every fact has a source', sourceCount >= 8 && badSources.length === 0, `sources=${sourceCount}; invalid=${badSources.join(',') || 'none'}`);
  assert('Alam Mo Ba: segment title hero', /^Alam Mo Ba\?$/i.test((await desktopPage.locator('.segment-hero h1').textContent())?.trim() || ''), await desktopPage.locator('.segment-hero h1').textContent());
  await checkNoOverflow(desktopPage, 'Alam Mo Ba');
  await screenshot(desktopPage, 'fmbnews-alam-mo-ba.png');

  await desktopPage.goto(`${origin}/fmbnews/?view=lotto`, { waitUntil: 'domcontentloaded' });
  await waitForNewsroom(desktopPage);
  const officialResults = desktopPage.locator('a[href="https://lottomatik.pcso.gov.ph/lotto-results"]');
  const responsibleGaming = desktopPage.locator('a[href="https://lottomatik.pcso.gov.ph/responsible-gaming"]');
  assert('Lotto: official result gateway', await visible(officialResults), `visible=${await visible(officialResults)}`);
  assert('Lotto: responsible gaming gateway', await visible(responsibleGaming), `visible=${await visible(responsibleGaming)}`);
  assert('Lotto: complete draw schedule', await desktopPage.locator('.schedule-card').count() >= 9, `schedule cards=${await desktopPage.locator('.schedule-card').count()}`);
  assert('Lotto: no invented result combination', !/winning combination\s*:\s*[0-9]/i.test(await desktopPage.locator('body').innerText()), 'official gateway only');
  await checkNoOverflow(desktopPage, 'Lotto');
  await screenshot(desktopPage, 'fmbnews-lotto.png');

  await desktopPage.goto(`${origin}/fmbnews/?view=horoscope`, { waitUntil: 'domcontentloaded' });
  await waitForNewsroom(desktopPage);
  assert('Horoscope: twelve signs', await desktopPage.locator('[data-zodiac]').count() === 12, `signs=${await desktopPage.locator('[data-zodiac]').count()}`);
  const beforeReading = (await desktopPage.locator('[data-horoscope-detail]').innerText()).trim();
  await desktopPage.locator('[data-zodiac="taurus"]').click();
  await desktopPage.locator('[data-horoscope-period="week"]').click();
  const afterReading = (await desktopPage.locator('[data-horoscope-detail]').innerText()).trim();
  assert('Horoscope: sign selection works', await desktopPage.locator('[data-zodiac="taurus"]').getAttribute('aria-pressed') === 'true', `aria-pressed=${await desktopPage.locator('[data-zodiac="taurus"]').getAttribute('aria-pressed')}`);
  assert('Horoscope: timeframe selection works', await desktopPage.locator('[data-horoscope-period="week"]').getAttribute('aria-pressed') === 'true', `aria-pressed=${await desktopPage.locator('[data-horoscope-period="week"]').getAttribute('aria-pressed')}`);
  assert('Horoscope: reading updates', beforeReading !== afterReading && /Taurus/i.test(afterReading) && /This Week/i.test(afterReading), afterReading.slice(0, 220));
  assert('Horoscope: entertainment disclaimer', /entertainment/i.test(await desktopPage.locator('.editorial-note').innerText()), await desktopPage.locator('.editorial-note').innerText());
  await checkNoOverflow(desktopPage, 'Horoscope');
  await screenshot(desktopPage, 'fmbnews-horoscope.png');

  await desktopPage.goto(`${origin}/fmbnews/?archive=all`, { waitUntil: 'domcontentloaded' });
  await waitForNewsroom(desktopPage);
  const archiveLinks = desktopPage.locator('.story-card a[href^="/news/"]');
  assert('Archives: preserved articles reachable', await archiveLinks.count() >= 1, `article cards=${await archiveLinks.count()}`);
  const manifest = await desktopPage.evaluate(async () => {
    const response = await fetch('/assets/data/fmbnews-manifest.json', { cache: 'no-store' });
    return response.json();
  });
  assert('Archives: manifest preservation record', Array.isArray(manifest.articles) && manifest.articles.length >= 1 && manifest.total === manifest.articles.length, `total=${manifest.total}; articles=${manifest.articles?.length}`);
  const lowResolution = manifest.articles.filter((article) => Math.max(Number(article.imageWidth), Number(article.imageHeight)) < 1080 || Math.min(Number(article.imageWidth), Number(article.imageHeight)) < 600);
  assert('Archives: all displayed editorial images are HD', lowResolution.length === 0 && manifest.preservation?.hdImagesVerified === true, `low-resolution=${lowResolution.map((article) => article.route).join(',') || 'none'}; upgraded=${manifest.preservation?.displayImagesUpgraded || 0}`);
  await screenshot(desktopPage, 'fmbnews-archives.png');

  const firstArticle = manifest.articles[0];
  assert('Archives: article route selected', Boolean(firstArticle?.route), firstArticle?.route || 'missing');
  if (firstArticle?.route) {
    await desktopPage.goto(`${origin}${firstArticle.route}`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForSelector('[data-fmbnews-article-shell]', { state: 'visible' });
    assert('Article desktop: supplied color logo', await visible(desktopPage.locator(`.fmbn-story-logo img[src="${exactColorLogo}"]`)), firstArticle.route);
    assert('Article desktop: supplied white footer logo', await visible(desktopPage.locator(`.fmbn-story-footer img[src="${exactWhiteLogo}"]`)), firstArticle.route);
    assert('Article desktop: Philippine time', /PHT/i.test((await desktopPage.locator('[data-philippine-time]').textContent()) || ''), await desktopPage.locator('[data-philippine-time]').textContent());
    assert('Article desktop: moving headline wire', (await desktopPage.locator('[data-fmbn-wire-track] span').count()) >= 2, `headlines=${await desktopPage.locator('[data-fmbn-wire-track] span').count()}`);
    assert('Article desktop: article body preserved', await desktopPage.locator('main h1').count() >= 1 && (await desktopPage.locator('main').innerText()).length > 500, `main length=${(await desktopPage.locator('main').innerText()).length}`);
    await checkNoOverflow(desktopPage, 'Article desktop');
    await screenshot(desktopPage, 'fmbnews-article-desktop.png');
  }
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on('console', (message) => { if (message.type() === 'error') mobileErrors.push(message.text()); });
  await mobilePage.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await waitForNewsroom(mobilePage);
  await checkLandingIdentity(mobilePage, 'mobile home');
  await checkNoOverflow(mobilePage, 'mobile home');
  const menuButton = mobilePage.locator('[data-drawer-open]');
  assert('mobile home: menu button visible', await visible(menuButton), `visible=${await visible(menuButton)}`);
  await screenshot(mobilePage, 'fmbnews-mobile-home.png');
  await menuButton.click();
  await mobilePage.waitForTimeout(180);
  assert('mobile drawer: opens', await menuButton.getAttribute('aria-expanded') === 'true' && await mobilePage.locator('body').evaluate((node) => node.classList.contains('drawer-open')), `aria-expanded=${await menuButton.getAttribute('aria-expanded')}`);
  const closeButton = mobilePage.locator('[data-drawer-close]');
  const closeGlyph = mobilePage.locator('.close-glyph');
  const closeVisual = await closeButton.evaluate((node) => {
    const style = getComputedStyle(node);
    const before = getComputedStyle(node.querySelector('.close-glyph'), '::before');
    const after = getComputedStyle(node.querySelector('.close-glyph'), '::after');
    return {
      visible: style.display !== 'none' && node.getBoundingClientRect().width >= 40,
      background: style.backgroundColor,
      beforeHeight: before.height,
      beforeBackground: before.backgroundColor,
      afterHeight: after.height,
      afterBackground: after.backgroundColor,
    };
  });
  assert('mobile drawer: corrected close control is not a blank white square', closeVisual.visible && closeVisual.background !== 'rgb(255, 255, 255)' && parseFloat(closeVisual.beforeHeight) >= 14 && parseFloat(closeVisual.afterHeight) >= 14, JSON.stringify(closeVisual));
  assert('mobile drawer: visible X glyph', await visible(closeGlyph), `visible=${await visible(closeGlyph)}`);
  assert('mobile drawer: supplied white logo', await visible(mobilePage.locator(`.sidebar img[src="${exactWhiteLogo}"]`)), exactWhiteLogo);
  await screenshot(mobilePage, 'fmbnews-mobile-drawer.png');
  await closeButton.click();
  assert('mobile drawer: closes', await menuButton.getAttribute('aria-expanded') === 'false', `aria-expanded=${await menuButton.getAttribute('aria-expanded')}`);
  await checkConsole(mobilePage, mobileErrors, 'mobile home');

  if (firstArticle?.route) {
    await mobilePage.goto(`${origin}${firstArticle.route}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('[data-fmbnews-article-shell]', { state: 'visible' });
    await checkNoOverflow(mobilePage, 'Article mobile');
    const articleMenu = mobilePage.locator('[data-fmbn-menu-open]');
    assert('Article mobile: menu visible', await visible(articleMenu), `visible=${await visible(articleMenu)}`);
    await articleMenu.click();
    const articleClose = mobilePage.locator('[data-fmbn-menu-close]');
    assert('Article mobile: drawer opens', await articleMenu.getAttribute('aria-expanded') === 'true' && await visible(articleClose), `aria-expanded=${await articleMenu.getAttribute('aria-expanded')}`);
    const articleCloseVisual = await articleClose.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      beforeHeight: getComputedStyle(node, '::before').height,
      afterHeight: getComputedStyle(node, '::after').height,
    }));
    assert('Article mobile: corrected close X', articleCloseVisual.background !== 'rgb(255, 255, 255)' && parseFloat(articleCloseVisual.beforeHeight) >= 14 && parseFloat(articleCloseVisual.afterHeight) >= 14, JSON.stringify(articleCloseVisual));
    assert('Article mobile: supplied white drawer logo', await visible(mobilePage.locator(`.fmbn-story-drawer img[src="${exactWhiteLogo}"]`)), exactWhiteLogo);
    await screenshot(mobilePage, 'fmbnews-article-mobile-drawer.png');
    await articleClose.click();
  }
  await mobile.close();

  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await waitForNewsroom(reducedPage);
  const reducedAnimation = await reducedPage.locator('[data-wire-track]').evaluate((node) => getComputedStyle(node).animationDuration);
  assert('Reduced motion: ticker animation disabled', reducedAnimation === '0.01ms' || reducedAnimation === '0s' || parseFloat(reducedAnimation) <= 0.01, reducedAnimation);
  await reduced.close();
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  origin,
  browser: 'Playwright Chromium',
  checks,
  failures,
  screenshots,
};
await writeFile(path.join(evidenceDirectory, 'fmbnews-browser-qa.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FMB News browser QA failed ${failures.length} check(s).`);
  process.exit(1);
}
console.log(`FMB News browser QA passed ${checks.length} checks with ${screenshots.length} screenshots.`);