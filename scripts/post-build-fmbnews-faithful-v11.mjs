import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const distRoot = path.join(repositoryRoot, 'dist');
const roots = [path.join(distRoot, 'news'), path.join(distRoot, 'fmbnews')];
const cssPath = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css', 'fmbnews-faithful-v11.css');
const portraitRelativePath = '/assets/images/fmb-approved/francine-portrait-front.webp';
const portraitSourcePath = path.join(repositoryRoot, 'apps', 'withlovefmb', portraitRelativePath.replace(/^\/assets\//, 'assets/'));
const portraitDistPath = path.join(distRoot, portraitRelativePath.replace(/^\//, ''));
const approvedPortraitSha256 = 'cd41d7a47590d93171628ac99a7c50ae6776b83fcf64a46a25f9ecb15d90c6de';

async function walkHtml(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walkHtml(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    if (/\bclass=(['"])([^'"]*)\1/i.test(attrs)) {
      const next = attrs.replace(/\bclass=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
      return `<body${next}>`;
    }
    return `<body${attrs} class="${className}">`;
  });
}

function signalMark() {
  return '<span class="fn11-signal-mark" aria-hidden="true"><i></i><i></i><i></i><b></b></span>';
}

function wordmark() {
  return '<span class="fn11-wordmark" aria-hidden="true"><strong>FMB</strong><span>NEWS</span></span>';
}

function searchIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"></circle><path d="m15.7 15.7 4.6 4.6"></path></svg>';
}

function menuIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><g class="fn11-menu-lines"><path d="M4 6.5h16M4 12h16M4 17.5h16"></path></g><g class="fn11-close-lines"><path d="m6 6 12 12M18 6 6 18"></path></g></svg>';
}

function headerMarkup() {
  return `<header class="nc-site-header fn9-site-header fn11-site-header" id="top"><div class="fn9-shell fn9-header-grid"><a class="fn11-brand-lockup" href="/fmbnews/" aria-label="FMB News home" data-fmb-news-logo>${wordmark()}<span class="fn11-logo-rule" aria-hidden="true"></span>${signalMark()}</a><div class="fn11-header-actions"><button class="fn11-icon-button fn11-search-button" type="button" data-fn9-search-open aria-label="Search FMB News" aria-expanded="false" aria-controls="fn9SearchPanel">${searchIcon()}</button><span class="fn11-header-divider" aria-hidden="true"></span><button class="fn11-icon-button fn11-menu-button" type="button" data-fn11-menu-toggle aria-label="Open FMB News menu" aria-expanded="false" aria-controls="fn11MenuPanel">${menuIcon()}</button></div></div><nav class="fn11-menu-panel" id="fn11MenuPanel" data-fn11-menu-panel aria-label="FMB News navigation" hidden><div class="fn9-shell fn11-menu-grid"><div class="fn11-menu-primary"><p class="fn11-menu-label">FMB News</p><a href="/fmbnews/#latest-reports">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbandco/">FMB&amp;CO. Home</a><a href="mailto:withlovefmb@gmail.com">Contact the newsroom</a></div><div><p class="fn11-menu-label">Browse by subject</p><div class="fn11-menu-categories"><a href="/fmbnews/?category=money#latest-reports">Money</a><a href="/fmbnews/?category=tech#latest-reports">Tech</a><a href="/fmbnews/?category=lifestyle#latest-reports">Lifestyle</a><a href="/fmbnews/?category=politics#latest-reports">Politics</a><a href="/fmbnews/?category=culture#latest-reports">Culture</a><a href="/fmbnews/?category=environment#latest-reports">Environment</a><a href="/fmbnews/?category=health#latest-reports">Health</a></div></div></div></nav></header>`;
}

function replaceHeader(html) {
  const header = headerMarkup();
  if (/<header\b[^>]*class=(['"])[^'"]*\bfn9-site-header\b[^'"]*\1/i.test(html)) {
    return html.replace(/<header\b[^>]*class=(['"])[^'"]*\bfn9-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i, header);
  }
  throw new Error('FMB News V11 could not locate the editorial masthead.');
}

function replaceAboutPortrait(html, isLanding) {
  if (!isLanding) return html;
  const portrait = `<figure class="fn11-about-portrait" data-fmb-news-exact-portrait><img src="${portraitRelativePath}" width="922" height="1152" loading="lazy" decoding="async" alt="Francine Marie Bautista, publisher of FMB News"></figure>`;
  if (/<div\b[^>]*class=(['"])[^'"]*\bfn9-about-mark\b[^'"]*\1[^>]*>[\s\S]*?<\/div>/i.test(html)) {
    return html.replace(/<div\b[^>]*class=(['"])[^'"]*\bfn9-about-mark\b[^'"]*\1[^>]*>[\s\S]*?<\/div>/i, portrait);
  }
  if (html.includes('data-fmb-news-exact-portrait')) return html;
  throw new Error('FMB News V11 could not replace the landing-page ampersand with the approved portrait.');
}

function facebookIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 8H17V4.5c-.7-.1-1.8-.3-3.2-.3-3.2 0-5.3 1.9-5.3 5.5V13H5v4h3.5v7h4.3v-7h3.5l.6-4h-4.1V10c0-1.2.3-2 1.7-2Z"></path></svg>';
}

function instagramIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.4" cy="6.7" r=".8" fill="currentColor" stroke="none"></circle></svg>';
}

function emailIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>';
}

function footerMarkup() {
  return `<footer class="nc-footer fn9-footer fn10-footer fn11-footer"><div class="fn9-shell fn11-footer-grid"><div><div class="fn11-footer-brand">${signalMark()}<div>${wordmark()}<p>Latest news, made clear for Filipinos. An FMB&amp;CO. publication.</p></div></div></div><div class="fn11-footer-mission"><h2>Clear information should travel farther than noise.</h2><p>We gather credible reports, explain the context, and answer why each story matters to Filipinos.</p></div><nav class="fn11-footer-links" aria-label="FMB News footer links"><a href="/fmbnews/#latest-reports">Latest reports</a><a href="/fmbnews/about/">About FMB News</a><a href="/fmbandco/">FMB&amp;CO. Home</a><a href="mailto:withlovefmb@gmail.com">Contact us</a></nav></div><div class="fn9-shell fn11-footer-bottom"><span>© 2026 FMB&amp;CO. All rights reserved.</span><nav class="fn11-footer-socials" aria-label="FMB News social links"><a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener noreferrer" aria-label="FMB News on Facebook">${facebookIcon()}</a><a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener noreferrer" aria-label="FMB News on Instagram">${instagramIcon()}</a><a href="mailto:withlovefmb@gmail.com" aria-label="Email FMB News">${emailIcon()}</a></nav></div></footer>`;
}

function replaceFooter(html) {
  const footer = footerMarkup();
  if (/<footer\b[^>]*class=(['"])[^'"]*\bfn10-footer\b[^'"]*\1/i.test(html)) {
    return html.replace(/<footer\b[^>]*class=(['"])[^'"]*\bfn10-footer\b[^'"]*\1[^>]*>[\s\S]*?<\/footer>/i, footer);
  }
  throw new Error('FMB News V11 could not locate the signal footer.');
}

function injectCss(html, css) {
  const style = `<style data-fmb-news-faithful-v11>${css}</style>`;
  return html
    .replace(/<style\b[^>]*data-fmb-news-faithful-v11[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<\/head>/i, `${style}</head>`);
}

function interactionScript() {
  return `<script data-fmb-news-faithful-v11>(() => {
  const body = document.body;
  if (!body?.classList.contains('news-faithful-v11')) return;
  const toggle = document.querySelector('[data-fn11-menu-toggle]');
  const panel = document.querySelector('[data-fn11-menu-panel]');
  if (!toggle || !panel) return;

  const setOpen = (open, restoreFocus = false) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close FMB News menu' : 'Open FMB News menu');
    body.classList.toggle('fn11-menu-open', open);
    if (open) panel.querySelector('a')?.focus({ preventScroll: true });
    else if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      setOpen(false, true);
    }
  });
  document.addEventListener('click', (event) => {
    if (!panel.hidden && !event.target.closest('.fn11-site-header')) setOpen(false);
  });
})();</script>`;
}

function injectInteraction(html) {
  const script = interactionScript();
  return html
    .replace(/<script\b[^>]*data-fmb-news-faithful-v11[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<\/body>/i, `${script}</body>`);
}

function assertCompleteIcons(html, filePath) {
  const header = html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn11-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] ?? '';
  const buttons = [...header.matchAll(/<button\b[^>]*class=(['"])[^'"]*\bfn11-icon-button\b[^'"]*\1[^>]*>[\s\S]*?<\/button>/gi)].map((match) => match[0]);
  if (buttons.length !== 2) throw new Error(`FMB News V11 expected exactly two complete header controls: ${filePath}`);
  for (const button of buttons) {
    if (!/<svg\b[^>]*viewBox=/i.test(button) || !/<(?:path|circle|rect)\b/i.test(button)) {
      throw new Error(`FMB News V11 found an incomplete header icon: ${filePath}`);
    }
  }
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

await access(portraitSourcePath);
await access(portraitDistPath);
const sourcePortraitHash = await sha256(portraitSourcePath);
const distPortraitHash = await sha256(portraitDistPath);
if (sourcePortraitHash !== approvedPortraitSha256 || distPortraitHash !== approvedPortraitSha256) {
  throw new Error(`The approved Francine portrait changed. Expected ${approvedPortraitSha256}; source ${sourcePortraitHash}; dist ${distPortraitHash}.`);
}

const css = (await readFile(cssPath, 'utf8')).trim();
const files = [...new Set((await Promise.all(roots.map(walkHtml))).flat())];
let updated = 0;
let landingCount = 0;
let portraitCount = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-signal-v10\b/.test(html)) continue;
  const original = html;
  const isLanding = /[\\/](?:news|fmbnews)[\\/]index\.html$/i.test(filePath);

  html = addBodyClass(html, 'news-faithful-v11');
  html = replaceHeader(html);
  html = replaceAboutPortrait(html, isLanding);
  html = replaceFooter(html);
  html = injectCss(html, css);
  html = injectInteraction(html);

  const required = [
    'news-faithful-v11',
    'data-fmb-news-faithful-v11',
    'data-fmb-news-logo',
    'fn11-wordmark',
    'fn11-signal-mark',
    'fn11-search-button',
    'fn11-menu-button',
    'fn11-menu-panel',
    'fn11-footer-grid',
    'Cormorant Garamond',
    'Manrope',
  ];
  for (const marker of required) {
    if (!html.includes(marker)) throw new Error(`FMB News V11 marker ${marker} missing: ${filePath}`);
  }
  if (/\bfn9-home-button\b/.test(html.match(/<header\b[^>]*class=(['"])[^'"]*\bfn11-site-header\b[^'"]*\1[^>]*>[\s\S]*?<\/header>/i)?.[0] ?? '')) {
    throw new Error(`FMB News V11 retained a redundant header button: ${filePath}`);
  }
  assertCompleteIcons(html, filePath);

  if (isLanding) {
    landingCount += 1;
    if (!html.includes('data-fmb-news-exact-portrait') || !html.includes(portraitRelativePath)) {
      throw new Error(`FMB News V11 exact portrait missing from landing route: ${filePath}`);
    }
    if (/\bfn9-about-mark\b/.test(html)) throw new Error(`FMB News V11 decorative ampersand remains: ${filePath}`);
    portraitCount += 1;
  }

  if (html !== original) {
    await writeFile(filePath, html, 'utf8');
    updated += 1;
  }
}

if (!updated || landingCount !== 2 || portraitCount !== 2) {
  throw new Error(`FMB News V11 expected two landing routes and updated pages; found ${landingCount} landing route(s), ${portraitCount} portrait(s), ${updated} update(s).`);
}

console.log(`Applied the faithful FMB News V11 design to ${updated} route(s), installed the complete signal wordmark and two real header controls, and used the byte-verified approved Francine portrait on both landing routes.`);
