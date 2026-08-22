// FMB News is a distinct publication, not a section of the FMB&CO. corporate
// site. Every /news/ route therefore carries the newsroom's own masthead,
// section rail and footer, and drops the corporate shell that the shared build
// applies to the rest of the public site.
//
// This runs at the end of the release pipeline, after the corporate shell and
// the dist verification stages, so it owns the production-facing newsroom
// surface without fighting the earlier stages.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoot = path.join(dist, 'news');
const stylesheet = '/assets/css/fmb-news-final.css?v=20260807';
const newsScript = '/assets/js/fmb-news-approved.js?v=20260807';

const PUBLICATION = 'FMB News';
const BULLETIN = 'Filipino Media Bulletin';

async function walk(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(target)));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(target);
  }
  return files;
}

const sections = [
  ['FMB Brief', '/news/fmb-brief/'],
  ['Latest', '/news/#stories'],
  ['Philippines', '/news/#stories'],
  ['World', '/news/#stories'],
  ['Economy', '/news/#stories'],
  ['Culture', '/news/#stories'],
  ['Climate', '/news/#stories'],
  ['About', '/news/about/'],
];

const wordmark = (extraClass = '') =>
  `<a class="brand${extraClass}" href="/news/" aria-label="${PUBLICATION}, ${BULLETIN}">${PUBLICATION}<small>${BULLETIN}</small></a>`;

const identityStrip = `<div class="news-identity" aria-label="Publication identity">
  <div class="shell"><span><b>${PUBLICATION}</b> · ${BULLETIN}</span><span>An independent newsroom of the FMB ecosystem · <a href="/">FMB&amp;CO.</a></span></div>
</div>`;

const masthead = `<header class="masthead">
  <div class="shell mast-row">
    ${wordmark()}
    <nav class="desktop-nav" aria-label="${PUBLICATION} sections">${sections
      .slice(0, 7)
      .map(([label, href]) => `<a href="${href}">${label}</a>`)
      .join('')}</nav>
    <div class="actions">
      <a class="submit-button" href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Share a Story</a>
      <button class="menu-button" data-menu aria-label="Open menu" aria-expanded="false">&#9776;</button>
    </div>
  </div>
  <nav class="mobile-nav" data-mobile-nav aria-label="${PUBLICATION} sections">${sections
    .map(([label, href]) => `<a href="${href}">${label}</a>`)
    .join('')}</nav>
</header>`;

// Retained for reference: the front page ships its own section rail.
const sectionRail = `<div class="section-rail"><div class="shell section-links">${sections
  .map(([label, href]) => `<a href="${href}">${label}</a>`)
  .join('')}</div></div>`;

const footer = `<footer class="footer">
  <div class="shell footer-grid">
    <div>${wordmark(' footer-brand')}<p>The news that matters. Made clear for Filipinos.</p></div>
    <nav><h3>Sections</h3>${sections
      .slice(0, 6)
      .map(([label, href]) => `<a href="${href}">${label}</a>`)
      .join('')}</nav>
    <nav><h3>Newsroom</h3><a href="/news/about/">About ${PUBLICATION}</a><a href="mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News">Submit a Story</a><a href="mailto:withlovefmb@gmail.com?subject=FMB%20News%20Correction">Corrections</a></nav>
    <nav><h3>FMB ecosystem</h3><a href="/">FMB&amp;CO.</a><a href="/aboutfmb/">About FMB</a><a href="/projects/">Projects</a></nav>
  </div>
  <div class="shell footer-bottom"><span>&copy; 2026 ${BULLETIN}.</span><span>Sources visible &middot; Evidence first &middot; Built for Filipinos</span></div>
</footer>`;

