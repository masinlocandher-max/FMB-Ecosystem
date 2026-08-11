import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const stories = [
  { slug:'francine-marie-bautista-ai-photography-creative-skill', title:'Using AI Does Not Make You Less of a Photographer: Francine Marie Bautista on Skill, Tools and Creative Judgment' },
  { slug:'francine-marie-bautista-pax-silica-terms-must-be-clear', title:'Francine Marie Bautista on Pax Silica: “Terms Must Be Clear. Questions Must Be Answered.”' },
  { slug:'francine-marie-bautista-ai-literacy-minimize-risks', title:'AI Has Risks. Francine Marie Bautista Says the Answer Is to Learn How to Use It Properly' }
];

await import('./post-build-fmb-news-ai-francine-august-8.mjs');

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourceDir = path.join(root, 'scripts', 'assets');
const chunkNames = [
  'kween-yasmin-hero.part01.txt',
  'kween-yasmin-hero.part02.txt'
];
const expectedBytes = 468524;
const expectedSha256 = 'abde36f3f45b44e32f9e40313ffcdc534ec8a5059a63ff4890fec0d39ed75ba7';
const chunks = await Promise.all(chunkNames.map((name) => readFile(path.join(sourceDir, name), 'utf8')));
const heroBytes = Buffer.from(chunks.join('').replace(/\s+/g, ''), 'base64');
const actualSha256 = createHash('sha256').update(heroBytes).digest('hex');
if (heroBytes.length !== expectedBytes || actualSha256 !== expectedSha256) {
  throw new Error(`Kween Yasmin approved hero integrity failure: expected ${expectedBytes} bytes / ${expectedSha256}, got ${heroBytes.length} bytes / ${actualSha256}`);
}
if (heroBytes[0] !== 0xff || heroBytes[1] !== 0xd8 || heroBytes.at(-2) !== 0xff || heroBytes.at(-1) !== 0xd9) throw new Error('Kween Yasmin approved hero is not a complete JPEG.');
const heroDir = path.join(root, 'dist', 'assets', 'images', 'fmbnews');
await mkdir(heroDir, { recursive: true });
await writeFile(path.join(heroDir, 'kween-yasmin-multifaceted-impact.jpeg'), heroBytes);
console.log(`Installed exact approved Kween Yasmin hero (${heroBytes.length} bytes, ${actualSha256}).`);
await import('./post-build-fmb-news-kween-yasmin-live.mjs');
