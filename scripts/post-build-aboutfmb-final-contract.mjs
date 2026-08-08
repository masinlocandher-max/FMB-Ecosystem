import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const sourceAbout = path.join(root, 'apps/withlovefmb/aboutfmb/index.html');
const outputAbout = path.join(dist, 'aboutfmb/index.html');
const wrongSchool = 'STI College Fairview';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function sanitizePersonGraph(graph) {
  const nodes = Array.isArray(graph?.['@graph']) ? graph['@graph'] : [graph];
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const isFrancine = node['@type'] === 'Person' && node.name === 'Francine Marie Bautista';
    if (!isFrancine) continue;
    delete node.alumniOf;
    if (node.hasCredential && typeof node.hasCredential === 'object') {
      delete node.hasCredential.recognizedBy;
    }
  }
  return graph;
}

function sanitizeAuthorityScript(html) {
  const pattern = /<script\b[^>]*data-fmb-authority-entity[^>]*>([\s\S]*?)<\/script>/gi;
  return html.replace(pattern, (full, raw) => {
    try {
      const graph = sanitizePersonGraph(JSON.parse(raw));
      return full.replace(raw, `\n${JSON.stringify(graph, null, 2)}\n`);
    } catch {
      return full;
    }
  });
}

// Remove an explicitly incorrect school attribution from the canonical machine profile.
const profilePath = path.join(dist, 'fmb-profile.json');
try {
  const profile = sanitizePersonGraph(JSON.parse(await readFile(profilePath, 'utf8')));
  const serialized = `${JSON.stringify(profile, null, 2)}\n`;
  if (serialized.includes(wrongSchool)) throw new Error('Incorrect school attribution survived canonical profile sanitation.');
  await writeFile(profilePath, serialized, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

// Keep already-generated authority graphs useful while stripping the known-wrong school attribution.
for (const file of (await walk(dist)).filter((file) => file.endsWith('.html'))) {
  let html = await readFile(file, 'utf8');
  html = sanitizeAuthorityScript(html);
  if (html.includes(wrongSchool)) {
    throw new Error(`${path.relative(dist, file)} still contains the incorrect school attribution.`);
  }
  await writeFile(file, html, 'utf8');
}

// About FMB is a bespoke authority experience. Its authored source is the final production contract,
// so generic sitewide post-build transforms cannot duplicate shells, append sections, rewrite portraits,
// or replace its carefully reviewed SEO and structured data.
const about = await readFile(sourceAbout, 'utf8');
await writeFile(outputAbout, about, 'utf8');

// Final About-specific QA after every other post-build script has finished.
const html = await readFile(outputAbout, 'utf8');
const expected = [
  '<title>About Francine Marie Bautista | Creative Director, Strategist &amp; Founder</title>',
  'The World According to FMB',
  'The advantage is not one skill.',
  '/assets/css/aboutfmb-cinematic.css?v=20260808-authority-v1',
  '/assets/js/aboutfmb-cinematic.js?v=20260808-authority-v1',
  'href="/work-with-fmb/"'
];
for (const marker of expected) {
  if (!html.includes(marker)) throw new Error(`About FMB final contract missing: ${marker}`);
}
for (const forbidden of [wrongSchool, 'class="fmb-shell-header"', 'class="fmb-shell-footer"', 'id="how-fmb-can-help"', 'id="fmb-authority"']) {
  if (html.includes(forbidden)) throw new Error(`About FMB final contract contains forbidden post-build mutation: ${forbidden}`);
}

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) throw new Error(`About FMB duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
if ((html.match(/<h1\b/gi) || []).length !== 1) throw new Error('About FMB must contain exactly one H1.');
for (const match of html.matchAll(/href=["']#([^"']+)["']/gi)) {
  if (!ids.includes(match[1])) throw new Error(`About FMB missing in-page target: #${match[1]}`);
}

for (const relative of [
  'assets/css/aboutfmb-cinematic.css',
  'assets/js/aboutfmb-cinematic.js',
  'assets/images/fmb-approved/francine-portrait-front.webp',
  'assets/images/fmb-approved/francine-standing-landscape.webp'
]) {
  await access(path.join(dist, relative));
}

console.log('Protected the final About FMB authority experience and removed the incorrect school attribution from generated authority data.');
