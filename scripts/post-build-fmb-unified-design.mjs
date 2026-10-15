import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withMicrositeExclusions } from './lib/standalone-microsites.mjs';

const dist = path.resolve('dist');
const cssHref = '/assets/css/fmb-unified-system.css?v=20260724-total-makeover-v1';
const jsSrc = '/assets/js/fmb-unified-system.js?v=20260724-total-makeover-v1';
const logoSrc = '/assets/images/fmbandco/fmbandco-primary-reversed.png';

const excludedPrefixes = withMicrositeExclusions([
  '_sites/',
  'app/',
  'api/',
  'auth/',
  'admin/',
  'data/',
  'yoni/',
]);

const excludedFiles = new Set([
  'admin.html',
  'login.html',
  'signup.html',
  'reset-password.html',
  'confirm-email.html',
]);

const publicNavigation = [
  ['/', 'Home'],
  ['/aboutfmb/', 'About FMB'],
  ['/news/', 'Bulletin'],
  ['/projects/', 'Projects'],
  ['/ebooks/', 'Reading'],
  ['/music/', 'Music'],
  ['/get-involved/', 'Get Involved'],
  ['/gethelp/', 'Get Help'],
  ['/fmbandco/', 'FMB&CO.'],
  ['/work-with-fmb/', 'Work with FMB'],
];

const shellHeader = `
<div class="fmb-shell-rail" data-fmb-unified-shell>
  <strong>FMB&amp;CO.</strong>
  <span>The official digital headquarters of Francine Marie Bautista</span>
  <a href="/news/">Open the bulletin</a>
</div>
<header class="fmb-shell-header" data-fmb-unified-shell>
  <a class="fmb-shell-brand" href="/" aria-label="Francine Marie Bautista and FMB&CO. home">
    <img src="${logoSrc}" width="1414" height="405" alt="FMB&CO. Francine Marie Bautista">
  </a>
  <nav class="fmb-shell-nav" id="fmbUnifiedNav" aria-label="Primary navigation">
    ${publicNavigation.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n    ')}
  </nav>
  <a class="fmb-shell-cta" href="/work-with-fmb/">Work with FMB</a>
  <a class="fmb-shell-yoni" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
  <button class="fmb-shell-menu" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav"><span></span></button>
</header>`;

const shellFooter = `
<footer class="fmb-shell-footer" data-fmb-unified-shell>
  <div class="fmb-shell-footer-grid">
    <div class="fmb-shell-footer-brand">
      <img src="${logoSrc}" width="1414" height="405" loading="lazy" decoding="async" alt="FMB&CO. Francine Marie Bautista">
      <p>The official digital home, bulletin, authority platform, and ecosystem gateway of Francine Marie Bautista.</p>
    </div>
    <nav aria-label="Official site links">
      <strong>Official Site</strong>
      <a href="/">Home</a>
      <a href="/aboutfmb/">About FMB</a>
      <a href="/news/">Bulletin</a>
      <a href="/projects/">Projects</a>
      <a href="/work-with-fmb/">Work with FMB</a>
    </nav>
    <nav aria-label="Public resources">
      <strong>Public Resources</strong>
      <a href="/ebooks/">Reading</a>
      <a href="/music/">Music</a>
      <a href="/withlovefmb/">With Love, FMB</a>
      <a href="/get-involved/">Get Involved</a>
      <a href="/gethelp/">Get Help</a>
    </nav>
    <nav aria-label="FMB ecosystem links">
      <strong>Ecosystem</strong>
      <a href="/fmbandco/">FMB&amp;CO.</a>
      <a href="https://senzpr.com/">SENZ</a>
      <a href="https://thecognitainstitute.com/">Cognita</a>
      <a href="https://yoni.francinemariebautista.com/">Yoni</a>
      <a href="/mabayani/">Mabayani</a>
    </nav>
  </div>
  <div class="fmb-shell-footer-bottom">
    <span>© 2026 Francine Marie Bautista. All rights reserved.</span>
    <div class="fmb-shell-footer-socials">
      <a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener">Instagram @bb.fmb</a>
      <a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener">Facebook</a>
      <a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>
    </div>
  </div>
</footer>`;

