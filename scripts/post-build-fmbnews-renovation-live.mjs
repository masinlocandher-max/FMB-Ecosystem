import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.resolve(process.env.FMB_DIST_DIR || path.join(root, 'dist'));
const newsRoot = path.join(dist, 'news');
const sourcePreviewPath = path.join(root, 'apps', 'withlovefmb', 'fmbnews-preview', 'index.html');
const distPreviewPath = path.join(dist, 'fmbnews-preview', 'index.html');
const fmbNewsPath = path.join(dist, 'fmbnews', 'index.html');
const newsLandingPath = path.join(newsRoot, 'index.html');

await import('./post-build-fmbnews-article-consistency.mjs');
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
  const legacyAnchors = '<div data-fmbnews-legacy-anchors hidden><span id="philippines"></span><span id="world"></span><span id="business"></span><span id="lifestyle"></span><span id="technology"></span><span id="politics-government"></span><span id="environment"></span><span id="health"></span><span id="education"></span><span id="science"></span><span id="sports"></span><span id="culture"></span></div>';
  let html = source
    .replace(/<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">')
    .replace(/<body\b([^>]*)>/i, `<body$1 data-fmbnews-live>${legacyAnchors}`)
    .replace('data-drawer-open aria-label="Open menu"', 'data-drawer-open data-news-menu aria-label="Open menu"')
    .replace(/<link rel="canonical"[^>]*>\s*/i, '')
    .replace(/<meta property="og:url"[^>]*>\s*/i, '');

  const headInsert = `<link rel="canonical" href="${canonical}">\n  <meta name="fmb-news-legacy-identity-record" content="/assets/images/fmb-approved/fmb-news-official-transparent.webp">\n  <meta property="og:type" content="website">\n  <meta property="og:site_name" content="FMB News">\n  <meta property="og:title" content="FMB News | Clearer, Sharper, Made for Filipinos">\n  <meta property="og:description" content="Clear, responsible reporting and original daily segments centered on why important stories matter to Filipinos.">\n  <meta property="og:url" content="${canonical}">\n  <meta property="og:image" content="https://www.francinemariebautista.com/assets/images/fmb-approved/fmb-master-purple-square.webp">\n  <meta property="og:image:width" content="1080">\n  <meta property="og:image:height" content="1080">\n  <script>(function(){var key=location.hash.slice(1);var allowed=['philippines','world','business','lifestyle','technology','politics-government','environment','health','education','science','sports','culture'];if(!location.search&&allowed.includes(key)){history.replaceState({},'',location.pathname+'?archive='+encodeURIComponent(key));}})();</script>\n  `;
  html = html.replace(/(<meta name="theme-color"[^>]*>\s*)/i, `$1  ${headInsert}`);
  return html;
}

const before = await walkArticles(newsRoot);
if (!before.length) throw new Error('FMB News live renovation found no preserved report pages.');
const pristineSource = await readFile(sourcePreviewPath, 'utf8');
if (!pristineSource.includes('data-fmb-news-logo-light') || !pristineSource.includes('data-fmb-news-logo-dark')) {
  throw new Error('FMB News live renovation source is missing the approved supplied logo pair.');
}
if (/data-fmb-unified-shell|fmb-shell-header|fmbandco-primary-reversed/i.test(pristineSource)) {
  throw new Error('FMB News pristine shell is contaminated by the wider FMB&CO. website chrome.');
}

await mkdir(path.dirname(distPreviewPath), { recursive: true });
await mkdir(path.dirname(fmbNewsPath), { recursive: true });
await writeFile(distPreviewPath, pristineSource, 'utf8');
await writeFile(fmbNewsPath, liveHtml(pristineSource, 'https://www.francinemariebautista.com/fmbnews/'), 'utf8');
await writeFile(newsLandingPath, liveHtml(pristineSource, 'https://www.francinemariebautista.com/fmbnews/'), 'utf8');

const after = await walkArticles(newsRoot);
if (JSON.stringify(before) !== JSON.stringify(after)) {
  throw new Error('FMB News live renovation changed, deleted, or added a published report page. The cutover was stopped.');
}
for (const [label, filePath] of [['preview', distPreviewPath], ['fmbnews', fmbNewsPath], ['news', newsLandingPath]]) {
  const html = await readFile(filePath, 'utf8');
  if (/data-fmb-unified-shell|fmb-shell-header|fmbandco-primary-reversed|fmb-network-contact/i.test(html)) {
    throw new Error(`The final ${label} newsroom still contains the wider FMB&CO. shell.`);
  }
}
console.log(`Applied the isolated FMB News publication shell to /fmbnews/, /news/, and the protected preview while preserving ${after.length} upgraded article files byte-for-byte through the live cutover.`);
await import('./check-fmbnews-live-renovation.mjs');