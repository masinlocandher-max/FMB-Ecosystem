import { runModules } from './run-modules.mjs';

// Preserve the exact first release unit from main. build-release.mjs already
// contains the original application build, hardening passes, and early gates.
await runModules('build:apps', [
  '../build-release.mjs',
]);
