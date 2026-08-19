import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const origin = 'https://www.francinemariebautista.com';
const cssSource = path.join(root, 'apps', 'withlovefmb', 'assets', 'css', 'fmb-news-consistency.css');
const cssTarget = path.join(dist, 'assets', 'css', 'fmb-news-consistency.css');
const consistencyLink = '<link rel="stylesheet" href="/assets/css/fmb-news-consistency.css?v=20260820-unified">';
const cleanLink = '<link rel="stylesheet" href="/assets/css/fmbnews-clean-v1.css?v=20260820-unified">';
const identityLink = '<link rel="stylesheet" href="/assets/css/fmb-news-identity-lockup.css?v=20260820">';

async function walk(directory) {
  const files = [];
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error?.code === 'ENOENT') return files; throw error; }
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (entry.isFile() && entry.name === 'index.html') files.push(target);
  }
  return files;
}

function isRedirect(html) {
  return /http-equiv=(['"])refresh\1/i.test(html) || /<meta\b[^>]*(?:name|property)=(['"])robots\1[^>]*content=(['"])[^'"]*noindex/i.test(html);
}

function addBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (tag) => {
    if (/\bclass=(['"])/i.test(tag)) {
      return tag.replace(/\bclass=(['"])(.*?)\1/i, (_m, quote, value) => {
        const classes = new Set(value.split(/\s+/).filter(Boolean));
        classes.add(className);
        return `class=${quote}${[...classes].join(' ')}${quote}`;
      });
    }
    return tag.replace(/<body/i, `<body class="${className}"`);
  });
}

function publicBriefRoute(date) {
  const parsed = new Date(`${date}T12:00:00+08:00`);
  const month = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', month:'long' }).format(parsed).toLowerCase();
  const day = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', day:'numeric' }).format(parsed);
  const year = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Manila', year:'numeric' }).format(parsed);
  return `/news/fmb-brief-${month}-${day}-${year}/`;
}

function retireMorningSpecialLinks(html) {
  html = html
    .replace(/href=(['"])\/news\/morning-special\/\1/gi, 'href="/news/fmb-brief/"')
    .replace(/href=(['"])\/fmbnews\/morning-special\/\1/gi, 'href="/news/fmb-brief/"');

  html = html.replace(/href=(['"])\/news\/morning-special\/(2026-08-(?:11|12|13|14|15|16|17))\/\1/gi, (_m, _q, date) => `href="${publicBriefRoute(date)}"`);
  return html
    .replace(/Today(?:&rsquo;|’|')s Morning Special/gi, 'FMB Brief')
    .replace(/Morning Special/gi, 'FMB Brief');
}

function ensureStyles(html) {
  if (!html.includes('fmbnews-clean-v1.css')) html = html.replace('</head>', `${cleanLink}</head>`);
  if (!html.includes('fmb-news-identity-lockup.css')) html = html.replace('</head>', `${identityLink}</head>`);
  html = html.replace(/<link[^>]+href=["'][^"']*fmb-news-consistency\.css[^"']*["'][^>]*>\s*/gi, '');
  return html.replace('</head>', `${consistencyLink}</head>`);
}

await mkdir(path.dirname(cssTarget), { recursive:true });
await writeFile(cssTarget, await readFile(cssSource, 'utf8'), 'utf8');

const targets = [...new Set([
  ...(await walk(path.join(dist, 'news'))),
  ...(await walk(path.join(dist, 'fmbnews'))),
])];

let updated = 0;
for (const file of targets) {
  let html = await readFile(file, 'utf8');
  if (isRedirect(html)) continue;
  html = retireMorningSpecialLinks(html);
  html = addBodyClass(html, 'fmb-publication');
  html = ensureStyles(html);
  await writeFile(file, html, 'utf8');
  updated += 1;
}

const failures = [];
for (const file of targets) {
  const html = await readFile(file, 'utf8');
  if (isRedirect(html)) continue;
  const relative = path.relative(dist, file).replaceAll(path.sep, '/');
  const route = `/${relative.replace(/index\.html$/, '')}`;
  const canonical = html.match(/<link\b[^>]*rel=(['"])canonical\1[^>]*href=(['"])([^'"]+)\2/i)?.[3] || `${origin}${route}`;

  if (!html.includes('fmb-publication')) failures.push(`${relative}: publication body class missing`);
  if (!html.includes('fmb-news-consistency.css')) failures.push(`${relative}: final consistency stylesheet missing`);
  if (!html.includes('fmbnews-clean-v1.css')) failures.push(`${relative}: clean publication stylesheet missing`);
  if (!html.includes('fmb-news-identity-lockup.css')) failures.push(`${relative}: FMB News identity stylesheet missing`);
  if (/FMB News Center|FMB(?:&|&amp;)CO\. News/i.test(html)) failures.push(`${relative}: retired newsroom identity remains`);
  if (/Morning Special/i.test(html)) failures.push(`${relative}: retired Morning Special branding remains`);
  if (!/<main\b/i.test(html) && !/\/about\/?$/i.test(new URL(canonical, origin).pathname)) failures.push(`${relative}: main content landmark missing`);
  if (!/<title>[\s\S]*?<\/title>/i.test(html)) failures.push(`${relative}: document title missing`);

  const pathname = new URL(canonical, origin).pathname;
  const isArticle = /<meta\b[^>]*property=(['"])og:type\1[^>]*content=(['"])article\2/i.test(html) || /news-story-route|news-article|brief-route/i.test(html) && pathname !== '/news/fmb-brief/';
  if (isArticle) {
    if (!/<h1\b/i.test(html)) failures.push(`${relative}: article headline missing`);
    if (!/<img\b/i.test(html)) failures.push(`${relative}: article image missing`);
    if (!/<meta\b[^>]*property=(['"])og:image\1[^>]*content=(['"])[^'"]+\2/i.test(html)) failures.push(`${relative}: social image metadata missing`);
  }
}

if (failures.length) throw new Error(`FMB News all-page consistency audit failed:\n${failures.join('\n')}`);
console.log(`Applied the unified FMB News visual system to ${updated} non-redirect public page(s) and verified every generated /news and /fmbnews page.`);
