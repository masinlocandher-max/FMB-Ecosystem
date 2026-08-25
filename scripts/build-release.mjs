globalThis.__FMB_BUILD_RELEASE_INNER__ = true;

const steps = [
  './build-ecosystem.mjs',
  './post-build-entity-copy.mjs',
  './post-build-repository-assets.mjs',
  './post-build-fmb-unified-design.mjs',
  './post-build-image-dimensions.mjs',
  './post-build-release-hardening.mjs',
  './post-build-fmb-performance-cleanup.mjs',
  './post-build-fmb-home-landing-clean.mjs',
  './check-fmb-unified-design.mjs',
  './check-fmb-public-brand-routes.mjs',
  './audit-fmb-enterprise.mjs',
  './audit-fmb-performance.mjs',
  '../apps/withlovefmb/scripts/check-orchestrator.mjs',
  './audit-fmb-image-integrity-exact.mjs',
  './check-dist-links.mjs',
  './post-build-miss-intercontinental-isolation.mjs',
];

for (const step of steps) {
  const started = Date.now();
  console.log(`\n[FMB release] ${step}`);
  await import(new URL(step, import.meta.url));
  console.log(`[FMB release] completed ${step} in ${Date.now() - started}ms`);
}

console.log('\nFMB release build completed with the unified public design system, retired public Reading/Music routes scrubbed before audits, and all technical gates.');
