import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const source = path.join(repositoryRoot, 'apps', 'withlovefmb');
const cssTarget = path.join(dist, 'assets', 'css', 'fmb-unified-system.css');
const jsTarget = path.join(dist, 'assets', 'js', 'fmb-unified-system.js');
const cssSource = path.join(source, 'assets', 'css', 'fmb-approved-launch.css');
const jsSource = path.join(source, 'assets', 'js', 'fmb-approved-launch.js');
const launchMarker = 'Approved FMB&CO. launch layer';

const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const excludedFiles = new Set(['admin.html', 'login.html', 'signup.html', 'reset-password.html', 'confirm-email.html']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const relative = (file) => path.relative(dist, file).replaceAll(path.sep, '/');
const isPublicHtml = (file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
};

for (const file of [cssTarget, jsTarget, cssSource, jsSource]) {
  const info = await stat(file);
  if (!info.isFile() || info.size < 200) throw new Error(`Approved launch dependency is missing or incomplete: ${file}`);
}

let unifiedCss = await readFile(cssTarget, 'utf8');
const launchCss = await readFile(cssSource, 'utf8');
if (!unifiedCss.includes(launchMarker)) {
  unifiedCss = `${unifiedCss.trim()}\n\n${launchCss.trim()}\n`;
  await writeFile(cssTarget, unifiedCss, 'utf8');
}

let unifiedJs = await readFile(jsTarget, 'utf8');
const launchJs = await readFile(jsSource, 'utf8');
if (!unifiedJs.includes('fmbApprovedLaunchReady')) {
  unifiedJs = `${unifiedJs.trim()}\n\n${launchJs.trim()}\n`;
  await writeFile(jsTarget, unifiedJs, 'utf8');
}

await Promise.all([
  rm(path.join(dist, 'assets', 'css', 'fmb-approved-launch.css'), { force: true }),
  rm(path.join(dist, 'assets', 'js', 'fmb-approved-launch.js'), { force: true }),
]);

const announcements = [
  ['Official Bulletin', '/news/'],
  ['Explore the complete FMB ecosystem', '/projects/'],
  ['Work with Francine Marie Bautista', '/work-with-fmb/'],
  ['Open the reading library', '/ebooks/'],
  ['Listen to FMB Music', '/music/'],
  ['Enter FMB&CO.', '/fmbandco/'],
];

const announcementGroup = announcements
  .map(([label, href]) => `<a class="fmb-announcement-item" href="${href}">${label}</a>`)
  .join('');

const announcementRail = `<div class="fmb-shell-rail" data-fmb-unified-shell aria-label="Latest FMB announcements">
  <div class="fmb-announcement-window">
    <div class="fmb-announcement-track">
      <div class="fmb-announcement-group">${announcementGroup}</div>
      <div class="fmb-announcement-group" aria-hidden="true">${announcementGroup}</div>
    </div>
  </div>
</div>`;

const headlines = [
  ['The Dumping Stopped. Subic’s Duty to Restore Has Not.', '/news/subic-aeta-landfill/'],
  ['Remembering Amor Deloso, Former Governor of Zambales', '/news/remembering-amor-deloso/'],
  ['Calling Filipinos “Monkeys” Is Racist, Not Clever', '/news/filipinos-monkey-insult-racism/'],
  ['Pax Silica Will Need a Lot of Water. Luzon Deserves the Full Plan.', '/news/pax-silica-water/'],
  ['North Luzon Takes Both Crowns at Binibining Pilipinas 2026', '/news/binibining-pilipinas-2026/'],
  ['When Propaganda Becomes Dehumanization', '/news/china-ai-monkey-video/'],
];

const headlineGroup = headlines
  .map(([label, href]) => `<a href="${href}">${label}</a>`)
  .join('');

const newsLivebar = `<section class="fmb-news-livebar" aria-label="FMB News live headlines and Philippine Standard Time">
  <strong class="fmb-news-live-label">Live Desk</strong>
  <time class="fmb-news-pst" data-fmb-pst>Philippine Standard Time</time>
  <div class="fmb-news-ticker-window">
    <div class="fmb-news-ticker-track">
      <div class="fmb-news-ticker-group">${headlineGroup}</div>
      <div class="fmb-news-ticker-group" aria-hidden="true">${headlineGroup}</div>
    </div>
  </div>
</section>`;

const mobileDock = `<nav class="fmb-mobile-dock" aria-label="Mobile quick navigation" data-fmb-mobile-dock>
  <a href="/">Home</a>
  <a href="/news/">News</a>
  <a href="/projects/">Projects</a>
  <button type="button" data-fmb-dock-menu aria-label="Open navigation" aria-expanded="false">Menu</button>
</nav>`;

const editorialVisuals = `<section class="fmb-editorial-visuals" id="fmb-visual-ecosystem" aria-labelledby="fmbVisualTitle">
  <div class="fmb-editorial-visuals-head">
    <div><small>The FMB ecosystem, in view</small><h2 id="fmbVisualTitle">Real work. Real platforms. One clear direction.</h2></div>
    <p>The public website uses the approved portraits, community photographs, project imagery, and newsroom assets already held by the FMB ecosystem.</p>
  </div>
  <div class="fmb-editorial-gallery" aria-label="Selected FMB ecosystem visuals">
    <a class="fmb-editorial-card" href="/aboutfmb/">
      <img src="/assets/images/fmb-approved/francine-standing-landscape.webp" width="1364" height="768" loading="lazy" decoding="async" alt="Francine Marie Bautista in the approved standing portrait">
      <span class="fmb-editorial-card-copy"><small>Founder profile</small><strong>Francine Marie Bautista</strong></span>
    </a>
    <a class="fmb-editorial-card" href="/withlovefmb/">
      <img src="/assets/images/volunteer/francine-leading-with-love-fmb.webp" width="1023" height="1537" loading="lazy" decoding="async" alt="Francine Marie Bautista leading a With Love, FMB community activity">
      <span class="fmb-editorial-card-copy"><small>Advocacy and community</small><strong>With Love, FMB</strong></span>
    </a>
    <a class="fmb-editorial-card" href="https://yoni.francinemariebautista.com/">
      <img src="/app/assets/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="Yoni, the digital companion of With Love, FMB">
      <span class="fmb-editorial-card-copy"><small>Digital companion</small><strong>Meet Yoni</strong></span>
    </a>
    <a class="fmb-editorial-card" href="/news/pax-silica-water/">
      <img src="/assets/images/news/new-clark-city-pax-silica-pia.jpg" width="800" height="500" loading="lazy" decoding="async" alt="Aerial view of New Clark City used in FMB News reporting on Pax Silica">
      <span class="fmb-editorial-card-copy"><small>FMB News</small><strong>Public-interest reporting with context</strong></span>
    </a>
  </div>
</section>`;

const premiumFonts = '<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,600;6..96,700&family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
const manifestLink = '<link rel="manifest" href="/manifest.webmanifest">';

function addBodyClass(html) {
  return html.replace(/<body([^>]*)>/i, (match, attributes = '') => {
    let next = attributes;
    if (/class=(['"])([^'"]*)\1/i.test(next)) {
      next = next.replace(/class=(['"])([^'"]*)\1/i, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add('fmb-approved-launch');
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      next += ' class="fmb-approved-launch"';
    }
    return `<body${next}>`;
  });
}

function replaceAnnouncementRail(html) {
  const pattern = /<div class="fmb-shell-rail"[^>]*>[\s\S]*?<\/div>\s*(?=<header class="fmb-shell-header")/i;
  return pattern.test(html) ? html.replace(pattern, `${announcementRail}\n`) : html;
}

function addPremiumFonts(html) {
  html = html.replace(/<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Cormorant\+Garamond[^>]*>\s*/gi, '');
  html = html.replace(/<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope[^>]*>\s*/gi, '');
  return html.includes('family=Bodoni+Moda') ? html : html.replace('</head>', `${premiumFonts}\n</head>`);
}

const publicHtml = (await walk(dist)).filter(isPublicHtml);
let updatedPages = 0;

for (const file of publicHtml) {
  const name = relative(file);
  let html = await readFile(file, 'utf8');
  const before = html;

  html = addBodyClass(html);
  html = replaceAnnouncementRail(html);
  html = addPremiumFonts(html);
  if (name === 'index.html' && !/rel=["']manifest["']/i.test(html)) {
    html = html.replace('</head>', `${manifestLink}\n</head>`);
  }

  if (!html.includes('data-fmb-mobile-dock')) {
    html = html.replace('</body>', `${mobileDock}\n</body>`);
  }

  if (name === 'index.html' && !html.includes('id="fmb-visual-ecosystem"')) {
    const insertionPoint = /(<section\b[^>]*id="how-fmb-can-help"[^>]*>)/i;
    html = insertionPoint.test(html)
      ? html.replace(insertionPoint, `${editorialVisuals}\n$1`)
      : html.replace('</main>', `${editorialVisuals}\n</main>`);
  }

  if (name.startsWith('news/') && !html.includes('class="fmb-news-livebar"')) {
    const headerEnd = /<\/header>/i;
    html = headerEnd.test(html)
      ? html.replace(headerEnd, `</header>\n${newsLivebar}`)
      : html.replace(/<main\b/i, `${newsLivebar}\n<main`);
  }

  html = html
    .replaceAll('sponsorship, donations, and responsible ways to contribute', 'non-financial collaboration, skills-sharing, and responsible ways to contribute')
    .replaceAll('Volunteer pathways, partnerships, community engagements, collaboration, sponsorship, donations, and responsible ways to contribute.', 'Volunteer pathways, partnerships, community engagements, collaboration, skills-sharing, and responsible non-financial ways to contribute.');

  if (html !== before) {
    await writeFile(file, html, 'utf8');
    updatedPages += 1;
  }
}

console.log(`Compiled the approved FMB launch layer into the single public CSS and JS bundles, connected the web manifest, removed duplicate compiled sources, and updated ${updatedPages} public pages.`);
