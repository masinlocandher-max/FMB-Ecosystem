const ALLOWED_HOSTS = new Set([
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'www.pna.gov.ph',
  'pna.gov.ph',
  'mirror.pco.gov.ph',
  'pco.gov.ph',
  'dict.gov.ph',
  'nicp.org.ph',
  'asean.org',
  'culturalcenter.gov.ph',
  'www.culturalcenter.gov.ph',
  'www.missusa.com',
  'missusa.com',
  'www.ssonetwork.com',
  'ssonetwork.com',
  'images.unsplash.com',
  'res.cloudinary.com'
]);

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase();
  if (ALLOWED_HOSTS.has(host)) return true;
  return host.endsWith('.gov.ph') || host.endsWith('.wikimedia.org');
}

export default async function handler(req, res) {
  const raw = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;
  if (!raw) return res.status(400).send('Missing image URL');

  let source;
  try {
    source = new URL(raw);
  } catch {
    return res.status(400).send('Invalid image URL');
  }

  if (source.protocol !== 'https:' || !isAllowedHost(source.hostname)) {
    return res.status(403).send('Image host not allowed');
  }

  try {
    const upstream = await fetch(source.toString(), {
      redirect: 'follow',
      headers: {
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
        'user-agent': 'FMBNews/2.0 (+https://www.francinemariebautista.com/news/)'
      }
    });

    if (!upstream.ok) return res.status(upstream.status).send('Image unavailable');
    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) return res.status(415).send('Not an image');

    const bytes = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(bytes);
  } catch {
    return res.status(502).send('Image fetch failed');
  }
}
