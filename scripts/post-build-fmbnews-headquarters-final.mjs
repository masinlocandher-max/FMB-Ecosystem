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

const editorialLanguage = [
  ['News explained for Filipinos', 'Philippine perspective. Global consequence.'],
  ['Today’s headlines for the Filipino', 'The Philippines in context'],
  ["Today's headlines for the Filipino", 'The Philippines in context'],
  ['What happened.<br>Why it matters to Filipinos.', 'Where the Philippines meets the world.'],
  ['Built for Filipinos', 'Philippine perspective'],
  ['Context before noise', 'Reporting with consequence'],
  ['News for Filipinos, with context that explains why every story matters.', 'Independent Philippine journalism with a global field of view.'],
  ['News, context, and clear explanations of why today’s events matter to Filipinos.', 'Reporting on the forces shaping public life, institutions, markets, and the country’s future.'],
  ['Credible reports, clear context, and why every important story matters to Filipinos.', 'Independent reporting and analysis on the forces shaping the Philippines and the world.'],
  ['Credible, independent, and community-centered journalism for Filipinos.', 'Independent Philippine journalism with a global field of view.'],
  ['Verified facts, useful context, and a clear explanation of why every important story matters.', 'Reporting that follows power, consequence, and the public record.'],
];

for (const file of targets) {
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/<link[^>]+href=["'][^"']*fmbnews-clean-v1\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link[^>]+href=["'][^"']*fmbnews-headquarters-final\.css[^"']*["'][^>]*>\s*/gi, '')
    .replaceAll('FMB News Center', 'FMB News')
    .replaceAll('FMB&amp;CO. News', 'FMB News')
    .replaceAll('FMB&CO. News', 'FMB News')
    .replaceAll('Hourly Newsroom Cycle', 'Newsroom Briefing');

  for (const [from, to] of editorialLanguage) {
    html = html.split(from).join(to);
  }

  if (html.includes('news-story-route') && !html.includes('nc-philippine-stakes')) {
    const stakes = '<section class="nc-philippine-stakes" aria-label="The Philippine stakes"><p>The Philippine stakes</p><p>This report examines the implications for Philippine policy, institutions, economic security, communities, culture, and the country’s position in the region and the world.</p></section>';
    html = html.replace('<div class="nc-story-body">', `<div class="nc-story-body">${stakes}`);
  }

  html = html
    .replaceAll('nc-why-filipinos', 'nc-philippine-stakes')
    .replaceAll('Why this story matters to Filipinos', 'The Philippine stakes')
    .replaceAll('Why this matters to Filipinos', 'The Philippine stakes')
    .replaceAll('This report is not only about what happened. It explains how the issue may affect Filipino rights, safety, livelihood, public services, communities, culture, or the country’s future.', 'This report examines the implications for Philippine policy, institutions, economic security, communities, culture, and the country’s position in the region and the world.');

  html = html.replace('</head>', `${finalCss}</head>`);
  await writeFile(file, html, 'utf8');
}

for (const file of targets) {
  const html = await readFile(file, 'utf8');
  const failures = [];
  if (!html.includes('fmbnews-headquarters-final.css')) failures.push('final stylesheet missing');
  if (/fmbnews-clean-v1\.css|FMB News Center|FMB(?:&|&amp;)CO\. News/.test(html)) failures.push('legacy identity remains');
  if (/News explained for Filipinos|Why this matters to Filipinos|Built for Filipinos/i.test(html)) failures.push('patronizing legacy language remains');
  if (html.includes('news-story-route') && !html.includes('nc-philippine-stakes')) failures.push('Philippine stakes module missing');
  if (failures.length) throw new Error(`FMB News final audit failed for ${path.relative(dist, file)}: ${failures.join(', ')}`);
}

console.log(`Applied the final FMB News rebrand and elevated editorial language to ${targets.length} production pages.`);
