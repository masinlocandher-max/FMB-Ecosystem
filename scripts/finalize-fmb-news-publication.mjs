const stages = [
  './post-build-fmb-brief-finalize-safe.mjs',
  './post-build-fmb-brief-existing-social.mjs',
  './post-build-fmb-news-reference-design.mjs',
  './post-build-fmb-news-editorial-lens-guard.mjs',
  './post-build-fmb-news-reference-polish.mjs',
  './post-build-fmb-news-polish-css.mjs',
  './post-build-fmb-news-image-overrides.mjs',
  // The shared-shell stage has already applied the one public ecosystem shell
  // across the site. After Brief finalization, reassert only the newsroom layer
  // so compatibility redirects such as /fmbnews/ are not treated as full pages.
  './post-build-fmb-news-unified-final.mjs',
  './post-build-retired-public-nav-clean.mjs',
];

for (const stage of stages) {
  console.log(`FMB News publication finalizer: ${stage}`);
  await import(new URL(stage, import.meta.url));
}

console.log(`FMB News publication finalization complete: ${stages.length} ordered stage(s) applied behind one controlled entry point.`);
