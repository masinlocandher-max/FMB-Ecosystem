import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const scriptsRoot = path.resolve(new URL('.', import.meta.url).pathname);
const sourceFile = path.join(scriptsRoot, 'post-build-fmb-brief-finalize.mjs');
const patchedFile = path.join(scriptsRoot, '.post-build-fmb-brief-finalize-runtime.mjs');
const needle = "    const crop = await createSafeSocialCrop(sourceFile, socialFile, image.focusX ?? 50, image.focusY ?? 50);";
const replacement = `    let crop;\n    try {\n      crop = await createSafeSocialCrop(sourceFile, socialFile, image.focusX ?? 50, image.focusY ?? 50);\n    } catch (error) {\n      repairQueue.push({ slug, headline:raw.headline || raw.seoTitle || slug, publishedAt:raw.publishedAt || null, currentImage:ogImage || image.url || null, reasons:[\`social crop source could not be decoded: \${error.message}\`], priority:raw.publishedAt || '' });\n      continue;\n    }`;

const source = await readFile(sourceFile, 'utf8');
if (!source.includes(needle)) throw new Error('FMB Brief safe finalizer could not find the article crop call to harden.');
await writeFile(patchedFile, source.replace(needle, replacement), 'utf8');
try {
  await import(`${pathToFileURL(patchedFile).href}?v=${Date.now()}`);
} finally {
  await rm(patchedFile, { force:true });
}
