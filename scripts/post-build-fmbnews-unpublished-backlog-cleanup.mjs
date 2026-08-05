import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const sitemapPath = path.join(dist, 'sitemap.xml');

const stories = [
  {
    slug: 'us-fuel-waiver-global-oil-volatility',
    date: '5 August 2026',
    isoCreated: '2026-08-05',
    category: 'World · Energy',
    filter: 'world',
    title: 'U.S. Weighs Extending Shipping Waiver as Fuel-Price Pressure Persists',
  },
  {
    slug: 'north-korea-japan-tomahawk-warning',
    date: '4 August 2026',
    isoCreated: '2026-08-04',
    category: 'World · Security',
    filter: 'world',
    title: 'North Korea Warns of Additional Measures After Japan’s Tomahawk Test',
  },
  {
    slug: 'sara-duterte-impeachment-per-article-format-july-28-2026',
    date: '28 July 2026',
    isoCreated: '2026-07-28',
    category: 'Impeachment Trial',
    filter: 'national',
    title: 'Prosecution Backs Article-by-Article Trial Format to Shorten Timetable',
  },
  {
    slug: 'sara-duterte-impeachment-prosecution-rests-article-iv-july-24-2026',
    date: '24 July 2026',
    isoCreated: '2026-07-24',
    category: 'Impeachment Trial',
    filter: 'national',
    title: 'Prosecution Formally Rests Article IV After Three NBI Witnesses',
  },
  {
    slug: 'sara-duterte-impeachment-financial-subpoenas-july-20-2026',
    date: '20 July 2026',
    isoCreated: '2026-07-20',
    category: 'Impeachment Trial',
    filter: 'national',
    title: 'Impeachment Court Grants Limited Subpoenas for Financial and Tax Records',
  },
  {
    slug: 'sara-duterte-impeachment-witnesses-withdrawn-july-15-2026',
    date: '15 July 2026',
    isoCreated: '2026-07-15',
    category: 'Impeachment Trial',
    filter: 'national',
    title: 'Prosecution Drops Planned Witnesses and Narrows Article IV Presentation',
  },
];

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function cleanInternalProductionNotes(html, story) {
  let cleaned = html.replace(
    /<div\b[^>]*class=(["'])[^"']*\bnc-factbox\b[^"']*\1[^>]*>\s*<p><strong>SEO title:<\/strong>[\s\S]*?<\/div>\s*/gi,
    '',
  );
  cleaned = cleaned
    .replace(/<p><strong>SEO title:<\/strong>[\s\S]*?<p><strong>Pubmat text:<\/strong>[\s\S]*?<\/p>\s*/gi, '')
    .replace(/<meta\s+name=(["'])robots\1[^>]*>\s*/gi, '')
    .replace('</head>', '<meta name="robots" content="index,follow,max-image-preview:large"></head>');

  cleaned = cleaned.replace(
    /<script\b([^>]*)type=(["'])application\/ld\+json\2([^>]*)>([\s\S]*?)<\/script>/gi,
    (whole, before, quote, after, jsonText) => {
      try {
        const data = JSON.parse(jsonText);
        if (data?.['@type'] !== 'NewsArticle') return whole;
        data.dateCreated = story.isoCreated;
        data.articleSection = story.category;
        data.isAccessibleForFree = true;
        data.publisher = {
          '@type': 'Organization',
          name: 'FMB News',
          url: 'https://www.francinemariebautista.com/fmbnews/',
        };
        return `<script${before}type=${quote}application/ld+json${quote}${after}>${JSON.stringify(data)}</script>`;
      } catch {
        return whole;
      }
    },
  );

  if (/SEO title:|Facebook caption:|Pubmat text:/i.test(cleaned)) {
    throw new Error(`${story.slug} still exposes internal production copy`);
  }
  if (!cleaned.includes(`dateCreated":"${story.isoCreated}`) && !cleaned.includes(`"dateCreated":"${story.isoCreated}"`)) {
    throw new Error(`${story.slug} has no normalized creation date`);
  }
  return cleaned;
}

function backlogCard(story) {
  const href = `/news/${story.slug}/`;
  const image = `/assets/images/news/${story.slug}.svg`;
  return `<article class="nc-rundown-story fn9-report-card fmb-verified-backlog-card" data-category="${story.filter}" data-fn9-searchable data-fmb-backlog-story="${story.slug}"><a href="${href}"><span class="nc-rundown-number">Verified</span><figure class="news-visual"><img src="${image}" width="1080" height="1350" loading="lazy" decoding="async" alt="${esc(story.title)}"><figcaption>Original FMB News editorial illustration.</figcaption></figure><div><p>${esc(story.category)} · ${esc(story.date)}</p><h3>${esc(story.title)}</h3><span>Filed earlier; published after independent re-verification on 5 August 2026</span></div></a></article>`;
}

function backlogSection() {
  return `<section class="fn9-reports fn9-backlog-reports" id="recovered-reports" data-fmb-verified-backlog="aug5" aria-labelledby="recoveredReportsTitle"><div class="fn9-shell"><div class="fn9-section-heading"><div><p class="nc-kicker">Publication recovery</p><h2 id="recoveredReportsTitle">Recovered and independently verified reports</h2><p>These reports were held from publication, re-verified, and released on 5 August 2026. They are arranged below by their original report date.</p></div></div><div class="fn9-report-grid">${stories.map(backlogCard).join('')}</div></div></section>`;
}

function backlogSchema() {
  return `<script type="application/ld+json" data-fmb-verified-backlog-schema>${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': 'https://www.francinemariebautista.com/fmbnews/#recovered-reports',
    name: 'Recovered and independently verified FMB News reports',
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: stories.length,
    itemListElement: stories.map((story, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://www.francinemariebautista.com/news/${story.slug}/`,
      name: story.title,
    })),
  })}</script>`;
}

function integrateBacklogSection(html, routeName) {
  let repaired = html
    .replace(/<section\b[^>]*data-unpublished-backlog=(["'])aug5\1[^>]*>[\s\S]*?<\/section>\s*/gi, '')
    .replace(/<section\b[^>]*data-fmb-verified-backlog=(["'])aug5\1[^>]*>[\s\S]*?<\/section>\s*/gi, '')
    .replace(/<script\b[^>]*data-fmb-verified-backlog-schema[^>]*>[\s\S]*?<\/script>\s*/gi, '');

  const insertionPoint = repaired.search(/<section\b[^>]*class=(["'])[^"']*\bfn9-about-band\b[^"']*\1/i);
  if (insertionPoint < 0) throw new Error(`${routeName} has no about-band insertion point`);
  repaired = `${repaired.slice(0, insertionPoint)}${backlogSection()}${repaired.slice(insertionPoint)}`;
  repaired = repaired.replace('</head>', `${backlogSchema()}</head>`);

  const section = repaired.match(/<section\b[^>]*data-fmb-verified-backlog=(["'])aug5\1[^>]*>[\s\S]*?<\/section>/i)?.[0] || '';
  let previous = -1;
  for (const story of stories) {
    const marker = `data-fmb-backlog-story="${story.slug}"`;
    const count = section.split(marker).length - 1;
    if (count !== 1) throw new Error(`${routeName} backlog section must contain one ${story.slug}, found ${count}`);
    const position = section.indexOf(marker);
    if (position <= previous) throw new Error(`${routeName} backlog section is out of date order at ${story.slug}`);
    previous = position;
  }
  if (repaired.includes('data-unpublished-backlog="aug5"')) throw new Error(`${routeName} still contains the unstructured backlog section`);
  return repaired;
}

for (const story of stories) {
  const file = path.join(dist, 'news', story.slug, 'index.html');
  const html = await readFile(file, 'utf8');
  await writeFile(file, cleanInternalProductionNotes(html, story), 'utf8');
}

for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, relative);
  const html = await readFile(file, 'utf8');
  await writeFile(file, integrateBacklogSection(html, `/${relative.replace('/index.html', '')}`), 'utf8');
}

let sitemap = await readFile(sitemapPath, 'utf8');
const fmbNewsEntry = `<url><loc>https://www.francinemariebautista.com/fmbnews/</loc><lastmod>2026-08-05</lastmod><changefreq>daily</changefreq><priority>0.9</priority><image:image><image:loc>https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-news-official-transparent.webp</image:loc><image:title>FMB News</image:title></image:image></url>`;
sitemap = sitemap.replace(
  /<url>\s*<loc>https:\/\/www\.francinemariebautista\.com\/fmbnews\/<\/loc>[\s\S]*?<\/url>/i,
  fmbNewsEntry,
);
for (const story of stories) {
  const canonical = `https://www.francinemariebautista.com/news/${story.slug}/`;
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `<url><loc>${canonical}</loc><lastmod>2026-08-05</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url></urlset>`);
  }
}
await writeFile(sitemapPath, sitemap, 'utf8');

console.log(`Cleaned and positioned ${stories.length} recovered reports before final publication audits.`);
