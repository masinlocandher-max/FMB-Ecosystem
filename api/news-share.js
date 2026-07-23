const fs = require('node:fs');
const path = require('node:path');

const SITE = 'https://www.francinemariebautista.com';
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const RASTER_PATTERN = /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i;

const FALLBACK_IMAGES = {
  'ai-water-consumption-responsible-ai-philippines': '/assets/images/fmbandco/francine-founder-hero-923.webp',
  'subic-aeta-landfill': '/assets/images/news/subic-aeta-dumpsite-iwitness.jpg',
  'pax-silica-water': '/assets/images/news/new-clark-city-pax-silica-pia.jpg',
  'binibining-pilipinas-2026': '/assets/images/news/binibining-pilipinas-2026-winners.jpg',
  'china-ai-monkey-video': '/assets/images/news/china-ai-propaganda-editorial.webp',
  impeachment: '/assets/images/news/sara-duterte-impeachment.webp',
  'pax-silica': '/assets/images/news/pax-silica-briefing.png',
  'cleopatra-barrera': '/assets/images/news/cleopatra-barrera-zambales-ocean-feature.jpeg',
  'good-news': '/assets/images/news/good-news-briefing.png'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function meta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function canonical(html, slug) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match?.[1] || `${SITE}/news/${slug}/`;
}

function locateArticle(slug) {
  const candidates = [
    path.join(process.cwd(), 'news', slug, 'index.html'),
    path.join(process.cwd(), 'apps', 'withlovefmb', 'news', slug, 'index.html'),
    path.join(__dirname, '..', 'news', slug, 'index.html'),
    path.join(__dirname, '..', 'apps', 'withlovefmb', 'news', slug, 'index.html')
  ];
  return candidates.find(candidate => fs.existsSync(candidate));
}

function absoluteUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith('/') ? value : `/${value}`, SITE).href;
}

function imageMime(imageUrl) {
  const clean = imageUrl.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith('.png')) return 'image/png';
  if (clean.endsWith('.webp')) return 'image/webp';
  if (clean.endsWith('.avif')) return 'image/avif';
  return 'image/jpeg';
}

function requestSlug(req) {
  const requestUrl = new URL(req.url || '/', SITE);
  return String(requestUrl.searchParams.get('slug') || '').trim().toLowerCase();
}

module.exports = function handler(req, res) {
  let slug;

  try {
    slug = requestSlug(req);
  } catch {
    res.statusCode = 400;
    res.end('Invalid request URL');
    return;
  }

  if (!SLUG_PATTERN.test(slug)) {
    res.statusCode = 400;
    res.end('Invalid article');
    return;
  }

  const articlePath = locateArticle(slug);
  if (!articlePath) {
    res.statusCode = 404;
    res.end('Article not found');
    return;
  }

  const article = fs.readFileSync(articlePath, 'utf8');
  const articleUrl = canonical(article, slug);
  const title = meta(article, 'og:title') || article.match(/<title>([^<]+)<\/title>/i)?.[1] || 'FMB&CO. News';
  const description = meta(article, 'og:description') || meta(article, 'description') || 'Read the latest report from FMB&CO. News.';
  const declaredImage = meta(article, 'og:image');
  const image = absoluteUrl(RASTER_PATTERN.test(declaredImage) ? declaredImage : FALLBACK_IMAGES[slug]);
  const width = meta(article, 'og:image:width') || (slug === 'ai-water-consumption-responsible-ai-philippines' ? '923' : '1200');
  const height = meta(article, 'og:image:height') || (slug === 'ai-water-consumption-responsible-ai-philippines' ? '1353' : '630');
  const alt = meta(article, 'og:image:alt') || title;
  const shareUrl = `${SITE}/api/news-share?slug=${encodeURIComponent(slug)}`;

  if (!image || !RASTER_PATTERN.test(image)) {
    res.statusCode = 422;
    res.end('Article sharing image is missing');
    return;
  }

  const safeArticle = escapeHtml(articleUrl);
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="noindex,follow,max-image-preview:large"><link rel="canonical" href="${safeArticle}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB&amp;CO. News"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(shareUrl)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:secure_url" content="${escapeHtml(image)}"><meta property="og:image:type" content="${imageMime(image)}"><meta property="og:image:width" content="${escapeHtml(width)}"><meta property="og:image:height" content="${escapeHtml(height)}"><meta property="og:image:alt" content="${escapeHtml(alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"><meta http-equiv="refresh" content="0;url=${safeArticle}"></head><body><p>Opening the FMB&amp;CO. News article. <a href="${safeArticle}">Continue to the article</a></p><script>location.replace(${JSON.stringify(articleUrl)});</script></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(page);
};
