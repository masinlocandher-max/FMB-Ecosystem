import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(target));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(target);
  }
  return out;
}

const targets = [path.join(dist, 'fmbnews', 'index.html'), ...(await htmlFiles(path.join(dist, 'news')))].filter(Boolean);
const finalCss = '<link rel="stylesheet" href="/assets/css/fmbnews-headquarters-final.css?v=20260806-final">';

for (const file of targets) {
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/<link[^>]+href=["'][^"']*fmbnews-clean-v1\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link[^>]+href=["'][^"']*fmbnews-headquarters-final\.css[^"']*["'][^>]*>\s*/gi, '')
    .replaceAll('FMB News Center', 'FMB News')
    .replaceAll('FMB&amp;CO. News', 'FMB News')
    .replaceAll('FMB&CO. News', 'FMB News')
    .replaceAll('Hourly Newsroom Cycle', 'Newsroom Briefing');

  if (html.includes('news-story-route') && !html.includes('nc-why-filipinos')) {
    const why = '<section class="nc-why-filipinos" aria-label="Why this story matters to Filipinos"><p>Why this matters to Filipinos</p><p>This report is not only about what happened. It explains how the issue may affect Filipino rights, safety, livelihood, public services, communities, culture, or the country’s future.</p></section>';
    html = html.replace('<div class="nc-story-body">', `<div class="nc-story-body">${why}`);
  }

  html = html.replace('</head>', `${finalCss}</head>`);
  await writeFile(file, html, 'utf8');
}

for (const file of targets) {
  const html = await readFile(file, 'utf8');
  const failures = [];
  if (!html.includes('fmbnews-headquarters-final.css')) failures.push('final stylesheet missing');
  if (/fmbnews-clean-v1\.css|FMB News Center|FMB(?:&|&amp;)CO\. News/.test(html)) failures.push('legacy identity remains');
  if (html.includes('news-story-route') && !html.includes('nc-why-filipinos')) failures.push('Filipino context module missing');
  if (failures.length) throw new Error(`FMB News final audit failed for ${path.relative(dist, file)}: ${failures.join(', ')}`);
}

console.log(`Applied final FMB News headquarters rebrand to ${targets.length} production pages.`);
