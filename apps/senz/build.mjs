import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
await mkdir(path.join(output, 'components'), { recursive: true });

for (const file of ['index.html', '404.html', 'robots.txt', 'sitemap.xml']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await copyFile(
  path.join(root, 'assets', 'senz-original-mark.png'),
  path.join(output, 'assets', 'senz-original-mark.png'),
);
await copyFile(
  path.join(root, 'components', 'safe-site.css'),
  path.join(output, 'components', 'safe-site.css'),
);

console.log('Built the evidence-only SENZ public website.');
