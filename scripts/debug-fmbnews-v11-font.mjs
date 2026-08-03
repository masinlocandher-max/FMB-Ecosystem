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
  if (!element) return { error: 'Hero heading missing' };

  const specificity = selector => {
    const cleaned = selector.replace(/:where\([^)]*\)/g, '').replace(/::[\w-]+/g, '');
    const ids = (cleaned.match(/#[\w-]+/g) || []).length;
    const classes = (cleaned.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length;
    const stripped = cleaned
      .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g, ' ')
      .replace(/[>+~*,]/g, ' ');
    const elements = stripped.split(/\s+/).filter(token => token && token !== '*').length;
    return [ids, classes, elements];
  };

  const matchingFontRules = [];
  const styleSheets = [];

  const visit = (rules, sheetIndex, ancestry = []) => {
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
      const rule = rules[ruleIndex];
      if (rule.type === CSSRule.STYLE_RULE) {
        if (!rule.style.fontFamily) continue;
        const selectors = rule.selectorText.split(',').map(value => value.trim());
        for (const selector of selectors) {
          let matched = false;
          try { matched = element.matches(selector); } catch {}
          if (!matched) continue;
          matchingFontRules.push({
            sheetIndex,
            ruleIndex,
            selector,
            specificity: specificity(selector),
            fontFamily: rule.style.fontFamily,
            priority: rule.style.getPropertyPriority('font-family'),
            ancestry,
          });
        }
      } else if (rule.cssRules) {
        visit(rule.cssRules, sheetIndex, [...ancestry, rule.conditionText || rule.media?.mediaText || rule.name || rule.constructor?.name || 'group']);
      }
    }
  };

  [...document.styleSheets].forEach((sheet, sheetIndex) => {
    let count = null;
    let error = '';
    try {
      count = sheet.cssRules.length;
      visit(sheet.cssRules, sheetIndex);
    } catch (exception) {
      error = String(exception);
    }
    styleSheets.push({
      sheetIndex,
      href: sheet.href || '',
      owner: sheet.ownerNode?.outerHTML?.slice(0, 180) || '',
      count,
      error,
    });
  });

  const v11Owner = document.querySelector('style[data-fmb-news-faithful-v11]');
  const v11Rule = matchingFontRules.find(rule => rule.selector === 'html body.news-faithful-v11 .fn9-hero .nc-lead-overlay h2');

  const testStyle = document.createElement('style');
  testStyle.textContent = 'html body.news-faithful-v11 .fn9-hero .nc-lead-overlay h2{font-family:"Cormorant Garamond",Georgia,serif!important}';
  document.head.appendChild(testStyle);
  const fontAfterTestRule = getComputedStyle(element).fontFamily;
  testStyle.remove();

  return {
    outerHTML: element.outerHTML,
    bodyClasses: [...document.body.classList],
    inlineStyle: element.getAttribute('style') || '',
    computedFontFamily: getComputedStyle(element).fontFamily,
    fontAfterTestRule,
    v11Rule: v11Rule || null,
    matchingFontRules,
    styleSheets,
    v11StylePosition: v11Owner ? [...document.head.children].indexOf(v11Owner) : -1,
    headChildCount: document.head.children.length,
  };
});

await writeFile(path.join(evidenceDir, 'fmbnews-v11-font-debug.json'), JSON.stringify(diagnostics, null, 2));
console.log(JSON.stringify(diagnostics, null, 2));
await browser.close();
