# FMB About Motion

Editable Remotion source for the About FMB website hero and 4:5 social video.

This folder is intentionally outside the repository workspaces and deployment applications. It does not change Vercel configuration or deployment boundaries. Its public assets are symbolic links to the approved About FMB images used by the website, keeping one source of truth for the identity.

## Preview

```bash
npm install
npm run studio
```

## Render

```bash
npm run render:hero
npm run render:social
```

The render scripts write generated MP4 files into `apps/withlovefmb/assets/video/`. Generated video outputs are not committed.
