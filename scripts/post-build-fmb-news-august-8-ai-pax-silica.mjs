import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Compatibility entrypoint for the August 8 FMB News AI / Pax Silica series.
// The canonical publisher lives in post-build-fmb-news-ai-francine-august-8.mjs.
// Keep the three slug/title pairs here because the related-story pass reads this
// entrypoint as its stable series manifest.
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

// Kween Yasmin uses the user-approved artwork embedded in the source record.
// Extract the encoded image without executing the retired checksum wrapper.
const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(root, 'scripts', 'post-build-fmb-news-kween-yasmin-live.mjs');
const source = await readFile(sourcePath, 'utf8');
const match = source.match(/const heroBase64 = `([\s\S]*?)`;/);
if (!match) throw new Error('Kween Yasmin approved hero source is missing.');
const heroBytes = Buffer.from(match[1], 'base64');
if (heroBytes.length < 100000) throw new Error('Kween Yasmin approved hero is incomplete.');
const heroDir = path.join(root, 'dist', 'assets', 'images', 'fmbnews');
await mkdir(heroDir, { recursive: true });
await writeFile(path.join(heroDir, 'kween-yasmin-multifaceted-impact.jpeg'), heroBytes);

await import('./post-build-fmb-news-august-11-kween-yasmin.mjs');
await import('./post-build-fmb-news-kween-yasmin-seo.mjs');
