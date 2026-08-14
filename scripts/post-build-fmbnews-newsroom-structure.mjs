import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const forbiddenImagePattern = /(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;
const origin = 'https://www.francinemariebautista.com';

const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const decode = (value = '') => String(value).replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
const strip = (value = '') => decode(String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

async function walk(dir) {
  const out = [];
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2] || '';
}

function meta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if ((attr(tag, 'property') || attr(tag, 'name')).toLowerCase() === key.toLowerCase()) return decode(attr(tag, 'content'));
  }
  return '';
}

function canonical(html, file) {
  const link = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(tag => attr(tag, 'rel').toLowerCase() === 'canonical');
  if (link) {
    try { return new URL(attr(link, 'href'), origin).pathname; } catch {}
  }
  return `/${path.relative(dist, path.dirname(file)).split(path.sep).join('/')}/`.replace(/\/+/g, '/');
}

function jsonDate(html) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(match[1]);
      const entries = Array.isArray(value) ? value : [value];
      for (const item of entries) if (item?.datePublished) return String(item.datePublished);
    } catch {}
  }
  return '';
}

function localEditorialImage(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return '';
    const local = parsed.pathname + parsed.search;
    if (!local.startsWith('/assets/') || forbiddenImagePattern.test(local)) return '';
    return local;
  } catch {
    return '';
  }
}

function firstImage(html) {
  const candidates = [
    meta(html, 'og:image'),
    ...[...html.matchAll(/<img\b[^>]*>/gi)].map((match) => decode(attr(match[0], 'src'))),
  ];
  for (const candidate of candidates) {
    const local = localEditorialImage(candidate);
    if (local) return local;
  }
  return '';
}

function proxiedImage(url) {
  return localEditorialImage(url);
}

async function imageExists(url) {
  const local = proxiedImage(url);
  if (!local) return false;
  const pathname = local.split('?')[0].replace(/^\/+/, '');
  try {
    await access(path.join(dist, pathname));
    return true;
  } catch {
    return false;
  }
}

function dateValue(raw) {
  const stamp = Date.parse(raw || '');
  return Number.isFinite(stamp) ? stamp : 0;
}

function dateLabel(raw) {
  const stamp = dateValue(raw);
  if (!stamp) return 'Undated archive';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(stamp));
}

function timeLabel(raw) {
  const stamp = dateValue(raw);
  if (!stamp) return 'Archive';
  return new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(stamp)) + ' PHT';
}

