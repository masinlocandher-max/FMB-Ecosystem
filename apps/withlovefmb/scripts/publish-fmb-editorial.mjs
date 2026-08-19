import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishNewsFeed } from './publish-news-feed.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const appRoot = path.resolve(scriptDirectory, '..');
const articleContentRoot = path.join(appRoot, 'content', 'news', 'articles');
// Legacy storage name retained so existing editorial files and publishing jobs do not break.
// Everything public-facing is FMB Brief.
const briefContentRoot = path.join(appRoot, 'content', 'news', 'morning-special');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const cleanStylesheet = '/assets/css/fmbnews-clean-v1.css?v=20260808-profile-v1';
const enhancementStylesheet = '/assets/css/fmbnews-enhancement-v2.css?v=20260820-brief-v1';
const fallbackPattern = /(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const stripTags = (value) => String(value ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function requiredString(value, label, file) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${file}: ${label} is required`);
  return value.trim();
}

function validDate(value, label, file) {
  const text = requiredString(value, label, file);
  if (Number.isNaN(new Date(text).getTime())) throw new Error(`${file}: ${label} is not a valid date`);
  return text;
}

function validHttpUrl(value, label, file) {
  const text = requiredString(value, label, file);
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(`${file}: ${label} is not a valid URL`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`${file}: ${label} must use HTTP or HTTPS`);
  return parsed.href;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function walkJson(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkJson(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
  }
  return files.sort();
}

function isRelatedLocalImage(image) {
  return Boolean(
    image
    && image.kind !== 'editorial-fallback'
    && typeof image.url === 'string'
    && image.url.startsWith('/assets/')
    && !fallbackPattern.test(image.url),
  );
}

async function prepareSafeArticleContent(distRoot) {
  const temporaryRoot = path.join(distRoot, '.fmb-news-safe-content');
  await rm(temporaryRoot, { recursive: true, force: true });
  await mkdir(temporaryRoot, { recursive: true });

  const safe = [];
  const withheld = [];
  for (const file of await walkJson(articleContentRoot)) {
    const relative = path.relative(articleContentRoot, file);
    const raw = JSON.parse(await readFile(file, 'utf8'));
    const slug = requiredString(raw.slug, 'slug', relative);
    let reason = '';
    try {
      validDate(raw.publishedAt, 'publishedAt', relative);
    } catch (error) {
      reason = error.message;
    }
    if (!reason && !isRelatedLocalImage(raw.image)) reason = 'related editorial image is missing or is a generic fallback';
    if (!reason) {
      try {
        requiredString(raw.image?.credit, 'image.credit', relative);
      } catch (error) {
        reason = error.message;
      }
    }
    if (!reason) {
      try {
        validHttpUrl(raw.image?.sourceUrl, 'image.sourceUrl', relative);
      } catch (error) {
        reason = error.message;
      }
    }
    if (!reason && !(await exists(path.join(distRoot, raw.image.url.slice(1))))) reason = `image asset is missing: ${raw.image.url}`;
    if (!reason && Number.isFinite(raw.image?.width) && Number.isFinite(raw.image?.height)) {
      if (raw.image.width < 1200 || raw.image.height < 630) reason = 'image is below the 1200×630 social-sharing minimum';
    }

    if (reason) {
      withheld.push({ slug, file: relative, reason });
      continue;
    }

    const target = path.join(temporaryRoot, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(file, target, { force: true });
    safe.push({ slug, file: relative, publishedAt: raw.publishedAt });
  }
  return { temporaryRoot, safe, withheld };
}

const attr = (html, name) => {
  const match = String(html || '').match(new RegExp(`\\b${name}=(['"])(.*?)\\1`, 'i'));
  return match?.[2] || '';
};

const meta = (html, key, value) => {
  const match = String(html || '').match(new RegExp(`<meta\\b(?=[^>]*\\b${key}=(['"])${value}\\1)[^>]*>`, 'i'));
  return match ? attr(match[0], 'content') : '';
};

function legacyPublishedAt(html) {
  return meta(html, 'property', 'article:published_time')
    || html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1]
    || html.match(/"dateCreated"\s*:\s*"([^"]+)"/i)?.[1]
    || html.match(/\bdatetime=(['"])(\d{4}-\d{2}-\d{2}T[^'"]+)\1/i)?.[2]
    || '';
}

function localEditorialImage(html) {
  const candidates = [
    meta(html, 'property', 'og:image'),
    ...[...String(html || '').matchAll(/<img\b[^>]*>/gi)].map((match) => attr(match[0], 'src')),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    let value = candidate;
    try {
      const parsed = new URL(candidate, canonicalOrigin);
      if (parsed.origin !== canonicalOrigin) continue;
      value = parsed.pathname;
    } catch {
      continue;
    }
    if (value.startsWith('/assets/') && !fallbackPattern.test(value)) return value;
  }
  return '';
}

function visibleImageCredit(html) {
  return stripTags(
    html.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]
    || html.match(/<[^>]+class=(['"])[^'"]*(?:credit|attribution)[^'"]*\1[^>]*>([\s\S]*?)<\//i)?.[2]
    || '',
  );
}

async function sanitizeLegacyRoutes(distRoot, safeSlugs, withheldSlugs) {
  const newsRoot = path.join(distRoot, 'news');
  const removed = [];
  let entries = [];
  try {
    entries = await readdir(newsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return removed;
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || ['about', 'brief'].includes(entry.name) || safeSlugs.has(entry.name)) continue;
    const directory = path.join(newsRoot, entry.name);
    if (withheldSlugs.has(entry.name)) {
      await rm(directory, { recursive: true, force: true });
      removed.push({ slug: entry.name, reason: 'structured article withheld by related-image gate' });
      continue;
    }
    const file = path.join(directory, 'index.html');
    if (!(await exists(file))) continue;
    const html = await readFile(file, 'utf8');
    if (/http-equiv=(['"])refresh\1/i.test(html) || /noindex/i.test(meta(html, 'name', 'robots'))) continue;
    const publishedAt = legacyPublishedAt(html);
    const image = localEditorialImage(html);
    const credit = visibleImageCredit(html);
    let reason = '';
    if (!publishedAt || Number.isNaN(new Date(publishedAt).getTime())) reason = 'missing or invalid publication date';
    else if (!image) reason = 'missing related local editorial image';
    else if (!(await exists(path.join(distRoot, image.slice(1))))) reason = `missing image asset ${image}`;
    else if (!credit) reason = 'missing visible image credit';
    if (reason) {
      await rm(directory, { recursive: true, force: true });
      removed.push({ slug: entry.name, reason });
    }
  }
  return removed;
}

function formatEditionDate(date) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00+08:00`));
}

function formatPht(value) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value)).replace(' at ', ', ') + ' PHT';
}

function briefCopy(value) {
  return String(value || '')
    .replace(/Today[’']s Morning Special/gi, 'FMB Brief')
    .replace(/Morning Special/gi, 'FMB Brief');
}

async function loadBriefs(distRoot) {
  const briefs = [];
  for (const file of await walkJson(briefContentRoot)) {
    const relative = path.relative(briefContentRoot, file);
    const raw = JSON.parse(await readFile(file, 'utf8'));
    const date = requiredString(raw.date, 'date', relative);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${relative}: date must use YYYY-MM-DD`);
    const publishedAt = validDate(raw.publishedAt, 'publishedAt', relative);
    const hero = raw.hero;
    if (!hero || typeof hero !== 'object') throw new Error(`${relative}: hero image is required`);
    const src = requiredString(hero.src, 'hero.src', relative);
    if (!src.startsWith('/assets/') || fallbackPattern.test(src)) throw new Error(`${relative}: FMB Brief requires a related editorial image, not generic fallback art`);
    if (!(await exists(path.join(distRoot, src.slice(1))))) throw new Error(`${relative}: hero image asset is missing: ${src}`);
    const sourceUrl = validHttpUrl(hero.sourceUrl, 'hero.sourceUrl', relative);
    const credit = requiredString(hero.credit, 'hero.credit', relative);
    const alt = requiredString(hero.alt, 'hero.alt', relative);
    const caption = requiredString(hero.caption, 'hero.caption', relative);
    if (!Array.isArray(raw.stories) || raw.stories.length === 0) throw new Error(`${relative}: at least one briefing item is required`);
    const stories = raw.stories.map((story, index) => {
      const prefix = `stories[${index}]`;
      if (!Array.isArray(story.body) || story.body.length === 0) throw new Error(`${relative}: ${prefix}.body is required`);
      if (!Array.isArray(story.sources) || story.sources.length === 0) throw new Error(`${relative}: ${prefix}.sources is required`);
      return {
        id: requiredString(story.id || `${date}-${index + 1}`, `${prefix}.id`, relative),
        kicker: requiredString(story.kicker, `${prefix}.kicker`, relative),
        headline: requiredString(story.headline, `${prefix}.headline`, relative),
        deck: requiredString(story.deck, `${prefix}.deck`, relative),
        body: story.body.map((paragraph, paragraphIndex) => requiredString(paragraph, `${prefix}.body[${paragraphIndex}]`, relative)),
        sources: story.sources.map((source, sourceIndex) => ({
          label: requiredString(source.label, `${prefix}.sources[${sourceIndex}].label`, relative),
          url: validHttpUrl(source.url, `${prefix}.sources[${sourceIndex}].url`, relative),
        })),
      };
    });
    briefs.push({
      date,
      publishedAt,
      title: briefCopy(requiredString(raw.title, 'title', relative)),
      deck: briefCopy(requiredString(raw.deck, 'deck', relative)),
      hero: { src, sourceUrl, credit, alt, caption, licenseUrl: hero.licenseUrl || null },
      stories,
    });
  }
  return briefs.sort((a, b) => b.date.localeCompare(a.date));
}

function brandLockup({ inverse = false, href = '/news/' } = {}) {
  return `<a class="fmb-wordmark-lockup${inverse ? ' is-inverse' : ''}" href="${href}" aria-label="FMB News, Filipino Media Bulletin"><span class="fmb-wordmark-main"><strong>FMB</strong><b>NEWS</b></span><span class="fmb-wordmark-sub">Filipino Media Bulletin</span></a>`;
}

function briefHead({ title, description, canonical, image }) {
  const imageUrl = image.startsWith('http') ? image : `${canonicalOrigin}${image}`;
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(imageUrl)}"><meta property="og:image:alt" content="${esc(description)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap"><link rel="stylesheet" href="${cleanStylesheet}"><link rel="stylesheet" href="${enhancementStylesheet}"></head>`;
}

function briefHeader() {
  return `<header class="fmbb-header"><div class="fmbb-shell">${brandLockup()}<nav aria-label="FMB Brief"><a href="/news/">News</a><a href="/news/brief/" aria-current="page">FMB Brief</a><a href="/news/about/">About</a></nav></div></header>`;
}

function briefFooter() {
  return `<footer class="fmbb-footer"><div class="fmbb-shell"><div>${brandLockup({ inverse: true })}<p>The news that matters. Made clear for Filipinos.</p></div><div><strong>FMB Brief</strong><p>A separate daily briefing from the FMB News Desk.</p></div><nav><a href="/news/">Latest news</a><a href="/news/brief/">Brief archive</a><a href="/news/about/#standards">Editorial standards</a></nav></div></footer>`;
}

function briefEditionPage(brief) {
  const canonical = `${canonicalOrigin}/news/brief/${brief.date}/`;
  const sourceLinks = (story) => story.sources.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`).join('');
  return `<!doctype html><html lang="en-PH">${briefHead({ title: `${brief.title} | FMB Brief`, description: brief.deck, canonical, image: brief.hero.src })}<body class="fmb-news-clean fmbb-page"><div class="fmbb-topline"><span>FMB Brief</span><span>Daily briefing · Philippines</span></div>${briefHeader()}<main><header class="fmbb-edition-hero"><div class="fmbb-shell fmbb-edition-grid"><div class="fmbb-edition-copy"><p class="fmbb-label">FMB Brief · ${esc(formatEditionDate(brief.date))}</p><h1>${esc(brief.title)}</h1><p class="fmbb-deck">${esc(brief.deck)}</p><div class="fmbb-meta"><span>By FMB News Desk</span><time datetime="${esc(brief.publishedAt)}">${esc(formatPht(brief.publishedAt))}</time></div></div><figure class="fmbb-hero-media"><img src="${esc(brief.hero.src)}" alt="${esc(brief.hero.alt)}" fetchpriority="high"><a class="fmbb-photo-credit" href="${esc(brief.hero.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(brief.hero.credit)}</a><figcaption>${esc(brief.hero.caption)}</figcaption></figure></div></header><section class="fmbb-rundown"><div class="fmbb-shell"><div class="fmbb-rundown-head"><p>Today at a glance</p><span>${brief.stories.length} essential reads</span></div><ol>${brief.stories.map((story, index) => `<li><a href="#brief-${index + 1}"><span>${String(index + 1).padStart(2, '0')}</span><strong>${esc(story.headline)}</strong></a></li>`).join('')}</ol></div></section><article class="fmbb-newsletter"><div class="fmbb-shell"><div class="fmbb-letter-intro"><span>FMB Brief</span><h2>What you need to know today</h2><p>One edition, separate from the individual news reports. Read the signal first, then go deeper where it matters.</p></div>${brief.stories.map((story, index) => `<section class="fmbb-story" id="brief-${index + 1}"><aside>${String(index + 1).padStart(2, '0')}</aside><div><p class="fmbb-story-kicker">${esc(story.kicker)}</p><h2>${esc(story.headline)}</h2><p class="fmbb-story-deck">${esc(story.deck)}</p>${story.body.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}<div class="fmbb-story-sources"><span>Sources</span>${sourceLinks(story)}</div></div></section>`).join('')}<div class="fmbb-endnote"><p>That’s the brief.</p><a href="/news/">Continue to FMB News</a></div></div></article></main>${briefFooter()}</body></html>`;
}

function briefArchivePage(briefs) {
  const latest = briefs[0];
  const canonical = `${canonicalOrigin}/news/brief/`;
  return `<!doctype html><html lang="en-PH">${briefHead({ title: 'FMB Brief | Daily Briefing by FMB News', description: 'One daily edition with the important developments, context, and signals worth knowing.', canonical, image: latest.hero.src })}<body class="fmb-news-clean fmbb-page fmbb-archive"><div class="fmbb-topline"><span>FMB Brief</span><span>Daily briefing · Philippines</span></div>${briefHeader()}<main><section class="fmbb-archive-hero"><div class="fmbb-shell"><div class="fmbb-archive-title"><p class="fmbb-label">The daily briefing from FMB News</p><h1>FMB Brief</h1><p>Everything important enough to carry into your day, edited into one distinct newsletter-style edition.</p></div><article class="fmbb-latest"><figure><img src="${esc(latest.hero.src)}" alt="${esc(latest.hero.alt)}"><a class="fmbb-photo-credit" href="${esc(latest.hero.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(latest.hero.credit)}</a></figure><div><p class="fmbb-label">Latest edition · ${esc(formatEditionDate(latest.date))}</p><h2>${esc(latest.title)}</h2><p>${esc(latest.deck)}</p><a class="fmbb-button" href="/news/brief/${latest.date}/">Read FMB Brief</a></div></article></div></section><section class="fmbb-archive-list"><div class="fmbb-shell"><div class="fmbb-section-title"><span>Archive</span><h2>Previous editions</h2></div>${briefs.slice(1).map((brief) => `<a class="fmbb-archive-row" href="/news/brief/${brief.date}/"><time datetime="${brief.date}">${esc(formatEditionDate(brief.date))}</time><strong>${esc(brief.title)}</strong><span>Read edition</span></a>`).join('')}</div></section></main>${briefFooter()}</body></html>`;
}

async function publishBriefs(distRoot, briefs) {
  const root = path.join(distRoot, 'news', 'brief');
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'index.html'), briefArchivePage(briefs), 'utf8');
  for (const brief of briefs) {
    const directory = path.join(root, brief.date);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), briefEditionPage(brief), 'utf8');
  }
}

function enhanceGeneratedNewsHtml(html) {
  let next = html;
  if (!next.includes('fmbnews-enhancement-v2.css')) {
    next = next.replace('</head>', `<link rel="stylesheet" href="${enhancementStylesheet}">\n</head>`);
  }
  next = next
    .replaceAll('href="/fmbnews/#reports"', 'href="/news/#reports"')
    .replaceAll('href="/fmbnews/about/', 'href="/news/about/')
    .replaceAll('href="/fmbnews/"', 'href="/news/"');

  next = next.replace(
    /<a class="fnc-brand" href="\/news\/" aria-label="FMB News home"><img[^>]*><\/a>/i,
    brandLockup(),
  );
  next = next.replace(
    /<span class="fnc-footer-logo-frame"><img[^>]*><\/span>/i,
    brandLockup({ inverse: true }),
  );
  if (!next.includes('href="/news/brief/"')) {
    next = next.replace(
      /(<a href="\/news\/#reports"[^>]*>Latest reports<\/a>)/i,
      '$1<a href="/news/brief/">FMB Brief</a>',
    );
  }
  return next;
}

function briefPromo(brief) {
  return `<section class="fmb-brief-promo" aria-labelledby="fmbBriefPromoTitle"><div class="fnc-shell fmb-brief-promo-grid"><div class="fmb-brief-promo-copy"><p class="fmb-brief-eyebrow">A separate daily edition</p><div class="fmb-brief-titleline"><span>FMB</span><strong>BRIEF</strong></div><p class="fmb-brief-date">${esc(formatEditionDate(brief.date))}</p><h2 id="fmbBriefPromoTitle">${esc(brief.title)}</h2><p>${esc(brief.deck)}</p><a href="/news/brief/${brief.date}/">Read today’s FMB Brief</a></div><figure><img src="${esc(brief.hero.src)}" alt="${esc(brief.hero.alt)}"><a class="fmbb-photo-credit" href="${esc(brief.hero.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(brief.hero.credit)}</a></figure></div></section>`;
}

async function enhanceNewsOutput(distRoot, latestBrief) {
  const newsRoot = path.join(distRoot, 'news');
  const htmlFiles = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(target);
    }
  }
  await walk(newsRoot);
  for (const file of htmlFiles) {
    let html = await readFile(file, 'utf8');
    html = enhanceGeneratedNewsHtml(html);
    if (file === path.join(newsRoot, 'index.html') && !html.includes('class="fmb-brief-promo"')) {
      html = html.replace('<section class="fnc-tools">', `${briefPromo(latestBrief)}<section class="fnc-tools">`);
    }
    await writeFile(file, html, 'utf8');
  }
}

