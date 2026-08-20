import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const strip = (value = '') => String(value)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#0?39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

function latestBriefFromArchive(html) {
  const start = html.search(/<a\b[^>]*class=["'][^"']*brief-issue[^"']*["'][^>]*>/i);
  if (start < 0) throw new Error('FMB Brief archive has no visible issue entry.');
  const end = html.indexOf('</a>', start);
  if (end < 0) throw new Error('FMB Brief archive first issue entry is malformed.');
  const entry = html.slice(start, end + 4);
  const href = entry.match(/\bhref=["']([^"']+)["']/i)?.[1] || '';
  const date = strip(entry.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1] || '');
  const title = strip(entry.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || '');
  const deck = strip(entry.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '');
  const image = entry.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)?.[1] || '';
  const alt = entry.match(/<img\b[^>]*\balt=["']([^"']*)["'][^>]*>/i)?.[1] || title;
  if (!href || !date || !title || !deck || !image) throw new Error('Latest FMB Brief archive entry is incomplete.');
  return { href, date, title, deck, image, alt };
}

async function visibleCreditFor(route) {
  const file = path.join(dist, route.replace(/^\//, ''), 'index.html');
  const html = await readFile(file, 'utf8');
  return html.match(/<figcaption\b[^>]*class=["'][^"']*brief-credit[^"']*["'][^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]?.trim() || '';
}

function patchShell(html) {
  html = html.replace(
    /<a class="brand" href="\/news\/">FMB News<small>[\s\S]*?<\/small><\/a>/i,
    '<a class="brand" href="/news/">FMB News<small>Filipino Media Bulletin</small></a>',
  );
  html = html.replace(
    /<a class="([^"]*)" href="\/news\/morning-special\/">Morning Special<\/a>/gi,
    '<a class="$1" href="/news/fmb-brief/">FMB Brief</a>',
  );
  html = html.replace(
    '.brand small{display:inline;margin-left:16px;',
    '.brand small{display:block;margin:4px 0 0;',
  );
  html = html.replace(
    /FMB News presents current Philippine and global reports in clear chronological order, including a complete Morning Special daily magazine edition\./gi,
    'FMB News presents current Philippine and global reporting in clear chronological order, with FMB Brief published separately as the daily newsletter.',
  );
  html = html.replace(
    /Morning Special remains a separate full-edition archive\./gi,
    'FMB Brief remains a separate daily newsletter archive.',
  );
  return html;
}

function briefFeature(issue, creditHtml) {
  return `<section class="special"><div class="section"><div class="section-head"><div><div class="eyebrow">Daily newsletter · Separate from News</div><h2>FMB Brief</h2></div><a href="/news/fmb-brief/">All briefs →</a></div><div class="edition-feature"><a class="edition-cover" href="${esc(issue.href)}"><img src="${esc(issue.image)}" alt="${esc(strip(issue.alt))}" loading="eager" decoding="async" fetchpriority="high"></a><div class="edition-feature-copy"><div class="edition-date">FMB Brief · ${esc(issue.date)}</div><h3>${esc(issue.title)}</h3><p>${esc(issue.deck)}</p><a class="button" href="${esc(issue.href)}">Read today’s brief →</a></div></div>${creditHtml ? `<div class="special-credit">${creditHtml}</div>` : ''}</div></section>`;
}

function patchHomepage(html, issue, creditHtml) {
  html = patchShell(html);
  const feature = briefFeature(issue, creditHtml);
  if (!/<section class="special">[\s\S]*?<\/section>/i.test(html)) throw new Error('FMB News homepage special section was not found.');
  html = html.replace(/<section class="special">[\s\S]*?<\/section>/i, feature);
  if (!html.includes('.special-credit{')) {
    html = html.replace('</style>', '.special-credit{margin-top:10px;color:#d4c9d7;font-size:.7rem;line-height:1.45}.special-credit a{color:#fff}</style>');
  }
  return html;
}

const briefArchiveFile = path.join(newsRoot, 'fmb-brief', 'index.html');
const briefArchive = await readFile(briefArchiveFile, 'utf8');
const latestBrief = latestBriefFromArchive(briefArchive);
const creditHtml = await visibleCreditFor(latestBrief.href);

const homepageFile = path.join(newsRoot, 'index.html');
let homepage = await readFile(homepageFile, 'utf8');
homepage = patchHomepage(homepage, latestBrief, creditHtml);
await writeFile(homepageFile, homepage, 'utf8');

const aliasFile = path.join(dist, 'fmbnews', 'index.html');
let alias = await readFile(aliasFile, 'utf8');
alias = patchHomepage(alias, latestBrief, creditHtml);
await writeFile(aliasFile, alias, 'utf8');

const archiveFile = path.join(newsRoot, 'archive', 'index.html');
let archive = await readFile(archiveFile, 'utf8');
archive = patchShell(archive);
await writeFile(archiveFile, archive, 'utf8');

for (const [label, html] of [['homepage', homepage], ['alias', alias], ['archive', archive]]) {
  if (/Morning Special/i.test(html)) throw new Error(`${label}: legacy Morning Special wording remains after final public-surface lock.`);
  if (!/Filipino Media Bulletin/i.test(html)) throw new Error(`${label}: Filipino Media Bulletin identity is missing.`);
  if (!/\/news\/fmb-brief\//i.test(html)) throw new Error(`${label}: FMB Brief navigation is missing.`);
}
if (!homepage.includes(`href="${latestBrief.href}"`)) throw new Error('Homepage does not feature the newest FMB Brief issue.');

console.log(`Final FMB News public surface locked to Filipino Media Bulletin identity and newest FMB Brief (${latestBrief.date}).`);
