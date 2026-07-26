import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const stylesheetHref = '/assets/css/fmb-news-masthead-v3.css?v=20260726a';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

let count = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  html = html.replace(/<link\b[^>]*href=["'][^"']*fmb-news-masthead-v3\.css[^"']*["'][^>]*>\s*/gi, '');
  if (!html.includes('</head>')) throw new Error(`Newsroom masthead: missing closing head in ${filePath}`);
  html = html.replace('</head>', `<link rel="stylesheet" href="${stylesheetHref}">\n</head>`);
  await writeFile(filePath, html, 'utf8');
  count += 1;
}

console.log(`Loaded the text-led Newsroom masthead last on ${count} News pages.`);
