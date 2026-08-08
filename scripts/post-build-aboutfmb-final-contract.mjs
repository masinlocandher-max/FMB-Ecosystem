import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const sourceAbout = path.join(root, 'apps/withlovefmb/aboutfmb/index.html');
const outputAbout = path.join(dist, 'aboutfmb/index.html');
const wrongSchool = 'STI College Fairview';
const verificationCss = '/assets/css/aboutfmb-verification-fixes.css?v=20260809-forensic-v2';
const chromeCss = '/assets/css/aboutfmb-chrome-v4.css?v=20260809-chrome-v4';
const lifeSpritePublicPath = '/assets/images/fmb-approved/about-life-sprite.webp';
const lifeSpriteOutput = path.join(dist, lifeSpritePublicPath.replace(/^\//, ''));

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

const fullPoemSection = `    <section class="poem-panel" aria-labelledby="poem-title">
      <div class="poem-layout">
        <div>
          <p class="chapter-kicker">This Is Francine</p>
          <h2 id="poem-title">Before the titles,<br>there was becoming.</h2>
          <p class="poem-note">The complete personal poem.</p>
        </div>
        <div class="poem-lines" data-verified-poem="full">
          <div class="poem-stanza"><p>I started as a little boy,</p><p>With a dream so simple and shy.</p><p>To be a girl, with hopes and joy,</p><p>Watching the world pass by.</p></div>
          <div class="poem-stanza"><p>I liked to sing. I liked to dance.</p><p>I loved the feel of the stage.</p><p>Performing gave my heart a chance,</p><p>To step outside the cage.</p></div>
          <div class="poem-stanza"><p>But as I grew, the dream stood still.</p><p>Life asked me to survive.</p><p>I learned to work. I learned to build.</p><p>I learned to stay alive.</p></div>
          <div class="poem-stanza"><p>I taught in rooms, with hopes I could</p><p>Help someone find their way.</p><p>And when I gave the best I could,</p><p>Small blessings came each day.</p></div>
          <div class="poem-stanza"><p>Then someone heard a prayer I kept,</p><p>A wish I hid from view.</p><p>A friend held out a hand so kind,</p><p>And helped that dream come true.</p></div>
          <div class="poem-stanza"><p>I walked a runway, scared but proud,</p><p>With fear beneath my grin.</p><p>I did not know if I belonged,</p><p>But still, I stepped right in.</p></div>
          <div class="poem-stanza"><p>I joined again. I lost. I learned.</p><p>I joined, and lost once more.</p><p>But every time the page was turned,</p><p>I came back to the door.</p></div>
          <div class="poem-stanza"><p>Until one day, I wore a crown,</p><p>With tears I could not hide.</p><p>The little boy I used to know</p><p>Was standing there with pride.</p></div>
          <div class="poem-stanza"><p>Then came a year that broke my heart.</p><p>I lost the ones I loved.</p><p>My Mama left. My Father too,</p><p>Now watching from above.</p></div>
          <div class="poem-stanza"><p>Cancer came and took my strength.</p><p>The sickness shook my soul.</p><p>There were nights I lost my way.</p><p>I thought I lost it all.</p></div>
          <div class="poem-stanza"><p>But angels came when hope was thin,</p><p>With gentle hands and care.</p><p>They held me when I could not stand.</p><p>They told me they were there.</p></div>
          <div class="poem-stanza"><p>Now I am here. I still survive.</p><p>I still can sing and dance.</p><p>I still believe in dreams inside.</p><p>I still believe in chance.</p></div>
          <div class="poem-stanza poem-last-stanza"><p>I am not perfect. I am not through.</p><p>I am still learning how.</p><p>The little boy once dreamed of her.</p><p class="poem-final-line">And this… is Francine now.</p></div>
        </div>
      </div>
    </section>`;

let about = await readFile(sourceAbout, 'utf8');
for (const stylesheet of [verificationCss, chromeCss]) {
  if (!about.includes(stylesheet)) about = about.replace('</head>', `  <link rel="stylesheet" href="${stylesheet}">\n</head>`);
}

const spriteMatch = about.match(/style="--life-sprite:url\('data:image\/webp;base64,([^']+)'\)"/);
if (!spriteMatch?.[1]) throw new Error('About FMB approved life-photo sprite was not found in authored source.');
await mkdir(path.dirname(lifeSpriteOutput), { recursive: true });
await writeFile(lifeSpriteOutput, Buffer.from(spriteMatch[1], 'base64'));
about = about.replace(spriteMatch[0], 'data-photo-source="approved-life-sprite"');

const lifePhotos = [
  { key: 'graduation', alt: 'Francine Marie Bautista in her graduation portrait' },
  { key: 'pageantry', alt: 'Francine Marie Bautista in her crowned pageant portrait' },
  { key: 'professional', alt: 'Francine Marie Bautista in her approved white-shirt professional portrait' }
];
let lifePhotoIndex = 0;
about = about.replace(/<article class="life-card">/g, () => {
  const photo = lifePhotos[lifePhotoIndex++];
  if (!photo) throw new Error('About FMB contains more life-photo cards than the verified inventory.');
  return `<article class="life-card" data-photo="${photo.key}"><img class="life-card-media" src="${lifeSpritePublicPath}" alt="${photo.alt}" loading="lazy" decoding="async">`;
});
if (lifePhotoIndex !== lifePhotos.length) throw new Error(`About FMB expected ${lifePhotos.length} verified life-photo cards but found ${lifePhotoIndex}.`);

const poemPattern = /\s{4}<section class="poem-panel" aria-labelledby="poem-title">[\s\S]*?<\/section>/;
if (!poemPattern.test(about)) throw new Error('About FMB poem section was not found in authored source.');
about = about.replace(poemPattern, `\n${fullPoemSection}`);
await writeFile(outputAbout, about, 'utf8');

const html = await readFile(outputAbout, 'utf8');
const expected = [
  '<title>About Francine Marie Bautista | Creative Director, Strategist &amp; Founder</title>', 'The World According to FMB', 'hero-name-first', 'Not stock imagery.',
  'data-photo="graduation"', 'data-photo="pageantry"', 'data-photo="professional"', `src="${lifeSpritePublicPath}"`, 'data-verified-poem="full"',
  'With a dream so simple and shy.', 'My Mama left. My Father too,', 'But angels came when hope was thin,', 'And this… is Francine now.',
  'The authority story', 'The advantage is not one skill.', 'How it works', 'Capacity by design', 'Illustrative portfolio calendar, not a live schedule.',
  '/assets/css/aboutfmb-cinematic.css?v=20260808-authority-v1', '/assets/css/aboutfmb-portfolio-v2.css?v=20260808-portfolio-v2', verificationCss, chromeCss,
  '/assets/js/aboutfmb-cinematic.js?v=20260808-authority-v1', '/assets/js/aboutfmb-portfolio-v2.js?v=20260808-portfolio-v2', 'href="/work-with-fmb/"',
  'class="menu-toggle"', 'class="site-footer"', 'class="closing-signature"'
];
for (const marker of expected) if (!html.includes(marker)) throw new Error(`About FMB final contract missing: ${marker}`);
for (const forbidden of [wrongSchool,'class="fmb-shell-header"','class="fmb-shell-footer"','id="how-fmb-can-help"','id="fmb-authority"','--life-sprite:url(\'data:image/webp;base64','data-verified-excerpt="true"','The complete poem is not presented here as verified copy.']) {
  if (html.includes(forbidden)) throw new Error(`About FMB final contract contains forbidden post-build mutation: ${forbidden}`);
}

const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) throw new Error(`About FMB duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
if ((html.match(/<h1\b/gi) || []).length !== 1) throw new Error('About FMB must contain exactly one H1.');
for (const match of html.matchAll(/href=["']#([^"']+)["']/gi)) if (!ids.includes(match[1])) throw new Error(`About FMB missing in-page target: #${match[1]}`);

for (const relative of ['assets/css/aboutfmb-cinematic.css','assets/css/aboutfmb-portfolio-v2.css','assets/css/aboutfmb-verification-fixes.css','assets/css/aboutfmb-chrome-v4.css','assets/js/aboutfmb-cinematic.js','assets/js/aboutfmb-portfolio-v2.js','assets/images/fmb-approved/francine-portrait-front.webp','assets/images/fmb-approved/francine-standing-landscape.webp','assets/images/fmb-approved/about-life-sprite.webp']) await access(path.join(dist, relative));
const spriteBytes = (await readFile(lifeSpriteOutput)).byteLength;
if (spriteBytes < 10_000) throw new Error(`About FMB life-photo sprite is unexpectedly small (${spriteBytes} bytes).`);
console.log(`Protected About FMB with complete poem, approved photo chapters, premium menu/footer chrome, clean brand lockup, authority story, ecosystem explanation, responsive layers, availability disclosure, and accuracy guard.`);
