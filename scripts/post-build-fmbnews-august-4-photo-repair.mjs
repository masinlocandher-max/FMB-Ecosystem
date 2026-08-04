import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const out = path.join(dist, 'assets', 'images', 'news');

const stories = [
  ['fmb-news-luis-lpa-habagat-august-4-2026.jpg', null, null, 'WEATHER UPDATE', ['LUIS WEAKENS,','BUT HABAGAT','HAZARDS REMAIN'], 'EDITORIAL ILLUSTRATION: FMB NEWS'],
  ['fmb-news-alex-eala-wta-title-august-4-2026.jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alex_Eala.jpg/1280px-Alex_Eala.jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alex_Eala.jpg/1280px-Alex_Eala.jpg', 'FILIPINO ACHIEVEMENT', ['ALEX EALA WINS','FIRST FILIPINO','WTA SINGLES TITLE'], 'PHOTO: PHILIPPINE SPORTS COMMISSION VIA WIKIMEDIA COMMONS'],
  ['fmb-news-markets-oil-fall-august-4-2026.jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg/1280px-Strait_of_Hormuz_%28MODIS_2020-12-04%29.jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/New_York_Stock_Exchange_Interior_2014.jpg/1280px-New_York_Stock_Exchange_Interior_2014.jpg', 'MONEY · GLOBAL MARKETS', ['IRAN PAUSE LIFTS','GLOBAL MARKETS','AS OIL FALLS'], 'PHOTO: NASA AQUA/MODIS VIA WIKIMEDIA COMMONS'],
  ['fmb-news-europe-wildfires-drought-august-4-2026.jpg', 'https://commons.wikimedia.org/wiki/Special:Redirect/file/East_Attica_Wildfire%2C_Greece_%28MODIS_2024-08-15%29.jpg?width=1600', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Europe_satellite_orthographic.jpg/1280px-Europe_satellite_orthographic.jpg', 'ENVIRONMENT · CLIMATE', ['WILDFIRES AND','DROUGHT DEEPEN','EUROPE EMERGENCY'], 'PHOTO: NASA MODIS LAND RAPID RESPONSE TEAM VIA WIKIMEDIA COMMONS'],
];

const esc = (s) => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const local = (name) => `/assets/images/news/${name}`;

function fallback() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111b45"/><stop offset=".55" stop-color="#263b69"/><stop offset="1" stop-color="#17032f"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#g)"/><g opacity=".65" stroke="#b9d9ff" stroke-width="5"><path d="M115 155L20 470M225 110L108 505M340 145L205 560M472 96L332 535M595 130L448 585M725 95L572 542M850 140L690 585M982 104L822 552"/></g></svg>`);
}

function overlay(category, lines, credit) {
  const title = lines.map((line,i)=>`<text x="60" y="${360+i*86}" fill="${i===2?'#e6ad2b':'#fff'}" font-family="Arial,sans-serif" font-size="70" font-weight="800">${esc(line)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#09052d" stop-opacity=".94"/><stop offset=".62" stop-color="#170934" stop-opacity=".68"/><stop offset="1" stop-color="#070b24" stop-opacity=".34"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#s)"/><g transform="translate(58 48)"><path d="M0 72A72 72 0 0 1 72 0" fill="none" stroke="#fff" stroke-width="16"/><path d="M24 72A48 48 0 0 1 72 24" fill="none" stroke="#e6ad2b" stroke-width="16"/><text x="99" y="48" fill="#fff" font-family="Georgia,serif" font-size="66" font-weight="700">FMB</text><text x="101" y="86" fill="#c697ff" font-family="Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="11">NEWS</text></g><text x="60" y="184" fill="#fff" font-family="Arial,sans-serif" font-size="20" font-weight="800" letter-spacing="3">CLEAR NEWS. REAL IMPACT.</text><rect x="60" y="224" width="430" height="42" rx="21" fill="#5b2c91"/><text x="275" y="252" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="18" font-weight="800">${esc(category)}</text>${title}<text x="60" y="810" fill="#fff" font-family="Arial,sans-serif" font-size="19" font-weight="700">4 AUGUST 2026</text><text x="60" y="850" fill="#fff" fill-opacity=".82" font-family="Arial,sans-serif" font-size="14">${esc(credit)}</text><rect y="948" width="1080" height="132" fill="#070b24"/><rect y="946" width="1080" height="3" fill="#e6ad2b"/><text x="58" y="1003" fill="#fff" font-family="Georgia,serif" font-size="30" font-weight="700">FMB NEWS</text><text x="250" y="1000" fill="#fff" font-family="Arial,sans-serif" font-size="18">Clear news. Real impact. Always for Filipinos.</text><text x="1022" y="1045" text-anchor="end" fill="#e6ad2b" font-family="Arial,sans-serif" font-size="18">francinemariebautista.com/fmbnews</text></svg>`);
}

async function remote(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'FMB-News-Cover-Builder/1.0' }, redirect: 'follow' });
  if (!response.ok) throw new Error(`Cover source returned ${response.status}: ${url}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1000) throw new Error(`Cover source returned an empty image: ${url}`);
  return buffer;
}

async function sourceImage(primary, backup, name) {
  const candidates = [...new Set([primary, backup].filter(Boolean))];
  for (const url of candidates) {
    try {
      return await remote(url);
    } catch (error) {
      console.warn(`Remote cover unavailable for ${name}; trying the next repository-safe option. ${error.message}`);
    }
  }
  console.warn(`Using the local FMB News editorial fallback for ${name}.`);
  return fallback();
}

async function files(dir) {
  const result=[];
  for (const e of await readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if(e.isDirectory()) result.push(...await files(p));
    else if(e.isFile()&&e.name.endsWith('.html')) result.push(p);
  }
  return result;
}

await mkdir(out,{recursive:true});
for (const [name,source,backup,category,lines,credit] of stories) {
  const bg = source || backup ? await sourceImage(source, backup, name) : fallback();
  const dest=path.join(out,name);
  await sharp(bg).resize(1080,1080,{fit:'cover',position:'centre'}).composite([{input:overlay(category,lines,credit)}]).jpeg({quality:92,chromaSubsampling:'4:4:4'}).toFile(dest);
  if((await stat(dest)).size<15000) throw new Error(`Invalid cover ${name}`);
}

let changed=0;
for (const file of await files(dist)) {
  let html=await readFile(file,'utf8');
  const before=html;
  for (const [name,,old] of stories) if(old) html=html.replaceAll(old,local(name));
  if(html!==before){await writeFile(file,html,'utf8');changed++;}
}

const landing=await readFile(path.join(dist,'fmbnews','index.html'),'utf8');
for(const [name] of stories) if(!landing.includes(local(name))) throw new Error(`Landing missing ${name}`);
console.log(`Generated ${stories.length} branded covers and updated ${changed} HTML files.`);
