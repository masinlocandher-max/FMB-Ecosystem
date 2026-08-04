import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FMBNEWS_QA_URL || 'http://127.0.0.1:4173';
const evidenceDir = path.resolve(process.env.FMBNEWS_QA_EVIDENCE || 'fmbnews-v11-evidence');
const expectedNavigation = ['Home', 'Latest', 'National', 'World', 'Business', 'Lifestyle', 'About'];
const minimumPublishedRoutes = 53;
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = { baseUrl, checks: {}, screenshots: [] };

const visible = element => {
  if (!element) return false;
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
};

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

function check(name, value, details = value) {
  results.checks[name] = { passed: Boolean(value), details };
  if (!value) throw new Error(`FMB News reference browser check failed: ${name} (${JSON.stringify(details)})`);
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 1 });
  await desktop.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(desktop);

  const desktopState = await desktop.evaluate((expected) => {
    const isVisible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const logo = document.querySelector('.fn14-reference-logo');
    const compatLogo = document.querySelector('[data-fmb-news-logo] .fn14-compat-official-logo');
    const nav = document.querySelector('.fn14-desktop-nav');
    const watch = document.querySelector('.fn14-watch-live');
    const hero = document.querySelector('[data-fmb-news-power-hero]');
    const existingLead = document.querySelector('.fn9-hero');
    const logoRect = logo?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    const watchRect = watch?.getBoundingClientRect();
    const labels = [...(nav?.querySelectorAll('a') || [])].map(link => link.textContent?.trim() || '');
    const heroActions = [...(hero?.querySelectorAll('.fn12-hero-actions a') || [])].map(link => link.textContent?.replace(/\s+/g, ' ').trim() || '');
    const phTime = document.querySelector('[data-philippine-time]');
    const leadImage = existingLead?.querySelector('img');
    return {
      referenceLayer: document.body.classList.contains('news-reference-v13'),
      logoVisible: isVisible(logo),
      logoText: logo?.textContent?.replace(/\s+/g, ' ').trim() || '',
      compatibilityLogoLoaded: Boolean(compatLogo?.complete && compatLogo.naturalWidth > 0),
      navVisible: isVisible(nav),
      labels,
      labelsExact: JSON.stringify(labels) === JSON.stringify(expected),
      watchVisible: isVisible(watch),
      watchHref: watch?.getAttribute('href') || '',
      oneRow: Boolean(logoRect && navRect && watchRect && Math.abs((logoRect.top + logoRect.height / 2) - (navRect.top + navRect.height / 2)) < 35 && Math.abs((logoRect.top + logoRect.height / 2) - (watchRect.top + watchRect.height / 2)) < 35),
      heroVisible: isVisible(hero),
      heroHeading: hero?.querySelector('h1')?.textContent?.trim() || '',
      heroActions,
      heroBeforeLead: Boolean(hero && existingLead && hero.getBoundingClientRect().top < existingLead.getBoundingClientRect().top),
      duplicateArticleTools: document.querySelectorAll('[data-fmb-news-article-tools]').length,
      phTimeLive: Boolean(phTime && !/Loading/i.test(phTime.textContent || '')),
      existingLeadImage: Boolean(leadImage?.complete && leadImage.naturalWidth > 0),
      portrait: Boolean(document.querySelector('[data-fmb-news-exact-portrait] img')),
      footer: Boolean(document.querySelector('.fn11-footer .fn11-wordmark') && document.querySelector('.fn11-footer .fn11-signal-mark')),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  }, expectedNavigation);

  check('reference layer active', desktopState.referenceLayer, desktopState);
  check('proper code-native FMB News logo visible', desktopState.logoVisible && /FMB\s*NEWS/i.test(desktopState.logoText), desktopState);
  check('approved compatibility logo remains loaded', desktopState.compatibilityLogoLoaded, desktopState);
  check('exact supplied seven-branch navigation', desktopState.navVisible && desktopState.labelsExact, desktopState);
  check('Watch Live button visible and linked', desktopState.watchVisible && /live_videos\/?$/i.test(desktopState.watchHref), desktopState);
  check('logo navigation and button share one header row', desktopState.oneRow, desktopState);
  check('supplied landing hero visible', desktopState.heroVisible, desktopState);
  check('supplied landing headline exact', desktopState.heroHeading === 'Making every news clearer and sharper in a world full of info.', desktopState.heroHeading);
  check('supplied hero buttons exact', desktopState.heroActions.some(label => /Read latest news/i.test(label)) && desktopState.heroActions.some(label => /Watch live/i.test(label)), desktopState.heroActions);
  check('hero stays above all existing news', desktopState.heroBeforeLead, desktopState);
  check('landing has no duplicate article share bar', desktopState.duplicateArticleTools === 0, desktopState.duplicateArticleTools);
  check('Philippine time is live', desktopState.phTimeLive, desktopState);
  check('existing lead story retained', desktopState.existingLeadImage, desktopState);
  check('existing publisher and footer sections retained', desktopState.portrait && desktopState.footer, desktopState);
  check('desktop has no horizontal overflow', desktopState.overflow <= 1, desktopState.overflow);

  await desktop.locator('[data-fn9-search-open]').click();
  await desktop.waitForTimeout(200);
  const searchState = await desktop.evaluate(() => ({
    hidden: document.querySelector('[data-fn9-search-panel]')?.hidden,
    focused: document.activeElement?.matches('[data-fn9-search-input]') || false,
  }));
  check('existing search remains functional', searchState.hidden === false && searchState.focused, searchState);
  await desktop.keyboard.press('Escape');

  await desktop.locator('[data-fn9-view-all]').click();
  await desktop.waitForTimeout(300);
  const archiveState = await desktop.evaluate(() => {
    const links = [...document.querySelectorAll('.fn9-report-grid a[href^="/news/"]')].map(link => link.getAttribute('href'));
    return {
      uniqueRoutes: new Set(links).size,
      expanded: document.querySelector('[data-fn9-view-all]')?.getAttribute('aria-expanded'),
    };
  });
  check('complete existing news archive retained', archiveState.uniqueRoutes >= minimumPublishedRoutes && archiveState.expanded === 'true', archiveState);
  await screenshot(desktop, 'fmbnews-v14-desktop-full.png', { fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await settle(mobile);
  const mobileState = await mobile.evaluate(() => {
    const isVisible = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const title = document.querySelector('[data-fmb-news-power-hero] h1');
    const rect = title?.getBoundingClientRect();
    return {
      logo: isVisible(document.querySelector('.fn14-reference-logo')),
      menu: isVisible(document.querySelector('[data-fn11-menu-toggle]')),
      desktopNavHidden: !isVisible(document.querySelector('.fn14-desktop-nav')),
      headline: rect ? { left: rect.left, right: rect.right } : null,
      duplicateTools: document.querySelectorAll('[data-fmb-news-article-tools]').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  check('proper logo remains visible on mobile', mobileState.logo, mobileState);
  check('mobile menu control visible', mobileState.menu, mobileState);
  check('desktop branches collapse on mobile', mobileState.desktopNavHidden, mobileState);
  check('mobile headline stays inside viewport', mobileState.headline && mobileState.headline.left >= 0 && mobileState.headline.right <= 390, mobileState);
  check('mobile landing has no duplicate share bar', mobileState.duplicateTools === 0, mobileState);
  check('mobile has no horizontal overflow', mobileState.overflow <= 1, mobileState);

  await mobile.locator('[data-fn11-menu-toggle]').click();
  await mobile.waitForTimeout(250);
  const menuState = await mobile.evaluate(() => ({
    hidden: document.querySelector('[data-fn11-menu-panel]')?.hidden,
    expanded: document.querySelector('[data-fn11-menu-toggle]')?.getAttribute('aria-expanded'),
    labels: [...document.querySelectorAll('[data-fn11-menu-panel] [data-fmb-news-section-link]')].map(link => link.textContent?.trim() || ''),
  }));
  check('mobile menu opens with supplied branches', menuState.hidden === false && menuState.expanded === 'true' && expectedNavigation.every(label => menuState.labels.includes(label)), menuState);
  await screenshot(mobile, 'fmbnews-v14-mobile-menu.png');
  await mobile.keyboard.press('Escape');
  await screenshot(mobile, 'fmbnews-v14-mobile-first-view.png');

  const article = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await article.goto(`${baseUrl}/news/tropical-depression-luis-northern-luzon-august-3-2026/`, { waitUntil: 'domcontentloaded' });
  await settle(article);
  const articleState = await article.evaluate(() => {
    const phTime = document.querySelector('[data-philippine-time]');
    const shareBox = document.querySelector('[data-fmb-share-ready]');
    const facebook = shareBox?.querySelector('[data-fmb-share-destination="facebook"]');
    const x = shareBox?.querySelector('[data-fmb-share-destination="x"]');
    const linkedIn = shareBox?.querySelector('[data-fmb-share-destination="linkedin"]');
    const nativeShare = shareBox?.querySelector('[data-fmb-share-native]');
    const articleImage = document.querySelector('.nc-story-media img');
    return {
      properLogo: Boolean(document.querySelector('.fn14-reference-logo')),
      powerHeroAbsent: !document.querySelector('[data-fmb-news-power-hero]'),
      duplicateTools: document.querySelectorAll('[data-fmb-news-article-tools]').length,
      existingShareBox: Boolean(shareBox),
      facebookHref: facebook?.getAttribute('href') || '',
      xHref: x?.getAttribute('href') || '',
      linkedInHref: linkedIn?.getAttribute('href') || '',
      nativeShare: Boolean(nativeShare),
      phTimeLive: Boolean(phTime && !/Loading/i.test(phTime.textContent || '')),
      storyBody: Boolean(document.querySelector('.nc-story-body')),
      articleImage: Boolean(articleImage?.complete && articleImage.naturalWidth > 0),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  check('article uses the proper logo and no landing hero', articleState.properLogo && articleState.powerHeroAbsent, articleState);
  check('article has no duplicate share toolbar', articleState.duplicateTools === 0, articleState);
  check('existing article share section is enhanced', articleState.existingShareBox && articleState.nativeShare, articleState);
  check('Facebook share destination works', /facebook\.com\/sharer/i.test(articleState.facebookHref), articleState.facebookHref);
  check('X share destination works', /twitter\.com\/intent\/tweet/i.test(articleState.xHref), articleState.xHref);
  check('LinkedIn share destination works', /linkedin\.com\/sharing\/share-offsite/i.test(articleState.linkedInHref), articleState.linkedInHref);
  check('article Philippine time is live', articleState.phTimeLive, articleState);
  check('article body and image remain intact', articleState.storyBody && articleState.articleImage, articleState);
  check('article has no horizontal overflow', articleState.overflow <= 1, articleState.overflow);
  await screenshot(article, 'fmbnews-v14-article-mobile.png', { fullPage: false });

  await desktop.close();
  await mobile.close();
  await article.close();
} finally {
  await writeFile(path.join(evidenceDir, 'fmbnews-v14-browser-qa.json'), JSON.stringify(results, null, 2));
  await browser.close();
}

console.log(`FMB News reference V14 Playwright QA passed ${Object.keys(results.checks).length} browser checks.`);
