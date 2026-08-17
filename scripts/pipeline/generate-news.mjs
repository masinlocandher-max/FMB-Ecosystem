import { runModules } from './run-modules.mjs';

// This ordered manifest preserves the current production release behavior while
// moving historical mutations out of package.json. Groups document why each
// legacy operation still exists. Removal requires output-equivalence evidence.
const foundationAndPublicSurfaces = [
  '../post-build-fmb-approved-launch.mjs',
  '../post-build-fmb-final-visual-polish.mjs',
  '../post-build-fmb-corporate-luxury-v2.mjs',
  '../post-build-fmb-approved-dashboard.mjs',
  '../post-build-fmb-approved-dashboard-order.mjs',
  '../post-build-fmb-dashboard-compatibility.mjs',
  '../post-build-fmb-safari-readiness.mjs',
  '../post-build-fmb-mobile-footer-pax.mjs',
  '../post-build-senz-website-space.mjs',
  '../post-build-fmb-performance-cleanup.mjs',
  '../post-build-fmb-sitewide-visual-fixes.mjs',
];

const historicalNewsMaterialization = [
  '../post-build-fmb-news-center.mjs',
  '../post-build-fmb-news-sara-tax-records.mjs',
  '../post-build-fmbnews-impeachment-catchup-aug5.mjs',
  '../post-build-fmb-sona-2026.mjs',
  '../post-build-fmb-news-july-31-catchup.mjs',
  '../post-build-fmb-news-august-2.mjs',
  '../post-build-fmb-news-august-3.mjs',
  '../post-build-fmb-news-august-3-morning.mjs',
  '../post-build-fmb-news-august-3-noon.mjs',
  '../post-build-fmb-news-august-3-3pm.mjs',
  '../post-build-fmb-news-august-3-6pm.mjs',
  '../post-build-fmb-news-august-3-10pm.mjs',
  '../post-build-fmb-news-august-4-midnight.mjs',
  '../post-build-fmb-news-august-4-9am.mjs',
  '../post-build-fmb-news-august-4-luis-lpa.mjs',
  '../post-build-fmbnews-unpublished-backlog-aug5.mjs',
  '../post-build-fmb-news-article-masthead-guard.mjs',
  '../post-build-fmb-unified-design.mjs',

  // These are intentionally re-applied after the historical routes above are
  // created. They are repeated operations, not duplicate mistakes.
  '../post-build-fmb-approved-launch.mjs',
  '../post-build-fmb-mobile-footer-pax.mjs',
  '../post-build-fmb-sitewide-visual-fixes.mjs',
  '../post-build-fmb-news-center.mjs',
];

const newsroomMigrationLayers = [
  '../post-build-fmb-news-retired-logo-cleanup.mjs',
  '../post-build-fmb-news-channel-command.mjs',
  '../post-build-fmb-news-masthead.mjs',
  '../post-build-fmbnews-futuristic-ph.mjs',
  '../post-build-fmbnews-sourced-photos.mjs',
  '../post-build-fmbnews-photo-css-external.mjs',
  '../post-build-fmbnews-html-budget.mjs',
  '../post-build-fmbnews-editorial-v5.mjs',
  '../post-build-fmbnews-editorial-v5-polish.mjs',
  '../post-build-fmbnews-corporate-recovery.mjs',
  '../post-build-fmbnews-independent-publication.mjs',
  '../post-build-fmbnews-independent-landing-fix.mjs',
  '../post-build-fmbnews-v9-route-guard.mjs',
  '../post-build-fmbnews-editorial-v9.mjs',
  '../post-build-fmbnews-v9-fidelity.mjs',
  '../post-build-fmbnews-v9-fragment-compat.mjs',
  '../post-build-fmb-cognita-ad-grid.mjs',
  '../post-build-fmbnews-compact-html.mjs',
  '../post-build-fmb-authority-entity.mjs',
  '../post-build-fmbnews-signal-v10.mjs',
  '../post-build-fmbnews-media-social-v10.mjs',
  '../post-build-fmb-cognita-social-dimensions.mjs',
  '../post-build-fmb-legacy-authority.mjs',
  '../post-build-fmbnews-cognita-raster-v10.mjs',
  '../post-build-fmbnews-faithful-v11.mjs',
  '../post-build-fmbnews-v11-compat.mjs',
  '../post-build-fmbnews-preserve-archive.mjs',
  '../post-build-fmbnews-visible-archive-guard.mjs',
  '../post-build-fmbnews-noon-anchor-guard.mjs',
  '../post-build-fmb-news-august-5-11am.mjs',
  '../post-build-fmb-news-august-5-noon.mjs',
  '../post-build-fmb-news-august-5-1pm.mjs',
  '../post-build-fmb-news-august-5-3pm.mjs',
  '../post-build-fmb-news-august-6-briefing.mjs',
  '../post-build-fmbnews-reference-polish.mjs',
  '../post-build-fmbnews-reference-compat.mjs',
  '../post-build-fmbnews-reference-final.mjs',
  '../post-build-fmbnews-submit-story.mjs',
  '../post-build-fmbnews-route-alias.mjs',
];

const canonicalStructuredPublication = [
  '../post-build-fmb-news-live-surfaces.mjs',
  '../post-build-fmbnews-unpublished-backlog-cleanup.mjs',
  '../post-build-aboutfmb-final-contract.mjs',
  '../post-build-fmb-news-august-8-ai-pax-silica.mjs',
  '../post-build-fmb-news-august-8-ai-series-related.mjs',
  '../post-build-fmb-heavy-image-optimization.mjs',
  '../post-build-fmb-vercel-observability.mjs',
  '../post-build-fmb-news-morning-special-edition-aug11.mjs',
  '../post-build-fmb-news-morning-special-dates-aug11.mjs',
  '../post-build-fmb-news-morning-special-edition-aug12.mjs',
  '../post-build-fmb-news-morning-special-catchup-aug13-16.mjs',
  '../post-build-fmb-news-morning-special-edition-aug17.mjs',
  '../post-build-fmbnews-image-reliability.mjs',
  '../post-build-fmbnews-rasterize-trusted-wrappers.mjs',
];

await runModules('generate:news', [
  ...foundationAndPublicSurfaces,
  ...historicalNewsMaterialization,
  ...newsroomMigrationLayers,
  ...canonicalStructuredPublication,
]);
