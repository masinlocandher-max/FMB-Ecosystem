import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const fallback = '/assets/images/news/fmb-news-editorial-fallback.svg';
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

function firstImage(html) {
  const og = meta(html, 'og:image');
  if (og) return og;
  const tag = html.match(/<img\b[^>]*>/i)?.[0] || '';
  return decode(attr(tag, 'src')) || fallback;
}

function proxiedImage(url) {
  if (!url || url === fallback) return fallback;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin === origin) return parsed.pathname + parsed.search;
    return `/api/news-image?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return fallback;
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
  return { route, title, description, published, category, image: firstImage(html), morning };
}

function articleCard(item, compact = false) {
  return `<article class="story-card${compact ? ' compact' : ''}"><a class="story-media" href="${esc(item.route)}"><img src="${esc(proxiedImage(item.image))}" alt="${esc(item.title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallback}'"></a><div class="story-copy"><div class="story-meta"><span>${esc(item.category)}</span><time datetime="${esc(item.published)}">${esc(timeLabel(item.published))}</time></div><h3><a href="${esc(item.route)}">${esc(item.title)}</a></h3>${compact ? '' : `<p>${esc(item.description)}</p>`}</div></article>`;
}

function shell({ title, description, active, body }) {
  const canonicalPath = active === 'latest' ? '/news/' : active === 'morning' ? '/news/morning-special/' : '/news/archive/';
  return `<!doctype html><html lang="en-PH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${canonicalPath}"><style>:root{--ink:#16091f;--purple:#271032;--muted:#716778;--line:#e9e2eb;--paper:#fff;--wash:#faf8fb}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif}.topline{height:7px;background:linear-gradient(90deg,#170720,#4d1d63,#170720)}.mast{border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);position:sticky;top:0;z-index:10}.mast-inner{width:min(1220px,calc(100% - 36px));margin:auto;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 0}.brand{text-decoration:none;color:var(--ink);font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:clamp(1.65rem,3vw,2.45rem);letter-spacing:-.045em}.brand small{display:block;font-family:Arial,sans-serif;font-size:.55rem;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:#75677d;margin-top:2px}.nav{display:flex;gap:6px;flex-wrap:wrap}.nav a{color:#574a5d;text-decoration:none;font-size:.78rem;font-weight:700;padding:9px 12px;border-radius:999px}.nav a.active{background:var(--purple);color:#fff}.hero{background:radial-gradient(circle at 84% 16%,rgba(67,20,85,.1),transparent 16rem),linear-gradient(180deg,#fff,#faf7fb);border-bottom:1px solid var(--line)}.hero-inner{width:min(1220px,calc(100% - 36px));margin:auto;padding:58px 0 38px}.eyebrow{text-transform:uppercase;letter-spacing:.17em;font-size:.66rem;font-weight:800;color:#765a80}.hero h1{font-family:Georgia,'Times New Roman',serif;font-size:clamp(3.2rem,8vw,7.4rem);line-height:.86;letter-spacing:-.065em;margin:12px 0 18px;max-width:10ch}.hero p{max-width:760px;color:#665b6a;font-family:Georgia,'Times New Roman',serif;font-size:1.08rem;line-height:1.75}.section{width:min(1220px,calc(100% - 36px));margin:auto;padding:44px 0}.section-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}.section-head h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(2rem,4vw,3.5rem);letter-spacing:-.045em;margin:0}.section-head a{color:#4d3158;font-size:.82rem;font-weight:700;text-decoration:none}.lead-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.75fr);gap:28px}.lead-card{border-bottom:1px solid var(--line);padding-bottom:26px}.lead-media{display:block;aspect-ratio:16/9;overflow:hidden;background:#eee8f0}.lead-media img,.story-media img{width:100%;height:100%;object-fit:cover;display:block}.lead-card h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(2.3rem,5vw,4.8rem);line-height:.95;letter-spacing:-.055em;margin:18px 0 10px}.lead-card h2 a,.story-card h3 a{color:inherit;text-decoration:none}.lead-card p,.story-card p{color:#6a606e;line-height:1.65}.stack{display:grid;gap:20px}.story-card{display:grid;grid-template-columns:190px 1fr;gap:18px;border-bottom:1px solid var(--line);padding-bottom:18px}.story-card.compact{grid-template-columns:130px 1fr}.story-media{display:block;aspect-ratio:4/3;overflow:hidden;background:#eee8f0}.story-meta{display:flex;gap:12px;justify-content:space-between;color:#877b8b;text-transform:uppercase;font-size:.59rem;letter-spacing:.09em;font-weight:800}.story-card h3{font-family:Georgia,'Times New Roman',serif;font-size:1.45rem;line-height:1.08;letter-spacing:-.025em;margin:8px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px}.grid .story-card{display:block}.grid .story-media{margin-bottom:14px}.special{background:#1b0b24;color:#fff}.special .section-head a,.special .story-meta,.special .story-card p{color:#cdbfd4}.special .story-card{border-color:#493653}.special .story-media{background:#321c3d}.archive-day{border-top:1px solid var(--line);padding:30px 0 12px}.archive-day h2{font-family:Georgia,'Times New Roman',serif;font-size:2.2rem;margin:0 0 22px}.archive-list{display:grid;gap:18px}.footer{border-top:1px solid var(--line);margin-top:30px}.footer-inner{width:min(1220px,calc(100% - 36px));margin:auto;padding:28px 0 45px;color:#786d7d;font-size:.75rem;line-height:1.6}@media(max-width:850px){.mast-inner{align-items:flex-start;flex-direction:column}.lead-grid,.grid{grid-template-columns:1fr}.story-card,.story-card.compact{grid-template-columns:120px 1fr}.hero-inner{padding-top:38px}.hero h1{font-size:clamp(3rem,15vw,5.8rem)}}@media(max-width:520px){.story-card,.story-card.compact{grid-template-columns:100px 1fr}.story-card p{display:none}.section,.hero-inner{width:min(100% - 24px,1220px)}.mast-inner{width:min(100% - 24px,1220px)}.nav{gap:2px}.nav a{padding:8px 9px}.story-card h3{font-size:1.2rem}}</style></head><body><div class="topline"></div><header class="mast"><div class="mast-inner"><a class="brand" href="/news/">FMB News<small>The news that matters. Made clear for Filipinos.</small></a><nav class="nav"><a class="${active==='latest'?'active':''}" href="/news/">Latest</a><a class="${active==='morning'?'active':''}" href="/news/morning-special/">Morning Special</a><a class="${active==='archive'?'active':''}" href="/news/archive/">Archive</a><a href="/news/about/">About</a><a href="/news/submit/">Submit a story</a></nav></div></header>${body}<footer class="footer"><div class="footer-inner"><strong>FMB News</strong><br>Verified facts, visible sources, meaningful context and clear explanations for Filipinos.</div></footer></body></html>`;
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
  const body = `<section class="hero"><div class="hero-inner"><div class="eyebrow">Independent Filipino News and Explainers</div><h1>News, properly organized.</h1><p>Current reports appear in true publication order. Morning Special has its own edition archive. Older reporting remains available without competing with the present news cycle.</p></div></section><main><section class="section"><div class="section-head"><h2>Latest News</h2><a href="/news/archive/">Browse complete archive →</a></div>${lead ? `<div class="lead-grid"><article class="lead-card"><a class="lead-media" href="${esc(lead.route)}"><img src="${esc(proxiedImage(lead.image))}" alt="${esc(lead.title)}" onerror="this.onerror=null;this.src='${fallback}'"></a><div class="story-meta"><span>${esc(lead.category)}</span><time>${esc(timeLabel(lead.published))}</time></div><h2><a href="${esc(lead.route)}">${esc(lead.title)}</a></h2><p>${esc(lead.description)}</p></article><div class="stack">${side.map(item => articleCard(item,true)).join('')}</div></div>` : '<p>No current reports available.</p>'}</section>${latestMorning.length ? `<section class="special"><div class="section"><div class="section-head"><div><div class="eyebrow">Daily Edition</div><h2>Morning Special</h2></div><a href="/news/morning-special/">All editions →</a></div><p style="margin:-8px 0 24px;color:#cdbfd4">${esc(latestMorningDate)}</p><div class="grid">${latestMorning.slice(0,6).map(item=>articleCard(item)).join('')}</div></div></section>` : ''}<section class="section"><div class="section-head"><h2>More Reports</h2><a href="/news/archive/">View all →</a></div><div class="grid">${rest.map(item=>articleCard(item)).join('')}</div></section></main>`;
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

function rewriteRemoteImgTags(html) {
  return html.replace(/<img\b[^>]*>/gi, tag => {
    const src = decode(attr(tag, 'src'));
    if (!/^https:\/\//i.test(src)) return tag;
    const replacement = proxiedImage(src);
    let next = tag.replace(/\bsrc\s*=\s*(["'])[^"']*\1/i, `src="${esc(replacement)}"`);
    next = next.replace(/\s+srcset\s*=\s*(["'])[^"']*\1/gi, '');
    if (!/\bonerror\s*=/i.test(next)) next = next.replace(/>$/, ` onerror="this.onerror=null;this.src='${fallback}'">`);
    return next;
  });
}

const files = await walk(newsRoot);
const records = [];
for (const file of files) {
  if (file === path.join(newsRoot, 'index.html')) continue;
  let html = await readFile(file, 'utf8');
  const rec = record(html, file);
  if (rec) records.push(rec);
  const rewritten = rewriteRemoteImgTags(html);
  if (rewritten !== html) await writeFile(file, rewritten, 'utf8');
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

console.log(`FMB News newsroom structure finalized: ${normal.length} standard reports, ${morning.length} Morning Special stories. Separate /news/archive/ and /news/morning-special/ generated; /fmbnews/ canonicalized.`);
