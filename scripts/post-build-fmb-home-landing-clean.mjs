import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const homepage = path.join(root, 'dist', 'index.html');

function findSectionEnd(html, start) {
  const token = /<section\b|<\/section>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(html))) {
    if (match[0].toLowerCase().startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) return token.lastIndex;
  }
  return -1;
}

function removeSectionByLabel(html, labelId) {
  const pattern = new RegExp(`<section\\b[^>]*aria-labelledby=["']${labelId}["'][^>]*>`, 'i');
  const match = pattern.exec(html);
  if (!match) return html;
  const end = findSectionEnd(html, match.index);
  return end > match.index ? html.slice(0, match.index) + html.slice(end) : html;
}

function removeExactRouteLinks(html, route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`<a\\b[^>]*href=["']${escaped}["'][^>]*>[\\s\\S]*?<\\/a>`, 'gi'), '');
}

let html = await readFile(homepage, 'utf8');

// The homepage is a hiring/authority landing page. Reading and Music remain
// valid standalone destinations, but they are no longer promoted here.
html = removeSectionByLabel(html, 'approvedMusicTitle');
html = removeSectionByLabel(html, 'approvedBooksTitle');
html = removeExactRouteLinks(html, '/ebooks/');
html = removeExactRouteLinks(html, '/music/');

// Remove the retired duplicate shell. The FMB unified shell remains the only
// public header/footer/navigation system on the landing page.
html = html
  .replace(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i, '')
  .replace(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i, '')
  .replace(/<nav\b[^>]*class=["'][^"']*\bmobile-dock\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/i, '')
  .replace('Explore verified news, projects, reading, music, and ecosystem destinations.', 'Explore verified news, projects, selected work, and ecosystem destinations.')
  .replace('Verified news, projects, reading, music, and ecosystem destinations from the official website of Francine Marie Bautista.', 'Verified news, projects, selected work, and ecosystem destinations from the official website of Francine Marie Bautista.')
  .replace('fmb-approved-library-grid fmb-approved-editorial-grid', 'fmb-approved-library-grid fmb-approved-editorial-grid fmb-approved-news-only');

const violations = [];
if (/approvedMusicTitle|Music Library/i.test(html)) violations.push('Music Library remains on homepage');
if (/approvedBooksTitle|eBook Library/i.test(html)) violations.push('eBook Library remains on homepage');
if (/href=["']\/music\/["']/i.test(html)) violations.push('Music is still linked from homepage');
if (/href=["']\/ebooks\/["']/i.test(html)) violations.push('Reading is still linked from homepage');
if (/class=["'][^"']*\bsite-header\b/i.test(html)) violations.push('legacy duplicate header remains');
if (/class=["'][^"']*\bsite-footer\b/i.test(html)) violations.push('legacy duplicate footer remains');
if (/class=["'][^"']*\bmobile-dock\b/i.test(html)) violations.push('legacy mobile dock remains');
if (!/class=["'][^"']*\bfmb-shell-header\b/i.test(html)) violations.push('unified header is missing');
if (!/class=["'][^"']*\bfmb-shell-footer\b/i.test(html)) violations.push('unified footer is missing');
if (!/href=["']\/news\/["']/i.test(html)) violations.push('FMB News link is missing');
if (!/href=["']\/work-with-fmb\/["']/i.test(html)) violations.push('Work with FMB link is missing');

if (violations.length) {
  throw new Error(`FMB homepage landing cleanup failed:\n${violations.join('\n')}`);
}

await writeFile(homepage, html, 'utf8');
console.log('FMB homepage cleaned: one shell retained; Reading and Music removed from the landing surface while standalone routes remain intact.');
