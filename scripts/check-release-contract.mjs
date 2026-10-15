import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'npm run build:ecosystem') {
  throw new Error('Root release must use the isolated build:ecosystem entry point.');
}
for (const stage of ['validate:content', 'generate:news', 'finalize:fmb-brief', 'verify:fmb-news']) {
  if (pkg.scripts?.[stage]) throw new Error('Retired newsroom release stage must not return: ' + stage);
}
for (const relative of ['scripts/build-ecosystem.mjs', 'tooling/check-deployment-boundaries.mjs', 'apps/withlovefmb/build.mjs']) {
  await access(path.join(root, relative));
}
const workflow = await readFile(path.join(root, '.github/workflows/monorepo-checks.yml'), 'utf8');
if (workflow.includes('deploy-fmb-prebuilt-production') || workflow.includes('scripts/validate-content.mjs')) {
  throw new Error('Monorepo CI must not publish or validate the retired newsroom.');
}
console.log('Release contract passed: isolated ecosystem build; no newsroom publication stages.');