const capabilitySection = `
<section class="fmb-strategy-section soft" id="how-fmb-can-help">
  <div class="fmb-strategy-head">
    <div><span class="fmb-strategy-kicker">How FMB can help</span><h2>Strategy, creativity, communication, and culture brought into one direction.</h2></div>
    <p>Francine Marie Bautista works across brand strategy, creative direction, public relations, strategic communications, education, photography, storytelling, technology, culture, advocacy, and community-building.</p>
  </div>
  <div class="fmb-capability-grid">
    <article class="fmb-capability"><span>01</span><h3>Brand and Identity</h3><p>Brand positioning, identity direction, naming, visual systems, campaigns, and the clarity a business needs before it becomes visible.</p></article>
    <article class="fmb-capability"><span>02</span><h3>PR and Perception</h3><p>Strategic communications, public perception, reputation, media narratives, launch messaging, and responsible public positioning.</p></article>
    <article class="fmb-capability"><span>03</span><h3>Creative Production</h3><p>Creative direction, photography, content systems, storytelling, audiovisual concepts, digital experiences, and campaign execution.</p></article>
    <article class="fmb-capability"><span>04</span><h3>Learning and Culture</h3><p>Training, education, knowledge programs, tourism and place branding, heritage storytelling, language preservation, and cultural research.</p></article>
  </div>
  <div class="fmb-strategy-actions"><a class="primary" href="/work-with-fmb/">Work with FMB</a><a href="https://senzpr.com/">Bring SENZ into your brand</a><a href="https://thecognitainstitute.com/">Explore Cognita</a></div>
</section>`;

const authoritySection = `
<section class="fmb-strategy-section dark" id="fmb-authority">
  <div class="fmb-strategy-head">
    <div><span class="fmb-strategy-kicker">Francine Marie Bautista</span><h2>A multidisciplinary founder working where brand, public meaning, technology, learning, and culture meet.</h2></div>
    <p>Francine is a creative director, brand strategist, entrepreneur, photographer, storyteller, educator, trainer, PR practitioner, communications professional, cultural advocate, and founder.</p>
  </div>
  <div class="fmb-role-cloud"><span>Creative Director</span><span>Brand Strategist</span><span>Entrepreneur</span><span>Photographer</span><span>Storyteller</span><span>Educator</span><span>Trainer</span><span>PR Practitioner</span><span>Strategic Communications</span><span>Cultural Advocate</span><span>Tourism and Place Branding</span><span>Community Builder</span></div>
  <div class="fmb-proof-list" style="margin-top:34px">
    <article><h3>Business and brand leadership</h3><p>Directing FMB&amp;CO., SENZ, and Cognita while preserving the distinct purpose and identity of every company and project.</p></article>
    <article><h3>Public-interest work</h3><p>Keeping women’s empowerment, LGBTQIA+ visibility, mental-health information, culture, language, heritage, dignity, and community participation active in the ecosystem.</p></article>
    <article><h3>Knowledge and training</h3><p>Bringing teaching, facilitation, research, professional development, and practical learning into programs and public resources.</p></article>
    <article><h3>Creative and digital work</h3><p>Building campaigns, visual identities, stories, websites, applications, media, photography, music, and digital products with clear strategy.</p></article>
  </div>
</section>`;

