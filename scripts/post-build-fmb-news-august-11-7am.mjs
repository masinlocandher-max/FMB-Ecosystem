import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(root, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const sitemapPath = path.join(root, 'dist', 'sitemap.xml');
const published = '2026-08-11T07:00:00+08:00';
const publishedLabel = '11 August 2026, 7:00 a.m. PHT';
const dateLabel = '11 August 2026';
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const stories = [
  {
    slug:'malacanang-suspends-classes-wfh-zambales-bataan-mindoro-manila-august-11-2026',
    category:'Government & Public Policy',
    kicker:'Habagat · Public Safety · Work and Classes',
    title:'Malacañang Orders Work-from-Home and Alternative Classes in Zambales, Bataan, Occidental Mindoro and Manila',
    deck:'Government offices shift to remote work and schools move to alternative learning arrangements as persistent Habagat rains continue to threaten flood-prone communities.',
    description:'Malacañang ordered work-from-home arrangements for covered government offices and alternative learning for schools in Zambales, Bataan, Occidental Mindoro and Manila on August 11, 2026 amid Habagat rains.',
    image:'https://pia.gov.ph/wp-content/uploads/2025/07/Govt-work-classes-suspended-in-NCR-several-provinces-due-to-heavy-rains-%E2%80%94-Palace.jpg',
    credit:'PHOTO: PCO VIA PHILIPPINE INFORMATION AGENCY / FILE',
    alt:'Malacañang public advisory image on government work and class suspensions during heavy rains',
    sections:[
      ['What happened','Malacañang directed covered government offices to shift to work-from-home arrangements and schools to adopt alternative learning modes on Tuesday, August 11, in Zambales, Bataan, Occidental Mindoro and the City of Manila as persistent southwest monsoon rains continue to affect western Luzon.'],
      ['What we know','The directive exempts agencies responsible for basic and health services, disaster preparedness and response, and other vital public services so frontline operations can continue. Private employers in affected areas were urged to consider flexible work arrangements based on local conditions and employee safety.'],
      ['Context','The southwest monsoon has produced repeated heavy-rain episodes across western and central Luzon, with local governments issuing additional localized suspensions and flood advisories. Similar Palace directives during previous Habagat events have kept essential services operational while allowing non-frontline personnel to work under alternate arrangements.'],
      ['Why it matters to Filipinos','The order affects commuters, government workers, students, families and businesses across several flood-prone areas. Clear work and class arrangements can reduce unnecessary travel while allowing essential public services to continue.'],
      ['What remains unclear','The timing of a full return to face-to-face classes and regular government office operations will depend on updated weather and flood conditions.'],
      ['What to watch next','Watch local government advisories, PAGASA rainfall bulletins and any follow-up Palace directive for Wednesday arrangements.']
    ],
    sources:[
      ['ABS-CBN News, class and government work arrangements for August 11, 2026','https://www.abs-cbn.com/news/weather-traffic/2026/8/10/-walangpasok-class-suspensions-for-august-11-2026-due-to-bad-weather-1820'],
      ['Inquirer.net, class and work suspensions on August 11','https://newsinfo.inquirer.net/2281365/walang-pasok-class-suspensions-on-aug-11'],
      ['Philippine Information Agency / PCO, background on Palace work and class suspension rules during Habagat','https://pia.gov.ph/news/govt-work-classes-suspended-in-ncr-several-provinces-due-to-heavy-rains-palace/']
    ]
  },
  {
    slug:'major-fuel-price-rollback-august-11-2026-diesel-gasoline',
    category:'Economy & Cost of Living',
    kicker:'Fuel Prices · Transport · Cost of Living',
    title:'Major Fuel Price Rollback Takes Effect as Diesel Drops ₱5.00 Per Liter',
    deck:'Diesel, gasoline and kerosene prices move lower at the pump, offering immediate relief to motorists and transport operators after weeks of upward pressure.',
    description:'Oil companies implemented a major fuel price rollback on August 11, 2026, cutting diesel by ₱5.00 per liter, gasoline by ₱2.40 and kerosene by ₱3.75.',
    image:'https://pia.gov.ph/wp-content/uploads/2026/04/IMG_6892-1-scaled.jpg',
    credit:'PHOTO: PHILIPPINE INFORMATION AGENCY / FILE',
    alt:'Fuel station pumps in the Philippines during a major price rollback',
    sections:[
      ['What happened','Oil companies implemented a major fuel price rollback effective Tuesday morning, August 11, cutting diesel by ₱5.00 per liter, gasoline by ₱2.40 per liter and kerosene by ₱3.75 per liter.'],
      ['What we know','Major fuel retailers announced the reductions ahead of Tuesday implementation. The rollback follows weaker international petroleum prices after a period of repeated increases that raised operating costs for transport workers, delivery riders, businesses and households.'],
      ['Context','Fuel prices in the Philippines are adjusted regularly in response to international market movements, foreign-exchange conditions and industry pricing. Because the country imports much of its petroleum requirement, global changes can quickly reach domestic pump prices.'],
      ['Why it matters to Filipinos','Lower diesel and gasoline prices can reduce the immediate cost of transport, logistics, farming and delivery work. The effect on food and other consumer prices is usually less immediate because businesses also factor in wages, inventory, electricity and other operating costs.'],
      ['What remains unclear','One rollback does not establish a lasting downward trend. Global oil prices remain sensitive to supply decisions, demand expectations, geopolitical events and currency movements.'],
      ['What to watch next','The Department of Energy and oil firms will release the next weekly price assessment after another round of international trading data.']
    ],
    sources:[
      ['ABS-CBN News, big-time rollback in fuel prices set on August 11','https://www.abs-cbn.com/news/business/2026/8/10/big-time-rollback-in-fuel-prices-set-on-aug-11-1216'],
      ['Department of Energy Philippines, retail pump price monitoring','https://legacy.doe.gov.ph/retail-pump-price-quality-service-dashboard'],
      ['Philippine Information Agency, background on fuel-price rollbacks and consumer impact','https://pia.gov.ph/news/big-time-fuel-rollback-hits-pumps/']
    ]
  },
  {
    slug:'bir-extends-tax-filing-payment-deadlines-august-28-2026-habagat',
    category:'Finance & Tax Policy',
    kicker:'BIR · Tax Relief · Habagat',
    title:'BIR Extends Tax Filing and Payment Deadlines to August 28 for Flood-Affected Revenue Districts',
    deck:'The tax agency grants additional time to taxpayers in Habagat-affected areas, allowing covered returns and payments to be completed without late-filing penalties within the extension period.',
    description:'The BIR extended selected tax filing and payment deadlines to August 28, 2026 for taxpayers under flood-affected revenue districts and large taxpayer divisions in Luzon.',
    image:'https://pia.gov.ph/wp-content/uploads/2026/03/Cover-photo-5-2.jpg',
    credit:'PHOTO: PHILIPPINE INFORMATION AGENCY / BIR-CAR FILE',
    alt:'Bureau of Internal Revenue officials during a 2026 tax information campaign',
    sections:[
      ['What happened','The Bureau of Internal Revenue extended selected tax filing and payment deadlines for taxpayers registered in flood-affected revenue districts and large taxpayer divisions in Luzon following severe Habagat-related disruption.'],
      ['What we know','The editorial package identifies Revenue Memorandum Circular No. 88-2026 as the basis for moving covered obligations falling due from August 7 to August 15 to a new deadline of August 28, without late-filing surcharges, interest or compromise penalties when the circular applies.'],
      ['Who may be covered','The relief is intended for taxpayers registered under the revenue offices specifically listed in the BIR circular. Taxpayers should confirm that their RDO or large-taxpayer division is included before relying on the extension.'],
      ['Why it matters to Filipinos','Flooding can interrupt access to offices, banks, records, employees and internet connections. A deadline extension gives affected households and businesses additional time to comply without adding penalties to an already disruptive disaster period.'],
      ['What remains unclear','Coverage depends on the exact list of revenue offices and tax obligations in the final BIR circular. Taxpayers with unusual filings or transactions should verify the applicable deadline directly with the BIR.'],
      ['What to watch next','Watch for BIR implementation guidance, any additional areas added to the relief list, and further extensions if severe weather continues.']
    ],
    sources:[
      ['Bureau of Internal Revenue, official website and issuances','https://www.bir.gov.ph/'],
      ['Philippine Information Agency, BIR taxpayer filing background','https://pia.gov.ph/news/bir-cordillera-reminds-taxpayers-pay-taxes-before-april-15-deadline/']
    ]
  }
];

const storyHtml = story => {
  const href = `/news/${story.slug}/`;
  const canonical = `https://www.francinemariebautista.com${href}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:story.title,description:story.description,datePublished:published,dateModified:published,inLanguage:'en-PH',isAccessibleForFree:true,author:{'@type':'Person',name:'Francine Marie Bautista'},publisher:{'@type':'Organization',name:'FMB News'},mainEntityOfPage:{'@type':'WebPage','@id':canonical},articleSection:story.category,image:[story.image]});
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(story.title)} | FMB News</title><meta name="description" content="${esc(story.description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(story.title)}"><meta property="og:description" content="${esc(story.deck)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${esc(story.image)}"><meta property="article:published_time" content="${published}"><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/assets/css/site.css?v=20260716g"><link rel="stylesheet" href="/assets/css/news-channel.css?v=20260720a"><link rel="stylesheet" href="/assets/css/fmb-news-luxury.css?v=20260722-luxury-v3"><style>.fmb-photo{position:relative;overflow:hidden;background:#07152f}.fmb-photo img{display:block;width:100%;max-height:760px;object-fit:cover}.fmb-photo-credit{position:absolute;right:10px;bottom:10px;padding:5px 8px;background:rgba(4,10,25,.78);color:#fff;font:700 10px/1.2 Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase}.nc-sources a{display:block;margin:.65rem 0}</style></head><body class="news-route news-story-route"><main id="story"><div class="nc-story-masthead"><div class="wrap"><a class="nc-back-link" href="/news/">Back to headlines</a><span>${publishedLabel}</span></div></div><header class="nc-article-hero"><div class="wrap"><p class="nc-kicker">${esc(story.kicker)}</p><h1>${esc(story.title)}</h1><p class="nc-article-deck">${esc(story.deck)}</p><div class="nc-article-meta"><span>By FMB News</span><span>Published ${publishedLabel}</span><span>Philippines</span></div></div></header><section class="nc-story-media"><div class="wrap"><figure class="news-visual fmb-photo"><img src="${esc(story.image)}" alt="${esc(story.alt)}" loading="eager"><span class="fmb-photo-credit">${esc(story.credit)}</span><figcaption>${esc(story.credit.replace('PHOTO: ','Photo: '))}</figcaption></figure></div></section><article class="nc-article"><div class="wrap nc-article-layout"><div class="nc-story-body"><div class="nc-factbox"><p><strong>Category:</strong> ${esc(story.category)}</p><p><strong>Editorial standard:</strong> Facts are sourced below. Developing details are identified and should be checked against the latest official advisories.</p></div>${story.sections.map(([h,p])=>`<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}<section class="nc-sources"><h2>Sources and public record</h2>${story.sources.map(([l,u])=>`<a href="${u}" target="_blank" rel="noopener noreferrer">${esc(l)}</a>`).join('')}</section></div></div></article></main></body></html>`;
};

await mkdir(newsRoot,{recursive:true});
let landing = await readFile(landingPath,'utf8');
for (const story of stories) {
  const href = `/news/${story.slug}/`;
  await mkdir(path.join(newsRoot,story.slug),{recursive:true});
  await writeFile(path.join(newsRoot,story.slug,'index.html'),storyHtml(story),'utf8');
  if (!landing.includes(href)) {
    const card = `<article class="nc-rundown-story"><a href="${href}"><span class="nc-rundown-number">NEW</span><figure class="news-visual fmb-photo"><img src="${esc(story.image)}" loading="lazy" decoding="async" alt="${esc(story.alt)}"><span class="fmb-photo-credit">${esc(story.credit)}</span><figcaption>${esc(story.credit.replace('PHOTO: ','Photo: '))}</figcaption></figure><div><p>${esc(story.category)} · ${dateLabel}</p><h3>${esc(story.title)}</h3><span>FMB News</span></div></a></article>`;
    const marker = '<div class="nc-rundown-head">';
    if (landing.includes(marker)) {
      const headStart = landing.indexOf(marker);
      const headEnd = landing.indexOf('</div>',headStart);
      const insertAt = landing.indexOf('</div>',headEnd + 6) + 6;
      landing = `${landing.slice(0,insertAt)}${card}${landing.slice(insertAt)}`;
    } else {
      landing = landing.replace('</main>',`${card}</main>`);
    }
  }
}
landing = landing.replace('</head>','<style>.fmb-photo{position:relative;overflow:hidden}.fmb-photo img{display:block;width:100%;height:100%;object-fit:cover}.fmb-photo-credit{position:absolute;right:8px;bottom:8px;padding:4px 7px;background:rgba(4,10,25,.78);color:#fff;font:700 9px/1.2 Arial,sans-serif;letter-spacing:.03em;text-transform:uppercase}</style></head>');
landing = landing.replace(/<time(?: data-news-updated)?>(?:Updated )?[^<]*<\/time>/,`<time data-news-updated>Updated ${publishedLabel}</time>`);
await writeFile(landingPath,landing,'utf8');

try {
  let sitemap = await readFile(sitemapPath,'utf8');
  for (const story of stories) {
    const canonical = `https://www.francinemariebautista.com/news/${story.slug}/`;
    if (!sitemap.includes(canonical)) sitemap = sitemap.replace('</urlset>',`<url><loc>${canonical}</loc><lastmod>2026-08-11</lastmod></url></urlset>`);
  }
  await writeFile(sitemapPath,sitemap,'utf8');
} catch {}

console.log(`Published ${stories.length} FMB News reports for the August 11, 2026 7:00 a.m. PHT package.`);
