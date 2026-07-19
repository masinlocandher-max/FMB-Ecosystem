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

  const upstreamUrl = new URL('https://drive.usercontent.google.com/download');
  upstreamUrl.searchParams.set('id', fileId);
  upstreamUrl.searchParams.set('export', 'download');
  upstreamUrl.searchParams.set('confirm', 't');

  const headers = {
    'User-Agent': 'Mozilla/5.0 With-love-FMB-audio/1.0',
    Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.5'
  };
  if (req.headers.range) headers.Range = req.headers.range;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers,
      redirect: 'follow'
    });

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

    for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
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
