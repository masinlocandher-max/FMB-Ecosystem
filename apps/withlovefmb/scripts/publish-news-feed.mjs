import { access, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const appRoot = path.resolve(scriptDirectory, '..');
const defaultContentRoot = path.join(appRoot, 'content', 'news', 'articles');
const canonicalOrigin = 'https://www.francinemariebautista.com';
const fallbackImage = '/assets/images/news/fmb-news-editorial-fallback.svg';
const colorLogo = '/assets/images/news/fmb-news-primary-logo-2026.webp';
const whiteLogo = '/assets/images/news/fmb-news-white-transparent-2026.webp';
const stylesheet = '/assets/css/fmbnews-clean-v1.css?v=20260808-profile-v1';
const allowedCategories = new Set([
  'National',
  'World',
  'Business',
  'Technology',
  'Culture',
  'Environment',
  'Health',
  'Community',
  'Pageantry',
]);
const allowedArticleTypes = new Set(['NewsArticle', 'AnalysisNewsArticle', 'ReportageNewsArticle']);
const allowedImageKinds = new Set([
  'open-license-photo',
  'public-domain-photo',
  'publisher-supplied-photo',
  'editorial-fallback',
]);
const unsafeUsagePattern = /reference image only|publication rights not verified|rights not verified|permission not verified/i;

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

const attr = (html, name) => {
  const match = String(html ?? '').match(new RegExp(`\\b${name}=(['"])(.*?)\\1`, 'i'));
  return match?.[2] ?? '';
};

const meta = (html, key, value) => {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${key}=(['"])${value}\\1)[^>]*>`, 'i');
  const match = String(html ?? '').match(pattern);
  return match ? attr(match[0], 'content') : '';
};

function requiredString(value, label, file) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${file}: ${label} is required`);
  return value.trim();
}

function validDate(value, label, file) {
  const text = requiredString(value, label, file);
  if (Number.isNaN(new Date(text).getTime())) throw new Error(`${file}: ${label} is not a valid date`);
  return text;
}

function validHttpUrl(value, label, file, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  const text = requiredString(value, label, file);
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${file}: ${label} is not a valid URL`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`${file}: ${label} must use HTTP or HTTPS`);
  return url.href;
}

function validateArticle(raw, file) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`${file}: article must be a JSON object`);
  if (raw.schemaVersion !== 1) throw new Error(`${file}: schemaVersion must be 1`);
  if (raw.status !== 'published') throw new Error(`${file}: only status "published" belongs in the public feed`);

  const slug = requiredString(raw.slug, 'slug', file);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 90) {
    throw new Error(`${file}: slug must be lowercase hyphen-case and no longer than 90 characters`);
  }

  const category = requiredString(raw.category, 'category', file);
  if (!allowedCategories.has(category)) throw new Error(`${file}: unsupported category ${category}`);
  const articleType = requiredString(raw.articleType, 'articleType', file);
  if (!allowedArticleTypes.has(articleType)) throw new Error(`${file}: unsupported articleType ${articleType}`);

  if (!Array.isArray(raw.sections) || raw.sections.length === 0) throw new Error(`${file}: at least one section is required`);
  const sections = raw.sections.map((section, sectionIndex) => {
    const prefix = `sections[${sectionIndex}]`;
    const heading = requiredString(section?.heading, `${prefix}.heading`, file);
    if (!Array.isArray(section?.paragraphs) || section.paragraphs.length === 0) {
      throw new Error(`${file}: ${prefix}.paragraphs must not be empty`);
    }
    const paragraphs = section.paragraphs.map((paragraph, paragraphIndex) => (
      requiredString(paragraph, `${prefix}.paragraphs[${paragraphIndex}]`, file)
    ));
    return { heading, paragraphs };
  });

  const editorialLens = [
    ['what happened', (heading) => /^what happened\b/i.test(heading)],
    ['context', (heading) => /\b(?:context|background)\b/i.test(heading)],
    ['why this matters', (heading) => /^why (?:this )?matters\b/i.test(heading)],
    ['what comes next', (heading) => /^(?:what (?:happens|comes) next|what to watch next)\b/i.test(heading)],
  ];
  for (const [label, matches] of editorialLens) {
    if (!sections.some((section) => matches(section.heading))) {
      throw new Error(`${file}: FMB News editorial lens is missing ${label}`);
    }
  }

  if (!Array.isArray(raw.sources) || raw.sources.length === 0) throw new Error(`${file}: at least one source is required`);
  const sources = raw.sources.map((source, sourceIndex) => {
    const prefix = `sources[${sourceIndex}]`;
    return {
      publisher: requiredString(source?.publisher, `${prefix}.publisher`, file),
      title: requiredString(source?.title, `${prefix}.title`, file),
      publishedAt: validDate(source?.publishedAt, `${prefix}.publishedAt`, file),
      dateLabel: source?.dateLabel ? requiredString(source.dateLabel, `${prefix}.dateLabel`, file) : null,
      url: validHttpUrl(source?.url, `${prefix}.url`, file),
    };
  });

  if (raw.faq !== undefined && (!Array.isArray(raw.faq) || raw.faq.length === 0)) {
    throw new Error(`${file}: faq must be a non-empty array when provided`);
  }
  const faq = raw.faq === undefined ? [] : raw.faq.map((item, itemIndex) => {
    const prefix = `faq[${itemIndex}]`;
    return {
      question: requiredString(item?.question, `${prefix}.question`, file),
      answer: requiredString(item?.answer, `${prefix}.answer`, file),
    };
  });
  if (raw.keywords !== undefined && (!Array.isArray(raw.keywords) || raw.keywords.length === 0)) {
    throw new Error(`${file}: keywords must be a non-empty array when provided`);
  }
  const keywords = raw.keywords === undefined ? [] : raw.keywords.map((keyword, keywordIndex) => (
    requiredString(keyword, `keywords[${keywordIndex}]`, file)
  ));

  const image = raw.image;
  if (!image || typeof image !== 'object' || Array.isArray(image)) throw new Error(`${file}: image is required`);
  const imageKind = requiredString(image.kind, 'image.kind', file);
  if (!allowedImageKinds.has(imageKind)) throw new Error(`${file}: unsupported image.kind ${imageKind}`);
  const imageUrl = requiredString(image.url, 'image.url', file);
  const imageSourceUrl = validHttpUrl(image.sourceUrl, 'image.sourceUrl', file, { nullable: imageKind === 'editorial-fallback' });
  const usageStatus = requiredString(image.usageStatus, 'image.usageStatus', file);
  if (unsafeUsagePattern.test(usageStatus) && imageKind !== 'editorial-fallback') {
    throw new Error(`${file}: unverified image rights require editorial-fallback`);
  }
  if (imageKind === 'editorial-fallback' && imageUrl !== fallbackImage) {
    throw new Error(`${file}: editorial-fallback must use ${fallbackImage}`);
  }
  if (!imageUrl.startsWith('/') && !/^https?:\/\//i.test(imageUrl)) throw new Error(`${file}: image.url is invalid`);

  const audit = raw.audit && typeof raw.audit === 'object' && !Array.isArray(raw.audit) ? raw.audit : {};
  return {
    schemaVersion: 1,
    status: 'published',
    bulletinKey: requiredString(raw.bulletinKey, 'bulletinKey', file),
    emailSubject: requiredString(raw.emailSubject, 'emailSubject', file),
    slug,
    headline: requiredString(raw.headline, 'headline', file),
    seoTitle: raw.seoTitle ? requiredString(raw.seoTitle, 'seoTitle', file) : requiredString(raw.headline, 'headline', file),
    seoDescription: raw.seoDescription ? requiredString(raw.seoDescription, 'seoDescription', file) : requiredString(raw.deck, 'deck', file),
    keywords,
    category,
    kicker: requiredString(raw.kicker, 'kicker', file),
    deck: requiredString(raw.deck, 'deck', file),
    publishedAt: validDate(raw.publishedAt, 'publishedAt', file),
    updatedAt: validDate(raw.updatedAt, 'updatedAt', file),
    author: raw.author === 'FMB News Desk' ? raw.author : 'FMB News Desk',
    articleType,
    sections,
    faq,
    faqTitle: raw.faqTitle
      ? requiredString(raw.faqTitle, 'faqTitle', file)
      : 'Quick answers',
    sources,
    image: {
      kind: imageKind,
      url: imageUrl,
      sourceUrl: imageSourceUrl,
      creator: requiredString(image.creator, 'image.creator', file),
      license: requiredString(image.license, 'image.license', file),
      licenseUrl: validHttpUrl(image.licenseUrl, 'image.licenseUrl', file),
      usageStatus,
      credit: requiredString(image.credit, 'image.credit', file),
      caption: requiredString(image.caption, 'image.caption', file),
      alt: requiredString(image.alt, 'image.alt', file),
      width: Number.isInteger(image.width) && image.width > 0 ? image.width : 1440,
      height: Number.isInteger(image.height) && image.height > 0 ? image.height : 900,
      focusX: Number.isFinite(image.focusX) && image.focusX >= 0 && image.focusX <= 100 ? image.focusX : 50,
      focusY: Number.isFinite(image.focusY) && image.focusY >= 0 && image.focusY <= 100 ? image.focusY : 50,
    },
    audit: {
      sourceCheckedAt: validDate(audit.sourceCheckedAt, 'audit.sourceCheckedAt', file),
      photoReferenceUrl: audit.photoReferenceUrl === null || audit.photoReferenceUrl === undefined
        ? null
        : validHttpUrl(audit.photoReferenceUrl, 'audit.photoReferenceUrl', file),
      notes: Array.isArray(audit.notes) ? audit.notes.map(String) : [],
    },
    sourceFile: file,
  };
}

