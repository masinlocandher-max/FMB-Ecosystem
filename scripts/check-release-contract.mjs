import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const stages = ['validate:content', 'build:apps', 'generate:news', 'apply:shared-shell', 'verify:dist', 'finalize:fmb-brief', 'verify:fmb-news'];
const expectedBuild = stages.map((stage) => `npm run ${stage}`).join(' && ');

if (pkg.scripts?.build !== expectedBuild) {
  throw new Error(`Release contract changed. Expected: ${expectedBuild}\nFound: ${pkg.scripts?.build || '<missing>'}`);
}
for (const stage of stages) {
  if (!pkg.scripts?.[stage]) throw new Error(`Release stage ${stage} is missing.`);
}
if (/post-build-[^\s&]+\.mjs/.test(pkg.scripts.build)) {
  throw new Error('Root build has regressed to a post-build serial patch ledger.');
}

for (const relative of [
  'scripts/validate-content.mjs',
  'scripts/pipeline/build-apps.mjs',
  'scripts/pipeline/generate-news.mjs',
  'scripts/pipeline/apply-shared-shell.mjs',
  'scripts/pipeline/verify-dist.mjs',
  'scripts/verify-fmb-news-publication.mjs',
  '.github/workflows/deploy-fmb.yml',
]) {
  await access(path.join(root, relative));
}

const deployWorkflow = await readFile(path.join(root, '.github/workflows/deploy-fmb.yml'), 'utf8');
for (const required of [
  "- 'apps/withlovefmb/**'",
  "- 'scripts/**'",
  'workflow_dispatch:',
  'vercel deploy --prebuilt --prod',
]) {
  if (!deployWorkflow.includes(required)) {
    throw new Error(`Dedicated FMB deployment contract is missing: ${required}`);
  }
}

const monorepoWorkflow = await readFile(path.join(root, '.github/workflows/monorepo-checks.yml'), 'utf8');
if (monorepoWorkflow.includes('deploy-fmb-prebuilt-production')) {
  throw new Error('Monorepo checks must not deploy FMB production on every unrelated main push.');
}

console.log(`Release contract passed: ${stages.join(' -> ')}. FMB News has a final publication QA gate and a dedicated path-scoped production deployment.`);
