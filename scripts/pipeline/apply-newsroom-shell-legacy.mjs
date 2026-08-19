// The historical newsroom builder still materializes the publication landing and
// archive structure, but current public output must finish on the FMB Brief and
// unified FMB News system. Do not regenerate legacy Morning Special editions here:
// those source materializers already ran during generate:news.
await import('../post-build-fmbnews-newsroom-structure.mjs');

// Re-apply canonical FMB Brief routes after the legacy structure pass so a later
// shell stage can never reintroduce public Morning Special branding or links.
await import('../post-build-fmb-brief-finalize-safe.mjs');
await import('../post-build-fmb-brief-existing-social.mjs');

// Apply the shared FMB News publication framing to articles and landing pages,
// preserve Brief-specific editorial markup, then finish every route with one
// last-mile typography, spacing, navigation and footer system.
await import('../post-build-fmbnews-headquarters-with-brief.mjs');
await import('../post-build-fmbnews-consistency.mjs');