function localDate(value) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}

function missingBriefDates(briefs, latestArticlePublishedAt) {
  if (!briefs.length || !latestArticlePublishedAt) return [];
  const set = new Set(briefs.map((brief) => brief.date));
  const first = briefs[briefs.length - 1].date;
  const last = localDate(latestArticlePublishedAt);
  const missing = [];
  for (let cursor = new Date(`${first}T12:00:00+08:00`); cursor <= new Date(`${last}T12:00:00+08:00`); cursor.setDate(cursor.getDate() + 1)) {
    const date = localDate(cursor.toISOString());
    if (!set.has(date)) missing.push(date);
  }
  return missing;
}

export async function publishFmbEditorial({ distRoot = path.join(appRoot, 'dist') } = {}) {
  const resolvedDist = path.resolve(distRoot);
  const gate = await prepareSafeArticleContent(resolvedDist);
  const safeSlugs = new Set(gate.safe.map((item) => item.slug));
  const withheldSlugs = new Set(gate.withheld.map((item) => item.slug));

  const newsResult = await publishNewsFeed({ distRoot: resolvedDist, contentRoot: gate.temporaryRoot });
  const removedLegacy = await sanitizeLegacyRoutes(resolvedDist, safeSlugs, withheldSlugs);
  const briefs = await loadBriefs(resolvedDist);
  if (!briefs.length) throw new Error('FMB Brief requires at least one validated edition');
  await publishBriefs(resolvedDist, briefs);
  await enhanceNewsOutput(resolvedDist, briefs[0]);

  const latestArticle = gate.safe
    .map((item) => item.publishedAt)
    .sort((a, b) => new Date(b) - new Date(a))[0] || null;
  const gaps = missingBriefDates(briefs, latestArticle);
  const audit = {
    generatedAt: new Date().toISOString(),
    rule: 'No FMB News article or FMB Brief is public without a valid date, a related editorial image, a visible credit, and a source link.',
    articles: {
      publishedStructured: gate.safe.length,
      withheldStructured: gate.withheld,
      removedLegacy,
      publisher: newsResult,
    },
    brief: {
      publicName: 'FMB Brief',
      legacyContentDirectory: 'content/news/morning-special',
      editionsPublished: briefs.map((brief) => brief.date),
      missingDailyEditionsThroughLatestArticleDate: gaps,
    },
    socialImageStandard: {
      minimumWidth: 1200,
      minimumHeight: 630,
      note: 'Editorial images remain photo-first and use explicit focal positioning. Social platforms may crop previews differently; future publishing should prefer dedicated 1200×630 crops when available.',
    },
  };
  await writeFile(path.join(resolvedDist, 'news', 'editorial-audit.json'), JSON.stringify(audit, null, 2), 'utf8');
  await rm(gate.temporaryRoot, { recursive: true, force: true });

  console.log(`FMB editorial upgrade: ${gate.safe.length} structured article(s) passed the related-image gate; ${gate.withheld.length} were withheld; ${removedLegacy.length} legacy route(s) were removed; ${briefs.length} FMB Brief edition(s) rendered.`);
  if (gaps.length) console.warn(`FMB Brief archive gap(s) through the latest article date: ${gaps.join(', ')}`);
  return { ...newsResult, safeCount: gate.safe.length, withheldCount: gate.withheld.length, removedLegacyCount: removedLegacy.length, briefCount: briefs.length, briefGaps: gaps };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await publishFmbEditorial();
}
