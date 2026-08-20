import { runModules } from './run-modules.mjs';

// Materialize the historical newsroom shell once. The approved FMB Brief
// migration and final public identity run later, after verification, so this
// legacy stage cannot overwrite the production-facing result.
await runModules('apply:shared-shell', [
  './apply-newsroom-shell-legacy.mjs',
]);
