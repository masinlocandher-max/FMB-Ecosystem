// These four operations were historically invoked from the rasterizer in this
// exact order and in one Node process. Keeping them together preserves that
// behavior while giving the new release contract a clear shell stage.
await import('../post-build-fmb-news-morning-special-catchup-aug13-16.mjs');
await import('../post-build-fmb-news-morning-special-edition-aug17.mjs');
await import('../post-build-fmbnews-newsroom-structure.mjs');
await import('./align-morning-special-framing.mjs');
