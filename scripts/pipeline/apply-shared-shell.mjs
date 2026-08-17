import path from 'node:path';
import { applyPersonalSharedShell } from '../../apps/withlovefmb/scripts/apply-personal-shared-shell.mjs';
import { runModules } from './run-modules.mjs';

const distRoot = path.resolve(new URL('../../dist/', import.meta.url).pathname);

// Content generation is complete before this stage. Apply only the canonical
// newsroom and personal-site shells, then align source-backed edition framing.
await runModules('apply:shared-shell', [
  '../post-build-fmbnews-newsroom-structure.mjs',
  './align-morning-special-framing.mjs',
]);
await applyPersonalSharedShell({ distRoot });
