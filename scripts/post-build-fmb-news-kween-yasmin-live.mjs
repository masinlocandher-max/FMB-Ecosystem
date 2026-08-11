import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Compatibility wrapper only. The approved hero is installed upstream from
// source-controlled chunks; this file must never embed or substitute another image.
const root = path.resolve(new URL('..', import.meta.url).pathname);
const heroPath = path.join(root, 'dist', 'assets', 'images', 'fmbnews', 'kween-yasmin-multifaceted-impact.jpeg');
const heroBytes = await readFile(heroPath);
const expectedBytes = 468524;
const expectedSha256 = 'abde36f3f45b44e32f9e40313ffcdc534ec8a5059a63ff4890fec0d39ed75ba7';
const actualSha256 = createHash('sha256').update(heroBytes).digest('hex');

if (heroBytes.length !== expectedBytes || actualSha256 !== expectedSha256) {
  throw new Error(`Kween Yasmin hero integrity failure: ${heroBytes.length} bytes, ${actualSha256}`);
}

await import('./post-build-fmb-news-august-11-kween-yasmin.mjs');
await import('./post-build-fmb-news-kween-yasmin-seo.mjs');
