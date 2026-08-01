import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const published = '2026-08-02T01:30:00+08:00';
const displayDate = '2 August 2026';

const story = {
  slug: 'early-briefing-august-2-2026',
  section: 'Philippines and world',
  kicker: 'Early briefing · Philippines · Zambales · World',
  read: '9 min read',
  title: 'Early 2 August Briefing: Luis Forms as China Holds Drills at Bajo de Masinloc',
  meta: 'FMB News tracks Tropical Depression Luis, Chinese drills at Bajo de Masinloc, Filipino seafarers in the Black Sea, a Zambales wildlife rescue, airfare surcharges and WorldPride.',
  deck: 'Six verified developments, led by the newest public-safety bulletin and followed by reports with direct consequences for Zambales, Filipino workers, travelers and LGBTQ+ communities.',
  image: '/assets/images/news/august-2-2026-early-briefing.svg',
  alt: 'FMB News Center early briefing visual for 2 August 2026 with Philippine sun, sea and weather signals',
  sections: [
    {
      heading: 'Tropical Depression Luis forms east of Luzon',
      paragraphs: [
        'PAGASA said the low-pressure area east of Infanta, Quezon developed into Tropical Depression Luis on Saturday evening. In its 11 p.m. bulletin, the weather bureau placed the Polillo Islands, the eastern portion of Camarines Norte and the northern portion of Catanduanes under Tropical Cyclone Wind Signal No. 1.',
        'At 10 p.m., Luis was estimated 360 kilometers east of Daet, Camarines Norte, carrying maximum sustained winds of 45 kilometers per hour and gusts of up to 55 kilometers per hour while moving westward at 15 kilometers per hour. PAGASA forecast the center to remain over the Philippine Sea, but said a westward shift and a close approach or landfall scenario could not be ruled out. Weather conditions can change quickly, so readers should use the newest PAGASA bulletin rather than this article as a standing forecast.',
      ],
    },
    {
      heading: 'China conducts joint drills around Bajo de Masinloc',
      paragraphs: [
        'China’s military and coast guard conducted joint air and naval combat drills around Scarborough Shoal, known in the Philippines as Bajo de Masinloc, according to Chinese state media reports carried by Reuters. Beijing described the exercises as a response to actions by unnamed countries and again rejected Philippine territorial-sea baselines around the shoal.',
        'Reuters also reported that China issued new administrative rules for a nature reserve it declared at the shoal in 2025 and said its coast guard would maintain regular patrols. Those are Chinese government claims and actions, not a settlement of sovereignty or maritime rights. The Philippine embassy in Beijing had not immediately responded to Reuters at the time of publication.',
      ],
    },
    {
      heading: 'Third Filipino seafarer confirmed dead in Black Sea attacks',
      paragraphs: [
        'The Department of Migrant Workers said a third Filipino seafarer had died amid attacks on commercial vessels in the northern Black Sea. Secretary Hans Leo Cacdac said 236 Filipino seafarers aboard 17 vessels had been affected: three were killed, 15 injured, one remained missing and 217 were accounted for as safe.',
        'The DMW said 89 affected Filipinos had already returned to the Philippines, including nine injured seafarers. The agency reiterated its high-risk advisory, called for Filipinos to be moved from attacked ships and advised ship owners against deploying Filipino crews to the northern Black Sea while the armed conflict continues.',
      ],
    },
    {
      heading: 'Three endangered saltwater crocodiles rescued in San Felipe, Zambales',
      paragraphs: [
        'Three critically endangered saltwater crocodiles were rescued during a wildlife extraction operation in San Felipe, according to the Department of Environment and Natural Resources in Central Luzon, as reported by The Philippine Star.',
        'The animals were transferred to Zoobic Safari for assessment, specialized medical care and secure long-term management. The report also reminded the public that possession, transport and maintenance of wildlife are regulated under Republic Act No. 9147, with conservation, animal welfare and public safety all requiring lawful handling.',
      ],
    },
    {
      heading: 'Airline fuel surcharge rises to Level 13 for 1 to 15 August',
      paragraphs: [
        'The Civil Aeronautics Board raised the allowable fuel surcharge from Level 8 to Level 13 for the first half of August. Under the Level 13 matrix, the surcharge may range from ₱423 to ₱1,237 for domestic flights and from ₱1,396.74 to ₱10,385.42 for international flights, depending on distance.',
        'A fuel surcharge is separate from the base fare and is intended to help airlines respond to volatile fuel costs. Airlines must still follow the CAB matrix and applicable filing rules. Travelers comparing fares should check the complete final price, not only the advertised base fare.',
      ],
    },
    {
      heading: 'WorldPride fills Amsterdam under tighter security',
      paragraphs: [
        'Hundreds of thousands of people lined Amsterdam’s canals for the flagship WorldPride parade, combining celebration with a public demonstration for LGBTQ+ rights. The event’s theme was “UNITY,” and Dutch Prime Minister Rob Jetten, the country’s first openly gay prime minister, attended.',
        'Security was strengthened after the deadly attack near Berlin’s Pride celebration a week earlier. Organizers and participants told Reuters that the violence made public visibility and solidarity more urgent, while police patrolled by bicycle, boat, jet ski and car. The gathering showed that Pride remains both cultural celebration and civic assertion when safety and equal rights are under pressure.',
      ],
    },
  ],
  sources: [
    ['PAGASA Tropical Cyclone Bulletin', 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin'],
    ['GMA News report on Tropical Depression Luis', 'https://www.gmanetwork.com/news/weather/content/997034/tropical-depression-luis-moves-west-3-luzon-areas-under-signal-no-1/story/'],
    ['Reuters report on the Bajo de Masinloc drills', 'https://www.reuters.com/world/china/china-conducts-naval-air-patrols-around-disputed-shoal-south-china-sea-2026-08-01/'],
    ['Philippine News Agency report on Filipino seafarers', 'https://www.pna.gov.ph/articles/1280866'],
    ['The Philippine Star report on the Black Sea casualties', 'https://www.philstar.com/headlines/2026/08/01/2546293/third-filipino-seafarer-dies-black-sea-attacks'],
    ['The Philippine Star report on the Zambales wildlife rescue', 'https://www.philstar.com/nation/2026/08/01/2546119/3-endangered-saltwater-crocodiles-rescued-zambales'],
    ['Philippine News Agency report on the airline fuel surcharge', 'https://www.pna.gov.ph/articles/1280532'],
    ['Reuters report from Amsterdam WorldPride', 'https://www.reuters.com/world/thousands-expected-amsterdam-boisterous-worldpride-shadow-berlin-attack-2026-08-01/'],
  ],
};

function esc(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function page() {
  const url = `https://www.francinemariebautista.com/news/${story.slug}/`;
  const sourceLinks = story.sources
    .map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`)
    .join('');
  const body = story.sections
    .map(({ heading, paragraphs }) => `<h2>${esc(heading)}</h2>${paragraphs.map(text => `<p>${esc(text)}</p>`).join('')}`)
    .join('\n');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: story.title,
    description: story.meta,
    datePublished: published,
    dateModified: published,
    inLanguage: 'en-PH',
    isAccessibleForFree: true,
    author: {
      '@type': 'Person',
      name: 'Francine Marie Bautista',
      url: 'https://www.francinemariebautista.com/aboutfmb/',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FMB News Center',
      url: 'https://www.francinemariebautista.com/fmbnews/',
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: story.section,
    image: `https://www.francinemariebautista.com${story.image}`,
  });

  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.meta)}"><meta name="author" content="Francine Marie Bautista"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:locale" content="en_PH"><meta property="og:site_name" content="FMB News Center"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.meta)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://www.francinemariebautista.com${story.image}"><meta property="og:image:width" content="1536"><meta property="og:image:height" content="864"><meta property="og:image:alt" content="${esc(story.alt)}"><meta property="article:published_time" content="${published}"><meta property="article:modified_time" content="${published}"><meta property="article:author" content="Francine Marie Bautista"><meta property="article:section" content="${esc(story.section)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(story.title)}"><meta name="twitter:description" content="${esc(story.meta)}"><meta name="twitter:image" content="https://www.francinemariebautista.com${story.image}"><script type="application/ld+json">${schema}</script><link rel="icon" href="/assets/images/fmb-approved/fmb-master-purple-square.webp" type="image/webp"><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/fmb-polish.css?v=20260717a"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"></head><body class="news-route news-story-route"><a class="nc-skip" href="#story">Skip to the story</a><header class="nc-site-header"><div class="nc-brandline"><div class="wrap"><span class="nc-network-label"><i></i> FMB News Center</span><span class="nc-network-clock"><time data-news-clock>Philippine Standard Time</time><b>PHT</b></span></div></div><div class="nc-nav-shell wrap"><a class="nc-publication-brand" href="/news/" aria-label="FMB News Center front page"><span>FMB News Center</span></a><nav class="nc-site-links" id="newsNav" aria-label="News navigation"><a href="/news/">Headlines</a><a href="/news/#philippines">Philippines</a><a href="/news/#world">World</a><a href="/news/#culture">Culture</a></nav></div></header><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span class="nc-story-edition">FMB News Center · ${displayDate}</span></div></div><header class="nc-article-hero"><div class="wrap"><div class="nc-article-hero-grid"><div><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1></div><p class="nc-article-deck">${esc(story.deck)}</p></div><div class="nc-article-meta"><span>By Francine Marie Bautista</span><span>Published ${displayDate}</span><span>${story.read}</span><span>Eight source links</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual"><img src="${story.image}" width="1536" height="864" alt="${esc(story.alt)}" fetchpriority="high" decoding="async"><figcaption>Original FMB News Center briefing visual. Reporting sources and the publication cutoff appear below.</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><aside class="nc-story-aside"><dl><div><dt>Desk</dt><dd>${esc(story.section)}</dd></div><div><dt>Format</dt><dd>Early briefing</dd></div><div><dt>Published</dt><dd>${displayDate}</dd></div></dl><button class="nc-share-button" type="button" data-news-share>Share this report</button></aside><div class="nc-story-body"><div class="nc-factbox"><p><strong>Publication cutoff:</strong> This briefing was completed at 1:30 a.m. Philippine Standard Time on 2 August 2026. Weather bulletins and developing events may change after publication.</p></div><p><strong>${esc(story.deck)}</strong></p>${body}<section class="nc-sources"><h2>Sources and public record</h2>${sourceLinks}</section></div><aside class="nc-story-rail"><p>More from this edition</p><a href="/news/marcos-authorizes-release-sara-duterte-tax-records/">Sara Duterte tax records authorized for release<span>Philippines</span></a><a href="/news/marcos-tax-relief-workers-small-businesses/">Tax relief proposals move to Congress<span>Economy</span></a><a href="/news/">Return to all headlines<span>FMB News Center</span></a></aside></div></article></main><footer class="nc-footer"><div class="wrap"><div class="nc-footer-bottom"><span>© 2026 Francine Marie Bautista. All rights reserved.</span><span>FMB News Center · Early briefing</span></div></div></footer><script src="/assets/js/news-channel.js?v=20260719-broadcast-v3"></script></body></html>`;
}

