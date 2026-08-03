import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FMBNEWS_QA_URL || 'http://127.0.0.1:4173';
const evidenceDir = path.resolve(process.env.FMBNEWS_QA_EVIDENCE || 'fmbnews-v11-evidence');
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
await page.goto(`${baseUrl}/fmbnews/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts?.ready);
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(evidenceDir, 'fmbnews-v11-font-debug.png'), fullPage: false });

const diagnostics = await page.evaluate(() => {
  const element = document.querySelector('.fn9-hero h2');
  const v11Owner = document.querySelector('style[data-fmb-news-faithful-v11]');
  const v11Sheet = v11Owner?.sheet;
  if (!element || !v11Owner || !v11Sheet) return { error: 'Hero heading or V11 sheet missing' };

  const flattenRules = (rules, ancestry = [], output = []) => {
    for (const rule of rules) {
      if (rule.type === CSSRule.STYLE_RULE) {
        output.push({
          selector: rule.selectorText,
          fontFamily: rule.style.fontFamily || '',
          display: rule.style.display || '',
          objectFit: rule.style.objectFit || '',
          ancestry,
          matchesHero: (() => { try { return element.matches(rule.selectorText); } catch { return false; } })(),
        });
      } else if (rule.cssRules) {
        flattenRules(rule.cssRules, [...ancestry, rule.conditionText || rule.media?.mediaText || rule.name || rule.constructor?.name || 'group'], output);
      }
    }
    return output;
  };

  const parsedRules = flattenRules(v11Sheet.cssRules);
  const heroRules = parsedRules.filter(rule => /fn9-hero|nc-lead|fn9-main/.test(rule.selector || ''));
  const exactSelector = 'html body.news-faithful-v11 .fn9-hero .nc-lead-overlay h2';
  const exactRule = parsedRules.find(rule => rule.selector?.split(',').map(value => value.trim()).includes(exactSelector));
  const rawCss = v11Owner.textContent || '';
  const expectedTokens = [
    '.fn9-main',
    '.fn9-hero .nc-lead-broadcast > a',
    '.fn9-hero .nc-lead-overlay h2',
    '.fn11-about-portrait',
    '.fn11-footer',
    '@media (max-width: 700px)',
  ];

  const testStyle = document.createElement('style');
  testStyle.textContent = `${exactSelector}{font-family:"Cormorant Garamond",Georgia,serif!important}`;
  document.head.appendChild(testStyle);
  const fontAfterTestRule = getComputedStyle(element).fontFamily;
  testStyle.remove();

  return {
    outerHTML: element.outerHTML,
    computedFontFamily: getComputedStyle(element).fontFamily,
    fontAfterTestRule,
    bodyFontFamily: getComputedStyle(document.body).fontFamily,
    v11RawLength: rawCss.length,
    v11RuleCount: v11Sheet.cssRules.length,
    flattenedRuleCount: parsedRules.length,
    firstTenRules: parsedRules.slice(0, 10),
    lastTwentyRules: parsedRules.slice(-20),
    heroRules,
    exactSelector,
    exactRule: exactRule || null,
    expectedTokenPositions: Object.fromEntries(expectedTokens.map(token => [token, rawCss.indexOf(token)])),
    rawBraceCounts: {
      opening: (rawCss.match(/{/g) || []).length,
      closing: (rawCss.match(/}/g) || []).length,
    },
    styleSheets: [...document.styleSheets].map((sheet, index) => ({
      index,
      href: sheet.href || '',
      owner: sheet.ownerNode?.outerHTML?.slice(0, 160) || '',
      ruleCount: (() => { try { return sheet.cssRules.length; } catch { return null; } })(),
    })),
  };
});

await writeFile(path.join(evidenceDir, 'fmbnews-v11-font-debug.json'), JSON.stringify(diagnostics, null, 2));
console.log(JSON.stringify(diagnostics, null, 2));
await browser.close();
