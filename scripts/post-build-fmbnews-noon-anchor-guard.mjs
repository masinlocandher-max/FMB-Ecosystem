import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const landingPath = path.join(root, 'dist', 'news', 'index.html');
let html = await readFile(landingPath, 'utf8');

if (!html.includes('<div class="nc-rundown-head">')) {
  const fallback = '<section class="nc-rundown"><div class="nc-rundown-head"></div><article class="nc-rundown-story" data-anchor-guard="true"><a href="/news/"><span class="nc-rundown-number">LATEST</span><div><p>FMB News</p><h3>Latest verified reports</h3><span>Newsroom</span></div></a></article></section>';
  if (html.includes('</main>')) html = html.replace('</main>', `${fallback}</main>`);
  else if (html.includes('</body>')) html = html.replace('</body>', `${fallback}</body>`);
  else html += fallback;
  await writeFile(landingPath, html, 'utf8');
  console.log('Created resilient FMB News rundown insertion anchor.');
} else {
  console.log('FMB News rundown insertion anchor already present.');
}