function normalizeStructuredPositions(html) {
  const marker = '"itemListElement":[';
  const start = html.indexOf(marker);
  const end = html.indexOf(']', start);
  if (start < 0 || end < 0) throw new Error('August 2 briefing: structured story list not found');
  let position = 0;
  const list = html.slice(start, end).replace(/"position":\d+/g, () => `"position":${++position}`);
  return `${html.slice(0, start)}${list}${html.slice(end)}`;
}

function normalizeVisibleIndex(html) {
  const start = html.indexOf('<ol class="nc-index-list">');
  const end = html.indexOf('</ol>', start);
  if (start < 0 || end < 0) throw new Error('August 2 briefing: visible story index not found');
  let position = 0;
  const list = html.slice(start, end).replace(
    /(<span class="nc-index-number">)[^<]+/g,
    (match, opening) => `${opening}${String(++position).padStart(2, '0')}`,
  );
  return `${html.slice(0, start)}${list}${html.slice(end)}`;
}

const storyDirectory = path.join(newsRoot, story.slug);
await mkdir(storyDirectory, { recursive: true });
await writeFile(path.join(storyDirectory, 'index.html'), page(), 'utf8');

let landing = await readFile(landingPath, 'utf8');
const href = `/news/${story.slug}/`;

if (!landing.includes(href)) {
  const wireNeedle = '<div class="nc-wire-track">';
  if (!landing.includes(wireNeedle)) throw new Error('August 2 briefing: news wire not found');
  landing = landing.replace(wireNeedle, `${wireNeedle}<span>${esc(story.title)}</span>`);

  const rundownStart = landing.indexOf('<div class="nc-rundown-head">');
  const firstArticle = landing.indexOf('<article class="nc-rundown-story"', rundownStart);
  if (rundownStart < 0 || firstArticle < 0) throw new Error('August 2 briefing: latest reports panel not found');
  const card = `<article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">NEW</span><figure class="news-visual"><img src="${story.image}" width="1536" height="864" loading="lazy" decoding="async" alt="${esc(story.alt)}"><figcaption>Original FMB News Center briefing visual. Full sources appear in the report.</figcaption></figure><div><p>${esc(story.kicker)}</p><h3>${esc(story.title)}</h3><span>${story.read}</span></div></a></article>\n        `;
  landing = `${landing.slice(0, firstArticle)}${card}${landing.slice(firstArticle)}`;

  const structuredNeedle = '"itemListElement":[';
  landing = landing.replace(
    structuredNeedle,
    `${structuredNeedle}\n        {"@type":"ListItem","position":1,"url":"https://www.francinemariebautista.com${href}","name":${JSON.stringify(story.title)}},`,
  );

  const indexNeedle = '<ol class="nc-index-list">';
  const indexEntry = `\n    <li><a href="${href}"><span class="nc-index-number">01</span><span class="nc-index-category">${esc(story.kicker)}</span><strong>${esc(story.title)}</strong><span class="nc-index-action">${esc(story.deck)}</span></a></li>`;
  landing = landing.replace(indexNeedle, `${indexNeedle}${indexEntry}`);
}

