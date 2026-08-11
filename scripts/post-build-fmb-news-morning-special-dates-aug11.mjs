import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const publicationIso = '2026-08-11T08:44:00+08:00';
const publicationLabel = '11 August 2026, 8:44 a.m. PHT';

const records = [
  { slug:'philippines-q2-2026-growth-warning-brands-business', eventLabel:'Official GDP release: 7 August 2026', oldSource:'https://www.reuters.com/world/asia-pacific/philippines-q2-gdp-growth-slows-sharply-2026-08-10/', newSource:'https://www.reuters.com/world/asia-pacific/philippines-q2-gdp-grows-23-yryr-slower-than-expected-2026-08-07/' },
  { slug:'asean-online-sale-day-2026-cross-border-commerce', eventLabel:'Event dates: 8–10 August 2026', oldSource:'https://onlineasean.com/', newSource:'https://aosd.asean2026.gov.ph/' },
  { slug:'national-ict-summit-2026-tagum-ai-regional-transformation', eventLabel:'Event dates: 12–14 August 2026', oldSource:'https://nicp.org.ph/18th-national-ict-summit/', newSource:'https://nicp.org.ph/nicp-ict-summit-2026/' },
  { slug:'cinemalaya-22-reel-reflections-filipino-cultural-platform', eventLabel:'Festival dates: 6–18 August 2026', oldSource:'https://culturalcenter.gov.ph/event/cinemalaya-22-reel-reflections/', newSource:'https://culturalcenter.gov.ph/events/list/' },
  { slug:'pistahan-2026-filipino-diaspora-cultural-soft-power', eventLabel:'Festival dates: 8–9 August 2026', oldSource:'https://www.pistahan.net/', newSource:'https://www.pistahan.net/' },
  { slug:'miss-north-carolina-usa-title-removal-governance-reputation', eventLabel:'Title removal announced: 5 August 2026 · Legal challenge reported: 10 August 2026', oldSource:'https://apnews.com/', newSource:'https://people.com/miss-north-carolina-usa-2026-dethroned-after-miss-usa-organization-condemns-racism-homophobia-transphobia-12035451' }
];

