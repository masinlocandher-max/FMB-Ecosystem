import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const excludedFiles = new Set([
  'admin.html',
  'admin-login.html',
  'admin-activate.html',
  'auth.html',
  'login.html',
  'signup.html',
  'reset-password.html',
  'confirm-email.html',
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
const analytics = [
  '<script defer src="/_vercel/insights/script.js"></script>',
  '<script defer src="/_vercel/speed-insights/script.js"></script>',
].join('\n  ');

let updated = 0;
for (const file of await walk(dist)) {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name) || excludedPrefixes.some((prefix) => name.startsWith(prefix))) continue;
  let html = await readFile(file, 'utf8');
  if (html.includes('/_vercel/insights/script.js')) continue;
  if (!/<\/head>/i.test(html)) continue;
  html = html.replace(/<\/head>/i, `  ${analytics}\n</head>`);
  await writeFile(file, html, 'utf8');
  updated += 1;
}

console.log(`Vercel Web Analytics and Speed Insights added to ${updated} public FMB page(s).`);

// The chronology renderer is deliberately last in the public-news mutation chain.
// It makes publication date + exact Philippine time authoritative regardless of
// older category, archive, or visual post-build layers.
await import('./post-build-fmbnews-chronology-final.mjs');