async function walkJson(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkJson(target));
      else if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files.sort();
}

async function loadArticles(contentRoot) {
  const articles = [];
  const slugs = new Map();
  for (const file of await walkJson(contentRoot)) {
    const raw = JSON.parse(await readFile(file, 'utf8'));
    const article = validateArticle(raw, path.relative(appRoot, file));
    if (slugs.has(article.slug)) throw new Error(`Duplicate slug ${article.slug} in ${slugs.get(article.slug)} and ${file}`);
    slugs.set(article.slug, file);
    articles.push(article);
  }
  return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt) || a.slug.localeCompare(b.slug));
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

function absoluteUrl(value) {
  return value.startsWith('http') ? value : `${canonicalOrigin}${value}`;
}

function categoryKey(category) {
  const value = String(category || '').toLowerCase();
  if (/pageant|culture|lifestyle|entertainment|life/.test(value)) return 'culture';
  if (/business|econom|finance|market/.test(value)) return 'business';
  if (/technology|tech|science/.test(value)) return 'technology';
  if (/environment|climate|weather/.test(value)) return 'environment';
  if (/health|medicine/.test(value)) return 'health';
  if (/world|international|global/.test(value)) return 'world';
  return 'national';
}

function readingTime(article) {
  const sectionWords = article.sections.flatMap((section) => section.paragraphs);
  const faqWords = article.faq.flatMap((item) => [item.question, item.answer]);
  const words = [...sectionWords, ...faqWords].join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 220));
}

