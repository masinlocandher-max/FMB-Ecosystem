import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const stages = ['validate:content', 'build:apps', 'generate:news', 'apply:shared-shell', 'verify:dist', 'finalize:fmb-brief'];
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
  'scripts/post-build-fmb-news-final-public-surface.mjs',
  'scripts/post-build-fmb-news-modern-newspaper.mjs',
  'scripts/post-build-fmb-news-consistency-guard.mjs',
]) {
  await access(path.join(root, relative));
}

console.log(`Release contract passed: ${stages.join(' -> ')}. Final public surface is an explicit named release stage.`);
