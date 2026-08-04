import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function ensureRootImageRuntime() {
  try {
    await import('sharp');
    return;
  } catch {
    console.log('[FMB release] sharp is not installed; preparing the declared image runtime for newsroom cover builds.');
  }

  const result = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['install', '--no-save', '--workspaces=false', '--no-audit', '--no-fund', 'sharp@0.35.3'],
    { cwd: repositoryRoot, stdio: 'inherit' },
  );
  if (result.status !== 0) throw new Error('Unable to prepare the declared sharp image runtime.');
  await import('sharp');
}

await ensureRootImageRuntime();

const steps = [
  './build-ecosystem.mjs',
  './post-build-entity-copy.mjs',
  './post-build-repository-assets.mjs',
  './post-build-fmb-unified-design.mjs',
  './post-build-image-dimensions.mjs',
  './post-build-release-hardening.mjs',
  './post-build-fmb-performance-cleanup.mjs',
  './check-fmb-unified-design.mjs',
  './check-fmb-public-brand-routes.mjs',
  './post-build-fmbnews-renovation-live.mjs',
  './audit-fmb-enterprise.mjs',
  './audit-fmb-performance.mjs',
  '../apps/withlovefmb/scripts/check-orchestrator.mjs',
  './audit-fmb-image-integrity-exact.mjs',
  './check-dist-links.mjs',
];

for (const step of steps) {
  const started = Date.now();
  console.log(`\n[FMB release] ${step}`);
  await import(new URL(step, import.meta.url));
  console.log(`[FMB release] completed ${step} in ${Date.now() - started}ms`);
}

console.log('\nFMB release build completed with the unified public design system and all technical gates.');