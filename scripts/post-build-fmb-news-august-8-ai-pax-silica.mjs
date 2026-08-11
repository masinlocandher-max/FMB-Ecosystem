import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Compatibility entrypoint for the August 8 FMB News AI / Pax Silica series.
// The canonical publisher lives in post-build-fmb-news-ai-francine-august-8.mjs.
export const stories = [
  {
    slug:'francine-marie-bautista-ai-photography-creative-skill',
    title:'Using AI Does Not Make You Less of a Photographer: Francine Marie Bautista on Skill, Tools and Creative Judgment'
  },
  {
    slug:'francine-marie-bautista-pax-silica-terms-must-be-clear',
    title:'Francine Marie Bautista on Pax Silica: “Terms Must Be Clear. Questions Must Be Answered.”'
  },
  {
    slug:'francine-marie-bautista-ai-literacy-minimize-risks',
    title:'AI Has Risks. Francine Marie Bautista Says the Answer Is to Learn How to Use It Properly'
  }
];

await import('./post-build-fmb-news-ai-francine-august-8.mjs');

// Reconstruct the exact user-approved 1536×768 Kween Yasmin JPEG from source-controlled
// base64 chunks. The expected size/hash are from the original uploaded master, so a
// truncated, substituted, or generated image cannot silently reach production.
const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourceDir = path.join(root, 'assets', 'fmbnews');
const chunkNames = [
  'kween-yasmin-master.part00a.txt',
  'kween-yasmin-master.part00b.txt',
  'kween-yasmin-master.part00c.txt',
  'kween-yasmin-master.part00d.txt',
  'kween-yasmin-master.part01.txt',
  'kween-yasmin-master.part02.txt'
];
const chunks = await Promise.all(chunkNames.map((name) => readFile(path.join(sourceDir, name), 'utf8')));
const heroBase64 = chunks.join('').replace(/\s+/g, '');
const heroBytes = Buffer.from(heroBase64, 'base64');
const expectedBytes = 468524;
const expectedSha256 = 'abde36f3f45b44e32f9e40313ffcdc534ec8a5059a63ff4890fec0d39ed75ba7';
const actualSha256 = createHash('sha256').update(heroBytes).digest('hex');
if (heroBytes.length !== expectedBytes) {
  throw new Error(`Kween Yasmin approved hero byte-length mismatch: ${heroBytes.length} !== ${expectedBytes}`);
}
if (actualSha256 !== expectedSha256) {
  throw new Error(`Kween Yasmin approved hero SHA-256 mismatch: ${actualSha256}`);
}

const heroDir = path.join(root, 'dist', 'assets', 'images', 'fmbnews');
const heroPath = path.join(heroDir, 'kween-yasmin-multifaceted-impact.jpeg');
await mkdir(heroDir, { recursive: true });
await writeFile(heroPath, heroBytes);
console.log(`Installed byte-verified approved Kween Yasmin hero (${heroBytes.length} bytes, ${actualSha256}).`);

await import('./post-build-fmb-news-kween-yasmin-live.mjs');
