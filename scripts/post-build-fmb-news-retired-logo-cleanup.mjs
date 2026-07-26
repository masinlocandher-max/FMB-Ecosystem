import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const fallbackPath = '/assets/images/news/newsroom-editorial-fallback.svg';
const fallbackUrl = `https://www.francinemariebautista.com${fallbackPath}`;
const retiredRelative = [
  '/assets/images/fmb-approved/fmb-news-official-transparent.webp',
  '/assets/images/news/fmb-news-official.svg',
];
const retiredAbsolute = retiredRelative.map(value => `https://www.francinemariebautista.com${value}`);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function footerMasthead() {
  return '<a class="nc-footer-brand nc-text-masthead nc-footer-masthead" href="/news/" aria-label="FMB News Center home"><span class="nc-masthead-monogram" aria-hidden="true">FMB</span><span class="nc-masthead-copy"><strong class="nc-masthead-title">News Center</strong><span class="nc-masthead-tagline">Filipino ang Mismong Balita.</span></span></a>';
}

let cleanedPages = 0;
let fallbackPages = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;

  html = html.replace(
    /<a\b(?=[^>]*\bclass=["'][^"']*\bnc-footer-brand\b[^"']*["'])(?=[^>]*\bhref=["']\/news\/["'])[^>]*>[\s\S]*?<\/a>/i,
    footerMasthead(),
  );

  const hadRetiredMedia = [...retiredRelative, ...retiredAbsolute].some(value => html.includes(value));
  for (const value of retiredRelative) html = html.replaceAll(value, fallbackPath);
  for (const value of retiredAbsolute) html = html.replaceAll(value, fallbackUrl);

  if (hadRetiredMedia) {
    html = html
      .replace(/<meta property="og:image:width" content="[^"]*">/i, '<meta property="og:image:width" content="1536">')
      .replace(/<meta property="og:image:height" content="[^"]*">/i, '<meta property="og:image:height" content="864">')
      .replace(/<meta property="og:image:alt" content="[^"]*">/i, '<meta property="og:image:alt" content="FMB News Center editorial report title card">')
      .replace(/<meta name="twitter:card" content="summary">/i, '<meta name="twitter:card" content="summary_large_image">')
      .replace(/FMB News identity\.?/gi, 'Original FMB News Center editorial title card.')
      .replace(/Official FMB News identity/gi, 'FMB News Center editorial report title card');

    html = html.replace(
      /<img\b[^>]*\bsrc=["']\/assets\/images\/news\/newsroom-editorial-fallback\.svg["'][^>]*>/gi,
      tag => {
        let next = tag
          .replace(/\bwidth=["'][^"']*["']/i, 'width="1536"')
          .replace(/\bheight=["'][^"']*["']/i, 'height="864"')
          .replace(/\balt=["'][^"']*["']/i, 'alt="FMB News Center editorial report title card"');
        if (!/\bwidth=/i.test(next)) next = next.replace('<img', '<img width="1536"');
        if (!/\bheight=/i.test(next)) next = next.replace('<img', '<img height="864"');
        if (!/\balt=/i.test(next)) next = next.replace('<img', '<img alt="FMB News Center editorial report title card"');
        return next;
      },
    );
    fallbackPages += 1;
  }

  if (/<(?:img|source)\b[^>]*(?:src|srcset)=["'][^"']*(?:fmb-news-official-transparent\.webp|fmb-news-official\.svg)/i.test(html)) {
    throw new Error(`News Center logo cleanup: retired News identity still renders in ${filePath}`);
  }
  await writeFile(filePath, html, 'utf8');
  cleanedPages += 1;
}

console.log(`Normalized ${cleanedPages} FMB News Center report footers and replaced retired-logo media with an editorial fallback on ${fallbackPages} page(s).`);
