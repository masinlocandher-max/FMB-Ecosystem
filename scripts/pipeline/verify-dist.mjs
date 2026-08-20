// Run the final distribution gates directly. The generic module runner was
// retired with the historical post-build ledger.
await import('../check-fmb-newsroom-final.mjs');
await import('../check-dist-links.mjs');
