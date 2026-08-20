import { runModules } from './run-modules.mjs';

// Preserve the historical newsroom materialization, then immediately restore
// the approved public FMB Brief routes and final FMB News identity. Nothing
// after this stage may reintroduce the retired Morning Special presentation.
await runModules('apply:shared-shell', [
  './apply-newsroom-shell-legacy.mjs',
  '../post-build-fmb-brief-finalize-safe.mjs',
  '../post-build-fmb-brief-existing-social.mjs',
  '../post-build-fmb-news-final-public-surface.mjs',
]);