const companyDepth = `
<section class="fmb-strategy-section soft" id="company-depth">
  <div class="fmb-strategy-head">
    <div><span class="fmb-strategy-kicker">The strategic house</span><h2>FMB&amp;CO. organizes businesses, ventures, ideas, intellectual property, and creative direction.</h2></div>
    <p>It is more than a logo above two businesses. It is the parent company and strategic structure that keeps commercial work, learning, technology, creative production, and future ventures clear and connected.</p>
  </div>
  <div class="fmb-company-depth">
    <article><img src="/assets/images/projects/senz-logo-clean.png" alt="SENZ" loading="lazy" decoding="async"><h3>SENZ</h3><p>Marketing and digital solutions for businesses, personalities, institutions, and ideas that need stronger clarity, visibility, systems, and public perception.</p><ul><li>Brand strategy and identity</li><li>Marketing, PR, and strategic communications</li><li>Social media and content systems</li><li>Websites, applications, and digital products</li><li>Creative production, photography, and campaigns</li><li>Analytics, perception, and narrative direction</li></ul><div class="fmb-strategy-actions"><a class="primary" href="https://senzpr.com/">Bring SENZ into your brand</a></div></article>
    <article><img src="/assets/images/projects/cognita-logo-clean.png" alt="Cognita" loading="lazy" decoding="async"><h3>Cognita</h3><p>The knowledge and learning arm for education, professional development, research, training, cultural knowledge, and meaningful exchange.</p><ul><li>Training and learning programs</li><li>Professional and personal development</li><li>Research and knowledge-building</li><li>Culture, heritage, and language initiatives</li><li>Workshops, talks, and educational resources</li><li>Future learning communities and programs</li></ul><div class="fmb-strategy-actions"><a class="primary" href="https://thecognitainstitute.com/">Explore Cognita</a></div></article>
  </div>
</section>`;

const impactDepth = `
<section class="fmb-strategy-section soft" id="impact-depth">
  <div class="fmb-strategy-head">
    <div><span class="fmb-strategy-kicker">With Love, FMB</span><h2>Advocacy, culture, community, wellbeing, and human connection must remain visible.</h2></div>
    <p>This is the heart-facing public platform of the ecosystem. It creates access, preserves stories and culture, supports participation, and helps people feel seen, heard, and valued.</p>
  </div>
  <div class="fmb-impact-grid">
    <article><h3>Women and Identity</h3><p>Women’s empowerment, women’s health information, transgender visibility, LGBTQIA+ dignity, inclusion, and identity-centered storytelling.</p></article>
    <article><h3>Mental Health and Wellbeing</h3><p>Public information, reading, music, support directories, safe-space principles, and responsible pathways to independent professional help.</p></article>
    <article><h3>Culture and Language</h3><p>Sambal language preservation, Masinloc history, Mabayani, heritage research, local memory, cultural expression, and public education.</p></article>
    <article><h3>Community Participation</h3><p>Volunteer pathways, partnerships, community engagements, collaboration, sponsorship, donations, and responsible ways to contribute.</p></article>
    <article><h3>Reading and Music</h3><p>Accessible books, essays, reflections, original music, and resources designed for learning, comfort, courage, and connection.</p></article>
    <article><h3>Projects with Purpose</h3><p>Yoni, Mabayani, community programs, advocacy campaigns, and future projects that carry the values of care, dignity, and access.</p></article>
  </div>
  <div class="fmb-strategy-actions"><a class="primary" href="/get-involved/">Support or participate</a><a href="/gethelp/">Open the support directory</a><a href="/projects/">View the project desk</a></div>
</section>`;

const consolidatedBulletin = `
<section class="bulletin section-band fmb-bulletin-consolidated" id="bulletin" aria-labelledby="bulletinTitle">
  <header class="section-intro">
    <p class="kicker">Official Bulletin</p>
    <h2 id="bulletinTitle">What’s<br>Happening<br>Now</h2>
    <p>Official updates and public stories from Francine Marie Bautista and the FMB ecosystem. This is the official public desk for current announcements from Francine Marie Bautista, FMB&amp;CO., SENZ, Cognita, With Love, FMB, Yoni, Mabayani, FMB News, Music, and Reading.</p>
    <a href="/news/">View all news <span>→</span></a>
  </header>
  <article class="bulletin-feature">
    <div class="bulletin-copy"><p>Featured platform</p><h3>Meet Yoni</h3><span>A private digital companion for existing members, with reflection, reading, listening, and support-oriented tools.</span><a href="https://yoni.francinemariebautista.com/">Open Yoni <b>→</b></a></div>
    <img src="/app/assets/yoni/yoni-hero.webp" width="1254" height="1254" loading="lazy" decoding="async" alt="Yoni, the orange bear companion">
    <em>Existing members</em>
  </article>
  <article class="fmb-bulletin-lead">
    <span class="fmb-strategy-kicker">Official FMB Bulletin · Current priority</span>
    <h3>The latest work, statements, releases, and opportunities across the ecosystem.</h3>
    <p><strong>One connected ecosystem. Clear destinations for every need.</strong> Business and professional inquiries go through FMB&amp;CO. and SENZ. Learning and knowledge work goes through Cognita. Advocacy, community, wellbeing, culture, and participation go through With Love, FMB and the public project desk.</p>
    <div class="fmb-strategy-actions"><a class="primary" href="/news/">Read the latest bulletin</a><a href="/projects/">Explore all projects</a></div>
  </article>
  <div class="bulletin-list">
    <a href="/fmbandco/"><span><small>Company</small><strong>Explore FMB&amp;CO.</strong><p>Meet SENZ and Cognita.</p></span></a>
    <a href="/mabayani/"><span><small>Culture</small><strong>Mabayani</strong><p>History. Expression. Remembrance. A source-first cultural and historical project for Masinloc and the Sambal people.</p></span></a>
    <a href="https://thecognitainstitute.com/"><span><small>Knowledge and learning</small><strong>Cognita</strong><p>Visit the FMB&amp;CO. learning arm.</p></span></a>
    <a href="/get-involved/"><span><small>Participation</small><strong>Get involved</strong><p>Find the correct route for volunteering, partnerships, cultural support, advocacy, and community participation.</p></span></a>
  </div>
</section>`;

