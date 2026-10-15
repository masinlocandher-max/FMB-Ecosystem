import { runModules } from './run-modules.mjs';

await runModules('verify:dist', ['../check-dist-links.mjs']);
