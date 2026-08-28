// These four operations were historically invoked from the rasterizer in this
// exact order and in one Node process. Keeping them together preserves that
// behavior while giving the new release contract a clear shell stage.
await import('../post-build-fmb-news-morning-special-catchup-aug13-16.mjs');
await import('../post-build-fmb-news-morning-special-edition-aug17.mjs');
await import('../post-build-fmbnews-newsroom-structure.mjs');
await import('./align-morning-special-framing.mjs');

// FMB Brief editions retain links to the newsroom's historical #stories
// anchor. Later newsroom transforms can replace the original stories section,
// so preserve a fragment-compatible target before the generated-link audit.
const { readFile, writeFile } = await import('node:fs/promises');
const path = await import('node:path');
const dist = path.resolve(new URL('../../dist/', import.meta.url).pathname);
for (const route of ['news', 'fmbnews']) {
  const file = path.join(dist, route, 'index.html');
  const html = await readFile(file, 'utf8');
  if (!/\bid=["']stories["']/.test(html)) {
    await writeFile(file, html.replace('<main', '<span id="stories" hidden></span><main'), 'utf8');
  }
}