// Corporate shell fragments that must not appear on a newsroom page.
function stripCorporateShell(html) {
  return html
    .replace(/<div\b[^>]*class=["'][^"']*\bfmb-shell-rail\b[^"']*["'][\s\S]*?<\/div>\s*(?=<header)/gi, '')
    .replace(/<header\b[^>]*class=["'][^"']*\bfmb-shell-header\b[^"']*["'][\s\S]*?<\/header>\s*/gi, '')
    .replace(/<footer\b[^>]*class=["'][^"']*\bfmb-shell-footer\b[^"']*["'][\s\S]*?<\/footer>\s*/gi, '')
    .replace(/<header\b[^>]*class=["'][^"']*\bnc-site-header\b[^"']*["'][\s\S]*?<\/header>\s*/gi, '')
    .replace(/<footer\b[^>]*class=["'][^"']*\bnc-footer\b[^"']*["'][\s\S]*?<\/footer>\s*/gi, '')
    .replace(/<nav\b[^>]*class=["'][^"']*\b(?:fmb-mobile-dock|nc-mobile-dock)\b[^"']*["'][\s\S]*?<\/nav>\s*/gi, '');
}

function ensureStylesheet(html) {
  if (html.includes('/assets/css/fmb-news-final.css')) return html;
  return html.replace(/<\/head>/i, `<link rel="stylesheet" href="${stylesheet}"></head>`);
}

function ensureScript(html) {
  if (html.includes('/assets/js/fmb-news-approved.js')) return html;
  return html.replace(/<\/head>/i, `<script src="${newsScript}" defer></script></head>`);
}

// The newsroom publishes as FMB News. The corporate byline was inherited from
// the shared shell and misnames the publication.
function rebrand(html) {
  return html
    .replace(/FMB&amp;CO\.\s*NEWS DESK/gi, `${PUBLICATION} Desk`)
    .replace(/FMB&CO\.\s*NEWS DESK/gi, `${PUBLICATION} Desk`)
    .replace(/FMB&amp;CO\.\s*News Desk/g, `${PUBLICATION} Desk`)
    .replace(/FMB&amp;CO\.\s*NEWS\b/g, PUBLICATION)
    .replace(/FMB&CO\.\s*NEWS\b/g, PUBLICATION)
    .replace(/FMB&amp;CO\.\s*News\b/g, PUBLICATION);
}

// `\bmasthead\b` also matches article classes such as `nc-story-masthead`,
// because a hyphen counts as a word boundary. The newsroom masthead must be
// matched as a whole class token.
function hasNewsMasthead(html) {
  return /<header\b[^>]*\sclass=(["'])(?:[^"']*\s)?masthead(?:\s[^"']*)?\1/i.test(html);
}

function applyShell(html) {
  let next = stripCorporateShell(html);

  // Keep whatever wire strip the newsroom already produced; otherwise the
  // masthead becomes the first element in the body.
  if (!hasNewsMasthead(next)) {
    const insert = `${identityStrip}\n${masthead}`;
    if (/<body[^>]*>/i.test(next)) {
      next = next.replace(/(<body[^>]*>)/i, (match) => `${match}\n${insert}`);
    }
  } else {
    // The front page already has the masthead; give it the identity strip and
    // the text wordmark.
    if (!next.includes('class="news-identity"')) {
      next = next.replace(/(<body[^>]*>)/i, (match) => `${match}\n${identityStrip}`);
    }
    next = next.replace(
      /<a class="brand"[^>]*>[\s\S]*?<\/a>/i,
      wordmark(),
    );
  }

  if (!/class=["'][^"']*\bfooter\b[^"']*["'][^>]*>[\s\S]*Filipino Media Bulletin/i.test(next)) {
    if (/<\/body>/i.test(next)) next = next.replace(/<\/body>/i, `${footer}\n</body>`);
  }

  next = ensureStylesheet(next);
  next = ensureScript(next);
  return rebrand(next);
}

const files = await walk(newsRoot);
if (!files.length) throw new Error('FMB News publication shell: no news routes were found in dist.');

let updated = 0;
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const next = applyShell(html);
  if (next !== html) {
    await writeFile(file, next, 'utf8');
    updated += 1;
  }
}

// Every newsroom page must present the publication, and none may keep the
// corporate shell.
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const route = '/' + path.relative(dist, path.dirname(file)).split(path.sep).join('/') + '/';
  for (const forbidden of ['fmb-shell-header', 'fmb-shell-rail', 'fmb-shell-footer', 'nc-site-header']) {
    if (html.includes(forbidden)) throw new Error(`${route} still carries the corporate shell fragment ${forbidden}`);
  }
  if (!html.includes(BULLETIN)) throw new Error(`${route} does not name the publication (${BULLETIN})`);
  if (!hasNewsMasthead(html)) throw new Error(`${route} is missing the ${PUBLICATION} masthead`);
}

console.log(`FMB News publication shell applied to ${updated} of ${files.length} newsroom routes as ${PUBLICATION}, ${BULLETIN}.`);
