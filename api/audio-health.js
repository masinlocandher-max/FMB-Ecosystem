const TRACKS = {
  '70s': '/assets/audio/70s/01-70s-feel-good.mp3',
  '80s': '/assets/audio/80s/08-80s-feel-good.mp3',
};

export default async function handler(req, res) {
  const collection = String(req.query.collection || '70s');
  const pathname = TRACKS[collection];

  if (!pathname) {
    return res.status(400).json({ ok: false, error: 'Unknown collection' });
  }

  try {
    const origin = `https://${req.headers.host}`;
    const response = await fetch(`${origin}${pathname}`, {
      headers: { Range: 'bytes=0-1023' },
      cache: 'no-store',
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    const signature = bytes.subarray(0, 3).toString('hex');
    const hasMp3Signature =
      bytes.subarray(0, 3).toString('ascii') === 'ID3' ||
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);

    return res.status(200).json({
      ok: response.ok && contentType.startsWith('audio/') && bytes.length > 0,
      collection,
      pathname,
      upstreamStatus: response.status,
      contentType,
      contentLength: response.headers.get('content-length'),
      contentRange: response.headers.get('content-range'),
      acceptRanges: response.headers.get('accept-ranges'),
      bytesReceived: bytes.length,
      signature,
      hasMp3Signature,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      collection,
      pathname,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
