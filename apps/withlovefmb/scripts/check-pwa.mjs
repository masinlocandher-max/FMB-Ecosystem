import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{console.error(message);process.exit(1)};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));

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
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  if(width!==Number(sizes[1])||height!==Number(sizes[2]))fail(`PWA icon dimensions do not match manifest: ${icon.src}`);
}

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!/rel="manifest"[^>]+manifest\.webmanifest/.test(index))fail('Home page is missing its manifest link.');
if(!/rel="apple-touch-icon"/.test(index))fail('Home page is missing its Apple touch icon.');

const appManifest=JSON.parse(fs.readFileSync(path.join(root,'app/manifest.webmanifest'),'utf8'));
if(appManifest.display!=='standalone')fail('Yoni manifest must use standalone display mode.');
if(appManifest.scope!=='/')fail('Yoni manifest must cover its dedicated subdomain root.');
if(appManifest.start_url!=='/')fail('Installed Yoni must open the root of its dedicated subdomain.');
if(appManifest.short_name!=='Yoni')fail('The companion app manifest must identify Yoni.');

const installPage=fs.readFileSync(path.join(root,'app/install/index.html'),'utf8');
const installScript=fs.readFileSync(path.join(root,'app/install/install.js'),'utf8');
if(!/rel="manifest"[^>]+\/app\/manifest\.webmanifest/.test(installPage))fail('Install campaign is not connected to the Yoni manifest.');
if(!installPage.includes('id="installNow"'))fail('Install campaign is missing its primary installation action.');
if(!installScript.includes('beforeinstallprompt')||!installScript.includes('appinstalled'))fail('Install campaign is missing native installation event handling.');

const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
if(!worker.includes("addEventListener('fetch'"))fail('Service worker has no fetch handler.');
if(worker.includes('registration.unregister'))fail('Service worker unregisters itself and cannot support installation.');
for(const asset of ('/app/install/ /app/install/index.html /app/install/install.css /app/install/install.js').split(' ')){
  if(!worker.includes(`'${asset}'`))fail(`Service worker is missing install campaign asset: ${asset}`);
}

const yoniDir=path.join(root,'app/assets/yoni');
const yoniFiles=['yoni-master-static.png','yoni-dancing.png','yoni-happy-wave.png','yoni-heart-hug.png','yoni-sleepy-rest.png','yoni-journal.png','yoni-music.png','yoni-meditation.png'];
for(const fileName of yoniFiles){
  const file=path.join(yoniDir,fileName);
  if(!fs.existsSync(file))fail(`Missing Yoni visual asset: ${fileName}`);
  if(fs.readFileSync(file).toString('hex',0,8)!=='89504e470d0a1a0a')fail(`Yoni asset is not a PNG: ${fileName}`);
  if(!worker.includes(`/app/assets/yoni/${fileName}`))fail(`Service worker does not cache Yoni asset: ${fileName}`);
}
const yoniLoader=fs.readFileSync(path.join(root,'assets/js/yoni-experience.js'),'utf8');
const yoniReply=fs.readFileSync(path.join(root,'assets/js/yoni-reply-core.js'),'utf8');
const yoniVisual=fs.readFileSync(path.join(root,'assets/js/yoni-visual-final.js'),'utf8');
const yoniCss=fs.readFileSync(path.join(root,'assets/css/yoni-visual-final.css'),'utf8');
if(!yoniLoader.includes('yoni-reply-core.js')||!yoniLoader.includes('yoni-visual-final.js'))fail('Yoni experience loader is missing the emotional or visual module.');
if(!yoniReply.includes('yoni-master-static.png'))fail('Yoni reply layer does not use the official master identity.');
if(!yoniVisual.includes('/app/assets/yoni/'))fail('Yoni visual layer does not use the official asset folder.');
if(!yoniVisual.includes('Yoni is an FMB&CO. digital product.'))fail('Yoni product attribution is missing.');
if(!worker.includes('/assets/js/yoni-reply-core.js')||!worker.includes('/assets/js/yoni-visual-final.js')||!worker.includes('/assets/css/yoni-visual-final.css'))fail('Service worker does not cache the final Yoni experience modules.');
for(const width of ['320px','375px','390px','430px'])if(!yoniCss.includes(width))fail(`Yoni CSS is missing the ${width} mobile optimization.`);
if(!yoniCss.includes('prefers-reduced-motion'))fail('Yoni visual layer must support reduced motion.');

console.log('Website and Yoni PWA, official visual identity, responsive ads, cache, and accessibility checks passed.');
