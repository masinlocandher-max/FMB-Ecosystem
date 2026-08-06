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

const targets = [
  path.join(dist, 'fmbnews', 'index.html'),
  ...(await htmlFiles(path.join(dist, 'news'))),
].filter(Boolean);

const finalCss = '<link rel="stylesheet" href="/assets/css/fmbnews-headquarters-final.css?v=20260806-visual-universe">';
const finalJs = '<script src="/assets/js/fmbnews-headquarters-final.js?v=20260806-visual-universe" defer></script>';
const progress = '<div class="fmb-hq-progress" aria-hidden="true"></div>';
const atmosphere = '<div class="fmb-hq-atmosphere" aria-hidden="true"><i class="fmb-hq-arc fmb-hq-arc--one"></i><i class="fmb-hq-arc fmb-hq-arc--two"></i><i class="fmb-hq-arc fmb-hq-arc--three"></i></div>';
const segment = '<div class="fmb-hq-segment" aria-hidden="true"></div>';
const controlStrip = '<div class="fmb-control-strip" aria-label="FMB News network information"><div><span>Philippine time</span><strong data-fmb-hq-clock>--:--:--</strong></div><div><span>Edition</span><strong>Philippines</strong></div><div><span>Archive</span><strong>Full access</strong></div><div><span>Standards</span><strong>Public record</strong></div></div>';

const editorialLanguage = [
  ['News explained for Filipinos', 'Philippine perspective. Global consequence.'],
  ['Today’s headlines for the Filipino', 'Philippine perspective. Global consequence.'],
  ["Today's headlines for the Filipino", 'Philippine perspective. Global consequence.'],
  ['The Philippines in context', 'Philippine perspective. Global consequence.'],
  ['What happened.<br>Why it matters to Filipinos.', 'Where the Philippines meets the world.'],
  ['Built for Filipinos', 'Philippine perspective'],
  ['Context before noise', 'Reporting with consequence'],
  ['News for Filipinos, with context that explains why every story matters.', 'Independent Philippine journalism with a global field of view.'],
  ['News, context, and clear explanations of why today’s events matter to Filipinos.', 'Reporting on the forces shaping public life, institutions, markets, and the country’s future.'],
  ['Credible reports, clear context, and why every important story matters to Filipinos.', 'Independent reporting and analysis on the forces shaping the Philippines and the world.'],
  ['Credible, independent, and community-centered journalism for Filipinos.', 'Independent Philippine journalism with a global field of view.'],
  ['Verified facts, useful context, and a clear explanation of why every important story matters.', 'Reporting that follows power, consequence, and the public record.'],
  ['Moving headlines', 'Newsroom wire'],
  ['Top story', 'Lead report'],
  ['Latest news', 'The newsroom'],
];

function removePreviousArchitecture(html) {
  return html
    .replace(/<div class=["']fmb-hq-progress["'][^>]*><\/div>\s*/gi, '')
    .replace(/<div class=["']fmb-hq-atmosphere["'][^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<div class=["']fmb-hq-segment["'][^>]*><\/div>\s*/gi, '')
    .replace(/<div class=["']fmb-control-strip["'][^>]*>[\s\S]*?<\/div>\s*/gi, '');
}

function addBodyClassAndArchitecture(html) {
  return html.replace(/<body([^>]*)>/i, (full, attributes) => {
    let next = full;
    if (/class=(["'])/i.test(next)) {
      next = next.replace(/class=(["'])(.*?)\1/i, (_match, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add('fmb-hq-universe');
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    } else {
      next = `<body class="fmb-hq-universe"${attributes}>`;
    }
    return `${next}${progress}${atmosphere}`;
  });
}

function addSectionArchitecture(html) {
  let next = html;
  if (next.includes('fmb-news-landing')) {
    next = next.replace(/(<\/section>\s*)(<section class=["']fnc-tools)/i, `$1${segment}$2`);
  }
  next = next.replace(/(<footer class=["']fnc-footer["'][^>]*>)/i, `$1${controlStrip}`);
  next = next.replace(/(<footer class=["']fnc-footer)/i, `${segment}$1`);
  return next;
}

for (const file of targets) {
  let html = await readFile(file, 'utf8');

  html = removePreviousArchitecture(html)
    .replace(/<link[^>]+href=["'][^"']*fmbnews-clean-v1\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link[^>]+href=["'][^"']*fmbnews-headquarters-final\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<script[^>]+src=["'][^"']*fmbnews-headquarters-final\.js[^"']*["'][^>]*><\/script>\s*/gi, '')
    .replaceAll('FMB News Center', 'FMB News')
    .replaceAll('FMB&amp;CO. News', 'FMB News')
    .replaceAll('FMB&CO. News', 'FMB News')
    .replaceAll('Hourly Newsroom Cycle', 'Newsroom Briefing')
    .replaceAll('aria-label="Moving headlines and Philippine time"', 'aria-label="Newsroom wire and Philippine time"');

  for (const [from, to] of editorialLanguage) html = html.split(from).join(to);

  if (html.includes('news-story-route') && !html.includes('nc-philippine-stakes')) {
    const stakes = '<section class="nc-philippine-stakes" aria-label="The Philippine stakes"><p>The Philippine stakes</p><p>This report examines the implications for Philippine policy, institutions, economic security, communities, culture, and the country’s position in the region and the world.</p></section>';
    html = html.replace('<div class="nc-story-body">', `<div class="nc-story-body">${stakes}`);
  }

  html = html
    .replaceAll('nc-why-filipinos', 'nc-philippine-stakes')
    .replaceAll('Why this story matters to Filipinos', 'The Philippine stakes')
    .replaceAll('Why this matters to Filipinos', 'The Philippine stakes')
    .replaceAll('This report is not only about what happened. It explains how the issue may affect Filipino rights, safety, livelihood, public services, communities, culture, or the country’s future.', 'This report examines the implications for Philippine policy, institutions, economic security, communities, culture, and the country’s position in the region and the world.');

  html = addBodyClassAndArchitecture(html);
  html = addSectionArchitecture(html);
  html = html.replace('</head>', `${finalCss}${finalJs}</head>`);
  await writeFile(file, html, 'utf8');
}

for (const file of targets) {
  const html = await readFile(file, 'utf8');
  const failures = [];
  if (!html.includes('fmbnews-headquarters-final.css')) failures.push('final stylesheet missing');
  if (!html.includes('fmbnews-headquarters-final.js')) failures.push('final motion system missing');
  if (!html.includes('fmb-hq-universe')) failures.push('visual universe body class missing');
  if (!html.includes('fmb-hq-atmosphere')) failures.push('signal atmosphere missing');
  if (!html.includes('fmb-control-strip')) failures.push('control room strip missing');
  if (/fmbnews-clean-v1\.css|FMB News Center|FMB(?:&|&amp;)CO\. News/.test(html)) failures.push('legacy identity remains');
  if (/News explained for Filipinos|Why this matters to Filipinos|Built for Filipinos/i.test(html)) failures.push('patronizing legacy language remains');
  if (html.includes('fmb-news-landing') && !html.includes('Newsroom wire')) failures.push('newsroom wire language missing');
  if (html.includes('news-story-route') && !html.includes('nc-philippine-stakes')) failures.push('Philippine stakes module missing');
  if (failures.length) throw new Error(`FMB News visual-universe audit failed for ${path.relative(dist, file)}: ${failures.join(', ')}`);
}

console.log(`Applied the complete FMB News visual universe, signal architecture, cinematic motion system, article design, and control-room footer to ${targets.length} production pages without removing editorial content.`);
