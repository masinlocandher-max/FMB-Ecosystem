import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const heroPath = path.join(root, 'dist', 'assets', 'images', 'fmbnews', 'kween-yasmin-multifaceted-impact.jpeg');
const expectedBytes = 468524;
const expectedSha256 = 'abde36f3f45b44e32f9e40313ffcdc534ec8a5059a63ff4890fec0d39ed75ba7';
const heroBytes = await readFile(heroPath);
const actualSha256 = createHash('sha256').update(heroBytes).digest('hex');

if (heroBytes.length !== expectedBytes || actualSha256 !== expectedSha256) {
  throw new Error(`Kween Yasmin hero integrity failure: expected ${expectedBytes} bytes / ${expectedSha256}, got ${heroBytes.length} bytes / ${actualSha256}`);
}
if (heroBytes[0] !== 0xff || heroBytes[1] !== 0xd8 || heroBytes.at(-2) !== 0xff || heroBytes.at(-1) !== 0xd9) {
  throw new Error('Kween Yasmin hero integrity failure: approved file is not a complete JPEG.');
}

console.log(`Validated exact Kween Yasmin hero (${heroBytes.length} bytes, ${actualSha256}).`);
await import('./post-build-fmb-news-august-11-kween-yasmin.mjs');
await import('./post-build-fmb-news-kween-yasmin-seo.mjs');