function assertChronological(records, label = 'FMB News feed') {
  let previous = Number.POSITIVE_INFINITY;
  for (const record of records) {
    const published = Date.parse(record.publishedAt || '');
    if (!Number.isFinite(published)) throw new Error(`${label}: ${record.route} has an invalid publication date`);
    if (published > previous) throw new Error(`${label}: ${record.route} is out of newest-first order`);
    previous = published;
  }
}

function head({ title, description, canonical, image, imageWidth, imageHeight, imageAlt, type = 'website', publishedAt, updatedAt, schema }) {
  const imageUrl = absoluteUrl(image || colorLogo);
  const imageType = /\.jpe?g(?:$|\?)/i.test(imageUrl) ? 'image/jpeg' : /\.png(?:$|\?)/i.test(imageUrl) ? 'image/png' : /\.webp(?:$|\?)/i.test(imageUrl) ? 'image/webp' : null;
  const imageMeta = `${imageType ? `<meta property="og:image:type" content="${imageType}">` : ''}${imageWidth ? `<meta property="og:image:width" content="${esc(imageWidth)}">` : ''}${imageHeight ? `<meta property="og:image:height" content="${esc(imageHeight)}">` : ''}${imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}"><meta name="twitter:image:alt" content="${esc(imageAlt)}">` : ''}`;
  return `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="FMB News"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(imageUrl)}">${imageMeta}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}">${publishedAt ? `<meta property="article:published_time" content="${esc(publishedAt)}"><meta property="article:modified_time" content="${esc(updatedAt || publishedAt)}">` : ''}${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>` : ''}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap"><link rel="stylesheet" href="${stylesheet}"></head>`;
}

