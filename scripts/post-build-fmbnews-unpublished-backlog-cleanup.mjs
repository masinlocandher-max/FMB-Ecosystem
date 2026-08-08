import path from 'node:path';

const { publishNewsFeed } = await import('../apps/withlovefmb/scripts/publish-news-feed.mjs');
await publishNewsFeed({ distRoot: path.resolve('dist') });
await import('./post-build-fmbnews-clean-recovery.mjs');
await import('./post-build-fmbnews-headquarters-final.mjs');
await import('./post-build-fmb-news-ai-series-polish.mjs');
