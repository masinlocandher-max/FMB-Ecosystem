import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const fail=message=>{console.error(message);process.exit(1)};

if(manifest.display!=='standalone')fail('PWA manifest must use standalone display mode.');
if(manifest.scope!=='/')fail('PWA manifest scope must cover the full website.');
if(!Array.isArray(manifest.icons)||manifest.icons.length<3)fail('PWA manifest requires any and maskable icons.');

for(const icon of manifest.icons){
  const sizes=String(icon.sizes||'').match(/^(\d+)x(\d+)$/);
  if(!sizes)fail(`Invalid icon size declaration: ${icon.sizes||'missing'}`);
  const file=path.join(root,String(icon.src||'').replace(/^\//,''));
  if(!fs.existsSync(file))fail(`Missing PWA icon: ${icon.src}`);
  const png=fs.readFileSync(file);
  if(png.toString('hex',0,8)!=='89504e470d0a1a0a')fail(`PWA icon is not a PNG: ${icon.src}`);
  const width=png.readUInt32BE(16);
  const height=png.readUInt32BE(20);
  if(width!==Number(sizes[1])||height!==Number(sizes[2]))fail(`PWA icon dimensions do not match manifest: ${icon.src}`);
}

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!/rel="manifest"[^>]+manifest\.webmanifest/.test(index))fail('Home page is missing its manifest link.');
if(!/rel="apple-touch-icon"/.test(index))fail('Home page is missing its Apple touch icon.');

const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
if(!worker.includes("addEventListener('fetch'"))fail('Service worker has no fetch handler.');
if(worker.includes('registration.unregister'))fail('Service worker unregisters itself and cannot support installation.');

console.log('PWA manifest, icons, install metadata, and service worker passed.');
