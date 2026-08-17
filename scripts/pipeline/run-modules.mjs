let invocation = 0;

export async function runModules(stage, modules) {
  for (const modulePath of modules) {
    const startedAt = Date.now();
    invocation += 1;
    console.log(`\n[FMB ${stage}] ${modulePath}`);
    // The historical release invoked every step in a fresh Node process. Add a
    // unique query to the top-level module specifier so an intentionally
    // repeated stage still executes instead of being skipped by ESM caching.
    await import(`${modulePath}?fmb_stage_run=${invocation}`);
    console.log(`[FMB ${stage}] completed ${modulePath} in ${Date.now() - startedAt}ms`);
  }
}
