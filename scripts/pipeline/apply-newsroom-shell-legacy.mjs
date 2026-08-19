// The root build already materializes historical inputs during generate:news.
// The shared-shell tail must never regenerate the retired Morning Special
// newsroom or withhold historical articles after canonical FMB Brief finalization.

// Re-apply canonical FMB Brief routes and social imagery at the start of the
// final shell stage. These operations are idempotent and keep the public daily
// briefing contract authoritative after all historical source builders have run.
await import('../post-build-fmb-brief-finalize-safe.mjs');
await import('../post-build-fmb-brief-existing-social.mjs');

// Seed every public newsroom page with the clean publication stylesheet before
// the historical headquarters compatibility pass audits it. Query strings make
// the two consistency imports distinct ES modules, so the post-compatibility pass
// really executes again and remains the final CSS/metadata writer.
await import('../post-build-fmbnews-consistency.mjs?stage=pre');
await import('../post-build-fmbnews-headquarters-with-brief.mjs');
await import('../post-build-fmbnews-consistency.mjs?stage=post');
