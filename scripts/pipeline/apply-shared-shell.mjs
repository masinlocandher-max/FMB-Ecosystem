// Apply the retained FMB News framing operations directly. Keeping the order
// explicit avoids the retired generic module runner and hidden serial ledgers.
await import('../post-build-fmb-news-morning-special-catchup-aug13-16.mjs');
await import('../post-build-fmb-news-morning-special-edition-aug17.mjs');
await import('../post-build-fmbnews-newsroom-structure.mjs');
await import('./align-morning-special-framing.mjs');
