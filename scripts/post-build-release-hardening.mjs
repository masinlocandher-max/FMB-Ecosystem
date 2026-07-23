import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('../dist/', import.meta.url).pathname);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function addLegalLinks(html) {
  let result = html.replace(/href=["']\/privacy-policy\.html["']/gi, 'href="/privacy/"');
  const privacyLink = /<a href=["']\/privacy\/["']>Privacy(?: Policy)?<\/a>/i;
  if (privacyLink.test(result) && !/href=["']\/terms\/["']/i.test(result)) {
    result = result.replace(
      privacyLink,
      '$&<a href="/terms/">Terms</a><a href="/data-deletion/">Data Deletion</a>',
    );
  }
  return result;
}

function makeImageLazy(tag) {
  const next = tag
    .replace(/\sloading=["'][^"']*["']/i, '')
    .replace(/\sfetchpriority=["'][^"']*["']/i, '')
    .replace(/\sdecoding=["'][^"']*["']/i, '');
  return next.replace(/<img/i, '<img loading="lazy" decoding="async" fetchpriority="low"');
}

function hardenHomepageImages(html) {
  return html
    .replace(/<img\b[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'][^>]*>/gi, makeImageLazy)
    .replace(/<img\b(?=[^>]*id=["']homeFounderImage["'])[^>]*>/gi, makeImageLazy);
}

function addNewsMobileDock(html) {
  const style = `<style data-fmb-news-mobile-dock>
@media(min-width:761px){.nc-mobile-dock{display:none!important}}
@media(max-width:760px){body.news-channel-route{padding-bottom:calc(82px + env(safe-area-inset-bottom,0px))!important}.nc-mobile-dock{position:fixed!important;left:12px!important;right:12px!important;bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;z-index:120!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;min-height:58px!important;padding:6px!important;border:1px solid rgba(91,24,47,.18)!important;border-radius:20px!important;background:rgba(255,250,243,.96)!important;box-shadow:0 16px 42px rgba(43,21,30,.2)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}.nc-mobile-dock a{display:grid!important;place-items:center!important;min-width:0!important;padding:9px 5px!important;border-radius:14px!important;color:#4a2633!important;font:700 9px/1.2 Montserrat,Arial,sans-serif!important;letter-spacing:.04em!important;text-align:center!important;text-decoration:none!important}.nc-mobile-dock a:focus-visible,.nc-mobile-dock a:hover{background:#f2e6dc!important;color:#7d193c!important}}
</style>`;
  if (!html.includes('data-fmb-news-mobile-dock')) html = html.replace('</head>', `${style}\n</head>`);
  if (!html.includes('class="nc-mobile-dock"')) {
    const dock = '<nav class="nc-mobile-dock" aria-label="Mobile newsroom navigation"><a href="#top">Home</a><a href="#rundown">Latest</a><a href="#philippines">Philippines</a><a href="#editorial-standard">Standards</a></nav>';
    html = html.replace('</body>', `${dock}\n</body>`);
  }
  return html;
}

let changed = 0;
for (const file of await walk(root)) {
  let html = await readFile(file, 'utf8');
  const before = html;
  const relative = path.relative(root, file).replaceAll(path.sep, '/');

  html = addLegalLinks(html);

  if (relative === 'index.html') {
    html = hardenHomepageImages(html)
      .replace(
        /<style>html\{background:#05020a\}body\{visibility:hidden\}<\/style><noscript><style>body\{visibility:visible\}<\/style><\/noscript>/i,
        '<style>html{background:#05020a}</style>',
      )
      .replace(/body\{visibility:hidden\}/gi, 'body{visibility:visible}')
      .replace(
        /<nav><strong>Legal<\/strong>[\s\S]*?<\/nav>/i,
        '<nav><strong>Legal</strong><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/data-deletion/">Data Deletion</a><a href="mailto:withlovefmb@gmail.com?subject=Accessibility%20Support">Accessibility Support</a><a href="/sitemap.xml">Sitemap</a></nav>',
      );
  }

  if (relative === 'news/index.html') html = addNewsMobileDock(html);

  if (html !== before) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

const home = await readFile(path.join(root, 'index.html'), 'utf8');
for (const required of ['/privacy/', '/terms/', '/data-deletion/']) {
  if (!home.includes(`href="${required}"`)) throw new Error(`Homepage legal navigation is missing ${required}`);
}
if (/body\{visibility:hidden\}/i.test(home)) throw new Error('Homepage still depends on a JavaScript-only body visibility reveal.');
for (const pattern of [
  /<img\b(?=[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'])(?=[^>]*loading=["']lazy["'])(?=[^>]*fetchpriority=["']low["'])[^>]*>/i,
  /<img\b(?=[^>]*id=["']homeFounderImage["'])(?=[^>]*loading=["']lazy["'])(?=[^>]*fetchpriority=["']low["'])[^>]*>/i,
]) {
  if (!pattern.test(home)) throw new Error('Homepage below-fold imagery is not fully protected by lazy loading.');
}
const news = await readFile(path.join(root, 'news/index.html'), 'utf8');
if (!news.includes('class="nc-mobile-dock"') || (news.match(/class="nc-mobile-dock"/g) || []).length !== 1 || !news.includes('data-fmb-news-mobile-dock')) {
  throw new Error('FMB News must have one visible, styled mobile newsroom dock.');
}

console.log(`Release hardening updated ${changed} HTML file(s): legal navigation is current, below-fold homepage artwork is lazy-loaded, and FMB News has collision-safe mobile navigation.`);