function record(html, file) {
  const route = canonical(html, file);
  if (!route.startsWith('/news/') || route === '/news/' || route.startsWith('/news/archive/') || route.startsWith('/news/morning-special/')) return null;
  if (/http-equiv=["']refresh["']/i.test(html) || /\bnoindex\b/i.test(meta(html, 'robots'))) return null;
  const title = (meta(html, 'og:title') || strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')).replace(/\s*[|·-]\s*FMB News.*$/i, '').trim();
  if (!title) return null;
  const description = meta(html, 'description') || meta(html, 'og:description') || '';
  const published = meta(html, 'article:published_time') || meta(html, 'date') || jsonDate(html);
  const category = strip(html.match(/<[^>]+class=(["'])[^"']*(?:nc-kicker|ms-kicker)[^"']*\1[^>]*>([\s\S]*?)<\//i)?.[2] || '') || 'FMB News';
  const morning = /FMB News Morning Special|fmb-morning-special|\bms-top\b|Morning Special/i.test(html);
  const image = firstImage(html);
  if (!image) return null;
  return { route, title, description, published, category, image, morning };
}

function articleCard(item, compact = false) {
  return `<article class="story-card${compact ? ' compact' : ''}"><a class="story-media" href="${esc(item.route)}"><img src="${esc(proxiedImage(item.image))}" alt="${esc(item.title)}" loading="lazy" decoding="async"></a><div class="story-copy"><div class="story-meta"><span>${esc(item.category)}</span><time datetime="${esc(item.published)}">${esc(timeLabel(item.published))}</time></div><h3><a href="${esc(item.route)}">${esc(item.title)}</a></h3>${compact ? '' : `<p>${esc(item.description)}</p>`}</div></article>`;
}

function shell({ title, description, active, body }) {
  const canonicalPath = active === 'latest' ? '/news/' : active === 'morning' ? '/news/morning-special/' : '/news/archive/';
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${canonicalPath}"><style>:root{--ink:#141018;--purple:#35125e;--orchid:#8a38f5;--muted:#6f6875;--line:#ddd8e1;--paper:#fff;--wash:#f3f1f5;--serif:Georgia,'Times New Roman',serif;--sans:Arial,Helvetica,sans-serif}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);overflow-x:hidden}.topline{height:5px;background:var(--purple)}.mast{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);backdrop-filter:blur(18px)}.mast-inner{width:min(1380px,calc(100% - 48px));min-height:82px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:28px}.brand{color:var(--purple);font-family:var(--serif);font-size:2.35rem;font-weight:700;letter-spacing:-.045em;text-decoration:none}.brand small{display:inline;margin-left:16px;color:var(--muted);font:700 .62rem/1 var(--sans);letter-spacing:.04em}.nav{display:flex;align-items:center;gap:25px}.nav a{padding:31px 0 27px;border-bottom:3px solid transparent;color:var(--ink);font-size:.7rem;font-weight:800;letter-spacing:.06em;text-decoration:none;text-transform:uppercase}.nav a.active,.nav a:hover{border-color:var(--purple);color:var(--purple)}.hero{border-bottom:1px solid var(--line);background:#fff}.hero-inner{width:min(1380px,calc(100% - 48px));margin:auto;padding:24px 0 18px}.eyebrow{display:block;padding:11px 16px;background:#1b0828;color:#dcbcff;font-size:.64rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.hero h1{margin:20px 0 10px;font-family:var(--serif);font-size:clamp(2.3rem,4vw,4.6rem);line-height:.95;letter-spacing:-.045em}.hero p{max-width:760px;margin:0 0 14px;color:var(--muted);font:1rem/1.65 var(--serif)}.section{width:min(1380px,calc(100% - 48px));margin:auto;padding:36px 0 70px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--line)}.section-head h2{margin:0;font-family:var(--serif);font-size:clamp(2.25rem,4vw,3.8rem);letter-spacing:-.045em}.section-head a{color:var(--purple);font-size:.7rem;font-weight:800;text-decoration:none;text-transform:uppercase}.lead-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(320px,.75fr);gap:26px}.lead-card{padding-bottom:25px;border-bottom:1px solid var(--line)}.lead-media{display:block;aspect-ratio:16/9;overflow:hidden;background:linear-gradient(135deg,#21072f,#6d28d9)}.lead-media img,.story-media img{display:block;width:100%;height:100%;object-fit:cover}.lead-card h2{margin:15px 0 9px;font-family:var(--serif);font-size:clamp(2.4rem,4.8vw,4.5rem);line-height:.94;letter-spacing:-.052em}.lead-card h2 a,.story-card h3 a{color:inherit;text-decoration:none}.lead-card p,.story-card p{color:var(--muted);line-height:1.6}.stack{display:grid;align-content:start;gap:15px}.story-card{display:grid;grid-template-columns:180px 1fr;gap:17px;padding:14px 0;border-top:1px solid var(--line)}.story-card.compact{grid-template-columns:130px 1fr}.story-media{display:block;aspect-ratio:4/3;overflow:hidden;background:linear-gradient(135deg,#21072f,#6d28d9)}.story-meta{display:flex;justify-content:space-between;gap:12px;color:var(--muted);font-size:.55rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.story-card h3{margin:7px 0;font-family:var(--serif);font-size:1.42rem;line-height:1.05;letter-spacing:-.025em}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:34px 22px}.grid .story-card{display:block}.grid .story-media{margin-bottom:13px;aspect-ratio:16/10}.special{background:#1b0828;color:#fff}.special .section-head a,.special .story-meta,.special .story-card p{color:#cfbfd7}.special .story-card{border-color:#ffffff26}.archive-day{padding:28px 0 10px;border-top:1px solid var(--line)}.archive-day h2{margin:0 0 18px;font-family:var(--serif);font-size:2.2rem}.archive-list{display:grid;gap:10px}.footer{margin-top:0;padding:65px 0;background:#1b0828;color:#fff}.footer-inner{width:min(1380px,calc(100% - 48px));margin:auto;color:#d3c4d9;font:1rem/1.7 var(--serif)}.footer-inner strong{display:block;margin-bottom:8px;color:#fff;font-size:2.2rem}@media(max-width:850px){.mast-inner{width:min(100% - 28px,1380px);min-height:66px}.brand{font-size:1.7rem}.brand small{display:none}.nav{gap:13px;overflow-x:auto}.nav a{padding:25px 0 20px;font-size:.58rem;white-space:nowrap}.hero-inner,.section{width:min(100% - 28px,1380px)}.hero-inner{padding-top:14px}.lead-grid,.grid{grid-template-columns:1fr}.lead-card h2{font-size:clamp(2.4rem,8vw,4rem)}.story-card,.story-card.compact{grid-template-columns:120px 1fr}}
@media(max-width:520px){.topline{height:4px}.mast-inner{width:100%;padding:0 14px}.brand{font-size:1.55rem}.nav a:nth-child(4),.nav a:nth-child(5){display:none}.hero-inner{width:100%;padding:0}.eyebrow{padding:10px 14px}.hero h1,.hero p{display:none}.section{width:min(100% - 28px,1380px);padding:28px 0 55px}.section-head{align-items:flex-start;flex-direction:column;gap:8px}.section-head h2{font-size:2.65rem}.lead-grid{display:flex;flex-direction:column}.lead-media{margin-inline:-14px}.lead-card h2{font-size:2.45rem;line-height:.98}.lead-card p{font-size:.9rem}.story-card,.story-card.compact{grid-template-columns:104px minmax(0,1fr);gap:13px}.story-card p{display:none}.story-card h3{font-size:1.16rem}.story-meta{display:block}.story-meta time{display:block;margin-top:4px}.grid{display:block}.grid .story-card{display:grid}.grid .story-media{margin:0;aspect-ratio:4/3}.footer{padding:48px 0}.footer-inner{width:min(100% - 28px,1380px)}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}</style></head><body><div class="topline"></div><header class="mast"><div class="mast-inner"><a class="brand" href="/news/">FMB News<small>The news that matters. Made clear for Filipinos.</small></a><nav class="nav"><a class="${active==='latest'?'active':''}" href="/news/">Latest</a><a class="${active==='morning'?'active':''}" href="/news/morning-special/">Morning Special</a><a class="${active==='archive'?'active':''}" href="/news/archive/">Archive</a><a href="/news/about/">About</a><a href="mailto:info.senz.pr@gmail.com?subject=FMB%20News%20Story%20Submission">Submit a story</a></nav></div></header>${body}<footer class="footer"><div class="footer-inner"><strong>FMB News</strong><br>Verified facts, visible sources, meaningful context and clear explanations for Filipinos.</div></footer></body></html>`;
}

function groupByDate(items) {
  const groups = new Map();
  for (const item of items) {
    const key = dateLabel(item.published);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function latestPage(normal, morning) {
  const lead = normal[0] || morning[0];
  const side = normal.slice(1, 4);
  const rest = normal.slice(4, 13);
  const latestMorningDate = morning[0] ? dateLabel(morning[0].published) : '';
  const latestMorning = latestMorningDate ? morning.filter(item => dateLabel(item.published) === latestMorningDate) : [];
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">What matters now</div><h1>The news that matters. Made clear for Filipinos.</h1><p>Verified reporting, useful context, and the developments shaping Filipino lives.</p></div></section><main><section class="section"><div class="section-head"><h2>Latest News</h2><a href="/news/archive/">Browse complete archive →</a></div>${lead ? `<div class="lead-grid"><article class="lead-card"><a class="lead-media" href="${esc(lead.route)}"><img src="${esc(proxiedImage(lead.image))}" alt="${esc(lead.title)}"></a><div class="story-meta"><span>${esc(lead.category)}</span><time>${esc(timeLabel(lead.published))}</time></div><h2><a href="${esc(lead.route)}">${esc(lead.title)}</a></h2><p>${esc(lead.description)}</p></article><div class="stack">${side.map(item => articleCard(item,true)).join('')}</div></div>` : '<p>No current reports available.</p>'}</section>${latestMorning.length ? `<section class="special"><div class="section"><div class="section-head"><div><div class="eyebrow">Daily Edition</div><h2>Morning Special</h2></div><a href="/news/morning-special/">All editions →</a></div><p style="margin:-8px 0 24px;color:#cdbfd4">${esc(latestMorningDate)}</p><div class="grid">${latestMorning.slice(0,6).map(item=>articleCard(item)).join('')}</div></div></section>` : ''}<section class="section"><div class="section-head"><h2>More Reports</h2><a href="/news/archive/">View all →</a></div><div class="grid">${rest.map(item=>articleCard(item)).join('')}</div></section></main>`;
  return shell({ title:'FMB News | The news that matters. Made clear for Filipinos.', description:'FMB News presents current Philippine and global reports in clear chronological order, with a separate Morning Special daily edition archive.', active:'latest', body });
}

function morningPage(morning) {
  const groups = groupByDate(morning);
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">FMB News Daily Edition</div><h1>Morning Special</h1><p>A dedicated archive for FMB News Morning Special. Each morning edition stays together by publication date instead of being mixed into the ordinary breaking-news stream.</p></div></section><main class="section">${morning.length ? [...groups.entries()].map(([label,items])=>`<section class="archive-day"><h2>${esc(label)}</h2><div class="grid">${items.map(item=>articleCard(item)).join('')}</div></section>`).join('') : '<p>No Morning Special editions are available yet.</p>'}</main>`;
  return shell({ title:'Morning Special Archive | FMB News', description:'Browse FMB News Morning Special editions by date.', active:'morning', body });
}

function archivePage(normal) {
  const groups = groupByDate(normal);
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">FMB News Record</div><h1>News Archive</h1><p>Every standard FMB News report in reverse chronological order. Morning Special is archived separately so the record stays clear.</p></div></section><main class="section">${normal.length ? [...groups.entries()].map(([label,items])=>`<section class="archive-day"><h2>${esc(label)}</h2><div class="archive-list">${items.map(item=>articleCard(item,true)).join('')}</div></section>`).join('') : '<p>No archived reports are available.</p>'}</main>`;
  return shell({ title:'News Archive | FMB News', description:'Browse the complete chronological archive of standard FMB News reports.', active:'archive', body });
}

function cleanGenericImageDelivery(html) {
  return html
    .replace(/<style\b[^>]*id=["']fmb-news-image-fallback-surface["'][^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<figure\b[^>]*>[\s\S]*?(?:fmb-news-editorial-fallback|newsroom-editorial-fallback)\.svg[\s\S]*?<\/figure>\s*/gi, '')
    .replace(/<(?:img|source)\b[^>]*(?:fmb-news-editorial-fallback|newsroom-editorial-fallback)\.svg[^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*content=["'][^"']*(?:fmb-news-editorial-fallback|newsroom-editorial-fallback)\.svg[^"']*["'][^>]*>\s*/gi, '');
}

const files = await walk(newsRoot);
const records = [];
for (const file of files) {
  if (file === path.join(newsRoot, 'index.html')) continue;
  let html = await readFile(file, 'utf8');
  const rec = record(html, file);
  if (rec && await imageExists(rec.image)) records.push(rec);
  const cleaned = cleanGenericImageDelivery(html);
  if (cleaned !== html) await writeFile(file, cleaned, 'utf8');
}

records.sort((a,b)=>dateValue(b.published)-dateValue(a.published) || a.title.localeCompare(b.title));
const morning = records.filter(item=>item.morning);
const normal = records.filter(item=>!item.morning);

await mkdir(path.join(newsRoot,'archive'), { recursive:true });
await mkdir(path.join(newsRoot,'morning-special'), { recursive:true });
await writeFile(path.join(newsRoot,'index.html'), latestPage(normal,morning), 'utf8');
await writeFile(path.join(newsRoot,'archive','index.html'), archivePage(normal), 'utf8');
await writeFile(path.join(newsRoot,'morning-special','index.html'), morningPage(morning), 'utf8');

const aliasDir = path.join(dist,'fmbnews');
await mkdir(aliasDir,{recursive:true});
await writeFile(path.join(aliasDir,'index.html'), `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${origin}/news/"><meta http-equiv="refresh" content="0;url=/news/"><title>FMB News</title></head><body><p><a href="/news/">Continue to FMB News</a></p></body></html>`, 'utf8');

console.log(`FMB News newsroom structure finalized with real attached images only: ${normal.length} standard reports, ${morning.length} Morning Special stories. Reports without valid local editorial media were withheld from all indexes.`);
