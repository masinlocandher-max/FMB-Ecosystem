import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const slug = 'why-websites-cost-and-how-senz-makes-them-accessible';
const articleDir = path.join(dist, 'news', slug);
const articleFile = path.join(articleDir, 'index.html');
const sourceArticle = path.join(dist, 'news', 'pax-silica', 'index.html');
const cssFile = path.join(dist, 'assets', 'css', 'fmb-unified-system.css');
const marker = 'SENZ managed website space 20260725';

const main = `<main id="story" class="senz-website-article">
<section class="senz-article-hero" aria-labelledby="senzArticleTitle">
  <div class="senz-article-wrap">
    <p class="nc-kicker">SENZ Strategic Communications and Digital Solutions</p>
    <h1 id="senzArticleTitle">Website Benefits, Website Costs, and a Smarter Way to Start Online</h1>
    <p class="senz-article-deck">A professional website can strengthen credibility, improve visibility, and give your business a digital home. But building one properly can be expensive. SENZ offers managed website space for businesses that want to begin professionally without carrying the full cost of an independent website.</p>
    <div class="senz-article-actions"><a class="button gold" href="#packages">View website packages</a><a class="button secondary" href="https://senzpr.com/">Start with SENZ</a></div>
  </div>
</section>
<article class="senz-article-body">
  <p class="senz-article-lead">Social media can help people discover a business. A website gives them a stable place to understand it, explore its services, see its work, and make contact.</p>
  <h2>The benefits of having a website</h2>
  <p>A website gives your brand an official digital address that you control. It can make a small business look more established, help customers find accurate information, support search visibility, and keep your services accessible even when you are not actively posting on social media.</p>
  <p>Unlike a social media profile, a website can organize your story, services, portfolio, contact details, articles, and calls to action around your own goals. It also gives your brand room to grow without depending entirely on the rules, reach, or layout of another platform.</p>
  <h2>Why professional websites can be expensive</h2>
  <p>A website is not only a page with text and pictures. A professional build may require planning, writing, visual direction, responsive design, coding, hosting, security, domain management, search optimization, testing, maintenance, and ongoing updates.</p>
  <p>The cost increases when a project needs more pages, custom features, stronger branding, content production, integrations, or long-term technical support. Good website work is expensive because it combines strategy, design, communication, and technology into one functioning business asset.</p>
  <h2>Cannot afford a full website yet? Start with SENZ.</h2>
  <p>Through SENZ Managed Website Space, entrepreneurs, professionals, organizations, and growing businesses can secure a professionally presented digital presence without paying the full upfront cost of developing and maintaining a completely independent website.</p>
  <p>You start with the space your business needs now, while SENZ handles the digital structure, presentation, and continuing management. As your brand grows, your website space can grow with it.</p>
  <section id="packages" class="senz-package-section" aria-labelledby="senzPackagesTitle">
    <p class="nc-kicker">Managed website space</p>
    <h2 id="senzPackagesTitle">Start small. Build strategically. Grow with SENZ.</h2>
    <div class="senz-package-grid">
      <article><span>Studio</span><h3>1 custom page beyond the dashboard</h3><p>About or business information, contact details, social links, and basic SEO.</p><strong>₱5,000 setup</strong><small>₱1,000 monthly</small></article>
      <article><span>Suite</span><h3>5 custom pages beyond the dashboard</h3><p>About, services or products, portfolio, contact, and basic SEO.</p><strong>₱10,000 setup</strong><small>₱3,000 monthly</small></article>
      <article><span>Signature</span><h3>10 custom pages beyond the dashboard</h3><p>About, services, portfolio, blog, contact, and basic SEO.</p><strong>₱15,000 setup</strong><small>₱5,000 monthly</small></article>
      <article><span>Executive</span><h3>15 custom pages beyond the dashboard</h3><p>About, services, portfolio, blog, team or careers, FAQ, contact, and basic SEO.</p><strong>₱20,000 setup</strong><small>₱10,000 monthly</small></article>
    </div>
  </section>
  <h2>More than website space</h2>
  <p>SENZ is a strategic communications and digital solutions partner. Website work can be supported by brand strategy, messaging, marketing, public relations, social media systems, content direction, creative production, and digital products. The goal is not merely to place a business online. It is to make the business clearer, sharper, more visible, and harder to ignore.</p>
  <section class="nc-reflection" aria-labelledby="fmbSenzMessage"><p class="nc-kicker">A message from FMB</p><h2 id="fmbSenzMessage">A strong digital presence should not be reserved for businesses with the biggest budgets.</h2><p>Through SENZ, we want to give growing businesses a practical way to begin professionally, communicate clearly, and build trust online. You do not always need to start with the largest website. You need to start with the right structure, the right message, and a digital space that can grow with you.</p><p><strong>With love,<br>FMB</strong></p></section>
</article>
</main>`;

