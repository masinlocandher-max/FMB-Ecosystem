import { runModules } from './run-modules.mjs';

// Reproduce the shell/framing tail that historically ran inside the rasterizer.
// No additional markup, image-priority, or personal-site mutations belong in
// Phase 1 because this stage must remain byte-equivalent to main.
await runModules('apply:shared-shell', [
  './apply-newsroom-shell-legacy.mjs',
]);
