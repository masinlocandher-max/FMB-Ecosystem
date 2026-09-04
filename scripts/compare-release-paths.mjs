import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const [leftArg, rightArg] = process.argv.slice(2);
if (!leftArg || !rightArg) {
  throw new Error('Usage: node scripts/compare-release-paths.mjs <left-dist> <right-dist>');
}

const leftRoot = path.resolve(leftArg);
const rightRoot = path.resolve(rightArg);

async function walk(root, directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(root, full));
    else if (entry.isFile()) result.push(path.relative(root, full).replaceAll(path.sep, '/'));
  }
  return result.sort();
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
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

console.log(`Release-path comparison: ${leftFiles.length} ledger files vs ${rightFiles.length} shortened-path files.`);
console.log(`Only in ledger: ${onlyLeft.length}`);
for (const file of onlyLeft.slice(0, 80)) console.log(`  L ${file}`);
if (onlyLeft.length > 80) console.log(`  ... ${onlyLeft.length - 80} more`);
console.log(`Only in shortened path: ${onlyRight.length}`);
for (const file of onlyRight.slice(0, 80)) console.log(`  R ${file}`);
if (onlyRight.length > 80) console.log(`  ... ${onlyRight.length - 80} more`);
console.log(`Different content in common paths: ${changed.length}`);
for (const file of changed.slice(0, 160)) console.log(`  Δ ${file}`);
if (changed.length > 160) console.log(`  ... ${changed.length - 160} more`);

const report = {
  leftFiles: leftFiles.length,
  rightFiles: rightFiles.length,
  onlyLeft,
  onlyRight,
  changed,
};
process.stdout.write(`RELEASE_EQUIVALENCE_JSON=${JSON.stringify(report)}\n`);

if (onlyLeft.length || onlyRight.length || changed.length) process.exitCode = 2;
