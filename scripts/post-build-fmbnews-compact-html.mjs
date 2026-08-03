import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const targets = [
  path.join(root, 'dist', 'news', 'index.html'),
  path.join(root, 'dist', 'fmbnews', 'index.html')
];

const retiredInlineStyles = [
  'data-fmb-news-mobile-dock',
  'data-fmb-news-final-styles',
  'data-fmbnews-futuristic-ph'
];

function removeTaggedBlockByAttribute(html, tagName, attribute) {
  const expression = new RegExp(
    `<${tagName}\\b(?=[^>]*\\b${attribute}\\b)[^>]*>[\\s\\S]*?<\\/${tagName}>\\s*`,
    'gi'
  );
  return html.replace(expression, '');
}

for (const file of targets) {
  let html;
  try {
    html = await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }

  const originalBytes = Buffer.byteLength(html, 'utf8');
  let optimized = html;

  for (const attribute of retiredInlineStyles) {
    optimized = removeTaggedBlockByAttribute(optimized, 'style', attribute);
  }

  optimized = optimized
    .replace(/<link\b[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>\s*/gi, '')
    .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!/fmb-sitewide-visual-fixes\.css/i.test(optimized)) {
    throw new Error(`FMB News optimization removed the required final stylesheet from ${file}`);
  }

  await writeFile(file, optimized, 'utf8');
  const savedBytes = originalBytes - Buffer.byteLength(optimized, 'utf8');
  console.log(`Optimized ${path.relative(root, file)} and removed ${Math.max(0, savedBytes)} bytes of retired inline styling.`);
}