async function walk(directory, relative = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, entry.name);
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(child, childRelative));
    else files.push(childRelative);
  }
  return files;
}

function isPublicHtml(relative) {
  if (!relative.endsWith('.html')) return false;
  if (excludedFiles.has(relative)) return false;
  return !excludedPrefixes.some((prefix) => relative.startsWith(prefix));
}

function pageKey(relative) {
  if (relative === 'index.html') return 'home';
  const route = relative.replace(/\/index\.html$/i, '').replace(/\.html$/i, '');
  if (route.startsWith('aboutfmb')) return 'about';
  if (route === 'news') return 'news';
  if (route.startsWith('news/')) return 'news-article';
  if (route.startsWith('projects')) return 'projects';
  if (route === 'ebooks') return 'reading';
  if (route.startsWith('ebooks/')) return 'reading-article';
  if (route.startsWith('music')) return 'music';
  if (route.startsWith('withlovefmb')) return 'withlove';
  if (route === 'fmbandco') return 'fmbandco';
  if (route.startsWith('fmbandco/')) return 'company-gateway';
  if (route.startsWith('mabayani')) return 'mabayani';
  if (route.startsWith('gethelp')) return 'help';
  if (route.startsWith('work-with-fmb')) return 'work';
  if (route.startsWith('get-involved')) return 'participate';
  if (route.startsWith('communityengagements')) return 'community';
  if (/^(privacy|terms|data-deletion)/.test(route)) return 'policy';
  return 'public';
}

