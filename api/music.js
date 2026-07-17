const { Readable } = require('node:stream');

const ALLOWED_FILE_IDS = new Set([
  '1gK-xvPeBnOCFk5ePG2inE8SiBSpndAD_',
  '1POQ-A-CWR_9uuV9rBnxeFZ1BxveqBeA7',
  '1VccOKflFGIMb1R0EF-5NCa-sgx3wmoz4',
  '12NvmUFL9xiQbKEyZ9QI2AxrPd8VYCka4',
  '1LbtikCtPSGQ11iQcfYYN79c_17BG7nGt',
  '148_1Bn6xuKTnYdgC5og8N_mkKWVv7XBq',
  '1rHuyF5GJDN67T4ewSbnbl6zUVkziidID',
  '13zTn1gsrCqdfvXPI0AC32Gxr4qM_RuMJ',
  '1fK_fgRf7G-DIWdRGkYtSdc3BFExCylEC',
  '1eHYnaF8NZ0ljmeCxXuP-AyHpv3MPH54i',
  '1obAaajazwa7lRg4dS3rmXDynuI0mAHgB',
  '1cJoC-Y8OljUskunADFZmlPkZN3Pp0VWV',
  '1cnwni7TIHPWTwqyXGF4n_-PZPHv1XSY1',
  '19PFWsk0AaAQjr73WPyUrl6cqgi5zHlxm',
  '1LEpsQYBcCsjh2hvWj-SebQHBNCEuzwGt',
  '1b7d0vlZgkOvIqoYcGaJSR2FHcJPZP5n1',
  '1YzfYQfGBq8WcDrZrBohAkQxUkxypwDQu',
  '1M2PBROlbdP6_TGA6AsxtmQqO8fDVEokp',
  '17DLinCFHRMdRMTQOQtaigHh2CV3jB-Aw'
]);

const decodeHtml = value => String(value || '')
  .replace(/&amp;/gi, '&')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const getAttribute = (tag, name) => {
  const quoted = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  if (quoted) return decodeHtml(quoted[2]);
  const bare = tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, 'i'));
  return bare ? decodeHtml(bare[1]) : '';
};

function extractConfirmationUrl(html, currentUrl) {
  const forms = String(html || '').match(/<form\b[^>]*>/gi) || [];
  const formTag = forms.find(tag => {
    const id = getAttribute(tag, 'id');
    const action = getAttribute(tag, 'action');
    return id === 'download-form' || /drive\.usercontent\.google\.com\/download/i.test(action);
  });

  if (formTag) {
    const action = getAttribute(formTag, 'action') || currentUrl;
    const nextUrl = new URL(action, currentUrl);
    const inputs = String(html || '').match(/<input\b[^>]*>/gi) || [];
    for (const input of inputs) {
      const name = getAttribute(input, 'name');
      if (!name) continue;
      nextUrl.searchParams.set(name, getAttribute(input, 'value'));
    }
    return nextUrl;
  }

  const directMatch = String(html || '').match(/https:\/\/drive\.usercontent\.google\.com\/download\?[^"'<>\s]+/i);
  return directMatch ? new URL(decodeHtml(directMatch[0])) : null;
}

function cookieHeader(headers) {
  const values = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie')].filter(Boolean);
  return values.map(value => String(value).split(';', 1)[0]).filter(Boolean).join('; ');
}

async function fetchDriveAudio(fileId, requestHeaders, method) {
  const startUrl = new URL('https://drive.google.com/uc');
  startUrl.searchParams.set('export', 'download');
  startUrl.searchParams.set('id', fileId);

  let url = startUrl;
  let cookie = '';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const headers = { ...requestHeaders };
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(url, {
      method,
      headers,
      redirect: 'follow'
    });

    const responseCookie = cookieHeader(response.headers);
    if (responseCookie) cookie = cookie ? `${cookie}; ${responseCookie}` : responseCookie;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    if (method === 'HEAD') {
      const getResponse = await fetch(url, { method: 'GET', headers, redirect: 'follow' });
      const getCookie = cookieHeader(getResponse.headers);
      if (getCookie) cookie = cookie ? `${cookie}; ${getCookie}` : getCookie;
      const getContentType = getResponse.headers.get('content-type') || '';
      if (!getContentType.includes('text/html')) return getResponse;
      const html = await getResponse.text();
      const confirmationUrl = extractConfirmationUrl(html, getResponse.url || url.href);
      if (!confirmationUrl) return getResponse;
      url = confirmationUrl;
      continue;
    }

    const html = await response.text();
    const confirmationUrl = extractConfirmationUrl(html, response.url || url.href);
    if (!confirmationUrl) return response;
    url = confirmationUrl;
  }

  return null;
}

module.exports = async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const fileId = Array.isArray(req.query?.file) ? req.query.file[0] : req.query?.file;
  if (!fileId || !ALLOWED_FILE_IDS.has(fileId)) {
    res.statusCode = 404;
    res.end('Audio file not found');
    return;
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 With-love-FMB-audio/1.0',
    Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.5'
  };
  if (req.headers.range) headers.Range = req.headers.range;

  try {
    const upstream = await fetchDriveAudio(fileId, headers, req.method === 'HEAD' ? 'HEAD' : 'GET');
    if (!upstream) {
      res.statusCode = 502;
      res.end('Audio source unavailable');
      return;
    }

    if (!upstream.ok && upstream.status !== 206) {
      res.statusCode = upstream.status === 404 ? 404 : 502;
      res.end('Audio source unavailable');
      return;
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      res.statusCode = 502;
      res.end('Audio source returned an unexpected response');
      return;
    }

    for (const name of ['content-length', 'content-range', 'accept-ranges', 'content-disposition', 'etag', 'last-modified']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.setHeader('Content-Type', contentType || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.statusCode = upstream.status;

    if (req.method === 'HEAD' || !upstream.body) {
      res.end();
      return;
    }

    if (typeof Readable.fromWeb === 'function') {
      Readable.fromWeb(upstream.body).on('error', () => res.destroy()).pipe(res);
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error('FMB audio proxy error', error);
    if (!res.headersSent) res.statusCode = 502;
    res.end('Audio source unavailable');
  }
};
