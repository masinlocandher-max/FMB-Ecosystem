import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const sourceImage = path.join(root, 'assets', 'images', 'fmb-news', 'fmb-news-ai-tool-hero.jpg');
const targetDir = path.join(dist, 'assets', 'images', 'fmb-news');
const targetImage = path.join(targetDir, 'fmb-news-ai-tool-hero.jpg');
const imagePath = '/assets/images/fmb-news/fmb-news-ai-tool-hero.jpg';
const imageUrl = `https://www.francinemariebautista.com${imagePath}`;
const oldPortrait = 'https://www.francinemariebautista.com/assets/images/fmb-approved/francine-standing-landscape.webp';

const series = [
  {
    slug: 'francine-marie-bautista-ai-photography-creative-skill',
    title: 'Using AI Does Not Make You Less of a Photographer: Francine Marie Bautista on Skill, Tools and Creative Judgment',
  },
  {
    slug: 'francine-marie-bautista-pax-silica-terms-must-be-clear',
    title: 'Francine Marie Bautista on Pax Silica: “Terms Must Be Clear. Questions Must Be Answered.”',
  },
  {
    slug: 'francine-marie-bautista-ai-literacy-minimize-risks',
    title: 'AI Has Risks. Francine Marie Bautista Says the Answer Is to Learn How to Use It Properly',
  },
];

const esc = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

await mkdir(targetDir, { recursive: true });
await copyFile(sourceImage, targetImage);

const relatedCss = '.nc-related-series{margin:2.5rem 0 1.5rem;padding:1.5rem 0;border-top:1px solid rgba(10,27,61,.18);border-bottom:1px solid rgba(10,27,61,.18)}.nc-related-series h2{margin:0 0 .85rem}.nc-related-series a{display:block;margin:.7rem 0;font-weight:700;text-decoration:none}.nc-related-series a:hover{text-decoration:underline}';

for (const current of series) {
  const file = path.join(newsRoot, current.slug, 'index.html');
  let html = await readFile(file, 'utf8');

  if (current.slug === series[0].slug) {
    html = html.replaceAll(oldPortrait, imageUrl)
      .replaceAll('PHOTO: FRANCINE MARIE BAUTISTA / FMB ARCHIVE', 'VISUAL: FMB NEWS')
      .replaceAll('Photo: FRANCINE MARIE BAUTISTA / FMB ARCHIVE', 'Visual: FMB News');
  }

  const related = series.filter(item => item.slug !== current.slug);
  const relatedHtml = `<section class="nc-related-series" aria-labelledby="related-series-${current.slug}"><h2 id="related-series-${current.slug}">Related in this series</h2>${related.map(item => `<a href="/news/${item.slug}/">${esc(item.title)}</a>`).join('')}</section>`;

  if (!html.includes('class="nc-related-series"')) {
    html = html.replace('<section class="nc-sources">', `${relatedHtml}<section class="nc-sources">`);
  }
  if (!html.includes('.nc-related-series{')) {
    html = html.replace('</style>', `${relatedCss}</style>`);
  }

  await writeFile(file, html, 'utf8');
}

for (const landingRelative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(dist, landingRelative);
  try {
    let html = await readFile(file, 'utf8');
    const marker = `href="/news/${series[0].slug}/"`;
    const hit = html.indexOf(marker);
    if (hit >= 0) {
      const start = html.lastIndexOf('<article', hit);
      const close = html.indexOf('</article>', hit);
      if (start >= 0 && close >= 0) {
        const end = close + '</article>'.length;
        const card = html.slice(start, end);
        const upgraded = card.replaceAll(oldPortrait, imageUrl)
          .replaceAll('PHOTO: FRANCINE MARIE BAUTISTA / FMB ARCHIVE', 'VISUAL: FMB NEWS')
          .replaceAll('Photo: FRANCINE MARIE BAUTISTA / FMB ARCHIVE', 'Visual: FMB News');
        html = `${html.slice(0, start)}${upgraded}${html.slice(end)}`;
        await writeFile(file, html, 'utf8');
      }
    }
  } catch {}
}
