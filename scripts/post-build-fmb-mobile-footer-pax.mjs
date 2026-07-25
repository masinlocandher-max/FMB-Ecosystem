import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const cssFile = path.join(dist, 'assets', 'css', 'fmb-unified-system.css');
const marker = 'FMB mobile menu and footer refinement 20260725';

const cssPatch = `
/* ${marker} */
.fmb-mobile-dock{display:none!important}
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

const fmbMessage = `<section class="nc-reflection" aria-labelledby="fmb-message-title"><p class="nc-kicker">A message from FMB</p><h2 id="fmb-message-title">Transparency must come before consent.</h2><p>As a Filipino, I believe we have the right to understand any agreement that may affect our economy, natural resources, communities, workers, and future.</p><p>Pax Silica may bring opportunities, but opportunity alone should never silence questions. We must know what is being promised, what is being exchanged, who will benefit, who will carry the risks, and what protections are written for the Filipino people.</p><p>Until the full terms, agreements, safeguards, incentives, environmental commitments, legal arrangements, and accountability mechanisms are made public, we should not be expected to offer unconditional support.</p><p>Through our voice and platforms, we will continue to explain developments, ask difficult questions, and make information easier for ordinary Filipinos to understand. This is not rejecting progress. It is making sure progress does not happen without public knowledge, scrutiny, and respect for Philippine sovereignty.</p><p>We welcome investment that creates dignified jobs, strengthens Filipino capability, protects communities, supports local businesses, and keeps our laws intact. But we must not agree simply because the promise sounds impressive. The Filipino people deserve to see the terms first.</p><p><strong>With love,<br>FMB</strong></p></section>`;

await update('news/pax-silica/index.html', html => {
  html = html
    .replaceAll('Pax Silica, Without the Jargon', 'Pax Silica and the Philippines: What It Means for Filipinos')
    .replace('A technology supply-chain alliance with consequences beyond technology, from chips and energy to skills, investment, and national resilience.', 'What Pax Silica is, why it exists, and how its promises and risks could affect Filipino jobs, education, resources, communities, and national sovereignty.')
    .replace('/assets/images/news/pax-silica-briefing.png', '/assets/images/projects/cognita-logo-clean.png')
    .replace('Editorial illustration of a semiconductor and connected supply-chain nodes', 'Cognita Institute of AI, Learn, Innovate, Transform');
  if (!html.includes('id="fmb-message-title"')) html = html.replace('<section class="nc-sources"', `${fmbMessage}\n<section class="nc-sources"`);
  return html;
});

await update('news/index.html', html => {
  const card = '<article class="nc-rundown-story"><a href="/news/pax-silica/"><span class="nc-rundown-number">PS</span><figure class="news-visual"><img src="/assets/images/projects/cognita-logo-clean.png" width="1200" height="630" loading="lazy" decoding="async" alt="Cognita Institute of AI"><figcaption>Cognita Institute of AI. Full sources and FMB perspective appear in the article.</figcaption></figure><div><p>Philippines · Technology and sovereignty</p><h3>Pax Silica and the Philippines: What it means for Filipinos</h3><span>10 min read</span></div></a></article>';
  if (!html.includes('href="/news/pax-silica/"')) html = html.replace('<article class="nc-rundown-story" id="world">', `${card}\n<article class="nc-rundown-story" id="world">`);
  return html;
});

for (const relative of ['index.html','aboutfmb/index.html','news/index.html','news/pax-silica/index.html','projects/index.html','ebooks/index.html','music/index.html','withlovefmb/index.html','get-involved/index.html','gethelp/index.html','fmbandco/index.html','work-with-fmb/index.html']) {
  await update(relative, html => html.replace(/<nav class="fmb-mobile-dock"[\s\S]*?<\/nav>\s*/i, ''));
}

console.log('Published the Pax Silica update, moved mobile navigation into the hamburger menu, removed the bottom dock, and enhanced the shared footer.');
