import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const fail = (message) => { throw new Error(`FMB unified design gate: ${message}`); };
const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const excludedFiles = new Set(['admin.html', 'login.html', 'signup.html', 'reset-password.html', 'confirm-email.html']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const relative = (file) => path.relative(root, file).replaceAll(path.sep, '/');
const publicHtml = (await walk(root)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

const cssFile = path.join(root, 'assets/css/fmb-unified-system.css');
const jsFile = path.join(root, 'assets/js/fmb-unified-system.js');
for (const file of [cssFile, jsFile]) {
  const info = await stat(file);
  if (!info.isFile() || info.size < 1000) fail(`${relative(file)} is missing or incomplete`);
}

const css = await readFile(cssFile, 'utf8');
for (const token of ['--fmb-ink', '--fmb-royal', '--fmb-lavender', '--fmb-gold', '.fmb-shell-header', '.fmb-shell-footer', '.fmb-unified-public']) {
  if (!css.includes(token)) fail(`unified stylesheet is missing ${token}`);
}

const js = await readFile(jsFile, 'utf8');
for (const marker of ['fmb-shell-menu', 'aria-expanded', 'IntersectionObserver', 'aria-current']) {
  if (!js.includes(marker)) fail(`unified interaction script is missing ${marker}`);
}

const obsoleteVisualMarkers = [
  'fmb-network-optimized.css',
  'fmb-network-optimized.js',
  'fmb-production-qa.css',
  'fmb-strategy-completion.css',
  'fmb-page-home.css',
  'fmb-page-about.css',
  '/aboutfmb/#work-with-fmb',
  '/withlovefmb/#volunteer',
];

let pagesChecked = 0;
for (const file of publicHtml) {
  const name = relative(file);
  const html = await readFile(file, 'utf8');
  pagesChecked += 1;

  for (const marker of [
    'fmb-unified-public',
    'data-fmb-page=',
    'class="fmb-shell-header"',
    'class="fmb-shell-footer"',
    '/assets/css/fmb-unified-system.css',
    '/assets/js/fmb-unified-system.js',
    '/assets/images/fmbandco/fmbandco-primary-reversed.png',
  ]) {
    if (!html.includes(marker)) fail(`${name} is missing ${marker}`);
  }

  if ((html.match(/class="fmb-shell-header"/g) || []).length !== 1) fail(`${name} does not have exactly one unified header`);
  if ((html.match(/class="fmb-shell-footer"/g) || []).length !== 1) fail(`${name} does not have exactly one unified footer`);
  if ((html.match(/fmb-unified-system\.css/g) || []).length !== 1) fail(`${name} does not have exactly one unified stylesheet`);
  if ((html.match(/fmb-unified-system\.js/g) || []).length !== 1) fail(`${name} does not have exactly one unified interaction script`);

  for (const marker of obsoleteVisualMarkers) {
    if (html.includes(marker)) fail(`${name} still contains obsolete visual marker ${marker}`);
  }
}

const home = await readFile(path.join(root, 'index.html'), 'utf8');
for (const marker of [
  'fmb-bulletin-consolidated',
  'id="how-fmb-can-help"',
  'id="fmb-authority"',
  'Creative Director. Brand Strategist. Entrepreneur. Storyteller. Educator. Founder.',
]) {
  if (!home.includes(marker)) fail(`homepage is missing ${marker}`);
}
if ((home.match(/id="bulletin"/g) || []).length !== 1) fail('homepage contains more than one bulletin');

const fmbCo = await readFile(path.join(root, 'fmbandco/index.html'), 'utf8');
if (!fmbCo.includes('id="company-depth"')) fail('FMB&CO. page is missing the strategic-house section');

const withLove = await readFile(path.join(root, 'withlovefmb/index.html'), 'utf8');
if (!withLove.includes('id="impact-depth"')) fail('With Love, FMB page is missing the advocacy depth section');

for (const route of ['work-with-fmb/index.html', 'get-involved/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  if (!html.includes('fmb-journey-options')) fail(`${route} lost its journey content`);
}

console.log(`FMB unified design gate passed ${pagesChecked} public pages with one shared shell and one active design system.`);
