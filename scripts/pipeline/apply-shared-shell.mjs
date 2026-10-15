import { runModules } from './run-modules.mjs';

// Apply only the parent-site shell. FMBNews owns the newsroom.
await runModules('apply:shared-shell', [
  '../post-build-fmb-unified-design.mjs',
  '../post-build-retired-public-nav-clean.mjs',
]);
