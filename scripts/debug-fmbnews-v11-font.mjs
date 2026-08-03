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
  const matches = [];

  const visitRules = (rules, sheetIndex, ancestry = []) => {
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
      const rule = rules[ruleIndex];
      if (rule.cssRules) {
        const condition = rule.conditionText || rule.media?.mediaText || rule.name || rule.constructor?.name || 'group';
        visitRules(rule.cssRules, sheetIndex, [...ancestry, condition]);
        continue;
      }
      if (!rule.selectorText || !rule.style?.fontFamily) continue;
      let matched = false;
      try { matched = element.matches(rule.selectorText); } catch {}
      if (!matched) continue;
      matches.push({
        sheetIndex,
        ruleIndex,
        selector: rule.selectorText,
        fontFamily: rule.style.fontFamily,
        priority: rule.style.getPropertyPriority('font-family'),
        ancestry,
      });
    }
  };

  [...document.styleSheets].forEach((sheet, sheetIndex) => {
    try { visitRules(sheet.cssRules, sheetIndex); }
    catch (error) { matches.push({ sheetIndex, inaccessible: true, href: sheet.href || '', error: String(error) }); }
  });

  return {
    outerHTML: element.outerHTML,
    ancestors: [...function* () { let node = element; while (node) { yield `${node.tagName?.toLowerCase() || ''}.${[...node.classList || []].join('.')}`; node = node.parentElement; } }()],
    computedFontFamily: getComputedStyle(element).fontFamily,
    inlineStyle: element.getAttribute('style') || '',
    bodyClasses: [...document.body.classList],
    styleSheets: [...document.styleSheets].map((sheet, index) => ({ index, href: sheet.href || '', owner: sheet.ownerNode?.outerHTML?.slice(0, 180) || '' })),
    matchingFontRules: matches,
  };
});

await writeFile(path.join(evidenceDir, 'fmbnews-v11-font-debug.json'), JSON.stringify(diagnostics, null, 2));
console.log(JSON.stringify(diagnostics, null, 2));
await browser.close();
