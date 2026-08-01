import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const requiredVisualCss = '/assets/css/fmb-sitewide-visual-fixes.css?v=20260726-readability-v2';
const editorialContract = '<style data-newsroom-generated-contract>.news-story-route .nc-story-body,.news-story-route .nc-article-deck{font-family: Georgia, "Times New Roman", Times, serif !important}</style>';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (match, attrs = '') => {
    const classAttribute = /\bclass=(["'])([^"']*)\1/i;
    if (classAttribute.test(attrs)) {
      const nextAttrs = attrs.replace(classAttribute, (whole, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
      return `<body${nextAttrs}>`;
    }
    return `<body${attrs} class="${className}">`;
  });
}

function channelCommand() {
  return `<section class="fmb-v2-news-command fmb-news-channel-command" aria-label="FMB News Center channel identity">
  <div class="fmb-news-channel-command-inner">
    <a class="fmb-news-channel-brand" href="/news/" aria-label="FMB News Center home">
      <span class="fmb-news-channel-mark" aria-hidden="true">FMB</span>
      <span class="fmb-news-channel-brand-copy"><strong>News Center</strong><small>Filipino ang Mismong Balita.</small></span>
    </a>
    <p class="fmb-news-channel-description">Public-interest reporting · Context · Source visibility · Corrections</p>
    <nav class="fmb-news-channel-links" aria-label="News Center quick links"><a href="/news/">Headlines</a><a href="/news/#rundown">Latest reports</a><a href="/news/#editorial-standard">Standards</a></nav>
  </div>
</section>`;
}

function fallbackLivebar() {
  const headlines = [
    ['Early 2 August Briefing: Luis Forms as China Holds Drills at Bajo de Masinloc', '/news/early-briefing-august-2-2026/'],
    ['Marcos authorizes release of Sara Duterte tax records', '/news/marcos-authorizes-release-sara-duterte-tax-records/'],
    ['PBBM’s 2026 SONA: accountability took center stage', '/news/pbbm-sona-2026-accountability-delivery/'],
  ];
  const group = headlines.map(([label, href]) => `<a href="${href}">${label}</a>`).join('');
  return `<section class="fmb-news-livebar" aria-label="FMB News live headlines and Philippine Standard Time">
  <strong class="fmb-news-live-label">Live Desk</strong>
  <time class="fmb-news-pst" data-fmb-pst>Philippine Standard Time</time>
  <div class="fmb-news-ticker-window">
    <div class="fmb-news-ticker-track">
      <div class="fmb-news-ticker-group">${group}</div>
      <div class="fmb-news-ticker-group" aria-hidden="true">${group}</div>
    </div>
  </div>
</section>`;
}

let updated = 0;
let repairedLivebars = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:channel|story)-route\b/.test(html)) continue;

  html = addBodyClass(html, 'fmb-unified-public');
  html = addBodyClass(html, 'fmb-approved-launch');
  html = addBodyClass(html, 'newsroom-polish-v3');
  html = addBodyClass(html, 'news-channel-v4');
  if (!html.includes(requiredVisualCss)) html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="${requiredVisualCss}">\n</head>`);
  if (/\bnews-story-route\b/.test(html) && !html.includes('data-newsroom-generated-contract')) html = html.replace(/<\/head>/i, `${editorialContract}\n</head>`);

  html = html.replace(/<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-v2-news-command\b[^"']*["'])[^>]*>[\s\S]*?<\/section>\s*/gi, '');
  const livebar = /(<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-news-livebar\b[^"']*["'])[^>]*>[\s\S]*?<\/section>)/i;
  if (!livebar.test(html)) {
    const headerEnd = /<\/header>/i;
    html = headerEnd.test(html)
      ? html.replace(headerEnd, `</header>\n${fallbackLivebar()}`)
      : html.replace(/<main\b/i, `${fallbackLivebar()}\n<main`);
    repairedLivebars += 1;
  }
  if (!livebar.test(html)) throw new Error(`News Center channel masthead: could not repair global livebar in ${filePath}`);
  html = html.replace(livebar, `$1\n${channelCommand()}`);

  const commandSections = html.match(/<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-news-channel-command\b[^"']*["'])[^>]*>/gi) || [];
  const commandInners = html.match(/<div\b(?=[^>]*\bclass=["'][^"']*\bfmb-news-channel-command-inner\b[^"']*["'])[^>]*>/gi) || [];
  if (commandSections.length !== 1 || commandInners.length !== 1) {
    throw new Error(`News Center channel masthead: ${filePath} must contain one command section and one inner class reference`);
  }

  if (!html.includes('Filipino ang Mismong Balita.')) throw new Error(`News Center channel masthead: approved tagline is missing in ${filePath}`);
  if (!/\bclass=["'][^"']*\bfmb-unified-public\b/.test(html)) throw new Error(`News Center compatibility: missing fmb-unified-public in ${filePath}`);
  if (!/\bclass=["'][^"']*\bfmb-approved-launch\b/.test(html)) throw new Error(`News Center compatibility: missing fmb-approved-launch in ${filePath}`);
  if (!/\bclass=["'][^"']*\bnewsroom-polish-v3\b/.test(html)) throw new Error(`News Center compatibility: missing newsroom-polish-v3 in ${filePath}`);
  if (!html.includes(requiredVisualCss)) throw new Error(`News Center compatibility: missing required visual stylesheet in ${filePath}`);

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

console.log(`Added the News Center masthead and final approved newsroom contract to ${updated} landing and report pages and repaired ${repairedLivebars} post-build livebar(s).`);
