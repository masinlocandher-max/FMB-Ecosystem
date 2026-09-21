import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = JSON.parse(await readFile(path.join(root, 'packages/ecosystem-contract/ecosystem.json'), 'utf8'));
const errors = [];
const warnings = [];
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const files = await walk(root);
const relativeFiles = files.map(file => path.relative(root, file).replaceAll(path.sep, '/'));

for (let index = 0; index < files.length; index++) {
  const file = files[index];
  const relative = relativeFiles[index];
  const name = path.basename(file);
  if ((name === '.env' || name.startsWith('.env.')) && !name.endsWith('.example')) {
    errors.push(`Committed environment file is forbidden: ${relative}`);
  }
}

const forbiddenFmbNewsPaths = [
  /^api\/news-/,
  /^apps\/withlovefmb\/news\//,
  /^apps\/withlovefmb\/content\/news\//,
  /^apps\/withlovefmb\/\.fmb-brief-.*publish-trigger$/,
];
for (const relative of relativeFiles) {
  if (forbiddenFmbNewsPaths.some(pattern => pattern.test(relative))) {
    errors.push(`FMB News must not be restored in FMB-Ecosystem: ${relative}. Use masinlocandher-max/FMBNews instead.`);
  }
}

const fmbOwnedResponsibilities = contract.applications?.fmb?.owns ?? [];
if (fmbOwnedResponsibilities.some(item => /FMB\s*News/i.test(String(item)))) {
  errors.push('FMB News must not appear in the FMB-Ecosystem ownership contract. Canonical repository: masinlocandher-max/FMBNews.');
}

const applicationEntries = Object.entries(contract.applications);
for (const [key, app] of applicationEntries) {
  const vercelPath = path.join(root, app.workspace, 'vercel.json');
  const vercelText = await readFile(vercelPath, 'utf8');
  for (const [otherKey, otherApp] of applicationEntries) {
    if (key === otherKey) continue;
    for (const domain of otherApp.domains) {
      if (vercelText.includes(domain)) {
        errors.push(`${app.workspace}/vercel.json references foreign ${otherKey} domain ${domain}.`);
      }
    }
  }
}

try {
  await readFile(path.join(root, 'vercel.json'), 'utf8');
  warnings.push('The root vercel.json remains as the legacy combined deployment. Remove it only after all app-root Vercel projects are verified in production. It must never serve FMB News.');
} catch {
  // The legacy deployment has already been retired.
}

if (warnings.length) {
  console.warn('Deployment boundary warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`Deployment boundary validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deployment boundaries are valid, FMB News is excluded from FMB-Ecosystem, and no private environment files are committed.');