function shell(titles = [], active = 'latest') {
  const tickerTitles = titles.length ? titles.slice(0, 6) : ['FMB News · Evidence first · Context always'];
  const ticker = [...tickerTitles, ...tickerTitles].map((title) => `<span>${esc(title)}</span>`).join('');
  const links = [
    ['Latest reports', '/fmbnews/#reports', 'latest'],
    ['About FMB News', '/fmbnews/about/', 'about'],
    ['Editorial standards', '/fmbnews/about/#standards', 'standards'],
    ['Corrections', 'mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction', 'corrections'],
    ['Contact', 'mailto:withlovefmb@gmail.com?subject=FMB%20Newsroom%20Inquiry', 'contact'],
  ];
  const categoryLinks = [['all','All news'],['national','Nation'],['world','World'],['business','Business'],['technology','Technology'],['culture','Life and culture'],['environment','Environment'],['health','Health']];
  return `<a class="fnc-skip" href="#main">Skip to the newsroom</a><div class="fnc-livebar" aria-label="Moving headlines and Philippine time"><div class="fnc-live-label"><i aria-hidden="true"></i>Moving headlines</div><div class="fnc-ticker"><div class="fnc-ticker-track">${ticker}</div></div><div class="fnc-pht"><span>Philippine time</span><time data-pht-time>--:--:--</time></div></div><header class="fnc-header"><div class="fnc-shell fnc-header-row"><a class="fnc-brand" href="/news/" aria-label="FMB News home"><img src="${colorLogo}" width="1225" height="265" alt="FMB News, Filipino Media Bulletin"></a><nav class="fnc-nav" id="fncNav" aria-label="FMB News menu"><div class="fnc-nav-head"><div><span>FMB News</span><strong>News menu</strong></div><button class="fnc-nav-close" type="button" data-fnc-menu-close aria-label="Close FMB News menu"><i aria-hidden="true"></i></button></div><div class="fnc-nav-links">${links.map(([label, href, key]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</div><section class="fnc-nav-categories" aria-labelledby="fncDrawerCategories"><p id="fncDrawerCategories">News categories</p><div>${categoryLinks.map(([value,label])=>`<a href="/news/?section=${value}#reports">${label}</a>`).join('')}</div></section><div class="fnc-nav-meta"><span>Edition <strong>Philippines</strong></span><span>Standard <strong>Evidence first</strong></span></div></nav><div class="fnc-actions"><a class="fnc-submit" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit story</a><button class="fnc-menu" type="button" aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fncNav"><span></span></button></div></div></header><div class="fnc-nav-backdrop" data-fnc-menu-close aria-hidden="true"></div>`;
}

function foot() {
  return `<footer class="fnc-footer" id="editorial-standard"><div class="fnc-footer-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="fnc-signal" aria-hidden="true"></div><div class="fnc-shell fnc-footer-grid"><div class="fnc-footer-brand"><span class="fnc-footer-logo-frame"><img src="${whiteLogo}" width="1133" height="243" alt="FMB News, Filipino Media Bulletin"></span><p>The news that matters.<br>Made clear for Filipinos.</p></div><div class="fnc-footer-statement"><span>Filipino news explainer</span><h2>We gather the facts, explain the context, and show why the story matters.</h2><p>Credible evidence, visible sources, original writing, and clear Filipino relevance.</p></div><nav><a href="/fmbnews/">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbnews/about/#standards">Editorial standards</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">Send a correction</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20Newsroom%20Inquiry">Contact newsroom</a></nav></div><div class="fnc-shell fnc-footer-bottom"><span>© 2026 FMB News. All rights reserved.</span><a href="#top">Back to top</a></div></footer>`;
}

function runtime() {
  return `<script>(()=>{const b=document.body,m=document.querySelector('.fnc-menu'),n=document.querySelector('#fncNav'),mq=matchMedia('(max-width:1080px)');const set=o=>{if(!m||!n)return;const v=!!(o&&mq.matches);b.classList.toggle('fnc-menu-open',v);b.classList.toggle('fnc-scroll-lock',v);m.setAttribute('aria-expanded',String(v));m.setAttribute('aria-label',v?'Close FMB News menu':'Open FMB News menu');n.setAttribute('aria-hidden',String(mq.matches&&!v));if(v)requestAnimationFrame(()=>n.querySelector('a,button')?.focus())};m?.addEventListener('click',()=>set(!b.classList.contains('fnc-menu-open')));document.querySelectorAll('[data-fnc-menu-close]').forEach(x=>x.addEventListener('click',()=>{set(false);m?.focus()}));n?.querySelectorAll('a').forEach(x=>x.addEventListener('click',()=>set(false)));document.addEventListener('keydown',e=>{if(e.key==='Escape'){set(false);m?.focus()}});mq.addEventListener?.('change',()=>set(false));set(false);const q=document.querySelector('[data-fnc-search]'),cards=[...document.querySelectorAll('[data-fnc-card]')],buttons=[...document.querySelectorAll('[data-fnc-filter]')];let active=new URLSearchParams(location.search).get('section')||'all';const apply=()=>{const t=(q?.value||'').toLowerCase();cards.forEach(c=>c.hidden=!((active==='all'||c.dataset.category===active)&&(!t||(c.textContent||'').toLowerCase().includes(t))));buttons.forEach(x=>{const on=x.dataset.fncFilter===active;x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',String(on))})};buttons.forEach(x=>x.onclick=e=>{e.preventDefault();active=x.dataset.fncFilter;apply()});q?.addEventListener('input',apply);apply();const clock=document.querySelector('[data-pht-time]');const tick=()=>{if(clock)clock.textContent=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date())};tick();setInterval(tick,1000)})();</script>`;
}

