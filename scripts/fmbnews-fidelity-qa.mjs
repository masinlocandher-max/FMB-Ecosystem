import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.FMB_QA_ORIGIN || 'http://127.0.0.1:4173';
const evidenceDirectory = path.resolve('final-whole-site-audit');
await mkdir(evidenceDirectory, { recursive: true });

const checks = [];
const failures = [];
const record = (name, passed, detail = '') => {
  checks.push({ name, passed: Boolean(passed), detail });
  if (!passed) failures.push({ name, detail });
};

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  await page.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-main-content]', { state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('[data-main-content] .loading-state'));

  const desktopClose = page.locator('.sidebar [data-drawer-close]');
  record('Desktop sidebar: close control is hidden', !(await desktopClose.isVisible()), `visible=${await desktopClose.isVisible()}`);

  const homeEmpty = await page.locator('.hero-card').count() === 0;
  if (homeEmpty) {
    const latestSections = await page.locator('.section-head h2', { hasText: 'Latest News Today' }).count();
    const emptyCards = await page.locator('[data-main-content] > .empty-card').count();
    record('Empty home: no duplicate Latest News Today section', latestSections === 0, `latest sections=${latestSections}`);
    record('Empty home: one intentional empty state', emptyCards <= 1, `direct empty cards=${emptyCards}`);
  } else {
    record('Populated home: duplicate-empty check not applicable', true, 'current-day reports are present');
  }

  await page.goto(`${origin}/fmbnews/?view=horoscope`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.zodiac-symbol', { state: 'visible' });
  const zodiac = await page.locator('.zodiac-symbol').first().evaluate((node) => ({
    text: node.textContent,
    family: getComputedStyle(node).fontFamily,
    color: getComputedStyle(node).color,
  }));
  record('Horoscope: text-style zodiac glyph', zodiac.text?.includes('\uFE0E') && /Times New Roman|Iowan|Georgia/i.test(zodiac.family), JSON.stringify(zodiac));
  record('Horoscope: zodiac glyph follows brand purple', /rgb\((74, 39, 133|75, 39, 133)\)/.test(zodiac.color), zodiac.color);
  await page.screenshot({ path: path.join(evidenceDirectory, 'fmbnews-fidelity-horoscope.png'), fullPage: false, animations: 'disabled' });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${origin}/fmbnews/`, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForSelector('[data-pht-time]', { state: 'visible' });
  await mobilePage.waitForTimeout(1200);
  const mobileClock = await mobilePage.locator('[data-pht-time]').evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return { text: node.textContent, width: rect.width, height: rect.height, lineHeight: parseFloat(style.lineHeight), whiteSpace: style.whiteSpace, title: node.getAttribute('title') };
  });
  record('Mobile masthead: compact PHT clock', /^\d{1,2}:\d{2}\s(?:AM|PM)\sPHT$/i.test((mobileClock.text || '').trim()), JSON.stringify(mobileClock));
  record('Mobile masthead: PHT stays on one line', mobileClock.whiteSpace === 'nowrap' && mobileClock.height <= Math.max(18, mobileClock.lineHeight * 1.35), JSON.stringify(mobileClock));
  record('Mobile masthead: full date remains accessible', /Philippine Standard Time:/i.test(await mobilePage.locator('[data-pht-time]').getAttribute('aria-label') || '') && Boolean(mobileClock.title), JSON.stringify(mobileClock));
  await mobilePage.screenshot({ path: path.join(evidenceDirectory, 'fmbnews-fidelity-mobile-home.png'), fullPage: false, animations: 'disabled' });

  const manifest = await mobilePage.evaluate(async () => (await fetch('/assets/data/fmbnews-manifest.json', { cache: 'no-store' })).json());
  const route = manifest.articles?.[0]?.route;
  record('Article fidelity: preserved route available', Boolean(route), route || 'missing');
  if (route) {
    await mobilePage.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForSelector('[data-fmbnews-article-shell]', { state: 'visible' });
    await mobilePage.waitForTimeout(1200);
    const visibleLegacyDesk = await mobilePage.locator('body > *').evaluateAll((nodes) => nodes.filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return /Live Desk\s*Philippine Standard Time/i.test((node.innerText || '').replace(/\s+/g, ' '));
    }).length);
    record('Article fidelity: legacy Live Desk block removed', visibleLegacyDesk === 0, `visible legacy blocks=${visibleLegacyDesk}`);
    const articleClock = (await mobilePage.locator('[data-philippine-time]').textContent() || '').trim();
    record('Article mobile: compact PHT clock', /^\d{1,2}:\d{2}\s(?:AM|PM)\sPHT$/i.test(articleClock), articleClock);
    await mobilePage.screenshot({ path: path.join(evidenceDirectory, 'fmbnews-fidelity-article-mobile.png'), fullPage: false, animations: 'disabled' });
  }
  await mobile.close();
} finally {
  await browser.close();
}

const report = { generatedAt: new Date().toISOString(), origin, checks, failures };
await writeFile(path.join(evidenceDirectory, 'fmbnews-fidelity-qa.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FMB News fidelity QA failed ${failures.length} check(s).`);
  process.exit(1);
}
console.log(`FMB News fidelity QA passed ${checks.length} checks.`);