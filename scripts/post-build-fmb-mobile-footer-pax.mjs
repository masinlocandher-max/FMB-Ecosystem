import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const cssFile = path.join(dist, 'assets', 'css', 'fmb-unified-system.css');
const marker = 'FMB mobile menu and footer refinement 20260725';

const cssPatch = `
/* ${marker} */
.fmb-mobile-dock,.nc-mobile-dock{display:none!important}
@media(max-width:960px){
  body.fmb-approved-launch{padding-bottom:env(safe-area-inset-bottom,0px)!important}
  .fmb-shell-nav{top:calc(38px + max(68px, env(safe-area-inset-top,0px) + 58px))!important;right:12px!important;bottom:auto!important;left:12px!important;max-height:calc(100svh - 124px)!important;grid-template-columns:1fr!important;padding:14px!important;border-radius:24px!important;transform:translateY(-14px)!important}
  .fmb-shell-nav.is-open{transform:translateY(0)!important}
  .fmb-shell-nav a{min-height:52px!important;justify-content:flex-start!important;padding:0 18px!important;border-radius:14px!important;text-align:left!important;font-size:11px!important}
}
.fmb-shell-footer{padding-top:clamp(72px,9vw,128px)!important;background:radial-gradient(circle at 82% 0,rgba(169,122,240,.28),transparent 30rem),linear-gradient(150deg,#090018,#1b0342 58%,#2b0960)!important}
.fmb-shell-footer-grid{grid-template-columns:minmax(280px,1.4fr) repeat(3,minmax(150px,.65fr))!important;gap:clamp(34px,5vw,74px)!important}
.fmb-shell-footer-brand{padding-right:clamp(0px,3vw,46px)}
.fmb-shell-footer-brand p{font-size:15px!important;line-height:1.8!important}
.fmb-shell-footer nav strong{font-size:11px!important;color:#f0bd62!important}
.fmb-shell-footer nav a{position:relative;padding:4px 0;font-size:14px!important;transition:color .18s ease,transform .18s ease}
.fmb-shell-footer nav a:hover{transform:translateX(4px)}
.fmb-shell-footer-bottom{padding-top:28px!important}
@media(max-width:960px){.fmb-shell-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.fmb-shell-footer-brand{grid-column:1/-1}}
@media(max-width:680px){.fmb-shell-footer{padding-inline:22px!important}.fmb-shell-footer-grid{grid-template-columns:1fr!important}.fmb-shell-footer-brand{grid-column:auto}.fmb-shell-footer nav{padding-top:22px;border-top:1px solid rgba(255,255,255,.1)}.fmb-shell-footer-bottom{gap:14px!important}}
`;

let css = await readFile(cssFile, 'utf8');
if (!css.includes(marker)) await writeFile(cssFile, `${css.trim()}\n\n${cssPatch.trim()}\n`, 'utf8');

async function update(relative, transform) {
  const file = path.join(dist, relative);
  let html = await readFile(file, 'utf8');
  const next = transform(html);
  if (next !== html) await writeFile(file, next, 'utf8');
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

await update('news/index.html', html => {
  const card = '<article class="nc-rundown-story"><a href="/news/pax-silica-philippines/"><span class="nc-rundown-number">PS</span><figure class="news-visual"><img src="/assets/images/projects/cognita-logo-clean.png" width="1200" height="630" loading="lazy" decoding="async" alt="Cognita Institute of AI"><figcaption>Cognita Institute of AI. Full sources and FMB perspective appear in the article.</figcaption></figure><div><p>Philippines · Technology and sovereignty</p><h3>Pax Silica and the Philippines: What it means for Filipinos</h3><span>12 min read</span></div></a></article>';
  if (!html.includes('href="/news/pax-silica-philippines/"')) html = html.replace('<article class="nc-rundown-story" id="world">', `${card}\n<article class="nc-rundown-story" id="world">`);
  return html;
});

const publicHtml = (await walk(dist)).filter(file => file.endsWith('.html') && !file.includes(`${path.sep}app${path.sep}`) && !file.includes(`${path.sep}admin${path.sep}`) && !file.includes(`${path.sep}data${path.sep}`) && !file.includes(`${path.sep}yoni${path.sep}`));
let dockRemovals = 0;
for (const file of publicHtml) {
  const html = await readFile(file, 'utf8');
  const next = html
    .replace(/<nav\b[^>]*class=["'][^"']*\bfmb-mobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi, '')
    .replace(/<nav\b[^>]*class=["'][^"']*\bnc-mobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>\s*/gi, '');
  if (next !== html) {
    await writeFile(file, next, 'utf8');
    dockRemovals += 1;
  }
}

const sitemapFile = path.join(dist, 'sitemap.xml');
try {
  let sitemap = await readFile(sitemapFile, 'utf8');
  const route = 'https://www.francinemariebautista.com/news/pax-silica-philippines/';
  if (!sitemap.includes(route)) {
    sitemap = sitemap.replace('</urlset>', `  <url><loc>${route}</loc></url>\n</urlset>`);
    await writeFile(sitemapFile, sitemap, 'utf8');
  }
} catch {
  // The route remains available even if a deployment does not include a sitemap file.
}

console.log(`Published the separate Pax Silica Philippines article, removed sticky mobile docks from ${dockRemovals} public page(s), kept navigation in the hamburger menu, and enhanced the shared footer.`);
