import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');

const stories = [
  {slug:'western-visayas-ai-festival-2026',category:'Technology',filter:'tech',title:'Iloilo AI Festival Pushes Local Innovation Toward Tourism, Energy and the Blue Economy',image:'https://pia.gov.ph/wp-content/uploads/2026/05/1000000802-1024x768.jpg',credit:'PHOTO: PIA ILOILO'},
  {slug:'pax-silica-new-clark-city-jobs-2026',category:'Business and Technology',filter:'money',title:'Pax Silica Promises High-Value Jobs, but Delivery Will Define Its Reputation',image:'https://pia.gov.ph/wp-content/uploads/2026/07/20260723-BCDA_Briefing-1.jpg',credit:'PHOTO: PCO / RTVM VIA PIA'},
  {slug:'sb19-lollapalooza-filipino-heritage-branding',category:'Entertainment and Culture',filter:'culture',title:'SB19 Turns Lollapalooza Debut Into a Statement of Filipino Identity',image:'https://assets.teenvogue.com/photos/6a6ce3d2f34041d1d51d24a2/16:9/w_2560,c_limit/SB19LollapaloozaTeenVogue-14.jpg',credit:'PHOTO: GINO LUCAS / COURTESY OF SB19'},
  {slug:'katrina-llegado-miss-supranational-2026',category:'Pageantry',filter:'culture',title:'Katrina Llegado Wins Miss Supranational 2026 for the Philippines',image:'https://people.com/thmb/RLVJ_PwsWPquKtV-LWNbY6iqgXc=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():focal(749x0:751x2):format(webp)/MISS-SUPRANATIONAL-winner-2026-Katrina-Llegado-073126-586df0e3dd7347d09c32a91d63417af9.jpg',credit:'PHOTO: MISS & MISTER SUPRANATIONAL OFFICIAL / YOUTUBE'},
  {slug:'myanmar-min-aung-hlaing-thailand-visit-2026',category:'Southeast Asia',filter:'world',title:'Myanmar Leader’s Thailand Visit Tests ASEAN’s Line Between Dialogue and Legitimacy',image:'https://dims.apnews.com/dims4/default/7b42ac5/2147483647/strip/true/crop/5000x3333+0+0/resize/1200x800!/quality/90/?url=https://assets.apnews.com/c9/b8/c9ad8538bf89cdda449050485594/705cb7273e7f4251ba34cdb2ccc2563c',credit:'PHOTO: SAKCHAI LALIT / AP'},
  {slug:'san-marcelino-scholarship-requirements-august-2026',category:'Zambales and Community',filter:'national',title:'San Marcelino Reminds College Students to Prepare Scholarship Requirements',image:'https://sanmarcelinozambales.gov.ph/wp-content/uploads/2026/05/paalala-1024x1024.jpg',credit:'PHOTO: LGU SAN MARCELINO'}
];

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function card(story) {
  return `<article class="nc-rundown-story fn9-report-card fmb-august-6-report" data-category="${story.filter}" data-fn9-searchable data-fmb-august-6-story="${story.slug}"><a href="/news/${story.slug}/"><span class="nc-rundown-number">NEW</span><figure class="news-visual fmb-photo"><img src="${esc(story.image)}" loading="lazy" decoding="async" alt="${esc(story.title)}"><span class="fmb-photo-credit">${esc(story.credit)}</span><figcaption>${esc(story.credit)}</figcaption></figure><div><p>${esc(story.category)} · 6 August 2026</p><h3>${esc(story.title)}</h3><span>FMB News original report</span></div></a></article>`;
}

function section() {
  return `<section class="fn9-reports fmb-august-6-reports" id="august-6-reports" data-fmb-august-6-visible aria-labelledby="august6ReportsTitle"><div class="fn9-shell"><div class="fn9-section-heading"><div><p class="nc-kicker">Latest publication</p><h2 id="august6ReportsTitle">New reports for 6 August 2026</h2></div></div><div class="fn9-report-grid">${stories.map(card).join('')}</div></div></section>`;
}

function apply(html, route) {
  let next = html.replace(/<section\b[^>]*data-fmb-august-6-visible[^>]*>[\s\S]*?<\/section>\s*/i, '');
  const marker = next.search(/<section\b[^>]*class=(["'])[^"']*\bfn9-about-band\b[^"']*\1/i);
  if (marker < 0) throw new Error(`${route} has no insertion point for August 6 reports`);
  next = `${next.slice(0, marker)}${section()}${next.slice(marker)}`;
  next = next.replace(/<time data-news-updated>[^<]*<\/time>/, '<time data-news-updated>Updated 6 August 2026, 3:00 p.m. PHT</time>');
  for (const story of stories) {
    if (!next.includes(`data-fmb-august-6-story="${story.slug}"`)) throw new Error(`${route} is missing ${story.slug}`);
  }
  return next;
}

for (const relative of ['news/index.html','fmbnews/index.html']) {
  const file = path.join(dist, relative);
  const html = await readFile(file, 'utf8');
  await writeFile(file, apply(html, `/${relative.replace('/index.html','')}`), 'utf8');
}

console.log(`Surfaced ${stories.length} August 6 FMB News reports on both live news homepages.`);
