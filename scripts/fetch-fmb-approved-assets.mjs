import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(repositoryRoot, 'dist');
const manifestPath = path.join(repositoryRoot, 'config', 'fmb-approved-assets.json');
const outputDirectory = path.join(distRoot, 'assets', 'images', 'fmb-approved');
const localImageRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'images');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

await mkdir(outputDirectory, { recursive: true });

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function isWebP(buffer) {
  return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

async function collectLocalWebp(directory, catalog = { byHash: new Map(), byName: new Map() }) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectLocalWebp(fullPath, catalog);
      continue;
    }
    if (!entry.name.toLowerCase().endsWith('.webp')) continue;
    const buffer = await readFile(fullPath);
    if (!isWebP(buffer)) continue;
    const record = { buffer, fullPath, hash: sha256(buffer), bytes: buffer.length };
    if (!catalog.byHash.has(record.hash)) catalog.byHash.set(record.hash, record);
    const sameName = catalog.byName.get(entry.name) || [];
    sameName.push(record);
    catalog.byName.set(entry.name, sameName);
  }
  return catalog;
}

const localMasters = await collectLocalWebp(localImageRoot);

async function fetchVerifiedAsset(asset) {
  const local = localMasters.byHash.get(asset.sha256);
  if (local) {
    console.log(`Using repository master for ${asset.key}: ${path.relative(repositoryRoot, local.fullPath)}`);
    return local.buffer;
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(asset.sourceUrl, {
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          accept: 'image/webp,image/*;q=0.9,*/*;q=0.1',
          'user-agent': 'FMB-Ecosystem-Verified-Asset-Build/1.0'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const receivedHash = sha256(buffer);
      if (!isWebP(buffer)) throw new Error(`received ${response.headers.get('content-type') || 'unknown content type'}, not a WebP master`);
      if (receivedHash !== asset.sha256) throw new Error(`SHA-256 mismatch: expected ${asset.sha256}, received ${receivedHash}`);
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  const candidates = (localMasters.byName.get(asset.file) || [])
    .map(candidate => `${path.relative(repositoryRoot, candidate.fullPath)} · ${candidate.bytes} bytes · sha256 ${candidate.hash}`)
    .join('; ');
  const candidateNote = candidates ? ` Same-name repository candidates: ${candidates}.` : '';
  throw new Error(`Unable to retrieve verified asset ${asset.key} (${asset.file}). No hash-matching repository master was found and the archived source failed: ${lastError?.message || 'unknown error'}.${candidateNote}`);
}

for (const asset of manifest.assets) {
  const buffer = await fetchVerifiedAsset(asset);
  await writeFile(path.join(outputDirectory, asset.file), buffer);
  console.log(`Verified exact FMB master: ${asset.key} · ${asset.width}×${asset.height} · ${asset.sha256.slice(0, 12)}`);
}

const publicManifest = {
  version: manifest.version,
  policy: manifest.policy,
  assets: manifest.assets.map(({ sourceUrl, ...asset }) => ({
    ...asset,
    publicPath: `/assets/images/fmb-approved/${asset.file}`
  }))
};
await writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(publicManifest, null, 2), 'utf8');
console.log(`Installed ${manifest.assets.length} exact user-supplied FMB masters into the deployment output.`);
