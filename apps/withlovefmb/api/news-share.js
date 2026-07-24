const SITE = 'https://www.francinemariebautista.com';
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const RASTER_PATTERN = /\.(?:avif|jpe?g|png|webp)(?:[?#].*)?$/i;
const NAMED_ENTITIES = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>'
};

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

export const config = {
  runtime: 'edge'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function codePoint(raw, radix) {
  const value = Number.parseInt(raw, radix);
  if (!Number.isInteger(value) || value < 0 || value > 0x10FFFF) return '';
  return String.fromCodePoint(value);
}

function decodeHtml(value = '') {
  let decoded = String(value);

  for (let pass = 0; pass < 4; pass += 1) {
    const next = decoded
      .replace(/&#x([0-9a-f]+);/gi, (_, raw) => codePoint(raw, 16))
      .replace(/&#(\d+);/g, (_, raw) => codePoint(raw, 10))
      .replace(/&(amp|quot|apos|lt|gt);/gi, (_, name) => NAMED_ENTITIES[name.toLowerCase()]);

    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
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
    if (match) return decodeHtml(match[1]);
  }

  return '';
}

function canonical(html, slug) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return match?.[1] ? decodeHtml(match[1]) : `${SITE}/news/${slug}/`;
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

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler(request) {
  let requestUrl;

  try {
    requestUrl = new URL(request.url);
  } catch {
    return textResponse('Invalid request URL', 400);
  }

  const slug = String(requestUrl.searchParams.get('slug') || '').trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return textResponse('Invalid article', 400);

  const articleFetchUrl = new URL(`/news/${slug}/`, requestUrl.origin);
  let articleResponse;

  try {
    articleResponse = await fetch(articleFetchUrl, {
      redirect: 'follow',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'FMB-News-Share/1.0'
      }
    });
  } catch {
    return textResponse('Article could not be loaded', 502);
  }

  if (!articleResponse.ok) return textResponse('Article not found', articleResponse.status === 404 ? 404 : 502);

  const article = await articleResponse.text();
  const articleUrl = canonical(article, slug);
  const htmlTitle = decodeHtml(article.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
  const title = meta(article, 'og:title') || htmlTitle || 'FMB&CO. News';
  const description = meta(article, 'og:description') || meta(article, 'description') || 'Read the latest report from FMB&CO. News.';
  const declaredImage = meta(article, 'og:image');
  const image = absoluteUrl(RASTER_PATTERN.test(declaredImage) ? declaredImage : FALLBACK_IMAGES[slug]);
  const width = meta(article, 'og:image:width') || (slug === 'ai-water-consumption-responsible-ai-philippines' ? '923' : '1200');
  const height = meta(article, 'og:image:height') || (slug === 'ai-water-consumption-responsible-ai-philippines' ? '1353' : '630');
  const alt = meta(article, 'og:image:alt') || title;
  const shareUrl = `${SITE}/api/news-share?slug=${encodeURIComponent(slug)}`;

  if (!image || !RASTER_PATTERN.test(image)) return textResponse('Article sharing image is missing', 422);

  const safeArticle = escapeHtml(articleUrl);
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="noindex,follow,max-image-preview:large"><link rel="canonical" href="${safeArticle}"><meta property="og:type" content="article"><meta property="og:site_name" content="FMB&amp;CO. News"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(shareUrl)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:secure_url" content="${escapeHtml(image)}"><meta property="og:image:type" content="${imageMime(image)}"><meta property="og:image:width" content="${escapeHtml(width)}"><meta property="og:image:height" content="${escapeHtml(height)}"><meta property="og:image:alt" content="${escapeHtml(alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}"><meta http-equiv="refresh" content="0;url=${safeArticle}"></head><body><p>Opening the FMB&amp;CO. News article. <a href="${safeArticle}">Continue to the article</a></p><script>location.replace(${JSON.stringify(articleUrl)});</script></body></html>`;

  return new Response(page, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