function articleRecord(article) {
  return {
    route: `/news/${article.slug}/`,
    title: article.headline,
    kicker: article.kicker,
    description: article.deck,
    image: article.image.url,
    alt: article.image.alt,
    credit: article.image.credit,
    focusX: article.image.focusX,
    focusY: article.image.focusY,
    publishedAt: article.publishedAt,
    published: formatPht(article.publishedAt),
    category: categoryKey(article.category),
    structured: true,
  };
}

function normalizeEditorialImage(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let normalized = raw;
  try {
    const parsed = new URL(raw, canonicalOrigin);
    if (parsed.origin !== canonicalOrigin) return raw;
    normalized = parsed.pathname + parsed.search;
  } catch {
    return '';
  }
  if (!normalized.startsWith('/assets/')) return '';
  if (/(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i.test(normalized)) return '';
  return normalized;
}

function firstEditorialImage(html) {
  const candidates = [
    meta(html, 'property', 'og:image'),
    ...[...String(html || '').matchAll(/<img\b[^>]*>/gi)].map((match) => attr(match[0], 'src')),
  ];
  for (const candidate of candidates) {
    const normalized = normalizeEditorialImage(candidate);
    if (normalized) return normalized;
  }
  return '';
}

function isPublishableEditorialImage(article) {
  if (!article.image.url.startsWith('/assets/')) return false;
  if (article.image.kind === 'editorial-fallback') return article.image.url === fallbackImage;
  return !/(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i.test(article.image.url);
}

async function legacyRecords(newsRoot, excludedSlugs) {
  const records = [];
  let entries = [];
  try {
    entries = await readdir(newsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || excludedSlugs.has(entry.name) || entry.name === 'about') continue;
    const file = path.join(newsRoot, entry.name, 'index.html');
    let html;
    try {
      html = await readFile(file, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    if (/http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html)) continue;
    const publishedAt = meta(html, 'property', 'article:published_time')
      || html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1]
      || html.match(/"dateCreated"\s*:\s*"([^"]+)"/i)?.[1]
      || meta(html, 'property', 'article:modified_time')
      || html.match(/\bdatetime=(['"])(\d{4}-\d{2}-\d{2}T[^'"]+)\1/i)?.[2]
      || '';
    if (!publishedAt || Number.isNaN(new Date(publishedAt).getTime())) continue;
    const headline = stripTags(meta(html, 'property', 'og:title') || html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
      .replace(/\s*[|·-]\s*FMB News.*$/i, '')
      .trim();
    if (!headline) continue;
    const description = meta(html, 'name', 'description')
      || stripTags(html.match(/<p\b[^>]*class=(['"])[^'"]*\bnc-article-deck\b[^'"]*\1[^>]*>([\s\S]*?)<\/p>/i)?.[2] || '')
      || 'Read the complete FMB News report.';
    const image = firstEditorialImage(html);
    if (!image || !image.startsWith('/assets/')) continue;
    try {
      await access(path.join(path.dirname(newsRoot), image.split('?')[0].slice(1)));
    } catch {
      continue;
    }
    const section = meta(html, 'property', 'article:section') || 'FMB News';
    const kicker = stripTags(html.match(/<p\b[^>]*class=(['"])[^'"]*\bnc-kicker\b[^'"]*\1[^>]*>([\s\S]*?)<\/p>/i)?.[2] || section);
    const credit = stripTags(html.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || 'FMB News');
    records.push({
      route: `/news/${entry.name}/`,
      title: headline,
      kicker,
      description,
      image,
      alt: headline,
      credit,
      publishedAt,
      published: formatPht(publishedAt),
      category: categoryKey(section),
      structured: false,
    });
  }
  return records;
}

async function migrateLegacyNewsLinks(newsRoot, excludedSlugs) {
  let entries = [];
  try {
    entries = await readdir(newsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || excludedSlugs.has(entry.name)) continue;
    const file = path.join(newsRoot, entry.name, 'index.html');
    let html;
    try {
      html = await readFile(file, 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }
    const migrated = html
      .replaceAll('href="/fmbnews/', 'href="/news/')
      .replaceAll("href='/fmbnews/", "href='/news/");
    if (migrated !== html) await writeFile(file, migrated, 'utf8');
  }
}

function card(record) {
  return `<article class="fnc-card" data-fnc-card data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}" style="--fmb-focus-x:${esc(record.focusX ?? 50)}%;--fmb-focus-y:${esc(record.focusY ?? 50)}%"><a href="${record.route}"><figure><img src="${esc(record.image)}" onerror="this.closest('article')?.remove()" loading="lazy" decoding="async" alt="${esc(record.alt)}"><figcaption class="fnc-credit">${esc(record.credit)}</figcaption></figure><div class="fnc-card-copy"><p class="fnc-meta">${esc(record.kicker)}</p><h3>${esc(record.title)}</h3><small><time datetime="${esc(record.publishedAt)}">${esc(record.published)}</time></small></div></a></article>`;
}

function landingPage(records) {
  const lead = records[0];
  if (!lead) throw new Error('FMB News feed requires at least one published or legacy article');
  const visible = records.slice(1, 13);
  const archive = records.slice(13);
  const filters = [
    ['all', 'All'],
    ['national', 'Nation'],
    ['world', 'World'],
    ['business', 'Business'],
    ['technology', 'Tech'],
    ['culture', 'Life'],
    ['environment', 'Environment'],
    ['health', 'Health'],
  ];
  return `<!doctype html><html lang="en-PH">${head({ title: 'FMB News | Today’s Headlines for the Filipino', description: 'Credible reports, clear context, and the information Filipinos need to understand why each development matters.', canonical: `${canonicalOrigin}/news/`, image: lead.image })}<body id="top" class="fmb-news-clean fmb-news-landing">${shell(records.map((record) => record.title))}<main id="main"><span id="rundown" hidden></span><span id="latest-reports" hidden></span><span id="philippines" hidden></span><span id="world" hidden></span><span id="culture" hidden></span><section class="fnc-hero"><div class="fnc-signal fnc-signal-hero" aria-hidden="true"></div><div class="fnc-shell"><p class="fnc-kicker">Today’s headlines for the Filipino</p><article class="fnc-lead" data-fnc-card data-category="${esc(lead.category)}" data-published-at="${esc(lead.publishedAt)}" style="--fmb-focus-x:${esc(lead.focusX ?? 50)}%;--fmb-focus-y:${esc(lead.focusY ?? 50)}%"><figure class="fnc-lead-media"><img src="${esc(lead.image)}" onerror="this.closest('article')?.remove()" alt="${esc(lead.alt)}"><figcaption class="fnc-credit">${esc(lead.credit)}</figcaption></figure><div class="fnc-lead-copy"><span class="fnc-top-story">Top story</span><p class="fnc-kicker">${esc(lead.kicker)}</p><h1>${esc(lead.title)}</h1><p>${esc(lead.description)}</p><div class="fnc-lead-meta"><small><time datetime="${esc(lead.publishedAt)}">${esc(lead.published)}</time></small><a class="fnc-read" href="${lead.route}">Read full report</a></div></div></article></div></section><section class="fnc-tools"><div class="fnc-shell fnc-tools-row"><input class="fnc-search" data-fnc-search type="search" placeholder="Search reports, people, places, or topics" aria-label="Search FMB News reports"><div class="fnc-categories">${filters.map(([value, label]) => `<a class="fnc-category" href="#reports" data-fnc-filter="${value}">${label}</a>`).join('')}</div></div></section><section class="fnc-content" id="reports"><div class="fnc-shell"><div class="fnc-section-head"><div><i aria-hidden="true"></i><div><p class="fnc-kicker">Newsroom</p><h2>Latest news</h2></div></div><p data-news-updated="${esc(lead.publishedAt)}"><strong>Newest first</strong><span>${records.length} reports accessible</span></p></div><div class="fnc-grid">${visible.map(card).join('')}</div>${archive.length ? `<details class="fnc-archive"><summary>View ${archive.length} more reports</summary><div class="fnc-archive-list">${archive.map((record) => `<a href="${record.route}" data-category="${esc(record.category)}" data-published-at="${esc(record.publishedAt)}"><span>${esc(record.kicker)}</span><strong>${esc(record.title)}</strong><time datetime="${esc(record.publishedAt)}">${esc(record.published)}</time></a>`).join('')}</div></details>` : ''}</div></section></main>${foot()}${runtime()}</body></html>`;
}

function articlePage(article, tickerTitles) {
  const route = `/news/${article.slug}/`;
  const canonical = `${canonicalOrigin}${route}`;
  const imageUrl = absoluteUrl(article.image.url);
  const articleSchema = {
    '@type': article.articleType,
    '@id': `${canonical}#article`,
    headline: article.headline,
    description: article.deck,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: 'en-PH',
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: 'FMB News Desk' },
    publisher: { '@type': 'Organization', name: 'FMB News', url: `${canonicalOrigin}/news/` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: article.category,
    keywords: article.keywords,
    image: [{
      '@type': 'ImageObject',
      contentUrl: imageUrl,
      creditText: article.image.credit,
      creator: article.image.creator,
      license: article.image.licenseUrl,
      acquireLicensePage: article.image.sourceUrl,
      width: article.image.width,
      height: article.image.height,
    }],
    citation: article.sources.map((source) => source.url),
  };
  const schema = article.faq.length ? {
    '@context': 'https://schema.org',
    '@graph': [
      articleSchema,
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: article.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  } : { '@context': 'https://schema.org', ...articleSchema };
  const sourceLinks = article.sources.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.publisher)}</strong>: ${esc(source.title)} <span>(${esc(source.dateLabel || formatPht(source.publishedAt))})</span></a>`).join('');
  const lensLabel = (heading) => {
    if (/^what happened\b/i.test(heading)) return 'Verified facts';
    if (/\b(?:context|background)\b/i.test(heading)) return 'Context';
    if (/^why (?:this )?matters\b/i.test(heading)) return 'Filipino relevance';
    if (/^(?:what (?:happens|comes) next|what to watch next)\b/i.test(heading)) return 'What to watch next';
    return '';
  };
  const sections = article.sections.map((section) => {
    const label = lensLabel(section.heading);
    return `<section${label ? ` class="nc-editorial-lens-section" data-fmb-lens="${esc(label)}"` : ''}>${label ? `<p class="nc-editorial-lens-label">${esc(label)}</p>` : ''}<h2>${esc(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}</section>`;
  }).join('');
  const faq = article.faq.length ? `<section class="nc-faq" aria-labelledby="nc-faq-title"><p class="nc-editorial-lens-label">Quick answers</p><h2 id="nc-faq-title">${esc(article.faqTitle)}</h2><div class="nc-faq-list">${article.faq.map((item) => `<article class="nc-faq-item"><h3>${esc(item.question)}</h3><p>${esc(item.answer)}</p></article>`).join('')}</div></section>` : '';
  const photoSourceLink = article.image.sourceUrl
    ? `<a href="${esc(article.image.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(article.image.credit)}</a>`
    : `<span>${esc(article.image.credit)}</span>`;
  const photoLicenseLink = `<a href="${esc(article.image.licenseUrl)}" target="_blank" rel="license noopener noreferrer">License details</a>`;
  return `<!doctype html><html lang="en-PH">${head({ title: `${article.seoTitle} | FMB News`, description: article.seoDescription, canonical, image: article.image.url, imageWidth: article.image.width, imageHeight: article.image.height, imageAlt: article.image.alt, type: 'article', publishedAt: article.publishedAt, updatedAt: article.updatedAt, schema })}<body id="top" class="fmb-news-clean fmb-news-article news-story-route">${shell(tickerTitles)}<main id="main"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/fmbnews/">Back to headlines</a><span>${esc(formatPht(article.publishedAt))}</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="fnc-kicker">${esc(article.kicker)}</p><h1>${esc(article.headline)}</h1><p class="nc-article-deck">${esc(article.deck)}</p><div class="nc-article-meta"><span>By FMB News Desk</span><span>Published ${esc(formatPht(article.publishedAt))}</span><span>${readingTime(article)} min read</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure style="--fmb-focus-x:${esc(article.image.focusX)}%;--fmb-focus-y:${esc(article.image.focusY)}%"><img src="${esc(article.image.url)}" onerror="this.closest('figure')?.remove()" width="${esc(article.image.width)}" height="${esc(article.image.height)}" alt="${esc(article.image.alt)}" fetchpriority="high" decoding="async"><span class="fmb-photo-credit">${photoSourceLink}</span><figcaption><span>${esc(article.image.caption)}</span><span class="nc-photo-attribution">${photoSourceLink}<span aria-hidden="true"> · </span>${photoLicenseLink}</span></figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Editorial standard:</strong> Sources are listed below. Verified reporting, attributed claims, uncertainty, and analysis remain distinct.</p></div>${sections}${faq}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div></div></article></main>${foot()}${runtime()}</body></html>`;
}

function redirectPage(destination) {
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="FMB News canonical route redirect."><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${destination}"><link rel="canonical" href="${canonicalOrigin}${destination}"><title>FMB News</title></head><body><span id="top" hidden></span><span id="reports" hidden></span><span id="latest-reports" hidden></span><span id="rundown" hidden></span><p>Continue to <a href="${destination}">${destination}</a>.</p></body></html>`;
}

async function updateSitemap(distRoot, articles, withheldArticles = []) {
  const sitemapPath = path.join(distRoot, 'sitemap.xml');
  let sitemap;
  try {
    sitemap = await readFile(sitemapPath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n';
  }
  const withheldUrls = new Set(withheldArticles.map((article) => `${canonicalOrigin}/news/${article.slug}/`));
  sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => (
    [...withheldUrls].some((url) => block.includes(`<loc>${url}</loc>`)) ? '' : block
  ));
  for (const article of articles) {
    const url = `${canonicalOrigin}/news/${article.slug}/`;
    if (sitemap.includes(`<loc>${url}</loc>`)) continue;
    const date = article.updatedAt.slice(0, 10);
    const entry = `  <url><loc>${url}</loc><lastmod>${date}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
  }
  await writeFile(sitemapPath, sitemap, 'utf8');
}

async function verifyOutput(distRoot, articles, landing) {
  for (const article of articles) {
    const file = path.join(distRoot, 'news', article.slug, 'index.html');
    const html = await readFile(file, 'utf8');
    const route = `/news/${article.slug}/`;
    for (const marker of [article.headline, route, article.image.url, article.image.sourceUrl, article.image.licenseUrl, article.image.credit, 'FMB News Desk', 'Sources and public record'].filter(Boolean)) {
      if (!html.includes(marker)) throw new Error(`${route} is missing ${marker}`);
    }
    if (!landing.includes(`href="${route}"`)) throw new Error(`News landing is missing ${route}`);
    if (!article.image.url.startsWith('/assets/')) throw new Error(`${route} must use a locally hosted image asset`);
    await access(path.join(distRoot, article.image.url.slice(1)));
    if (unsafeUsagePattern.test(article.image.usageStatus) && article.image.url !== fallbackImage) {
      throw new Error(`${route} renders an image without verified publication rights`);
    }
  }
  for (const anchor of ['top', 'rundown', 'philippines', 'world', 'culture', 'editorial-standard']) {
    if (!landing.includes(`id="${anchor}"`)) throw new Error(`News landing is missing compatibility anchor ${anchor}`);
  }
}

export async function publishNewsFeed({ distRoot = path.join(appRoot, 'dist'), contentRoot = defaultContentRoot } = {}) {
  const resolvedDist = path.resolve(distRoot);
  const resolvedContent = path.resolve(contentRoot);
  const newsRoot = path.join(resolvedDist, 'news');
  const fmbNewsRoot = path.join(resolvedDist, 'fmbnews');
  await mkdir(newsRoot, { recursive: true });

  const loadedArticles = await loadArticles(resolvedContent);
  const articles = loadedArticles.filter(isPublishableEditorialImage);
  const withheldArticles = loadedArticles.filter((article) => !isPublishableEditorialImage(article));
  const structuredSlugs = new Set(loadedArticles.map((article) => article.slug));
  for (const article of withheldArticles) {
    await rm(path.join(newsRoot, article.slug), { recursive: true, force: true });
  }
  await migrateLegacyNewsLinks(newsRoot, structuredSlugs);
  const legacy = await legacyRecords(newsRoot, structuredSlugs);
  const records = [...articles.map(articleRecord), ...legacy]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt) || a.title.localeCompare(b.title));
  const uniqueRecords = [...new Map(records.map((record) => [record.route, record])).values()];
  assertChronological(uniqueRecords);

  const tickerTitles = uniqueRecords.map((record) => record.title);
  for (const article of articles) {
    const directory = path.join(newsRoot, article.slug);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), articlePage(article, tickerTitles), 'utf8');
  }

  const landing = landingPage(uniqueRecords);
  await writeFile(path.join(newsRoot, 'index.html'), landing, 'utf8');
  await mkdir(fmbNewsRoot, { recursive: true });
  await writeFile(path.join(fmbNewsRoot, 'index.html'), redirectPage('/news/'), 'utf8');
  await mkdir(path.join(fmbNewsRoot, 'about'), { recursive: true });
  await writeFile(path.join(fmbNewsRoot, 'about', 'index.html'), redirectPage('/news/about/'), 'utf8');
  await updateSitemap(resolvedDist, articles, withheldArticles);
  await verifyOutput(resolvedDist, articles, landing);

  console.log(`FMB News publisher rendered ${articles.length} image-backed structured article(s), withheld ${withheldArticles.length} report(s) without a real attached image, retained ${legacy.length} image-backed legacy report(s), and exposed ${uniqueRecords.length} independent story route(s).`);
  return { articleCount: articles.length, withheldCount: withheldArticles.length, legacyCount: legacy.length, totalCount: uniqueRecords.length };
}

function cliValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await publishNewsFeed({
    distRoot: cliValue('--dist') || path.join(appRoot, 'dist'),
    contentRoot: cliValue('--content') || defaultContentRoot,
  });
}
