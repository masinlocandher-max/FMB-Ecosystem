import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export async function runModules(stage, modules) {
  for (const modulePath of modules) {
    const startedAt = Date.now();
    const scriptPath = fileURLToPath(new URL(modulePath, import.meta.url));
    console.log(`\n[FMB ${stage}] ${modulePath}`);

    // The legacy package ledger launched each top-level script in a fresh Node
    // process. Preserve that process boundary so module caches and globals cannot
    // make the staged release behave differently from main.
    const result = spawnSync(process.execPath, [...process.execArgv, scriptPath], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      throw new Error(`${stage}: ${modulePath} exited with status ${result.status}`);
    }
    console.log(`[FMB ${stage}] completed ${modulePath} in ${Date.now() - startedAt}ms`);
  }
}
