import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const distRoot = path.join(repositoryRoot, 'dist');

const sites = [
  {
    name: 'FMB',
    root: distRoot,
    hosts: new Set([
      'francinemariebautista.com',
      'www.francinemariebautista.com',
      'yoni.francinemariebautista.com',
      'app.francinemariebautista.com',
      'data.francinemariebautista.com',
    ]),
    excludeDirectories: new Set(['_sites']),
  },
  {
    name: 'SENZ',
    root: path.join(distRoot, '_sites', 'senz'),
    hosts: new Set(['senz.francinemariebautista.com']),
    excludeDirectories: new Set(),
  },
  {
    name: 'Cognita',
    root: path.join(distRoot, '_sites', 'cognita'),
    hosts: new Set(['cognita.francinemariebautista.com']),
    excludeDirectories: new Set(),
  },
];

const siteByHost = new Map(sites.flatMap((site) => [...site.hosts].map((host) => [host, site])));
const ignoredProtocols = new Set(['data:', 'mailto:', 'tel:', 'javascript:', 'blob:']);
const failures = [];
let htmlReferenceCount = 0;
let cssReferenceCount = 0;
let fragmentCount = 0;

async function listFiles(directory, excludedDirectories = new Set(), relativeDirectory = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath, excludedDirectories, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
    .trim();
}

function isDynamicReference(reference) {
  return reference.includes('{{')
    || reference.includes('}}')
    || reference.includes('${')
    || reference.startsWith('#!');
}

function documentPath(relativeFile) {
  const normalized = relativeFile.split(path.sep).join('/');
  return normalized.endsWith('/index.html')
    ? `/${normalized.slice(0, -'index.html'.length)}`
    : `/${normalized}`;
}

function normalizeHostedPath(host, pathname) {
  if (host === 'data.francinemariebautista.com') return '/admin.html';
  if (host === 'app.francinemariebautista.com') {
    if (pathname === '/' || pathname === '') return '/app/index.html';
  }
  if (host === 'yoni.francinemariebautista.com') {
    if (pathname === '/' || pathname === '') return '/app/index.html';
    if (!pathname.startsWith('/app/') && !pathname.startsWith('/assets/')) return '/app/index.html';
  }
  return pathname;
}

async function resolveFile(siteRoot, pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relativePath = decodedPath.replace(/^\/+/, '');
  const directPath = path.resolve(siteRoot, relativePath);
  if (directPath !== siteRoot && !directPath.startsWith(`${siteRoot}${path.sep}`)) return null;

  const candidates = [
    directPath,
    path.join(directPath, 'index.html'),
  ];
  if (!path.extname(directPath)) candidates.push(`${directPath}.html`);

  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Continue through the browser-style resolution candidates.
    }
  }
  return null;
}

function hasFragment(html, fragment) {
  let decodedFragment;
  try {
    decodedFragment = decodeURIComponent(fragment);
  } catch {
    return false;
  }
  const escaped = decodedFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b(?:id|name)\\s*=\\s*["']${escaped}["']`, 'i').test(html);
}

async function checkReference({ sourceSite, sourceFile, baseUrl, reference, kind }) {
  const normalizedReference = decodeHtmlAttribute(reference);
  if (!normalizedReference || isDynamicReference(normalizedReference)) return;

  let targetUrl;
  try {
    targetUrl = new URL(normalizedReference, baseUrl);
  } catch {
    failures.push(`${sourceSite.name}: ${sourceFile} has an invalid ${kind} reference: ${normalizedReference}`);
    return;
  }

  if (ignoredProtocols.has(targetUrl.protocol)) return;
  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') return;

  let targetSite = sourceSite;
  if (targetUrl.hostname !== 'local.invalid') {
    targetSite = siteByHost.get(targetUrl.hostname);
    if (!targetSite) return;
  }

  const hostedPath = normalizeHostedPath(targetUrl.hostname, targetUrl.pathname);
  const targetFile = await resolveFile(targetSite.root, hostedPath);
  if (!targetFile) {
    failures.push(`${sourceSite.name}: ${sourceFile} points to missing local ${kind} ${normalizedReference}`);
    return;
  }

  if (targetUrl.hash && targetUrl.hash !== '#') {
    fragmentCount += 1;
    if (path.extname(targetFile).toLowerCase() !== '.html') {
      failures.push(`${sourceSite.name}: ${sourceFile} points a fragment at a non-HTML file: ${normalizedReference}`);
      return;
    }
    const targetHtml = await readFile(targetFile, 'utf8');
    if (!hasFragment(targetHtml, targetUrl.hash.slice(1))) {
      failures.push(`${sourceSite.name}: ${sourceFile} points to missing fragment ${normalizedReference}`);
    }
  }
}

async function checkHtml(site, relativeFile) {
  const html = await readFile(path.join(site.root, relativeFile), 'utf8');
  const defaultBaseUrl = `https://local.invalid${documentPath(relativeFile)}`;
  const baseMatch = html.match(/<base\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/i);
  let baseUrl = defaultBaseUrl;
  if (baseMatch) {
    try {
      baseUrl = new URL(decodeHtmlAttribute(baseMatch[2]), defaultBaseUrl).href;
    } catch {
      failures.push(`${site.name}: ${relativeFile} has an invalid base href: ${baseMatch[2]}`);
    }
  }

  const attributePattern = /(?:^|[\s<])(href|src|poster|action)\s*=\s*(["'])(.*?)\2/gis;
  for (const match of html.matchAll(attributePattern)) {
    htmlReferenceCount += 1;
    await checkReference({
      sourceSite: site,
      sourceFile: relativeFile,
      baseUrl,
      reference: match[3],
      kind: match[1].toLowerCase(),
    });
  }

  const srcsetPattern = /\bsrcset\s*=\s*(["'])(.*?)\1/gis;
  for (const match of html.matchAll(srcsetPattern)) {
    for (const candidate of match[2].split(',')) {
      const reference = candidate.trim().split(/\s+/)[0];
      if (!reference) continue;
      htmlReferenceCount += 1;
      await checkReference({
        sourceSite: site,
        sourceFile: relativeFile,
        baseUrl,
        reference,
        kind: 'srcset',
      });
    }
  }
}

async function checkCss(site, relativeFile) {
  const css = await readFile(path.join(site.root, relativeFile), 'utf8');
  const baseUrl = `https://local.invalid/${relativeFile.split(path.sep).join('/')}`;
  const urlPattern = /\burl\(\s*(?:(["'])(.*?)\1|([^)"']+))\s*\)/gis;
  for (const match of css.matchAll(urlPattern)) {
    const reference = (match[2] || match[3] || '').trim();
    if (!reference || reference.startsWith('#')) continue;
    cssReferenceCount += 1;
    await checkReference({
      sourceSite: site,
      sourceFile: relativeFile,
      baseUrl,
      reference,
      kind: 'CSS asset',
    });
  }
}

await access(distRoot);
for (const site of sites) {
  const files = await listFiles(site.root, site.excludeDirectories);
  for (const relativeFile of files.filter((file) => file.endsWith('.html'))) {
    await checkHtml(site, relativeFile);
  }
  for (const relativeFile of files.filter((file) => file.endsWith('.css'))) {
    await checkCss(site, relativeFile);
  }
}

if (failures.length > 0) {
  console.error(`Generated-site link audit found ${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Generated-site link audit passed: ${htmlReferenceCount} HTML references, `
  + `${cssReferenceCount} CSS references, and ${fragmentCount} fragments resolved.`,
);