landing = landing.replace(
  /<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/,
  `<time data-news-updated>Updated ${displayDate}</time>`,
);
landing = normalizeStructuredPositions(landing);
landing = normalizeVisibleIndex(landing);
await writeFile(landingPath, landing, 'utf8');

let sitemap = await readFile(sitemapPath, 'utf8');
sitemap = sitemap.replace(
  /(<loc>https:\/\/www\.francinemariebautista\.com\/news\/<\/loc><lastmod>)[^<]+/,
  `$1${published.slice(0, 10)}`,
);
const absoluteStoryUrl = `https://www.francinemariebautista.com${href}`;
if (!sitemap.includes(`<loc>${absoluteStoryUrl}</loc>`)) {
  const entry = `  <url><loc>${absoluteStoryUrl}</loc><lastmod>${published.slice(0, 10)}</lastmod><changefreq>daily</changefreq><priority>0.9</priority><image:image><image:loc>https://www.francinemariebautista.com${story.image}</image:loc><image:title>${esc(story.title)}</image:title><image:caption>Original FMB News Center early briefing visual for ${displayDate}.</image:caption></image:image></url>\n`;
  sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
}
await writeFile(sitemapPath, sitemap, 'utf8');

console.log(`Published the verified ${displayDate} early briefing with ${story.sections.length} developments and ${story.sources.length} visible source links.`);
