import './build-release.mjs';

const stage = async (label, modulePath) => {
  console.log(`[phase1-candidate] ${label}`);
  await import(modulePath);
};

await stage('news live surfaces', './post-build-fmb-news-live-surfaces.mjs');
await stage('structured FMB News feed', './post-build-fmbnews-unpublished-backlog-cleanup.mjs');
await stage('public brand routes check', './check-fmb-public-brand-routes.mjs');
await stage('enterprise audit', './audit-fmb-enterprise.mjs');
await stage('performance audit', './audit-fmb-performance.mjs');
await stage('image audit', './audit-fmb-image-integrity-exact.mjs');
await stage('About FMB contract', './post-build-aboutfmb-final-contract.mjs');
await stage('Aug 8 AI/Pax Silica feature', './post-build-fmb-news-august-8-ai-pax-silica.mjs');
await stage('Aug 8 related stories', './post-build-fmb-news-august-8-ai-series-related.mjs');
await stage('heavy image optimization', './post-build-fmb-heavy-image-optimization.mjs');
await stage('Vercel observability hooks', './post-build-fmb-vercel-observability.mjs');
await stage('Morning Special Aug 11', './post-build-fmb-news-morning-special-edition-aug11.mjs');
await stage('Morning Special Aug 11 dates', './post-build-fmb-news-morning-special-dates-aug11.mjs');
await stage('Morning Special Aug 12', './post-build-fmb-news-morning-special-edition-aug12.mjs');
await stage('Morning Special Aug 13-16', './post-build-fmb-news-morning-special-catchup-aug13-16.mjs');
await stage('Morning Special Aug 17', './post-build-fmb-news-morning-special-edition-aug17.mjs');
await stage('news image reliability', './post-build-fmbnews-image-reliability.mjs');
await stage('trusted wrapper rasterization', './post-build-fmbnews-rasterize-trusted-wrappers.mjs');
await stage('final newsroom audit', './check-fmb-newsroom-final.mjs');
await stage('final link audit', './check-dist-links.mjs');
