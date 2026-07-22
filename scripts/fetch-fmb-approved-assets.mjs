import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const distRoot=path.join(repositoryRoot,'dist');
const manifestPath=path.join(repositoryRoot,'config','fmb-approved-assets.json');
const sourceDirectory=path.join(repositoryRoot,'apps','withlovefmb','assets','images','fmb-approved');
const outputDirectory=path.join(distRoot,'assets','images','fmb-approved');
const manifest=JSON.parse(await readFile(manifestPath,'utf8'));

await mkdir(outputDirectory,{recursive:true});

function sha256(buffer){return createHash('sha256').update(buffer).digest('hex');}
function isWebP(buffer){return buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP';}

for(const asset of manifest.assets){
  const sourcePath=path.join(sourceDirectory,asset.file);
  const buffer=await readFile(sourcePath);
  if(!isWebP(buffer))throw new Error(`GitHub master ${asset.file} is not a valid WebP`);
  const receivedHash=sha256(buffer);
  if(receivedHash!==asset.sha256)throw new Error(`GitHub master ${asset.file} does not match the uploaded asset. Expected ${asset.sha256}, received ${receivedHash}`);
  await writeFile(path.join(outputDirectory,asset.file),buffer);
  console.log(`Installed GitHub-owned FMB master: ${asset.key} · ${asset.width}×${asset.height} · ${asset.sha256.slice(0,12)}`);
}

const publicManifest={
  version:manifest.version,
  policy:{...manifest.policy,source:'github-repository'},
  assets:manifest.assets.map(({sourceUrl,adobeAssetId,...asset})=>({
    ...asset,
    repositoryPath:`/assets/images/fmb-approved/${asset.file}`,
    publicPath:`/assets/images/fmb-approved/${asset.file}`
  }))
};
await writeFile(path.join(outputDirectory,'manifest.json'),JSON.stringify(publicManifest,null,2),'utf8');
console.log(`Installed ${manifest.assets.length} exact user-supplied FMB masters from GitHub with no external asset dependency.`);
