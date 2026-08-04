import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(root, 'dist');
const imageDir = path.join(distRoot, 'assets', 'images', 'news');

const stories = [
  {
    name: 'fmb-news-luis-lpa-habagat-august-4-2026.jpg',
    source: null,
    old: '/assets/images/news/fmb-news-luis-lpa-habagat-august-4-2026.jpg',
    category: 'WEATHER UPDATE',
    lines: ['LUIS WEAKENS,', 'BUT HABAGAT', 'HAZARDS REMAIN'],
    goldLine: 2,
    deck: 'Heavy rain, strong gusts and rough seas may continue after cyclone warnings end.',
    credit: 'EDITORIAL ILLUSTRATION: FMB NEWS',
  },
  {
    name: 'fmb-news-alex-eala-wta-title-august-4-2026.jpg',
    source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alex_Eala.jpg/1280px-Alex_Eala.jpg',
    old: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alex_Eala.jpg/1280px-Alex_Eala.jpg',
    category: 'FILIPINO ACHIEVEMENT',
    lines: ['ALEX EALA WINS', 'FIRST FILIPINO', 'WTA SINGLES TITLE'],
    goldLine: 2,
    deck: 'A milestone for Philippine tennis and a breakthrough on the global tour.',
    credit: 'PHOTO: PHILIPPINE SPORTS COMMISSION VIA WIKIMEDIA COMMONS',
  },
  {
    name: 'fmb-news-markets-oil-fall-august-4-2026.jpg',
    source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/New_York_Stock_Exchange_Interior_2014.jpg/1280px-New_York_Stock_Exchange_Interior_2014.jpg',
    old: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/New_York_Stock_Exchange_Interior_2014.jpg/1280px-New_York_Stock_Exchange_Interior_2014.jpg',
    category: 'MONEY · GLOBAL MARKETS',
    lines: ['IRAN PAUSE LIFTS', 'GLOBAL MARKETS', 'AS OIL FALLS'],
    goldLine: 2,
    deck: 'Lower oil prices eased immediate pressure, but diplomacy remains unsettled.',
    credit: 'PHOTO: THOMAS J. O’HALLORAN COLLECTION VIA WIKIMEDIA COMMONS',
  },
  {
    name: 'fmb-news-europe-wildfires-drought-august-4-2026.jpg',
    source: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Europe_satellite_orthographic.jpg/1280px-Europe_satellite_orthographic.jpg',
    old: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Europe_satellite_orthographic.jpg/1280px-Europe_satellite_orthographic.jpg',
    category: 'ENVIRONMENT · CLIMATE',
    lines: ['WILDFIRES AND', 'DROUGHT DEEPEN', 'EUROPE EMERGENCY'],
    goldLine: 2,
    deck: 'Heat, dry conditions and fire risks are straining emergency systems.',
    credit: 'PHOTO: NASA IMAGERY VIA WIKIMEDIA COMMONS',
  },
];

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function brandingSvg(story) {
  const headline = story.lines.map((line, index) => `<text x="62" y="${358 + index * 86}" fill="${index === story.goldLine ? '#e6ad2b' : '#ffffff'}" font-family="Arial,sans-serif" font-size="70" font-weight="800">${esc(line)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
    <defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#09052d" stop-opacity=".92"/><stop offset=".62" stop-color="#170934" stop-opacity=".68"/><stop offset="1" stop-color="#070b24" stop-opacity=".35"/></linearGradient></defs>
    <rect width="1080" height="1080" fill="url(#shade)"/>
    <g transform="translate(58 48)"><path d="M0 72A72 72 0 0 1 72 0" fill="none" stroke="#fff" stroke-width="16"/><path d="M24 72A48 48 0 0 1 72 24" fill="none" stroke="#e6ad2b" stroke-width="16"/><text x="99" y="48" fill="#fff" font-family="Georgia,serif" font-size="66" font-weight="700">FMB</text><text x="101" y="86" fill="#c697ff" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="11">NEWS</text></g>
    <text x="62" y="184" fill="#fff" font-family="Arial,sans-serif" font-size="20" font-weight="800" letter-spacing="3">CLEAR NEWS. REAL IMPACT.</text>
    <rect x="62" y="225" width="410" height="42" rx="21" fill="#5b2c91"/><text x="267" y="253" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="800" letter-spacing="1">${esc(story.category)}</text>
    ${headline}
    <rect x="62" y="650" width="760" height="112" rx="18" fill="#070b24" fill-opacity=".82" stroke="#7962ad" stroke-width="2"/><text x="90" y="697" fill="#fff" font-family="Arial,sans-serif" font-size="25"><tspan x="90">${esc(story.deck.slice(0, 58))}</tspan><tspan x="90" dy="35">${esc(story.deck.slice(58))}</tspan></text>
    <text x="62" y="825" fill="#fff" font-family="Arial,sans-serif" font-size="19" font-weight="700">4 AUGUST 2026</text>
    <text x="62" y="865" fill="#fff" fill-opacity=".82" font-family="Arial,sans-serif" font-size="14">${esc(story.credit)}</text>
    <rect y="948" width="1080" height="132" fill="#070b24"/><rect y="946" width="1080" height="3" fill="#e6ad2b"/><text x="58" y="1003" fill="#fff" font-family="Georgia,serif" font-size="30" font-weight="700">FMB NEWS</text><text x="250" y="1000" fill="#fff" font-family="Arial,sans-serif" font-size="18">Clear news. Real impact. Always for Filipinos.</text><text x="1022" y="1045" text-anchor="end" fill="#e6ad2b" font-family="Arial,sans-serif" font-size="18">francinemariebautista.com/fmbnews</text>
  </svg>`);
}

