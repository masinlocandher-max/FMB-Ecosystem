import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const nativeFetch = globalThis.fetch.bind(globalThis);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function collectImages(directory, matches = []) {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return matches;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectImages(fullPath, matches);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!imageExtensions.has(extension)) continue;
    if (!/(amor.*deloso|deloso.*amor)/i.test(entry.name)) continue;

    try {
      const details = await stat(fullPath);
      if (details.size > 0) matches.push({ path: fullPath, size: details.size, extension });
    } catch {
      // A missing optional fallback must not stop the normal build.
    }
  }

  return matches;
}

async function findAmorFallback() {
  const candidates = [];
  for (const root of [
    path.resolve('apps/withlovefmb'),
    path.resolve('public'),
    path.resolve('assets'),
  ]) {
    await collectImages(root, candidates);
  }

  return candidates.sort((a, b) => b.size - a.size)[0] ?? null;
}

function contentType(extension) {
  return ({
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
  })[extension] ?? 'application/octet-stream';
}

globalThis.fetch = async function resilientBuildFetch(input, init = {}) {
  const url = typeof input === 'string' ? input : input?.url ?? String(input);
  const isFacebookImage = /(?:scontent[^/]*|fbcdn\.net)/i.test(url);

  if (!isFacebookImage) return nativeFetch(input, init);

  const headers = new Headers(init.headers ?? (typeof input !== 'string' ? input?.headers : undefined));
  if (!headers.has('user-agent')) {
    headers.set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36');
  }
  if (!headers.has('accept')) headers.set('accept', 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8');
  if (!headers.has('referer')) headers.set('referer', 'https://www.facebook.com/');

  const response = await nativeFetch(input, { ...init, headers });
  if (response.ok) return response;

  const fallback = await findAmorFallback();
  if (!fallback) return response;

  const bytes = await readFile(fallback.path);
  console.warn(`Remote News image returned ${response.status}; preserving repository fallback ${path.relative(process.cwd(), fallback.path)} (${fallback.size} bytes).`);

  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': contentType(fallback.extension),
      'content-length': String(bytes.byteLength),
      'x-fmb-build-fallback': 'repository-image',
    },
  });
};
