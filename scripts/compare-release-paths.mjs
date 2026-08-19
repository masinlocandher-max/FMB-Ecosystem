import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const [leftArg, rightArg, leftRepoArg, rightRepoArg] = process.argv.slice(2);
if (!leftArg || !rightArg) {
  throw new Error('Usage: node scripts/compare-release-paths.mjs <left-dist> <right-dist> [left-repo] [right-repo]');
}

const leftRoot = path.resolve(leftArg);
const rightRoot = path.resolve(rightArg);
const leftRepoRoot = leftRepoArg ? path.resolve(leftRepoArg) : null;
const rightRepoRoot = rightRepoArg ? path.resolve(rightRepoArg) : null;

async function walk(root, directory = root) {
  const result = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return result;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(root, full));
    else if (entry.isFile()) result.push(path.relative(root, full).replaceAll(path.sep, '/'));
  }
  return result.sort();
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function articleSourceDeltaSlugs() {
  if (!leftRepoRoot || !rightRepoRoot) return [];
  const relativeRoot = path.join('apps', 'withlovefmb', 'content', 'news', 'articles');
  const leftArticleRoot = path.join(leftRepoRoot, relativeRoot);
  const rightArticleRoot = path.join(rightRepoRoot, relativeRoot);
  const leftFiles = (await walk(leftArticleRoot)).filter((file) => file.endsWith('.json'));
  const rightFiles = (await walk(rightArticleRoot)).filter((file) => file.endsWith('.json'));
  const union = [...new Set([...leftFiles, ...rightFiles])].sort();
  const slugs = new Set();

  for (const relative of union) {
    let left = null;
    let right = null;
    try { left = await readFile(path.join(leftArticleRoot, relative)); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    try { right = await readFile(path.join(rightArticleRoot, relative)); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    if (left && right && sha256(left) === sha256(right)) continue;

    const candidate = right || left;
    if (!candidate) continue;
    let parsed;
    try { parsed = JSON.parse(candidate.toString('utf8')); } catch { continue; }
    if (typeof parsed?.slug === 'string' && parsed.slug.trim()) slugs.add(parsed.slug.trim());
  }

  return [...slugs].sort();
}

const articleSlugs = await articleSourceDeltaSlugs();
const articleSlugSet = new Set(articleSlugs);
const sharedArticleState = new Set([
  'news/social-image-manifest.json',
  'news/image-repair-queue.json',
]);

function isDirectAuditedArticleOutput(file) {
  if (!articleSlugSet.size) return false;
  if (sharedArticleState.has(file)) return true;

  for (const slug of articleSlugSet) {
    if (file === `news/${slug}/index.html`) return true;
    if (file === `assets/images/news/social/${slug}-1200x630.webp`) return true;
    if (new RegExp(`^assets/images/news/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(?:jpe?g|png|webp|gif|avif|svg)$`, 'i').test(file)) return true;
  }
  return false;
}

const sharedPublicationHtml = [
  /^news\/index\.html$/,
  /^fmbnews\/index\.html$/,
  /^news\/about\/index\.html$/,
  /^news\/fmb-brief(?:-[^/]+)?\/index\.html$/,
];

function isSharedPublicationHtml(file) {
  return sharedPublicationHtml.some((pattern) => pattern.test(file));
}

async function sharedHtmlReferencesChangedArticle(file) {
  if (!articleSlugSet.size || !isSharedPublicationHtml(file)) return false;
  let left = '';
  let right = '';
  try { left = await readFile(path.join(leftRoot, file), 'utf8'); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  try { right = await readFile(path.join(rightRoot, file), 'utf8'); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const combined = `${left}\n${right}`;
  return articleSlugs.some((slug) => combined.includes(slug));
}

const leftFiles = await walk(leftRoot);
const rightFiles = await walk(rightRoot);
const leftSet = new Set(leftFiles);
const rightSet = new Set(rightFiles);
const onlyLeft = leftFiles.filter((file) => !rightSet.has(file));
const onlyRight = rightFiles.filter((file) => !leftSet.has(file));
const common = leftFiles.filter((file) => rightSet.has(file));
const changed = [];

for (const file of common) {
  const [left, right] = await Promise.all([
    readFile(path.join(leftRoot, file)),
    readFile(path.join(rightRoot, file)),
  ]);
  if (sha256(left) !== sha256(right)) changed.push(file);
}

const referenceBearingSharedHtml = new Set();
for (const file of [...onlyLeft, ...onlyRight, ...changed]) {
  if (await sharedHtmlReferencesChangedArticle(file)) referenceBearingSharedHtml.add(file);
}

function isAuditedArticleOutput(file) {
  return isDirectAuditedArticleOutput(file) || referenceBearingSharedHtml.has(file);
}

const expectedOnlyLeft = onlyLeft.filter(isAuditedArticleOutput);
const expectedOnlyRight = onlyRight.filter(isAuditedArticleOutput);
const expectedChanged = changed.filter(isAuditedArticleOutput);
const unexpectedOnlyLeft = onlyLeft.filter((file) => !isAuditedArticleOutput(file));
const unexpectedOnlyRight = onlyRight.filter((file) => !isAuditedArticleOutput(file));
const unexpectedChanged = changed.filter((file) => !isAuditedArticleOutput(file));

console.log(`Release-path comparison: ${leftFiles.length} baseline files vs ${rightFiles.length} candidate files.`);
if (articleSlugs.length) {
  console.log(`Audited article-source deltas: ${articleSlugs.length}`);
  for (const slug of articleSlugs) console.log(`  article ${slug}`);
  console.log(`Reference-bearing shared newsroom pages: ${referenceBearingSharedHtml.size}`);
  for (const file of [...referenceBearingSharedHtml].sort()) console.log(`  shared ${file}`);
  console.log(`Expected generated deltas: ${expectedOnlyLeft.length + expectedOnlyRight.length + expectedChanged.length}`);
} else {
  console.log('Audited article-source deltas: 0; strict byte-for-byte equivalence remains in force.');
}

console.log(`Unexpected only in baseline: ${unexpectedOnlyLeft.length}`);
for (const file of unexpectedOnlyLeft.slice(0, 80)) console.log(`  L! ${file}`);
if (unexpectedOnlyLeft.length > 80) console.log(`  ... ${unexpectedOnlyLeft.length - 80} more`);
console.log(`Unexpected only in candidate: ${unexpectedOnlyRight.length}`);
for (const file of unexpectedOnlyRight.slice(0, 80)) console.log(`  R! ${file}`);
if (unexpectedOnlyRight.length > 80) console.log(`  ... ${unexpectedOnlyRight.length - 80} more`);
console.log(`Unexpected different content: ${unexpectedChanged.length}`);
for (const file of unexpectedChanged.slice(0, 160)) console.log(`  Δ! ${file}`);
if (unexpectedChanged.length > 160) console.log(`  ... ${unexpectedChanged.length - 160} more`);

const report = {
  leftFiles: leftFiles.length,
  rightFiles: rightFiles.length,
  articleSlugs,
  referenceBearingSharedHtml: [...referenceBearingSharedHtml].sort(),
  expected: {
    onlyLeft: expectedOnlyLeft,
    onlyRight: expectedOnlyRight,
    changed: expectedChanged,
  },
  unexpected: {
    onlyLeft: unexpectedOnlyLeft,
    onlyRight: unexpectedOnlyRight,
    changed: unexpectedChanged,
  },
};
process.stdout.write(`RELEASE_EQUIVALENCE_JSON=${JSON.stringify(report)}\n`);

if (unexpectedOnlyLeft.length || unexpectedOnlyRight.length || unexpectedChanged.length) process.exitCode = 2;
