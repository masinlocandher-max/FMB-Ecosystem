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

function lazyLoadYoniHomepageArt(html) {
  return html.replace(/<img\b[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'][^>]*>/gi, tag => {
    let next = tag
      .replace(/\sloading=["'][^"']*["']/i, '')
      .replace(/\sfetchpriority=["'][^"']*["']/i, '')
      .replace(/\sdecoding=["'][^"']*["']/i, '');
    return next.replace(/<img/i, '<img loading="lazy" decoding="async" fetchpriority="low"');
  });
}

let changed = 0;
for (const file of await walk(root)) {
  let html = await readFile(file, 'utf8');
  const before = html;
  const relative = path.relative(root, file).replaceAll(path.sep, '/');

  html = addLegalLinks(html);

  if (relative === 'index.html') {
    html = lazyLoadYoniHomepageArt(html)
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
if (!/<img\b(?=[^>]*src=["']\/app\/assets\/yoni\/yoni-hero\.webp["'])(?=[^>]*loading=["']lazy["'])(?=[^>]*fetchpriority=["']low["'])[^>]*>/i.test(home)) {
  throw new Error('Homepage Yoni artwork is not protected as a below-fold lazy image.');
}

console.log(`Release hardening updated ${changed} HTML file(s): legal navigation is current, the homepage renders without JavaScript, and below-fold Yoni artwork is lazy-loaded.`);
