import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const colorLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const cssHref = '/assets/css/fmbnews-article-consistency.css?v=20260805a';
const jsSrc = '/assets/js/fmbnews-article-consistency.js?v=20260805a';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name === 'index.html') files.push(absolute);
  }
  return files;
}

const navLinks = `
  <a href="/fmbnews/">Home</a>
  <a href="/fmbnews/?view=alam-mo-ba">Alam Mo Ba?</a>
  <a href="/fmbnews/?view=lotto">Lotto</a>
  <a href="/fmbnews/?view=horoscope">Horoscope</a>
  <a href="/fmbnews/?archive=all">Archives</a>
  <a href="/fmbnews/?view=submit">Submit Your Story</a>`;

const header = `<header class="fmbn-story-shell" data-fmbnews-article-shell>
  <div class="fmbn-story-top">
    <a class="fmbn-story-logo" href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo-light><img src="${colorLogo}" width="576" height="202" alt="FMB News"></a>
    <span class="fmbn-story-signal" aria-hidden="true"><i></i><i></i></span>
    <nav class="fmbn-story-nav" aria-label="FMB News navigation">${navLinks}</nav>
    <time class="fmbn-story-time" data-philippine-time>Philippine Standard Time</time>
    <button class="fmbn-story-menu" type="button" data-fmbn-menu-open aria-label="Open menu" aria-expanded="false" aria-controls="fmbnStoryDrawer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"></path></svg></button>
  </div>
  <div class="fmbn-story-wire" aria-label="Moving headlines">
    <span class="fmbn-wire-label">Latest</span>
    <div class="fmbn-wire-window"><div class="fmbn-wire-track" data-fmbn-wire-track><span>Loading the latest FMB News reports…</span></div></div>
    <button class="fmbn-wire-control" type="button" data-fmbn-wire-toggle aria-label="Pause moving headlines" aria-pressed="false">
      <svg class="fmbn-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"></path></svg>
      <svg class="fmbn-play" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"></path></svg>
    </button>
  </div>
</header>
<div class="fmbn-story-scrim" data-fmbn-scrim aria-hidden="true"></div>
<aside class="fmbn-story-drawer" id="fmbnStoryDrawer" data-fmbn-drawer aria-label="FMB News menu">
  <div class="fmbn-drawer-head">
    <a href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo-dark><img src="${whiteLogo}" width="575" height="203" alt="FMB News"></a>
    <button class="fmbn-drawer-close" type="button" data-fmbn-menu-close aria-label="Close menu"></button>
  </div>
  <nav class="fmbn-drawer-nav" aria-label="FMB News mobile navigation">${navLinks}
    <a href="/fmbnews/?view=about">About FMB News</a>
    <a href="/fmbnews/?view=fmb-message">FMB Message</a>
  </nav>
  <p class="fmbn-drawer-foot">Every story. Clearer. Sharper.<br><strong>Why it matters to us Filipinos is the key.</strong></p>
</aside>`;

const footer = `<footer class="fmbn-story-footer" data-fmbnews-article-footer>
  <a href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo-dark><img src="${whiteLogo}" width="575" height="203" alt="FMB News"></a>
  <p>Clear news, responsible context, and the Filipino meaning behind every important story.</p>
  <nav aria-label="FMB News footer navigation"><a href="/fmbnews/">Home</a><a href="/fmbnews/?archive=all">Archives</a><a href="/fmbnews/?view=about">About</a><a href="/fmbnews/?view=submit">Submit a Story</a></nav>
</footer>`;

let updated = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/i.test(html)) continue;

  html = html.replace(/<header\b[^>]*data-fmbnews-article-shell[^>]*>[\s\S]*?<\/header>\s*<div\b[^>]*data-fmbn-scrim[^>]*><\/div>\s*<aside\b[^>]*data-fmbn-drawer[^>]*>[\s\S]*?<\/aside>/i, '');
  html = html.replace(/<footer\b[^>]*data-fmbnews-article-footer[^>]*>[\s\S]*?<\/footer>/i, '');
  html = html.replace(/<nav\b[^>]*class=(["'])[^"']*(?:mobile[^"']*dock|dock[^"']*mobile)[^"']*\1[^>]*>[\s\S]*?<\/nav>/gi, '');

  if (!html.includes(cssHref)) html = html.replace('</head>', `<link rel="stylesheet" href="${cssHref}">\n</head>`);
  if (!html.includes(jsSrc)) html = html.replace('</body>', `<script src="${jsSrc}" defer></script>\n</body>`);
  html = html.replace(/<body\b([^>]*)>/i, (match, attributes) => `<body${attributes}>\n${header}`);
  html = html.replace('</body>', `${footer}\n</body>`);

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

console.log(`Applied one supplied-logo FMB News article shell, Philippine clock, moving headline wire, premium mobile drawer and dark footer to ${updated} preserved report page(s).`);