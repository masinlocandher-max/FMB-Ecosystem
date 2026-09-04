// These four operations were historically invoked from the rasterizer in this
// exact order and in one Node process. Keeping them together preserves that
// behavior while giving the new release contract a clear shell stage.
await import('../post-build-fmb-news-morning-special-catchup-aug13-16.mjs');
await import('../post-build-fmb-news-morning-special-edition-aug17.mjs');
await import('../post-build-fmbnews-newsroom-structure.mjs');
await import('./align-morning-special-framing.mjs');

// Legacy reports retain links to the newsroom's historical #stories and
// #top-story anchors. Later newsroom transforms can replace those sections,
// so preserve fragment-compatible targets before the generated-link audit.
const { readFile, writeFile } = await import('node:fs/promises');
const path = await import('node:path');
const dist = path.resolve(new URL('../../dist/', import.meta.url).pathname);
for (const route of ['news', 'fmbnews']) {
  const file = path.join(dist, route, 'index.html');
  let html = await readFile(file, 'utf8');
  const missingAnchors = ['stories', 'top-story'].filter(
    (anchor) => !new RegExp(`\\bid=["']${anchor}["']`).test(html),
  );
  if (missingAnchors.length > 0) {
    const targets = missingAnchors.map((anchor) => `<span id="${anchor}" hidden></span>`).join('');
    html = html.replace('<main', `${targets}<main`);
    await writeFile(file, html, 'utf8');
  }
}
