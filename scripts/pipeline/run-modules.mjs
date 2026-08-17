export async function runModules(stage, modules) {
  for (const modulePath of modules) {
    const startedAt = Date.now();
    console.log(`\n[FMB ${stage}] ${modulePath}`);
    await import(modulePath);
    console.log(`[FMB ${stage}] completed ${modulePath} in ${Date.now() - startedAt}ms`);
  }
}
