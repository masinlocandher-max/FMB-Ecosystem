import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
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

let updated = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-(?:channel|story)-route\b/.test(html)) continue;

  html = html.replace(/<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-v2-news-command\b[^"']*["'])[^>]*>[\s\S]*?<\/section>\s*/gi, '');
  const livebar = /(<section\b(?=[^>]*\bclass=["'][^"']*\bfmb-news-livebar\b[^"']*["'])[^>]*>[\s\S]*?<\/section>)/i;
  if (!livebar.test(html)) throw new Error(`News Center channel masthead: missing global livebar in ${filePath}`);
  html = html.replace(livebar, `$1\n${channelCommand()}`);

  if ((html.match(/fmb-news-channel-command/g) || []).length !== 2) {
    throw new Error(`News Center channel masthead: ${filePath} must contain one command section and one inner class reference`);
  }
  if (!html.includes('Filipino ang Mismong Balita.')) throw new Error(`News Center channel masthead: approved tagline is missing in ${filePath}`);

  await writeFile(filePath, html, 'utf8');
  updated += 1;
}

console.log(`Added the visible FMB News Center channel masthead to ${updated} landing and report pages.`);