function addBodyIdentity(html, key) {
  return html.replace(/<body([^>]*)>/i, (match, attrs = '') => {
    let next = attrs;
    if (/class=(['"])([^'"]*)\1/i.test(next)) {
      next = next.replace(/class=(['"])([^'"]*)\1/i, (full, quote, value) => {
        const classes = new Set(`${value} fmb-unified-public fmb-unified-${key}`.trim().split(/\s+/));
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      next += ` class="fmb-unified-public fmb-unified-${key}"`;
    }
    if (!/data-fmb-page=/i.test(next)) next += ` data-fmb-page="${key}"`;
    return `<body${next}>`;
  });
}

function removeLegacyVisualPatches(html) {
  const obsoleteStyles = [
    'fmb-network-optimized.css',
    'fmb-network-core.css',
    'fmb-network-pages.css',
    'fmb-network-channels.css',
    'fmb-network-reception.css',
    'fmb-network-responsive.css',
    'fmb-identity-v3.css',
    'fmb-production-qa.css',
    'fmb-strategy-completion.css',
    'fmb-sitewide-gateway.css',
    'aboutfmb-seamless.css',
    'fmb-page-home.css',
    'fmb-page-about.css',
    'fmb-page-withlove.css',
    'fmb-page-community.css',
    'fmb-page-help.css',
    'fmb-page-news.css',
    'fmb-page-music.css',
    'fmb-page-ebooks.css',
    'fmb-page-company.css',
    'fmb-page-senz-gateway.css',
    'fmb-page-cognita-gateway.css',
  ];

  for (const file of obsoleteStyles) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${escaped}[^"']*["'][^>]*>\\s*`, 'gi'), '');
  }

  const obsoleteScripts = [
    'fmb-network-optimized.js',
    'fmb-network-motion.js',
    'fmb-reception-search.js',
    'fmb-home-approved.js',
  ];

  for (const file of obsoleteScripts) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`<script\\b[^>]*src=["'][^"']*${escaped}[^"']*["'][^>]*><\\/script>\\s*`, 'gi'), '');
  }

  html = html
    .replace(/<style>html\{background:[^}]+\}body\{visibility:hidden\}<\/style>/i, '<style>html{background:#100129}body{visibility:visible}</style>')
    .replace(/body\{visibility:hidden\}/gi, 'body{visibility:visible}');

  return html;
}

function ensureHeadAssets(html) {
  if (!html.includes('family=Manrope')) {
    html = html.replace('</head>', '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">\n</head>');
  }
  if (!html.includes(cssHref)) html = html.replace('</head>', `<link rel="stylesheet" href="${cssHref}">\n</head>`);
  if (!html.includes(jsSrc)) html = html.replace('</body>', `<script src="${jsSrc}" defer></script>\n</body>`);
  html = /<meta\s+name=["']theme-color["'][^>]*>/i.test(html)
    ? html.replace(/<meta\s+name=["']theme-color["'][^>]*>/i, '<meta name="theme-color" content="#100129">')
    : html.replace('</head>', '<meta name="theme-color" content="#100129">\n</head>');
  return html;
}

function ensureShell(html) {
  if (!html.includes('class="fmb-shell-header"')) html = html.replace(/<body[^>]*>/i, (body) => `${body}\n${shellHeader}`);
  if (!html.includes('class="fmb-shell-footer"')) html = html.replace('</body>', `${shellFooter}\n</body>`);
  return html;
}

function applyContentConsistency(html) {
  return html
    .replaceAll('/aboutfmb/#work-with-fmb', '/work-with-fmb/')
    .replaceAll('/withlovefmb/#volunteer', '/get-involved/')
    .replaceAll('href="#volunteer"', 'href="/get-involved/"')
    .replaceAll('Founder &middot; Strategist &middot; Creative Director &middot; Storyteller', 'Creative Director &middot; Brand Strategist &middot; Entrepreneur &middot; Educator &middot; Storyteller &middot; Founder')
    .replaceAll('Founder, Strategist, Creative Director, Storyteller', 'Creative Director, Brand Strategist, Entrepreneur, Photographer, Storyteller, Educator, Trainer, PR Practitioner, Cultural Advocate, Founder')
    .replaceAll('Creative Director. Strategist. Storyteller. Founder.', 'Creative Director. Brand Strategist. Entrepreneur. Storyteller. Educator. Founder.')
    .replaceAll('Directing distinct projects and businesses with clear roles, public destinations, and responsibilities.', 'Building brands, ideas, public platforms, learning, technology, culture, and community with one clear direction.')
    .replaceAll('Francine connects strategy, creative direction, and storytelling across distinct projects and businesses.', 'Francine connects branding, strategic communications, creative direction, entrepreneurship, photography, education, technology, culture, advocacy, and storytelling across distinct projects and businesses.')
    .replaceAll('Francine Marie Bautista is the founder, strategist, creative director, and storyteller behind the FMB ecosystem.', 'Francine Marie Bautista is a creative director, brand strategist, entrepreneur, photographer, storyteller, educator, trainer, PR practitioner, cultural advocate, and founder behind the FMB ecosystem.')
    .replaceAll('"jobTitle": ["Founder", "Strategist", "Creative Director", "Storyteller"]', '"jobTitle": ["Creative Director", "Brand Strategist", "Entrepreneur", "Photographer", "Storyteller", "Educator", "Trainer", "PR Practitioner", "Cultural Advocate", "Founder"]');
}

function replaceFirstSection(html, classFragment, replacement) {
  const escaped = classFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<section\\b[^>]*class=["'][^"']*${escaped}[^"']*["'][^>]*>[\\s\\S]*?<\\/section>`, 'i');
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function enhanceHome(html) {
  html = replaceFirstSection(html, 'bulletin section-band', consolidatedBulletin);
  if (!html.includes('id="how-fmb-can-help"')) {
    html = html.replace(/(<section\b[^>]*class=["'][^"']*ecosystem[^"']*["'])/i, `${capabilitySection}\n${authoritySection}\n\n$1`);
  }
  return html;
}

function enhanceAbout(html) {
  if (!html.includes('id="how-fmb-can-help"')) html = html.replace('</main>', `${capabilitySection}\n${authoritySection}\n</main>`);
  return html;
}

function enhanceFmbCo(html) {
  html = html
    .replaceAll('One company. Two distinct businesses.', 'One strategic house. Distinct businesses. Future ventures.')
    .replaceAll('FMB&amp;CO. is the company home of SENZ and Cognita. Each business keeps its own purpose, audience, and work.', 'FMB&amp;CO. is the parent company and strategic house for SENZ, Cognita, future ventures, intellectual property, commercial initiatives, technology, learning, and creative production. Each business keeps its own purpose, audience, identity, and responsibility.');
  if (!html.includes('id="company-depth"')) html = html.replace('</main>', `${companyDepth}\n</main>`);
  return html;
}

function enhanceWithLove(html) {
  html = html
    .replaceAll('Care, made easier to understand and act on.', 'Care, culture, dignity, and community turned into visible action.')
    .replaceAll('With Love, FMB is the advocacy, community, and wellbeing part of the FMB ecosystem. This page connects visitors to its current public information, participation route, and support directory.', 'With Love, FMB is the advocacy, culture, community, and wellbeing platform of the FMB ecosystem. It brings together women’s empowerment, LGBTQIA+ visibility, mental-health information, language and heritage preservation, reading, music, safe-space principles, and responsible participation.');
  if (!html.includes('id="impact-depth"')) html = html.replace('</main>', `${impactDepth}\n</main>`);
  return html;
}

const htmlFiles = (await walk(dist)).filter(isPublicHtml);

for (const relative of htmlFiles) {
  const file = path.join(dist, relative);
  const key = pageKey(relative);
  let html = await readFile(file, 'utf8');

  html = removeLegacyVisualPatches(html);
  html = applyContentConsistency(html);
  if (key === 'home') html = enhanceHome(html);
  if (key === 'about') html = enhanceAbout(html);
  if (key === 'fmbandco') html = enhanceFmbCo(html);
  if (key === 'withlove') html = enhanceWithLove(html);
  html = addBodyIdentity(html, key);
  html = ensureShell(html);
  html = ensureHeadAssets(html);

  await writeFile(file, html, 'utf8');
}

for (const relative of htmlFiles) {
  const html = await readFile(path.join(dist, relative), 'utf8');
  for (const required of ['fmb-unified-public', 'fmb-shell-header', 'fmb-shell-footer', cssHref, jsSrc]) {
    if (!html.includes(required)) throw new Error(`${relative}: unified public design requirement missing: ${required}`);
  }
  for (const legacy of ['/aboutfmb/#work-with-fmb', '/withlovefmb/#volunteer', 'fmb-network-optimized.css', 'fmb-strategy-completion.css']) {
    if (html.includes(legacy)) throw new Error(`${relative}: legacy visual or route value remains: ${legacy}`);
  }
}

const home = await readFile(path.join(dist, 'index.html'), 'utf8');
for (const required of ['fmb-bulletin-consolidated', 'id="how-fmb-can-help"', 'id="fmb-authority"']) {
  if (!home.includes(required)) throw new Error(`Homepage makeover content missing: ${required}`);
}
if ((home.match(/id="bulletin"/g) || []).length !== 1) throw new Error('Homepage must contain one consolidated bulletin only.');

console.log(`Applied one FMB&CO.-led public design system to ${htmlFiles.length} public HTML pages.`);
