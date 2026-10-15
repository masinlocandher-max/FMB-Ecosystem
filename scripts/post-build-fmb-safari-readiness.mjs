import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { withMicrositeExclusions } from './lib/standalone-microsites.mjs';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const rootManifest = '<link rel="manifest" href="/manifest.webmanifest">';
const excludedPrefixes = withMicrositeExclusions(['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'data-center/', 'yoni/']);
const excludedFiles = new Set([
  'admin.html',
  'admin-activate.html',
  'admin-login.html',
  'login.html',
  'signup.html',
  'reset-password.html',
  'confirm-email.html',
  'auth.html',
  'member.html',
  'profile/index.html',
]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const relative = (file) => path.relative(dist, file).replaceAll(path.sep, '/');
const isPublicHtml = (file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
};

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}=(['"])(.*?)\\1`, 'i'));
  return match?.[2] || '';
}

function setAttribute(tag, name, value) {
  const pattern = new RegExp(`\\s${name}=(['"])[^'"]*\\1`, 'i');
  if (pattern.test(tag)) return tag.replace(pattern, ` ${name}="${value}"`);
  return tag.replace(/\s*\/?\>$/, (ending) => ` ${name}="${value}"${ending}`);
}

const publicPages = (await walk(dist)).filter(isPublicHtml);
let changed = 0;

for (const file of publicPages) {
  let html = await readFile(file, 'utf8');
  const before = html;
  let manifestSeen = false;

  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const rel = attributeValue(tag, 'rel');
    if (!/(^|\s)manifest(\s|$)/i.test(rel)) return tag;
    if (manifestSeen) return '';
    manifestSeen = true;
    return setAttribute(tag, 'href', '/manifest.webmanifest');
  });

  if (!manifestSeen) html = html.replace('</head>', `${rootManifest}\n</head>`);

  const manifestTags = [...html.matchAll(/<link\b[^>]*rel=(['"])[^'"]*manifest[^'"]*\1[^>]*>/gi)].map((match) => match[0]);
  if (manifestTags.length !== 1 || attributeValue(manifestTags[0], 'href') !== '/manifest.webmanifest') {
    throw new Error(`Safari manifest normalization failed for ${relative(file)}`);
  }

  if (html !== before) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Normalized the public PWA manifest to /manifest.webmanifest on ${changed} page(s) for Safari and iPhone.`);