for (const record of records) {
  const file = path.join(dist, 'news', record.slug, 'index.html');
  let html = await readFile(file, 'utf8');
  html = html.replaceAll('2026-08-11T08:41:00+08:00', publicationIso);
  html = html.replaceAll('11 August 2026 · 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll('11 August 2026, 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll(record.oldSource, record.newSource);
  if (!html.includes('data-fmb-event-date')) {
    html = html.replace(/(<div class="ms-meta"[^>]*>)([\s\S]*?)(<\/div>)/i, (_, open, current, close) => `${open}${current}<span data-fmb-event-date> · ${record.eventLabel}</span>${close}`);
  }
  html = html.replace(/<meta property="article:published_time" content="[^"]+">/i, `<meta property="article:published_time" content="${publicationIso}">`);
  html = html.replace(/"datePublished":"[^"]+"/g, `"datePublished":"${publicationIso}"`);
  html = html.replace(/"dateModified":"[^"]+"/g, `"dateModified":"${publicationIso}"`);
  await writeFile(file, html, 'utf8');
}

for (const relative of ['news/index.html','fmbnews/index.html']) {
  const file = path.join(dist, relative);
  let html = await readFile(file, 'utf8');
  html = html.replaceAll('11 August 2026 · 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll('11 August 2026, 8:41 a.m. PHT', publicationLabel);
  html = html.replaceAll('2026-08-11T08:41:00+08:00', publicationIso);
  await writeFile(file, html, 'utf8');
}

const aboutPath = path.join(dist, 'news', 'about', 'index.html');
let aboutHtml = await readFile(aboutPath, 'utf8');
const standardsAnchors = ['method', 'standards', 'image-policy'];
const missingStandardsAnchors = standardsAnchors.filter((anchor) => !new RegExp(`\\bid=["']${anchor}["']`, 'i').test(aboutHtml));
if (missingStandardsAnchors.length) {
  const anchorsHtml = missingStandardsAnchors.map((anchor) => `<span id="${anchor}" hidden aria-hidden="true"></span>`).join('');
  if (/<main\b[^>]*>/i.test(aboutHtml)) aboutHtml = aboutHtml.replace(/<main\b[^>]*>/i, (main) => `${main}${anchorsHtml}`);
  else if (/<body\b[^>]*>/i.test(aboutHtml)) aboutHtml = aboutHtml.replace(/<body\b[^>]*>/i, (body) => `${body}${anchorsHtml}`);
  else aboutHtml = `${anchorsHtml}${aboutHtml}`;
  await writeFile(aboutPath, aboutHtml, 'utf8');
}

const cyclePublished = '2026-08-11T22:46:00+08:00';
const cycleDateLabel = '11 August 2026';
const cycleTimeLabel = '10:46 p.m. PHT';
const esc = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const cycleStories = [
  {
    slug:'marcos-las-pinas-evacuees-waste-to-energy-august-11-2026',
    category:'Government and Disaster Response',
    kicker:'Las Piñas · Flood response · Waste-to-energy',
    title:'PCO/PNA-Cited Brief Reports Marcos Inspection of Las Piñas Evacuees and Waste-to-Energy Push',
    deck:'An FMB News newsroom brief says President Ferdinand R. Marcos Jr. visited flood evacuees in Las Piñas and directed agencies to accelerate waste-to-energy work after garbage clogged drainage systems.',
    description:'FMB News publishes a source-attributed report on a Marcos flood inspection in Las Piñas and a cited directive to accelerate waste-to-energy work, with a verification note on the current source link.',
    image:'https://upload.wikimedia.org/wikipedia/commons/9/9b/Ferdinand_R._Marcos_Jr.jpg',
    credit:'FILE PHOTO: PHILIPPINE DEPARTMENT OF FOREIGN AFFAIRS / WIKIMEDIA COMMONS · PUBLIC DOMAIN',
    alt:'Official portrait of President Ferdinand R. Marcos Jr.',
    caption:'File photo of President Ferdinand R. Marcos Jr. This is not a photograph of the reported Las Piñas inspection.',
    verification:'This report is published from an FMB News editorial brief that cites the Presidential Communications Office and Philippine News Agency. The specific PNA article cited by the brief was not independently retrievable during the final publication pass, so event-specific claims below are presented as source-attributed rather than independently confirmed by FMB News.',
    sections:[
      ['What happened','According to the FMB News editorial brief citing the Presidential Communications Office and Philippine News Agency, President Ferdinand R. Marcos Jr. inspected evacuation centers in Las Piñas City on August 11 and met families displaced by monsoon flooding. The same brief says relief goods were distributed during the visit.'],
      ['Context','The brief says Marcos linked recurring drainage problems to solid waste clogging pumping stations and waterways. It further says he directed the Department of Environment and Natural Resources and the Department of Energy to accelerate work on waste-to-energy frameworks.'],
      ['Why it matters to Filipinos','Flooding in Metro Manila is not only a weather problem. Drainage capacity, waste collection, pumping systems, river maintenance and land use all affect how quickly water recedes. A waste-to-energy push would also raise questions about cost, environmental safeguards, local siting and whether it reduces waste at the source or simply changes how waste is processed.'],
      ['What to watch next','Watch for a retrievable PCO or PNA release confirming the inspection, a written directive or agency timetable from DENR and DOE, and details on which waste-to-energy projects or regulatory changes the government intends to accelerate.']
    ],
    sources:[
      ['PNA article cited in the newsroom brief','https://www.pna.gov.ph/articles/1281555'],
      ['Philippine News Agency national news section','https://www.pna.gov.ph/categories/national']
    ]
  },
  {
    slug:'la-mesa-dam-reported-80-20-meters-august-11-2026',
    category:'Weather and Public Safety',
    kicker:'La Mesa Dam · Tullahan River · Flood monitoring',
    title:'Newsroom Brief Reports La Mesa Dam at 80.20 Meters as Tullahan River Monitoring Continues',
    deck:'The 1:00 p.m. FMB News brief cites a La Mesa Dam reading of 80.20 meters, slightly above its 80.15-meter spilling elevation, while downstream communities remain the focus of flood monitoring.',
    description:'FMB News publishes a source-attributed La Mesa Dam update from its August 11 editorial brief, with a verification note because the latest official PAGASA page available during publication did not display the cited reading.',
    image:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/La_Mesa_Dam%2C_Greater_Lagro_drone_%28Quezon_City%3B_03-07-2026%29.jpg/1280px-La_Mesa_Dam%2C_Greater_Lagro_drone_%28Quezon_City%3B_03-07-2026%29.jpg',
    credit:'FILE PHOTO: PATRICKROQUE01 / WIKIMEDIA COMMONS · CC BY-SA 4.0',
    alt:'Aerial view of La Mesa Dam and reservoir in Quezon City',
    caption:'File photo of La Mesa Dam taken in March 2026. The image does not depict the reported August 11 water level.',
    verification:'The FMB News editorial brief cites DOST-PAGASA and a linked news report for the 80.20-meter reading. During the final publication pass, the official PAGASA flood page available to FMB News did not display an August 11 reading, so the number is being published as a source-attributed newsroom-brief figure pending a retrievable current official bulletin.',
    sections:[
      ['What happened','The FMB News 1:00 p.m. editorial brief reports that La Mesa Dam measured 80.20 meters on the morning of August 11, or 0.05 meters above its 80.15-meter natural spilling elevation. The brief attributes the figure to PAGASA.'],
      ['Context','La Mesa is an ungated reservoir, which means excess water flows over its spillway rather than being released through manually operated floodgates. Water from the reservoir feeds into the Tullahan River system, making downstream monitoring important when the reservoir reaches spilling level.'],
      ['Why it matters to Filipinos','For residents along low-lying sections of the Tullahan River, even small changes in reservoir level can matter when combined with continuing rain, saturated ground and local drainage conditions. The most useful information is therefore not the dam number alone but the latest official flood advisory for a resident’s specific area.'],
      ['What to watch next','Check for a fresh PAGASA dam situationer, updated rainfall forecasts and local disaster-office advisories. Residents in flood-prone areas should follow current evacuation or safety instructions from local authorities rather than relying on an older water-level figure.']
    ],
    sources:[
      ['PAGASA flood and dam information','https://pagasa.dost.gov.ph/flood'],
      ['News report cited in the editorial brief','https://newsinfo.inquirer.net/2281965/pagasa-la-mesa-dams-water-level-still-exceeds-overflow-status'],
      ['Wikimedia Commons image and license record','https://commons.wikimedia.org/wiki/File:La_Mesa_Dam,_Greater_Lagro_drone_(Quezon_City;_03-07-2026).jpg']
    ]
  },
  {
    slug:'pdea-reports-98-million-drugs-139-arrests-august-11-2026',
    category:'Public Safety and Law Enforcement',
    kicker:'PDEA · Drug enforcement · Public safety',
    title:'PDEA-Cited Brief Reports ₱98 Million Drug Seizure and 139 Arrests in Nationwide Operations',
    deck:'An FMB News newsroom brief attributes to PDEA a total of 91 anti-illegal drug operations, ₱98 million in seized drugs and 139 arrests across several regions.',
    description:'FMB News publishes a source-attributed report from its August 11 editorial brief citing PDEA figures of ₱98 million in seized drugs and 139 arrests, with a verification note on the exact current source.',
    image:'https://upload.wikimedia.org/wikipedia/commons/e/eb/Philippine_Drug_Enforcement_Agency_seal.png',
    credit:'IMAGE: PHILIPPINE DRUG ENFORCEMENT AGENCY / WIKIMEDIA COMMONS · PUBLIC DOMAIN',
    alt:'Official seal of the Philippine Drug Enforcement Agency',
    caption:'Official PDEA seal. This is a contextual image, not a photograph of the reported August operations.',
    verification:'The FMB News editorial brief attributes these figures to the Philippine Drug Enforcement Agency and Philippine News Agency. The exact current PDEA or PNA report could not be independently retrieved during the final publication pass, so the figures below remain explicitly source-attributed.',
    sections:[
      ['What happened','The FMB News editorial brief says PDEA reported 91 anti-illegal drug operations conducted from July 30 to August 6, resulting in the seizure of illegal drugs valued at ₱98 million and the arrest of 139 suspects. The brief attributes the announcement to PDEA Director General Isagani Nerez.'],
      ['Context','The brief says the confiscated substances included shabu, marijuana and liquid ecstasy and that operations were conducted across multiple regions. FMB News is not independently identifying individual suspects in this report. Arrests are allegations and do not establish guilt; every accused person retains the presumption of innocence unless convicted by a court.'],
      ['Why it matters to Filipinos','Headline seizure values can show the scale of enforcement activity, but they do not by themselves measure whether illegal-drug availability, organized crime or community harm is declining. Public accountability also depends on lawful evidence handling, transparent case filing and court outcomes.'],
      ['What to watch next','Watch for the official PDEA release, case filings tied to the reported operations, laboratory confirmation of seized substances and follow-up reporting that distinguishes arrests from convictions.']
    ],
    sources:[
      ['Philippine News Agency national news section cited in the newsroom brief','https://www.pna.gov.ph/categories/national'],
      ['Philippine Drug Enforcement Agency official website','https://pdea.gov.ph/'],
      ['Wikimedia Commons PDEA seal record','https://commons.wikimedia.org/wiki/File:Philippine_Drug_Enforcement_Agency_seal.png']
    ]
  }
];

const cycleArticleHtml = (story) => {
  const href = `/news/${story.slug}/`;
  const canonical = `https://www.francinemariebautista.com${href}`;
  const schema = JSON.stringify({
    '@context':'https://schema.org',
    '@type':'NewsArticle',
    headline:story.title,
    description:story.description,
    datePublished:cyclePublished,
    dateModified:cyclePublished,
    inLanguage:'en-PH',
    isAccessibleForFree:true,
    author:{'@type':'Person',name:'Francine Marie Bautista'},
    publisher:{'@type':'Organization',name:'FMB News'},
    mainEntityOfPage:{'@type':'WebPage','@id':canonical},
    articleSection:story.category,
    image:[story.image]
  });
  const body = story.sections.map(([heading, paragraph]) => `<h2>${esc(heading)}</h2><p>${esc(paragraph)}</p>`).join('');
  const sources = story.sources.map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`).join('');
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(story.image)}"><meta property="article:published_time" content="${cyclePublished}"><script type="application/ld+json">${schema}</script><style>body{margin:0;background:#fff;color:#18111f;font-family:Manrope,Arial,sans-serif}.cycle-top{padding:12px 24px;background:#1d092f;color:#fff;font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.cycle-hero{padding:58px 24px 34px;background:linear-gradient(135deg,#faf7fc,#fff)}.cycle-wrap{width:min(1100px,calc(100% - 48px));margin:auto}.cycle-kicker{margin:0 0 10px;color:#70409b;font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.cycle-hero h1{max-width:14ch;margin:0;color:#1d092f;font-family:Cormorant Garamond,Georgia,serif;font-size:clamp(2.8rem,6vw,5.7rem);font-weight:600;line-height:.94}.cycle-deck{max-width:780px;margin:20px 0 0;color:#5e5365;font-size:1.08rem;line-height:1.7}.cycle-meta{margin-top:18px;color:#84788a;font-size:11px}.cycle-media{padding:24px 0;background:#fff}.cycle-media figure{margin:0;overflow:hidden;border-radius:16px;background:#eee;box-shadow:0 18px 45px rgba(29,9,47,.10)}.cycle-media img{display:block;width:100%;max-height:680px;object-fit:cover}.cycle-media figcaption{padding:10px 14px;color:#6f6574;font-size:9px;line-height:1.5}.cycle-body{padding:12px 0 80px}.cycle-inner{width:min(760px,calc(100% - 48px));margin:auto}.cycle-note{margin:12px 0 30px;padding:18px 20px;border-left:4px solid #8f63b2;background:#f7f1fb;color:#4f4057;font-size:.92rem;line-height:1.6}.cycle-body h2{margin:2em 0 .55em;color:#2b0d42;font-family:Cormorant Garamond,Georgia,serif;font-size:2.3rem;line-height:1}.cycle-body p{font-family:Georgia,'Times New Roman',serif;font-size:1.08rem;line-height:1.85;color:#332a37}.cycle-sources{margin-top:40px;padding:24px;border:1px solid rgba(43,13,66,.14);background:#fcfafc}.cycle-sources a{display:block;margin:.72rem 0;color:#5d2e86;word-break:break-word}@media(max-width:700px){.cycle-wrap{width:min(100% - 28px,1100px)}.cycle-inner{width:min(100% - 28px,760px)}.cycle-hero{padding-top:42px}.cycle-hero h1{font-size:clamp(2.5rem,12vw,4.2rem)}.cycle-media img{max-height:460px}}</style></head><body><div class="cycle-top">FMB News · August 11 News Cycle</div><header class="cycle-hero"><div class="cycle-wrap"><p class="cycle-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="cycle-deck">${esc(story.deck)}</p><p class="cycle-meta">By Francine Marie Bautista · Published ${cycleDateLabel}, ${cycleTimeLabel} · Source window: 7:00 a.m.–1:00 p.m. PHT</p></div></header><section class="cycle-media"><div class="cycle-wrap"><figure><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="eager"><figcaption><strong>${esc(story.credit)}</strong><br>${esc(story.caption)}</figcaption></figure></div></section><article class="cycle-body"><div class="cycle-inner"><div class="cycle-note"><strong>Verification note.</strong> ${esc(story.verification)}</div>${body}<section class="cycle-sources"><h2>Sources and public record</h2>${sources}</section></div></article></body></html>`;
};

for (const story of cycleStories) {
  const dir = path.join(dist, 'news', story.slug);
  await mkdir(dir, { recursive:true });
  await writeFile(path.join(dir, 'index.html'), cycleArticleHtml(story), 'utf8');
}

const cycleCards = cycleStories.map((story) => `<article class="fmb-cycle-card"><a href="/news/${story.slug}/"><div class="fmb-cycle-thumb"><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="lazy"></div><p>${esc(story.category)}</p><h3>${esc(story.title)}</h3><small>Published ${cycleTimeLabel}</small></a></article>`).join('');
const cycleSection = `<section class="fmb-aug11-cycle" id="aug11-1pm-news-cycle" aria-labelledby="aug11CycleTitle"><div class="fn9-shell"><div class="fmb-cycle-head"><div><p>FMB News · August 11 News Cycle</p><h2 id="aug11CycleTitle">Three reports from the 1:00 p.m. editorial package</h2><span>Published with explicit source-attribution and verification notes where the cited current source could not be independently retrieved.</span></div></div><div class="fmb-cycle-grid">${cycleCards}</div></div></section><style>.fmb-aug11-cycle{padding:56px 0 68px;background:#f8f4fa;color:#24112f}.fmb-cycle-head{margin-bottom:24px}.fmb-cycle-head p{margin:0 0 8px;color:#7a4da0;font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.fmb-cycle-head h2{max-width:16ch;margin:0;font-family:Cormorant Garamond,Georgia,serif;font-size:clamp(2.5rem,4.8vw,4.7rem);font-weight:600;line-height:.92}.fmb-cycle-head span{display:block;max-width:68ch;margin-top:14px;color:#746779;font-size:12px;line-height:1.6}.fmb-cycle-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.fmb-cycle-card{overflow:hidden;border:1px solid rgba(43,13,66,.12);border-radius:14px;background:#fff;box-shadow:0 12px 35px rgba(43,13,66,.07)}.fmb-cycle-card a{display:block;color:inherit;text-decoration:none}.fmb-cycle-thumb{aspect-ratio:16/10;overflow:hidden;background:#eee}.fmb-cycle-thumb img{width:100%;height:100%;object-fit:cover}.fmb-cycle-card p{margin:15px 17px 7px;color:#7a4da0;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.fmb-cycle-card h3{margin:0 17px;font-family:Cormorant Garamond,Georgia,serif;font-size:1.65rem;line-height:1.02}.fmb-cycle-card small{display:block;margin:14px 17px 18px;color:#8a7f8e;font-size:8px;text-transform:uppercase;letter-spacing:.06em}@media(max-width:900px){.fmb-cycle-grid{grid-template-columns:1fr}.fmb-cycle-card h3{font-size:2rem}}</style>`;

for (const relative of ['news/index.html','fmbnews/index.html']) {
  const file = path.join(dist, relative);
  let html = await readFile(file, 'utf8');
  html = html.replace(/<section class="fmb-aug11-cycle"[\s\S]*?<\/section><style>[\s\S]*?<\/style>/, '');
  const anchor = '<section class="fn9-reports" id="latest-reports"';
  if (html.includes(anchor)) html = html.replace(anchor, `${cycleSection}${anchor}`);
  else html = html.replace('</main>', `${cycleSection}</main>`);
  await writeFile(file, html, 'utf8');
}

const sitemapPath = path.join(dist, 'sitemap.xml');
let sitemap = await readFile(sitemapPath, 'utf8');
for (const story of cycleStories) {
  const loc = `https://www.francinemariebautista.com/news/${story.slug}/`;
  if (!sitemap.includes(loc)) sitemap = sitemap.replace('</urlset>', `<url><loc>${loc}</loc><lastmod>2026-08-11</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url></urlset>`);
}
await writeFile(sitemapPath, sitemap, 'utf8');

console.log('Corrected Morning Special metadata and published three source-attributed FMB News reports from the August 11 1:00 p.m. editorial package.');
