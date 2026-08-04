import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const origin = process.env.FMB_QA_ORIGIN || 'http://127.0.0.1:4173';
const evidenceDirectory = path.resolve('final-whole-site-audit');
await mkdir(evidenceDirectory, { recursive: true });

const failures = [];
const checks = [];
const screenshots = [];
const record = (name, passed, detail = '') => {
  checks.push({ name, passed: Boolean(passed), detail });
  if (!passed) failures.push({ name, detail });
};

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });

  async function open(query, expected) {
    const response = await page.goto(`${origin}/fmbnews/${query}`, { waitUntil: 'domcontentloaded' });
    record(`${expected}: HTTP`, response?.ok(), `status=${response?.status()}`);
    await page.waitForSelector('[data-main-content]', { state: 'visible' });
    await page.waitForFunction(() => {
      const main = document.querySelector('[data-main-content]');
      return main && !main.querySelector('.loading-state') && main.innerText.trim().length > 30;
    });
    const text = (await page.locator('[data-main-content]').innerText()).replace(/\s+/g, ' ').trim();
    record(`${expected}: meaningful content`, text.length > 100, `length=${text.length}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    record(`${expected}: responsive width`, overflow <= 2, `overflow=${overflow}`);
    return text;
  }

  const home = await open('', 'Home');
  record('Home: current-day newsroom promise', /12:00 a\.m\. to 11:59 p\.m\.|published today|Today’s FMB News/i.test(home), home.slice(0, 180));
  const primaryLabels = await page.locator('[data-primary-nav] > a span').allTextContents();
  const expectedLabels = ['Home', 'Alam Mo Ba?', 'Lotto', 'Horoscope', 'About', 'FMB Message', 'Submit Your Story'];
  record('Primary menu: exact seven destinations', JSON.stringify(primaryLabels) === JSON.stringify(expectedLabels), JSON.stringify(primaryLabels));
  record('Primary menu: archive categories excluded', !primaryLabels.some((label) => ['Philippines', 'World', 'Business', 'Lifestyle'].includes(label)), JSON.stringify(primaryLabels));

  const about = await open('?view=about', 'About');
  for (const marker of ['Who We Are', 'Our Mission', 'Our Vision', 'Our Editorial Promise', 'withlovefmb@gmail.com']) {
    record(`About: ${marker}`, about.includes(marker), marker);
  }

  const message = await open('?view=fmb-message', 'FMB Message');
  record('FMB Message: publisher message present', /A newsroom built around understanding/i.test(message), message.slice(0, 180));
  record('FMB Message: signature present', /With love, FMB/i.test(message), message.slice(-100));

  const submit = await open('?view=submit', 'Submit Your Story');
  record('Submit: working email action', await page.locator('a[href^="mailto:withlovefmb@gmail.com"]').count() >= 1, `mailto count=${await page.locator('a[href^="mailto:withlovefmb@gmail.com"]').count()}`);
  record('Submit: safety guidance', /Never place yourself in danger/i.test(submit), submit.slice(0, 220));
  record('Submit: permission guidance', /permission to share/i.test(submit), submit.slice(0, 220));

  const archiveSlugs = ['philippines', 'world', 'business', 'lifestyle', 'technology', 'politics-government', 'environment', 'health', 'education', 'science', 'sports', 'culture', 'all'];
  for (const slug of archiveSlugs) {
    const text = await open(`?archive=${encodeURIComponent(slug)}`, `Archive ${slug}`);
    const hasStories = await page.locator('.story-card').count() > 0;
    const hasEmptyContinuation = await page.locator('.empty-card a[data-route-link]').count() > 0;
    record(`Archive ${slug}: no dead end`, hasStories || hasEmptyContinuation, `stories=${await page.locator('.story-card').count()}; continuation=${await page.locator('.empty-card a[data-route-link]').count()}; text=${text.slice(0, 90)}`);
  }

  const manifest = await page.evaluate(async () => (await fetch('/assets/data/fmbnews-manifest.json', { cache: 'no-store' })).json());
  const searchTerm = String(manifest.articles?.[0]?.title || '').split(/\s+/).filter((word) => word.length > 4)[0] || 'Philippines';
  await open(`?search=${encodeURIComponent(searchTerm)}`, 'Search');
  record('Search: returns preserved reports', await page.locator('.story-card').count() >= 1, `term=${searchTerm}; results=${await page.locator('.story-card').count()}`);

  await page.goto(`${origin}/news/#philippines`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-main-content]', { state: 'visible' });
  await page.waitForFunction(() => location.search.includes('archive=philippines'));
  record('Legacy archive link: /news/#philippines remains useful', new URL(page.url()).searchParams.get('archive') === 'philippines', page.url());

  const relevantConsoleErrors = consoleErrors.filter((message) => !/favicon|third-party|net::ERR_BLOCKED_BY_CLIENT/i.test(message));
  record('Completeness flow: console health', relevantConsoleErrors.length === 0, relevantConsoleErrors.join(' | ') || 'no relevant console errors');
  const screenshotName = 'fmbnews-page-completeness.png';
  await page.screenshot({ path: path.join(evidenceDirectory, screenshotName), fullPage: false, animations: 'disabled' });
  screenshots.push(screenshotName);
  await context.close();
} finally {
  await browser.close();
}

const report = { generatedAt: new Date().toISOString(), origin, checks, failures, screenshots };
await writeFile(path.join(evidenceDirectory, 'fmbnews-completeness-qa.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FMB News completeness QA failed ${failures.length} check(s).`);
  process.exit(1);
}
console.log(`FMB News completeness QA passed ${checks.length} checks.`);