function luisBackground() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#111b45"/><stop offset=".58" stop-color="#263b69"/><stop offset="1" stop-color="#09122f"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#sky)"/><g opacity=".7" stroke="#b9d9ff" stroke-width="5"><path d="M115 155L20 470M225 110L108 505M340 145L205 560M472 96L332 535M595 130L448 585M725 95L572 542M850 140L690 585M982 104L822 552"/></g><path d="M0 718C180 680 325 727 504 700C696 670 830 632 1080 694V1080H0Z" fill="#080b25"/></svg>`);
}

async function fetchBuffer(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'FMB-News-Cover-Builder/1.0' } });
  if (!response.ok) throw new Error(`Unable to fetch cover source ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function buildCover(story) {
  const background = story.source ? await fetchBuffer(story.source) : luisBackground();
  const destination = path.join(imageDir, story.name);
  await sharp(background).resize(1080, 1080, { fit: 'cover', position: 'centre' }).composite([{ input: brandingSvg(story), top: 0, left: 0 }]).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(destination);
  const details = await stat(destination);
  if (!details.isFile() || details.size < 15000) throw new Error(`Invalid branded cover: ${destination}`);
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
for (const story of stories) await buildCover(story);

let replacements = 0;
for (const file of await walkHtml(distRoot)) {
  let html = await readFile(file, 'utf8');
  const original = html;
  for (const story of stories) {
    if (!story.source) continue;
    html = html.replaceAll(story.old, `/assets/images/news/${story.name}`);
  }
  if (html !== original) {
    await writeFile(file, html, 'utf8');
    replacements += 1;
  }
}

const landing = await readFile(path.join(distRoot, 'fmbnews', 'index.html'), 'utf8');
for (const story of stories) {
  if (!landing.includes(`/assets/images/news/${story.name}`)) throw new Error(`Branded cover did not reach landing page: ${story.name}`);
}
if (/fn9-report-card[\s\S]{0,500}<img src="https:\/\//.test(landing)) throw new Error('Priority landing cards still contain external primary images.');

console.log(`Generated ${stories.length} branded FMB News covers and updated ${replacements} HTML files.`);