let html = await readFile(sourceArticle, 'utf8');
html = html
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Website Benefits, Costs, and Affordable Website Space | SENZ</title>')
  .replace(/<meta name="description" content="[^"]*">/i, '<meta name="description" content="Learn the benefits of having a website, why professional websites cost more, and how SENZ Managed Website Space helps businesses start online affordably.">')
  .replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="https://www.francinemariebautista.com/news/${slug}/">`)
  .replace(/<main\b[\s\S]*?<\/main>/i, main)
  .replaceAll('Pax Silica and the Philippines: What It Means for Filipinos', 'Website Benefits, Website Costs, and a Smarter Way to Start Online');
await mkdir(articleDir, { recursive: true });
await writeFile(articleFile, html, 'utf8');

const card = `<article class="nc-rundown-story nc3-searchable" data-search="senz website benefits costs digital solutions business"><a href="/news/${slug}/"><span>Business</span><div><p>Digital Solutions</p><h3>Website Benefits, Website Costs, and a Smarter Way to Start Online</h3></div></a></article>`;
const newsFile = path.join(dist, 'news', 'index.html');
let news = await readFile(newsFile, 'utf8');
if (!news.includes(`/news/${slug}/`)) news = news.replace('<article class="nc-rundown-story"', `${card}\n<article class="nc-rundown-story"`);
await writeFile(newsFile, news, 'utf8');

const promo = `<section class="senz-home-promo" id="senz-managed-website-space" aria-labelledby="senzHomeTitle"><div class="senz-home-promo-copy"><p class="fmb-strategy-kicker">SENZ Managed Website Space</p><h2 id="senzHomeTitle">Your business deserves more than a social media page.</h2><p>Build a professional digital presence through SENZ, starting at ₱5,000 setup and ₱1,000 monthly. Get a managed website space designed to help your business look credible, communicate clearly, and grow strategically.</p><div class="fmb-strategy-actions"><a class="primary" href="/news/${slug}/#packages">View website packages</a><a href="https://senzpr.com/">Start with SENZ</a></div></div><div class="senz-home-package-rail" aria-label="SENZ website packages"><article><span>Studio</span><strong>₱5,000 setup</strong><small>₱1,000 monthly</small></article><article><span>Suite</span><strong>₱10,000 setup</strong><small>₱3,000 monthly</small></article><article><span>Signature</span><strong>₱15,000 setup</strong><small>₱5,000 monthly</small></article><article><span>Executive</span><strong>₱20,000 setup</strong><small>₱10,000 monthly</small></article></div></section>`;
const homeFile = path.join(dist, 'index.html');
let home = await readFile(homeFile, 'utf8');
if (!home.includes('id="senz-managed-website-space"')) home = home.replace(/(<section\b[^>]*id="how-fmb-can-help"[^>]*>)/i, `${promo}\n$1`);
await writeFile(homeFile, home, 'utf8');

let css = await readFile(cssFile, 'utf8');
if (!css.includes(marker)) css += `\n/* ${marker} */\n.senz-article-wrap,.senz-article-body,.senz-home-promo{width:min(var(--fmb-container),calc(100% - 2 * var(--fmb-gutter)));margin-inline:auto}.senz-article-hero{padding:clamp(86px,10vw,150px) var(--fmb-gutter)!important;background:radial-gradient(circle at 82% 18%,rgba(143,211,255,.28),transparent 28rem),linear-gradient(145deg,#07142d,#123f83)!important;color:#fff!important}.senz-article-hero h1{max-width:980px}.senz-article-deck{max-width:760px;font-size:clamp(17px,1.4vw,21px);color:rgba(255,255,255,.78)!important}.senz-article-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.senz-article-body{max-width:900px;padding:clamp(70px,8vw,120px) 0}.senz-article-body>p,.senz-article-body>h2{max-width:780px;margin-inline:auto}.senz-article-body>h2{margin-top:56px}.senz-article-lead{font-size:clamp(20px,2vw,27px)!important;color:var(--fmb-royal)!important}.senz-package-section{margin:64px 0;padding:clamp(34px,5vw,64px)!important;border-radius:34px;background:#eef7ff!important}.senz-package-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:30px}.senz-package-grid article,.senz-home-package-rail article{padding:24px;border:1px solid rgba(36,81,217,.16);border-radius:24px;background:#fff;color:#16091f!important;box-shadow:0 18px 46px rgba(10,23,48,.08)}.senz-package-grid :is(h3,p,strong,small),.senz-home-package-rail :is(h3,p,strong,small){color:#16091f!important}.senz-package-grid span,.senz-home-package-rail span{color:#2451d9!important;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.senz-package-grid h3{margin:16px 0 12px;font-size:25px!important}.senz-package-grid strong,.senz-package-grid small,.senz-home-package-rail strong,.senz-home-package-rail small{display:block}.senz-package-grid small,.senz-home-package-rail small{color:#5e5366!important}.senz-package-grid strong,.senz-home-package-rail strong{margin-top:20px;font-size:20px}.senz-home-promo{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(30px,6vw,80px);align-items:center;padding:clamp(70px,8vw,120px) 0}.senz-home-package-rail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.senz-home-promo-copy h2{max-width:720px}.senz-home-promo-copy p{max-width:680px}@media(max-width:960px){.senz-package-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px}.senz-package-grid article{flex:0 0 min(82vw,360px);scroll-snap-align:center}.senz-home-promo{grid-template-columns:1fr}.senz-home-package-rail{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px}.senz-home-package-rail article{flex:0 0 min(72vw,300px);scroll-snap-align:center}}@media(max-width:600px){.senz-home-package-rail article{flex-basis:78vw}.senz-package-section{margin-inline:-6px}.senz-article-body{width:min(100% - 36px,900px)}}\n`;
await writeFile(cssFile, css, 'utf8');

console.log('Published the SENZ website article, news card, homepage promotion, package pricing, and responsive package rails.');
