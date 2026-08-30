import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const cssDir = path.join(dist, 'assets', 'css');
const finalCssHref = '/assets/css/fmb-news-unified-final.css?v=20260830-news-unified-v1';
const worldCssHref = '/assets/css/fmb-worldwide.css?v=20260830-worldwide-v1';

async function exists(file) {
  try { await readFile(file); return true; } catch { return false; }
}

async function htmlFiles(directory) {
  const out = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) {
    if (error?.code === 'ENOENT') return out;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

function ensureClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (full, attrs = '') => {
    if (/\bclass=(['"])/i.test(full)) {
      return full.replace(/\bclass=(['"])(.*?)\1/i, (_match, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    }
    return `<body class="${className}"${attrs}>`;
  });
}

function stripStylesheet(html, filename) {
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${escaped}[^"']*["'][^>]*>\\s*`, 'gi'), '');
}

function activeKey(relative) {
  if (/^news\/world(?:\/|$)/.test(relative)) return 'worldwide';
  if (/^news\/fmb-brief(?:\/|$)/.test(relative)) return 'brief';
  if (/^(?:fmbnews|news)\/about\//.test(relative)) return 'about';
  if (relative === 'fmbnews/index.html' || relative === 'news/index.html') return 'home';
  return '';
}

function newsbar(active = '') {
  const links = [
    ['home', '/fmbnews/', 'News Home'],
    ['brief', '/news/fmb-brief/', 'FMB Brief'],
    ['worldwide', '/news/world/', 'FMB Worldwide'],
    ['national', '/fmbnews/?section=national#reports', 'Philippines'],
    ['business', '/fmbnews/?section=business#reports', 'Economy'],
    ['culture', '/fmbnews/?section=culture#reports', 'Culture'],
    ['about', '/fmbnews/about/', 'About'],
  ];
  return `<nav class="fmb-shell-newsbar" aria-label="FMB News sections"><a class="fmb-shell-newsbar__brand" href="/fmbnews/"><strong>FMB News</strong><span>Filipino Media Bulletin</span></a><div class="fmb-shell-newsbar__links">${links.map(([key, href, label]) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</div></nav>`;
}

const worldwideSpotlight = `<section class="fmb-worldwide-spotlight" id="fmb-worldwide" aria-labelledby="fmbWorldwideTitle"><div class="fmb-worldwide-spotlight__inner"><div class="fmb-worldwide-spotlight__head"><div><p class="fmb-worldwide-spotlight__eyebrow">Global Desk · Past 24 Hours</p><h2 id="fmbWorldwideTitle">FMB Worldwide</h2><p>A separate FMB News desk for consequential verified developments across the world, organized by country and explained with Filipino relevance. FMB Brief remains the complete daily newsletter. FMB Worldwide is the dedicated global desk.</p></div><a class="fmb-worldwide-spotlight__cta" href="/news/world/">Open FMB Worldwide →</a></div><div class="fmb-worldwide-spotlight__grid"><a class="fmb-worldwide-spotlight__card" href="/news/world/august-30-2026/#nepal-china"><small>Nepal + China · Climate</small><strong>Himalayan disaster response remains a major global humanitarian story.</strong></a><a class="fmb-worldwide-spotlight__card" href="/news/world/august-30-2026/#us-roman"><small>United States · Science</small><strong>NASA launches the Nancy Grace Roman Space Telescope.</strong></a><a class="fmb-worldwide-spotlight__card" href="/news/world/august-30-2026/#malaysia"><small>Malaysia · Business + AI</small><strong>Cost-of-living measures arrive alongside new youth AI access.</strong></a></div></div></section>`;

await mkdir(cssDir, { recursive: true });
await writeFile(
  path.join(cssDir, 'fmb-news-unified-final.css'),
  await readFile(path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-news-unified-final.css'), 'utf8'),
  'utf8',
);
await writeFile(
  path.join(cssDir, 'fmb-worldwide.css'),
  await readFile(path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-worldwide.css'), 'utf8'),
  'utf8',
);

const roots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
let processed = 0;
for (const base of roots) {
  for (const file of await htmlFiles(base)) {
    let html = await readFile(file, 'utf8');
    const relative = path.relative(dist, file).replaceAll(path.sep, '/');
    const redirect = /http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html);
    const isWorld = /^news\/world(?:\/|$)/.test(relative);

    html = stripStylesheet(html, 'fmb-news-unified-final.css');
    html = stripStylesheet(html, 'fmb-worldwide.css');
    html = html.replace('</head>', `<link rel="stylesheet" href="${finalCssHref}">${isWorld || relative === 'fmbnews/index.html' ? `<link rel="stylesheet" href="${worldCssHref}">` : ''}</head>`);

    if (isWorld) html = ensureClass(html, 'fmb-worldwide-route');

    html = html.replace(/<nav\b[^>]*class=(['"])[^'"]*\bfmb-shell-newsbar\b[^'"]*\1[^>]*>[\s\S]*?<\/nav>\s*/gi, '');
    if (!redirect && html.includes('class="fmb-shell-header"')) {
      html = html.replace(/(<header\b[^>]*class=(['"])[^'"]*\bfmb-shell-header\b[^'"]*\2[^>]*>[\s\S]*?<\/header>)/i, `$1${newsbar(activeKey(relative))}`);
    }

    if (relative === 'fmbnews/index.html') {
      html = html.replace(/<section\b[^>]*class=(['"])[^'"]*\bfmb-worldwide-spotlight\b[^'"]*\1[^>]*>[\s\S]*?<\/section>\s*/gi, '');
      if (/<section\b[^>]*class=(['"])[^'"]*\bfnc-tools\b/i.test(html)) {
        html = html.replace(/<section\b[^>]*class=(['"])[^'"]*\bfnc-tools\b/i, `${worldwideSpotlight}<section class="fnc-tools"`);
      } else if (/<section\b[^>]*class=(['"])[^'"]*\bfnc-content\b/i.test(html)) {
        html = html.replace(/<section\b[^>]*class=(['"])[^'"]*\bfnc-content\b/i, `${worldwideSpotlight}<section class="fnc-content"`);
      }
    }

    await writeFile(file, html, 'utf8');
    processed += 1;
  }
}

const canonical = path.join(dist, 'fmbnews', 'index.html');
if (await exists(canonical)) {
  const html = await readFile(canonical, 'utf8');
  const failures = [];
  if (!html.includes('fmb-news-unified-final.css')) failures.push('final news stylesheet missing');
  if (!html.includes('fmb-shell-newsbar')) failures.push('contextual newsroom menu missing');
  if (!html.includes('FMB Worldwide')) failures.push('FMB Worldwide menu/overview missing');
  if (!html.includes('fmb-worldwide-spotlight')) failures.push('FMB Worldwide homepage overview missing');
  if (failures.length) throw new Error(`FMB News final unification failed: ${failures.join(', ')}`);
}

console.log(`Applied final FMB News navigation, redundancy cleanup, and visual system across ${processed} newsroom page(s).`);
