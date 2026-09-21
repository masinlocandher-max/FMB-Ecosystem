import { runModules } from './run-modules.mjs';

// Let the historical newsroom materialize first, then reassert the one approved
// public shell and the final FMB News contextual layer. Running these last in
// the shared-shell stage prevents legacy generators from reintroducing duplicate
// headers, footers, menus, or page-specific visual systems before verification.
await runModules('apply:shared-shell', [
  './apply-newsroom-shell-legacy.mjs',
  '../post-build-fmb-unified-design.mjs',
  '../post-build-fmb-news-unified-final.mjs',
  '../post-build-retired-public-nav-clean.mjs',
]);
