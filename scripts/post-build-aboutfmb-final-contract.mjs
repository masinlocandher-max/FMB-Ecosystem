import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const sourceAbout = path.join(root, 'apps/withlovefmb/aboutfmb/index.html');
const outputAbout = path.join(dist, 'aboutfmb/index.html');
const wrongSchool = 'STI College Fairview';
const verificationCss = '/assets/css/aboutfmb-verification-fixes.css?v=20260808-verify-v1';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function sanitizeStructuredData(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (const item of value) sanitizeStructuredData(item);
    return value;
  }

  const isFrancine = value['@type'] === 'Person' && value.name === 'Francine Marie Bautista';
  if (isFrancine) {
    delete value.alumniOf;
    if (value.hasCredential && typeof value.hasCredential === 'object') delete value.hasCredential.recognizedBy;
  }

  for (const child of Object.values(value)) sanitizeStructuredData(child);
  return value;
}

function sanitizeJsonLd(html) {
  const pattern = /<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi;
  return html.replace(pattern, (full, before, after, raw) => {
    try {
      const graph = sanitizeStructuredData(JSON.parse(raw));
      return `<script${before}type="application/ld+json"${after}>\n${JSON.stringify(graph, null, 2)}\n</script>`;
    } catch {
      return full;
    }
  });
}

function sanitizeVisibleSchoolClaim(html) {
  return html
    .replace(/\s*<div class=["']fact["']>\s*<strong>College<\/strong>\s*<span>STI College Fairview<\/span>\s*<\/div>/gi, '')
    .replace(/\s+at STI College Fairview(?=[.,<])/gi, '')
    .replace(/STI College Fairview/gi, '');
}

const profilePath = path.join(dist, 'fmb-profile.json');
try {
  const profile = sanitizeStructuredData(JSON.parse(await readFile(profilePath, 'utf8')));
  const serialized = `${JSON.stringify(profile, null, 2)}\n`;
  if (serialized.includes(wrongSchool)) throw new Error('Incorrect school attribution survived canonical profile sanitation.');
  await writeFile(profilePath, serialized, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

for (const file of (await walk(dist)).filter((file) => file.endsWith('.html'))) {
  let html = await readFile(file, 'utf8');
  html = sanitizeJsonLd(html);
  html = sanitizeVisibleSchoolClaim(html);
  if (html.includes(wrongSchool)) throw new Error(`${path.relative(dist, file)} still contains the incorrect school attribution.`);
  await writeFile(file, html, 'utf8');
}

// About FMB is deliberately bespoke. Restore its authored source after generic sitewide transforms,
// then apply only small verified corrections that should not be lost to future production builds.
let about = await readFile(sourceAbout, 'utf8');
if (!about.includes(verificationCss)) {
  about = about.replace('</head>', `  <link rel="stylesheet" href="${verificationCss}">\n</head>`);
}

// The current poem block contains selected lines from an earlier approved draft, not the complete poem.
// Make the omission explicit instead of presenting a shortened excerpt as if it were the full work.
about = about.replace('<div class="poem-lines">', '<div class="poem-lines" data-verified-excerpt="true">');
about = about.replace(
  '<p class="poem-turn">That little girl grew up.</p>',
  '<p class="poem-ellipsis" aria-hidden="true">···</p><p class="poem-turn">That little girl grew up.</p>'
);
about = about.replace(
  'An excerpt from the personal poem created for the About FMB story. It is kept intentionally short here so the page can breathe.',
  'Selected lines from an earlier approved draft of the personal About FMB poem. The complete poem is not presented here as verified copy.'
);

await writeFile(outputAbout, about, 'utf8');

const html = await readFile(outputAbout, 'utf8');
const expected = [
  '<title>About Francine Marie Bautista | Creative Director, Strategist &amp; Founder</title>',
  'The World According to FMB',
  'hero-name-first',
  'Not stock imagery.',
  'I started as a little boy,',
  'data-verified-excerpt="true"',
  'The complete poem is not presented here as verified copy.',
  'The authority story',
  'The advantage is not one skill.',
  'How it works',
  'Capacity by design',
  'Illustrative portfolio calendar, not a live schedule.',
  '/assets/css/aboutfmb-cinematic.css?v=20260808-authority-v1',
  '/assets/css/aboutfmb-portfolio-v2.css?v=20260808-portfolio-v2',
  verificationCss,
  '/assets/js/aboutfmb-cinematic.js?v=20260808-authority-v1',
  '/assets/js/aboutfmb-portfolio-v2.js?v=20260808-portfolio-v2',
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
  'assets/css/aboutfmb-portfolio-v2.css',
  'assets/css/aboutfmb-verification-fixes.css',
  'assets/js/aboutfmb-cinematic.js',
  'assets/js/aboutfmb-portfolio-v2.js',
  'assets/images/fmb-approved/francine-portrait-front.webp',
  'assets/images/fmb-approved/francine-standing-landscape.webp'
]) await access(path.join(dist, relative));

console.log('Protected About FMB and verified its structure, authority story, ecosystem explanation, mobile enhancement layer, transparent availability preview, non-script brand lockup override, and accuracy guard. The autobiographical poem remains explicitly marked as a partial verified excerpt until the complete approved text is recovered.');
