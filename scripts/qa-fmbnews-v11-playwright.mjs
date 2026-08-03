import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FMBNEWS_QA_URL || 'http://127.0.0.1:4173';
const evidenceDir = path.resolve(process.env.FMBNEWS_QA_EVIDENCE || 'fmbnews-v11-evidence');
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = { baseUrl, checks: {}, screenshots: [] };

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(1800);
}

async function screenshot(page, name, options = {}) {
  const filePath = path.join(evidenceDir, name);
  await page.screenshot({ path: filePath, ...options });
  results.screenshots.push(name);
}

function requireCheck(name, value, details = value) {
  results.checks[name] = { passed: Boolean(value), details };
  if (!value) throw new Error(`FMB News V11 browser check failed: ${name} (${JSON.stringify(details)})`);
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
  await desktop.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(desktop);

  const desktopState = await desktop.evaluate(() => {
    const visible = element => element && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden';
    const buttons = [...document.querySelectorAll('.fn11-site-header .fn11-icon-button')];
    const heroImage = document.querySelector('.fn9-hero img');
    const wordmarkStrong = document.querySelector('.fn11-site-header .fn11-wordmark strong');
    const wordmarkNews = document.querySelector('.fn11-site-header .fn11-wordmark span');
    const heroHeading = document.querySelector('.fn9-hero h2');
    const ticker = document.querySelector('.fmb-news-ticker');
    const phTime = document.querySelector('[data-philippine-time]');
    return {
      bodyClass: document.body.classList.contains('news-faithful-v11'),
      headerButtons: buttons.length,
      completeIcons: buttons.every(button => button.querySelector('svg[viewBox]') && button.querySelector('path, circle, rect')),
      logoPresent: Boolean(document.querySelector('[data-fmb-news-logo] .fn11-wordmark') && document.querySelector('[data-fmb-news-logo] .fn11-signal-mark')),
      upperCategoryHidden: !visible(document.querySelector('.fn9-category-nav')),
      publicationBarHidden: !visible(document.querySelector('.fn9-publication-bar')),
      tickerVisible: visible(ticker),
      phTimeVisible: visible(phTime) && !/Loading/i.test(phTime?.textContent || ''),
      heroImageLoaded: Boolean(heroImage?.complete && heroImage.naturalWidth > 0 && heroImage.naturalHeight > 0),
      wordmarkFont: wordmarkStrong ? getComputedStyle(wordmarkStrong).fontFamily : '',
      newsFont: wordmarkNews ? getComputedStyle(wordmarkNews).fontFamily : '',
      heroFont: heroHeading ? getComputedStyle(heroHeading).fontFamily : '',
      bodyFont: getComputedStyle(document.body).fontFamily,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fakeAmpersand: Boolean(document.querySelector('.fn9-about-mark')),
    };
  });

  requireCheck('desktop V11 body', desktopState.bodyClass, desktopState);
  requireCheck('exactly two header controls', desktopState.headerButtons === 2, desktopState.headerButtons);
  requireCheck('complete SVG header icons', desktopState.completeIcons, desktopState.completeIcons);
  requireCheck('signal wordmark in header', desktopState.logoPresent, desktopState.logoPresent);
  requireCheck('no redundant upper category menu', desktopState.upperCategoryHidden, desktopState.upperCategoryHidden);
  requireCheck('no redundant publication bar', desktopState.publicationBarHidden, desktopState.publicationBarHidden);
  requireCheck('moving headlines visible', desktopState.tickerVisible, desktopState.tickerVisible);
  requireCheck('Philippine time visible', desktopState.phTimeVisible, desktopState.phTimeVisible);
  requireCheck('hero image loaded', desktopState.heroImageLoaded, desktopState.heroImageLoaded);
  requireCheck('Cormorant wordmark', /Cormorant Garamond/i.test(desktopState.wordmarkFont), desktopState.wordmarkFont);
  requireCheck('Manrope NEWS label', /Manrope/i.test(desktopState.newsFont), desktopState.newsFont);
  requireCheck('Cormorant hero heading', /Cormorant Garamond/i.test(desktopState.heroFont), desktopState.heroFont);
  requireCheck('Manrope body', /Manrope/i.test(desktopState.bodyFont), desktopState.bodyFont);
  requireCheck('no desktop horizontal overflow', desktopState.overflow <= 1, desktopState.overflow);
  requireCheck('decorative ampersand removed', !desktopState.fakeAmpersand, desktopState.fakeAmpersand);

  await screenshot(desktop, 'fmbnews-v11-desktop-full.png', { fullPage: true });

  const about = desktop.locator('.fn9-about-card').first();
  await about.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(500);
  const portraitState = await desktop.evaluate(() => {
    const image = document.querySelector('[data-fmb-news-exact-portrait] img');
    return {
      src: image?.getAttribute('src') || '',
      loaded: Boolean(image?.complete && image.naturalWidth === 922 && image.naturalHeight === 1152),
      alt: image?.getAttribute('alt') || '',
      aboutDisplay: getComputedStyle(document.querySelector('.fn9-about-card')).display,
    };
  });
  requireCheck('approved exact portrait source', portraitState.src === '/assets/images/fmb-approved/francine-portrait-front.webp', portraitState);
  requireCheck('approved portrait loaded at expected dimensions', portraitState.loaded, portraitState);
  requireCheck('portrait has meaningful alt text', /Francine Marie Bautista/i.test(portraitState.alt), portraitState.alt);
  await about.screenshot({ path: path.join(evidenceDir, 'fmbnews-v11-about-desktop.png') });
  results.screenshots.push('fmbnews-v11-about-desktop.png');

  const footer = desktop.locator('.fn11-footer').first();
  await footer.scrollIntoViewIfNeeded();
  await desktop.waitForTimeout(350);
  const footerState = await desktop.evaluate(() => ({
    signal: Boolean(document.querySelector('.fn11-footer .fn11-signal-mark')),
    wordmark: Boolean(document.querySelector('.fn11-footer .fn11-wordmark')),
    socialIcons: document.querySelectorAll('.fn11-footer-socials a svg').length,
  }));
  requireCheck('footer signal logo', footerState.signal && footerState.wordmark, footerState);
  requireCheck('three complete footer social icons', footerState.socialIcons === 3, footerState.socialIcons);
  await footer.screenshot({ path: path.join(evidenceDir, 'fmbnews-v11-footer-desktop.png') });
  results.screenshots.push('fmbnews-v11-footer-desktop.png');

  await desktop.locator('[data-fn9-view-all]').click();
  await desktop.waitForTimeout(300);
  const archiveState = await desktop.evaluate(() => {
    const links = [...document.querySelectorAll('.fn9-report-grid a[href^="/news/"]')].map(link => link.getAttribute('href'));
    return {
      uniqueRoutes: new Set(links).size,
      expanded: document.querySelector('[data-fn9-view-all]')?.getAttribute('aria-expanded'),
      buttonText: document.querySelector('[data-fn9-view-all]')?.textContent?.trim() || '',
    };
  });
  requireCheck('all 50 articles in visible archive', archiveState.uniqueRoutes === 50, archiveState);
  requireCheck('archive expands', archiveState.expanded === 'true', archiveState);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(mobile);
  await screenshot(mobile, 'fmbnews-v11-mobile-first-view.png');

  const mobileState = await mobile.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    headerButtons: document.querySelectorAll('.fn11-site-header .fn11-icon-button').length,
    heroTitleRect: (() => { const r = document.querySelector('.fn9-hero h2')?.getBoundingClientRect(); return r ? { left: r.left, right: r.right, width: r.width } : null; })(),
    portraitExists: Boolean(document.querySelector('[data-fmb-news-exact-portrait] img')),
  }));
  requireCheck('no mobile horizontal overflow', mobileState.overflow <= 1, mobileState);
  requireCheck('two mobile controls', mobileState.headerButtons === 2, mobileState.headerButtons);
  requireCheck('mobile headline inside viewport', mobileState.heroTitleRect && mobileState.heroTitleRect.left >= 0 && mobileState.heroTitleRect.right <= 390, mobileState.heroTitleRect);
  requireCheck('mobile portrait exists', mobileState.portraitExists, mobileState.portraitExists);

  await mobile.locator('[data-fn11-menu-toggle]').click();
  await mobile.waitForTimeout(250);
  const menuState = await mobile.evaluate(() => ({
    hidden: document.querySelector('[data-fn11-menu-panel]')?.hidden,
    expanded: document.querySelector('[data-fn11-menu-toggle]')?.getAttribute('aria-expanded'),
    links: document.querySelectorAll('[data-fn11-menu-panel] a').length,
  }));
  requireCheck('mobile menu opens', menuState.hidden === false && menuState.expanded === 'true', menuState);
  requireCheck('mobile menu has real destinations', menuState.links >= 10, menuState.links);
  await screenshot(mobile, 'fmbnews-v11-mobile-menu.png');
  await mobile.keyboard.press('Escape');
  requireCheck('mobile menu closes with Escape', await mobile.locator('[data-fn11-menu-panel]').evaluate(element => element.hidden), true);

  await mobile.locator('[data-fn9-search-open]').click();
  await mobile.waitForTimeout(200);
  const searchState = await mobile.evaluate(() => ({
    hidden: document.querySelector('[data-fn9-search-panel]')?.hidden,
    focused: document.activeElement?.matches('[data-fn9-search-input]') || false,
  }));
  requireCheck('search opens and focuses input', searchState.hidden === false && searchState.focused, searchState);
  await mobile.keyboard.press('Escape');

  await mobile.locator('.fn9-about-card').scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(400);
  await mobile.locator('.fn9-about-card').screenshot({ path: path.join(evidenceDir, 'fmbnews-v11-about-mobile.png') });
  results.screenshots.push('fmbnews-v11-about-mobile.png');

  const article = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await article.goto(`${baseUrl}/news/tropical-depression-luis-northern-luzon-august-3-2026/`, { waitUntil: 'domcontentloaded' });
  await settle(article);
  const articleState = await article.evaluate(() => ({
    v11: document.body.classList.contains('news-faithful-v11'),
    controls: document.querySelectorAll('.fn11-site-header .fn11-icon-button').length,
    footerLogo: Boolean(document.querySelector('.fn11-footer .fn11-wordmark')),
    articleImage: Boolean(document.querySelector('.nc-story-media img')?.naturalWidth),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  requireCheck('article pages share V11 system', articleState.v11 && articleState.controls === 2 && articleState.footerLogo, articleState);
  requireCheck('article media loads', articleState.articleImage, articleState.articleImage);
  requireCheck('article mobile no overflow', articleState.overflow <= 1, articleState.overflow);
  await screenshot(article, 'fmbnews-v11-article-mobile.png', { fullPage: false });

  await desktop.close();
  await mobile.close();
  await article.close();
} finally {
  await writeFile(path.join(evidenceDir, 'fmbnews-v11-browser-qa.json'), JSON.stringify(results, null, 2));
  await browser.close();
}

console.log(`FMB News V11 Playwright QA passed ${Object.keys(results.checks).length} browser checks.`);
