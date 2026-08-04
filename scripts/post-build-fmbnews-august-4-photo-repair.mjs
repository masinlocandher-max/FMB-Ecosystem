import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(root, 'dist');
const imageDir = path.join(distRoot, 'assets', 'images', 'news');
const luisName = 'fmb-news-luis-lpa-habagat-august-4-2026.jpg';
const luisPath = path.join(imageDir, luisName);
const hormuzPath = path.join(imageDir, 'fmb-news-hormuz-ship-strike-talks-august-4-2026.jpg');
const alexBroken = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Alex_Eala.jpg/1280px-Alex_Eala.jpg';
const alexCorrect = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alex_Eala.jpg/1280px-Alex_Eala.jpg';

function luisCoverSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#111b45"/>
        <stop offset="0.58" stop-color="#263b69"/>
        <stop offset="1" stop-color="#09122f"/>
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#060b25"/>
        <stop offset="1" stop-color="#17103b"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect width="1080" height="1080" fill="url(#sky)"/>
    <ellipse cx="830" cy="280" rx="330" ry="185" fill="#8797b8" opacity="0.22" filter="url(#blur)"/>
    <path d="M0 718 C180 680 325 727 504 700 C696 670 830 632 1080 694 L1080 1080 L0 1080Z" fill="url(#ground)"/>
    <g opacity="0.72" stroke="#b9d9ff" stroke-width="5">
      <path d="M115 155L20 470M225 110L108 505M340 145L205 560M472 96L332 535M595 130L448 585M725 95L572 542M850 140L690 585M982 104L822 552"/>
    </g>
    <g fill="#050817">
      <path d="M640 702c18-78 79-128 149-128 78 0 139 51 158 128H640Z"/>
      <rect x="783" y="700" width="22" height="215" rx="11"/>
      <circle cx="794" cy="655" r="39"/>
      <path d="M794 716c-83 0-151-68-151-151 83 0 151 68 151 151Z"/>
      <path d="M794 716c83 0 151-68 151-151-83 0-151 68-151 151Z"/>
      <path d="M760 905h72l35 119H726Z"/>
    </g>
    <rect x="0" y="0" width="1080" height="1080" fill="#09052d" opacity="0.16"/>
    <g transform="translate(58 50)">
      <path d="M0 72A72 72 0 0 1 72 0" fill="none" stroke="#ffffff" stroke-width="16"/>
      <path d="M24 72A48 48 0 0 1 72 24" fill="none" stroke="#e6ad2b" stroke-width="16"/>
      <text x="99" y="48" fill="#ffffff" font-family="Georgia,serif" font-size="66" font-weight="700">FMB</text>
      <text x="101" y="86" fill="#c697ff" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="11">NEWS</text>
    </g>
    <rect x="58" y="205" width="190" height="40" rx="20" fill="#5b2c91"/>
    <text x="153" y="232" text-anchor="middle" fill="#ffffff" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="1">WEATHER UPDATE</text>
    <text x="58" y="326" fill="#ffffff" font-family="Georgia,serif" font-size="72" font-weight="700">LUIS WEAKENS,</text>
    <text x="58" y="405" fill="#ffffff" font-family="Georgia,serif" font-size="72" font-weight="700">BUT HABAGAT</text>
    <text x="58" y="484" fill="#e6ad2b" font-family="Georgia,serif" font-size="72" font-weight="700">HAZARDS REMAIN</text>
    <rect x="58" y="538" width="590" height="116" rx="18" fill="#080c2c" opacity="0.84" stroke="#6b5bb1" stroke-width="2"/>
    <text x="86" y="580" fill="#ffffff" font-family="Arial,sans-serif" font-size="25"><tspan x="86">Heavy rain, strong gusts and rough seas</tspan><tspan x="86" dy="35">may continue even after cyclone warnings end.</tspan></text>
    <rect y="948" width="1080" height="132" fill="#070b24"/>
    <rect y="946" width="1080" height="3" fill="#e6ad2b"/>
    <text x="58" y="1003" fill="#ffffff" font-family="Georgia,serif" font-size="30" font-weight="700">FMB NEWS</text>
    <text x="250" y="1000" fill="#ffffff" font-family="Arial,sans-serif" font-size="18">Clear news. Real impact. Always for Filipinos.</text>
    <text x="1022" y="1045" text-anchor="end" fill="#e6ad2b" font-family="Arial,sans-serif" font-size="18">francinemariebautista.com/fmbnews</text>
  </svg>`;
}

async function walkHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

await mkdir(imageDir, { recursive: true });
await sharp(Buffer.from(luisCoverSvg()))
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toFile(luisPath);

let replacements = 0;
for (const file of await walkHtml(distRoot)) {
  const html = await readFile(file, 'utf8');
  if (!html.includes(alexBroken)) continue;
  const repaired = html.replaceAll(alexBroken, alexCorrect);
  await writeFile(file, repaired, 'utf8');
  replacements += 1;
}

for (const required of [luisPath, hormuzPath]) {
  const details = await stat(required);
  if (!details.isFile() || details.size < 10000) {
    throw new Error(`FMB News image validation failed: ${required}`);
  }
}

const alexArticle = path.join(distRoot, 'news', 'alex-eala-first-wta-title-washington-august-4-2026', 'index.html');
const alexHtml = await readFile(alexArticle, 'utf8');
if (!alexHtml.includes(alexCorrect) || alexHtml.includes(alexBroken)) {
  throw new Error('Alex Eala photo URL repair did not reach the article page.');
}

console.log(`Repaired August 4 FMB News media: generated Luis cover, validated Hormuz photo, and corrected Alex Eala image URL across ${replacements} HTML files.`);
