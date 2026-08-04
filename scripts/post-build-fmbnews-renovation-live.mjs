import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const previewPath = path.join(dist, 'fmbnews-preview', 'index.html');
const fmbNewsPath = path.join(dist, 'fmbnews', 'index.html');
const newsLandingPath = path.join(newsRoot, 'index.html');

await import('./post-build-fmbnews-hd-images.mjs');
await import('./post-build-fmbnews-preview.mjs');
await import('./post-build-fmbnews-hd-manifest-status.mjs');

async function walkArticles(directory) {
  const records = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) records.push(...await walkArticles(absolute));
    else if (entry.isFile() && entry.name === 'index.html' && absolute !== newsLandingPath) {
      const html = await readFile(absolute, 'utf8');
      if (/\bnews-story-route\b/i.test(html)) {
        records.push({
          relative: path.relative(newsRoot, absolute).replaceAll(path.sep, '/'),
          hash: createHash('sha256').update(html).digest('hex'),
        });
      }
    }
  }
  return records.sort((a, b) => a.relative.localeCompare(b.relative));
}

function liveHtml(source, canonical) {
  let html = source
    .replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">')
    .replace('<body>', '<body data-fmbnews-live>')
    .replace(/<link rel="canonical"[^>]*>\s*/i, '')
    .replace(/<meta property="og:url"[^>]*>\s*/i, '');

  const headInsert = `<link rel="canonical" href="${canonical}">\n  <meta property="og:type" content="website">\n  <meta property="og:site_name" content="FMB News">\n  <meta property="og:title" content="FMB News | Clearer, Sharper, Made for Filipinos">\n  <meta property="og:description" content="Clear, responsible reporting and original daily segments centered on why important stories matter to Filipinos.">\n  <meta property="og:url" content="${canonical}">\n  <meta property="og:image" content="https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-master-purple-square.webp">\n  <meta property="og:image:width" content="1080">\n  <meta property="og:image:height" content="1080">\n  `;
  html = html.replace(/(<meta name="theme-color"[^>]*>\s*)/i, `$1  ${headInsert}`);
  return html;
}

const before = await walkArticles(newsRoot);
if (!before.length) throw new Error('FMB News live renovation found no preserved report pages.');
const source = await readFile(previewPath, 'utf8');
if (!source.includes('data-fmb-news-logo-light') || !source.includes('data-fmb-news-logo-dark')) {
  throw new Error('FMB News live renovation source is missing the approved supplied logo pair.');
}
await mkdir(path.dirname(fmbNewsPath), { recursive: true });
await writeFile(fmbNewsPath, liveHtml(source, 'https://www.francinemariebautista.com/fmbnews/'), 'utf8');
await writeFile(newsLandingPath, liveHtml(source, 'https://www.francinemariebautista.com/fmbnews/'), 'utf8');

const after = await walkArticles(newsRoot);
if (JSON.stringify(before) !== JSON.stringify(after)) {
  throw new Error('FMB News live renovation changed, deleted, or added a published report page. The cutover was stopped.');
}
console.log(`Applied the final FMB News Apple-style newsroom shell to /fmbnews/ and /news/ while preserving ${after.length} upgraded article files byte-for-byte through the live cutover.`);
await import('./check-fmbnews-live-renovation.mjs');