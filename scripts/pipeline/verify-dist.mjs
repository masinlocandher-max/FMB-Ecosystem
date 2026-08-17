import { runModules } from './run-modules.mjs';

await runModules('verify:dist', [
  '../check-fmbnews-futuristic-ph.mjs',
  '../check-fmb-unified-design.mjs',
  '../check-fmb-public-brand-routes.mjs',
  '../audit-fmb-enterprise.mjs',
  '../audit-fmb-performance.mjs',
  '../../apps/withlovefmb/scripts/check-orchestrator.mjs',
  '../audit-fmb-image-integrity-exact.mjs',
  '../check-fmb-newsroom-final.mjs',
  '../check-dist-links.mjs',
]);
