import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const article = path.join(root, 'dist', 'news', 'filipino-centered-training-institution-cognita-vision', 'index.html');
let html = await readFile(article, 'utf8');

html = html
  .replace(/<meta property="og:image:width" content="\d+">/i, '<meta property="og:image:width" content="1536">')
  .replace(/<meta property="og:image:height" content="\d+">/i, '<meta property="og:image:height" content="864">')
  .replace(/(<section\b[^>]*class="[^"]*nc-story-media[^"]*"[\s\S]*?<img\b[^>]*?)\bwidth="\d+"\s+height="\d+"/i, '$1width="1536" height="864"')
  .replace(/width="1200"\s+height="675"/g, 'width="1536" height="864"');

if (!html.includes('og:image:width" content="1536"') || !html.includes('og:image:height" content="864"')) {
  throw new Error('Cognita article social metadata dimensions were not normalized.');
}
if (!html.includes('width="1536" height="864"')) {
  throw new Error('Cognita article image dimensions were not normalized.');
}

await writeFile(article, html, 'utf8');
console.log('Normalized Cognita article social and lead-image dimensions to 1536×864.');
