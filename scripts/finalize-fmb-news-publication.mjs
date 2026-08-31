const stages = [
  './post-build-fmb-brief-finalize-safe.mjs',
  './post-build-fmb-brief-existing-social.mjs',
  './post-build-fmb-news-reference-design.mjs',
  './post-build-fmb-news-editorial-lens-guard.mjs',
  './post-build-fmb-news-reference-polish.mjs',
  './post-build-fmb-news-polish-css.mjs',
  './post-build-fmb-news-image-overrides.mjs',
  // Late newsroom renderers can replace the shared shell. Restore the one
  // approved ecosystem shell first, then apply the FMB News / Worldwide layer.
  './post-build-fmb-news-shell-final.mjs',
  './post-build-fmb-news-unified-final.mjs',
  // Worldwide is a live-desk product, not a static newsroom residue. Run its
  // compatibility layer after all general newsroom renderers so later stages
  // cannot restore the legacy World landing during every build.
  './post-build-fmb-worldwide-publication-compat.mjs',
  './post-build-retired-public-nav-clean.mjs',
];

for (const stage of stages) {
  console.log(`FMB News publication finalizer: ${stage}`);
  await import(new URL(stage, import.meta.url));
}

console.log(`FMB News publication finalization complete: ${stages.length} ordered stage(s) applied behind one controlled entry point.`);
