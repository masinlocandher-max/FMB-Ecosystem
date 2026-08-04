import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const officialLogo = '/assets/images/fmb-approved/fmb-news-official-transparent.webp';
const finalCssPath = path.join(dist, 'assets', 'css', 'fmb-sitewide-visual-fixes.css');
const cssStart = '/* FMB_NEWS_EXACT_LOGO_SHARE_PHT_V15_START */';
const cssEnd = '/* FMB_NEWS_EXACT_LOGO_SHARE_PHT_V15_END */';

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function manilaFallback() {
  const now = new Date();
  const text = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);
  return { now, text: `${text} PHT` };
}

function useExactOfficialLogo(html) {
  const exactImage = `<img class="fn15-official-logo" src="${officialLogo}" width="909" height="210" alt="FMB News">`;
  return html.replace(
    /<span class="fn14-reference-logo"[\s\S]*?<span class="fn12-compat-logo"/i,
    `${exactImage}<span class="fn12-compat-logo"`,
  );
}

function removeLegacyShareButton(html) {
  return html.replace(/<button\b[^>]*\bdata-news-share\b[^>]*>[\s\S]*?<\/button>\s*/gi, '');
}

function setPhilippineTimeFallback(html, fallback) {
  return html.replace(
    /(<time\b[^>]*\bdata-philippine-time\b[^>]*>)[\s\S]*?(<\/time>)/gi,
    `$1${fallback}$2`,
  );
}

const { now, text: fallback } = manilaFallback();
const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
let updated = 0;
let articleCount = 0;
let verified = 0;

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (!/\bnews-reference-v13\b/.test(html)) continue;
  const original = html;
  const isArticle = /\bnews-story-route\b/.test(html) && /class="[^"]*\bnc-story-body\b/i.test(html);

  html = useExactOfficialLogo(html);
  html = removeLegacyShareButton(html);
  html = setPhilippineTimeFallback(html, fallback);

  const header = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn14-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  if (!/<img\b[^>]*class="fn15-official-logo"[^>]*alt="FMB News"/i.test(header)) {
    throw new Error(`Exact visible FMB News logo missing from masthead: ${file}`);
  }
  if (/fn14-reference-logo/i.test(header)) {
    throw new Error(`Recreated FMB News logo remained in masthead: ${file}`);
  }
  if (/Loading Philippine time/i.test(html)) {
    throw new Error(`Philippine time fallback remained unresolved: ${file}`);
  }
  if (isArticle) {
    articleCount += 1;
    if (/data-news-share/i.test(html)) {
      throw new Error(`Legacy duplicate share button remained: ${file}`);
    }
    const shareBars = html.match(/class="[^"]*\bfn10-share-bar\b[^"]*"/gi) || [];
    if (shareBars.length !== 1) {
      throw new Error(`Expected one article share section, found ${shareBars.length}: ${file}`);
    }
  }

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    updated += 1;
  }
  verified += 1;
}

if (!verified || !articleCount) {
  throw new Error(`Exact FMB News correction found ${verified} News route(s) and ${articleCount} article route(s).`);
}

const css = `
html body.news-reference-v13 .fn14-brand-lockup[data-fmb-news-logo] {
  width: auto !important;
  min-width: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
}
html body.news-reference-v13 .fn15-official-logo {
  position: static !important;
  width: clamp(190px, 18vw, 258px) !important;
  max-width: 100% !important;
  height: auto !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  object-fit: contain !important;
  clip: auto !important;
  clip-path: none !important;
  pointer-events: auto !important;
}
html body.news-reference-v13 .fn14-reference-logo {
  display: none !important;
}
@media (max-width: 820px) {
  html body.news-reference-v13 .fn15-official-logo {
    width: 178px !important;
  }
}
@media (max-width: 560px) {
  html body.news-reference-v13 .fn15-official-logo {
    width: 150px !important;
  }
}
`;

const currentCss = await readFile(finalCssPath, 'utf8');
const markerPattern = new RegExp(
  `${cssStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${cssEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`,
  'g',
);
const cleanCss = currentCss.replace(markerPattern, '').trimEnd();
await writeFile(finalCssPath, `${cleanCss}\n${cssStart}\n${css.trim()}\n${cssEnd}\n`, 'utf8');

console.log(`Applied the exact official FMB News logo, one share section per article, and a visible Philippine time fallback across ${verified} route(s), including ${articleCount} article route(s), at ${now.toISOString()}.`);
