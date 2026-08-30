const stages = [
  './post-build-fmb-brief-finalize-safe.mjs',
  './post-build-fmb-brief-existing-social.mjs',
  './post-build-fmb-news-reference-design.mjs',
  './post-build-fmb-news-editorial-lens-guard.mjs',
  './post-build-fmb-news-reference-polish.mjs',
  './post-build-fmb-news-polish-css.mjs',
  './post-build-fmb-news-image-overrides.mjs',
  // Final authority: no late newsroom or Brief pass may leave a second shell,
  // competing menu, or page-specific design system behind.
  './post-build-fmb-unified-design.mjs',
  './post-build-fmb-news-unified-final.mjs',
];

for (const stage of stages) {
  console.log(`FMB News publication finalizer: ${stage}`);
  await import(new URL(stage, import.meta.url));
}

console.log(`FMB News publication finalization complete: ${stages.length} ordered stage(s) applied behind one controlled entry point.`);
