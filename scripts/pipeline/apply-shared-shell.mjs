import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { applyPersonalSharedShell } from '../../apps/withlovefmb/scripts/apply-personal-shared-shell.mjs';
import { runModules } from './run-modules.mjs';

const distRoot = path.resolve(new URL('../../dist/', import.meta.url).pathname);

// Content generation is complete before this stage. Apply only the canonical
// newsroom and personal-site shells, then align source-backed edition framing.
await runModules('apply:shared-shell', [
  '../post-build-fmbnews-newsroom-structure.mjs',
  './align-morning-special-framing.mjs',
]);

// Keep only the lead News image at high fetch priority. Secondary story and
// Morning Special cards retain the same markup and imagery but load lazily.
for (const relative of ['news/index.html', 'fmbnews/index.html']) {
  const file = path.join(distRoot, relative);
  let html = await readFile(file, 'utf8');
  let highPrioritySeen = false;
  let downgraded = 0;
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!/\bfetchpriority=["']high["']/i.test(tag)) return tag;
    if (!highPrioritySeen) {
      highPrioritySeen = true;
      return tag;
    }
    downgraded += 1;
    return tag
      .replace(/\s+fetchpriority=["']high["']/i, '')
      .replace(/\s+loading=["']eager["']/i, ' loading="lazy"');
  });
  await writeFile(file, html, 'utf8');
  const finalCount = (html.match(/<img\b[^>]*fetchpriority=["']high["']/gi) || []).length;
  if (finalCount > 1) throw new Error(`${relative} still contains ${finalCount} high-priority images.`);
  console.log(`${relative}: kept ${finalCount} lead high-priority image and downgraded ${downgraded} secondary image(s).`);
}

await applyPersonalSharedShell({ distRoot });
