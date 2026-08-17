import { runModules } from './run-modules.mjs';

// The full Morning Special set is republished after image sanitization, then the
// canonical newsroom renderer applies the final FMB News masthead, navigation,
// footer and publication layout from the source-backed newsroom structure.
await runModules('apply:shared-shell', [
  '../post-build-fmb-news-morning-special-catchup-aug13-16.mjs',
  '../post-build-fmb-news-morning-special-edition-aug17.mjs',
  '../post-build-fmbnews-newsroom-structure.mjs',
]);
