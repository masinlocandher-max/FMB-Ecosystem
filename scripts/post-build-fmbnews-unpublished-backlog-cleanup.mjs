import path from 'node:path';

const { prepareFmbNewsLocalImages } = await import('./prepare-fmbnews-local-images.mjs');
const contentRoot = await prepareFmbNewsLocalImages();
const { normalizeFmbNewsFeedCategories } = await import('./normalize-fmbnews-feed-categories.mjs');
await normalizeFmbNewsFeedCategories(contentRoot);
const { publishNewsFeed } = await import('../apps/withlovefmb/scripts/publish-news-feed.mjs');
await publishNewsFeed({ distRoot: path.resolve('dist'), contentRoot });
await import('./post-build-fmbnews-clean-recovery.mjs');
await import('./post-build-fmbnews-headquarters-final.mjs');
await import('./post-build-fmb-news-ai-series-polish.mjs');
