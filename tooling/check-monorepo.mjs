import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(root, 'packages/ecosystem-contract/ecosystem.json');
const errors = [];

async function readJson(relativePath) {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

async function requirePath(relativePath) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    errors.push(`Missing required path: ${relativePath}`);
  }
}

const rootPackage = await readJson('package.json');
const contract = await readJson('packages/ecosystem-contract/ecosystem.json');
const expectedWorkspaces = [
  'apps/withlovefmb',
  'apps/senz',
  'apps/cognita',
  'packages/*',
];

if (rootPackage) {
  const workspaces = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : [];
  for (const workspace of expectedWorkspaces) {
    if (!workspaces.includes(workspace)) errors.push(`Root package.json is missing workspace ${workspace}.`);
  }
  if (!rootPackage.scripts?.['build:legacy']) {
    errors.push('Root package.json must preserve build:legacy until the Vercel migration is complete.');
  }
}

if (contract) {
  const seenDomains = new Map();
  const seenProjects = new Map();
  const seenDataBoundaries = new Map();
  for (const [key, app] of Object.entries(contract.applications || {})) {
    await requirePath(app.workspace);
    await requirePath(`${app.workspace}/package.json`);
    await requirePath(`${app.workspace}/vercel.json`);
    const appPackage = await readJson(`${app.workspace}/package.json`);
    await readJson(`${app.workspace}/vercel.json`);
    if (appPackage && appPackage.name !== app.package) {
      errors.push(`${key}: package name must be ${app.package}, received ${appPackage.name}.`);
    }
    if (seenProjects.has(app.vercelProject)) {
      errors.push(`${key}: Vercel project ${app.vercelProject} is also assigned to ${seenProjects.get(app.vercelProject)}.`);
    }
    seenProjects.set(app.vercelProject, key);
    if (seenDataBoundaries.has(app.dataBoundary)) {
      errors.push(`${key}: data boundary ${app.dataBoundary} is also assigned to ${seenDataBoundaries.get(app.dataBoundary)}.`);
    }
    seenDataBoundaries.set(app.dataBoundary, key);
    for (const domain of app.domains || []) {
      if (seenDomains.has(domain)) errors.push(`${key}: domain ${domain} is also assigned to ${seenDomains.get(domain)}.`);
      seenDomains.set(domain, key);
    }
  }
}

if (errors.length) {
  console.error(`Monorepo validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Monorepo structure is valid: ${contractPath}`);
