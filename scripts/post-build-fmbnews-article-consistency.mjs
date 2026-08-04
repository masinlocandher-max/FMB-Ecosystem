import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const colorLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const cssHref = '/assets/css/fmbnews-article-consistency.css?v=20260805d';
const jsSrc = '/assets/js/fmbnews-article-consistency.js?v=20260805d';

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
<aside class="fmbn-story-drawer" id="fmbnStoryDrawer" data-fmbn-drawer aria-label="FMB News menu" aria-hidden="true" inert>
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

function stripClassToken(attributes, token) {
  return attributes.replace(/\bclass=(["'])([^"']*)\1/i, (match, quote, value) => {
    const next = value.split(/\s+/).filter(Boolean).filter((entry) => entry !== token).join(' ');
    return next ? `class=${quote}${next}${quote}` : '';
  });
}

function removePreviousShells(html) {
  let next = html;
  next = next.replace(/<(?:div|header|footer)\b[^>]*data-fmb-unified-shell[^>]*>[\s\S]*?<\/(?:div|header|footer)>\s*/gi, '');
  next = next.replace(/<(?:div|aside|nav)\b[^>]*class=(["'])[^"']*(?:fmb-network-contact|network-reveal|fco-topline|mobile-dock)[^"']*\1[^>]*>[\s\S]*?<\/(?:div|aside|nav)>\s*/gi, '');
  next = next.replace(/<header\b[^>]*data-fmbnews-article-shell[^>]*>[\s\S]*?<\/header>\s*/gi, '');
  next = next.replace(/<div\b[^>]*data-fmbn-scrim[^>]*>[\s\S]*?<\/div>\s*/gi, '');
  next = next.replace(/<aside\b[^>]*data-fmbn-drawer[^>]*>[\s\S]*?<\/aside>\s*/gi, '');
  next = next.replace(/<footer\b[^>]*data-fmbnews-article-footer[^>]*>[\s\S]*?<\/footer>\s*/gi, '');
  next = next.replace(/<nav\b[^>]*class=(["'])[^"']*(?:mobile[^"']*dock|dock[^"']*mobile)[^"']*\1[^>]*>[\s\S]*?<\/nav>\s*/gi, '');
  next = next.replace(/<link\b[^>]*href=(["'])\/assets\/css\/(?:fmb-unified-system|fmbnews-article-consistency)\.css(?:\?[^"']*)?\1[^>]*>\s*/gi, '');
  next = next.replace(/<script\b[^>]*src=(["'])\/assets\/js\/(?:fmb-unified-system|fmbnews-article-consistency)\.js(?:\?[^"']*)?\1[^>]*>\s*<\/script>\s*/gi, '');
  next = next.replace(/<body\b([^>]*)>/i, (match, attributes) => `<body${stripClassToken(attributes, 'fmb-unified-public')}>`);
  return next;
}

let updated = 0;
for (const filePath of await walk(newsRoot)) {
  if (filePath === path.join(newsRoot, 'index.html')) continue;
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/i.test(html)) continue;

  html = removePreviousShells(html);
  html = html.replace('</head>', `<link rel="stylesheet" href="${cssHref}">\n</head>`);
  html = html.replace(/<body\b([^>]*)>/i, (match, attributes) => `<body${attributes}>\n${header}`);
  html = html.replace('</body>', `<script src="${jsSrc}" defer></script>\n${footer}\n</body>`);

  const drawerIds = (html.match(/id="fmbnStoryDrawer"/g) || []).length;
  const shellCount = (html.match(/data-fmbnews-article-shell/g) || []).length;
  const footerCount = (html.match(/data-fmbnews-article-footer/g) || []).length;
  const unifiedShells = (html.match(/data-fmb-unified-shell|fmb-unified-system\.(?:css|js)|fmbandco-primary-reversed/gi) || []).length;
  if (drawerIds !== 1 || shellCount !== 1 || footerCount !== 1 || unifiedShells !== 0) {
    throw new Error(`FMB News article shell is not isolated for ${path.relative(dist, filePath)}: drawer=${drawerIds}, header=${shellCount}, footer=${footerCount}, widerShell=${unifiedShells}`);
  }

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

console.log(`Applied exactly one isolated supplied-logo FMB News article shell, Philippine clock, moving headline wire, premium mobile drawer and dark footer to ${updated} preserved report page(s).`);