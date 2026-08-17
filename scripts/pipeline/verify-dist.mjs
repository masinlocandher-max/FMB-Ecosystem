import { runModules } from './run-modules.mjs';

// The legacy root ledger ended with exactly these two final gates. Earlier
// checks and audits stay at their original positions in build/generation.
await runModules('verify:dist', [
  '../check-fmb-newsroom-final.mjs',
  '../check-dist-links.mjs',
]);
