import { runModules } from './run-modules.mjs';

await runModules('build:apps', [
  '../build-ecosystem.mjs',
  '../post-build-entity-copy.mjs',
  '../post-build-repository-assets.mjs',
  '../post-build-fmb-unified-design.mjs',
  '../post-build-image-dimensions.mjs',
  '../post-build-release-hardening.mjs',
  '../post-build-fmb-performance-cleanup.mjs',
]);
