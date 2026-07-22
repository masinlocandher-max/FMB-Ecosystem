import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{console.error(message);process.exit(1)};
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const pngDimensions=file=>{
  const data=fs.readFileSync(file);
  if(data.toString('hex',0,8)!=='89504e470d0a1a0a')fail(`Not a PNG: ${path.relative(root,file)}`);
  return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
};

const manifest=readJson('manifest.webmanifest');
if(manifest.display!=='standalone')fail('Website manifest must use standalone display mode.');
if(manifest.scope!=='/')fail('Website manifest scope must cover the full website.');
if(!Array.isArray(manifest.icons)||manifest.icons.length<3)fail('Website manifest requires any and maskable icons.');
for(const icon of manifest.icons){
  const sizes=String(icon.sizes||'').match(/^(\d+)x(\d+)$/);
  if(!sizes)fail(`Invalid website icon size declaration: ${icon.sizes||'missing'}`);
  const file=path.join(root,String(icon.src||'').replace(/^\//,''));
  if(!fs.existsSync(file))fail(`Missing website icon: ${icon.src}`);
  const dimensions=pngDimensions(file);
  if(dimensions.width!==Number(sizes[1])||dimensions.height!==Number(sizes[2]))fail(`Website icon dimensions do not match manifest: ${icon.src}`);
}

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!/rel="manifest"[^>]+manifest\.webmanifest/.test(index))fail('Home page is missing its manifest link.');
if(!index.includes('/assets/images/home/fmb-home-logo.webp'))fail('Home page is missing the current FMB icon.');

const appManifest=readJson('app/manifest.webmanifest');
if(appManifest.display!=='standalone')fail('Yoni manifest must use standalone display mode.');
if(appManifest.scope!=='/')fail('Yoni manifest must cover the complete Yoni host experience.');
if(appManifest.id!=='/app/')fail('Yoni manifest must keep the /app/ product identity.');
if(appManifest.start_url!=='/app/#home')fail('Installed Yoni must open the Yoni home screen.');
if(appManifest.short_name!=='Yoni')fail('The companion manifest must identify Yoni.');
if(appManifest.name!=='Yoni Mental Health Companion')fail('The companion manifest must retain the current Yoni product name.');
const expectedYoniIcons={
  '/app/assets/yoni/yoni-app-icon-192.png':'192x192',
  '/app/assets/yoni/yoni-app-icon-512.png':'512x512',
};
for(const [src,sizes] of Object.entries(expectedYoniIcons)){
  const entry=appManifest.icons.find(icon=>icon.src===src&&icon.sizes===sizes);
  if(!entry)fail(`Yoni manifest is missing current icon ${src}`);
  const file=path.join(root,src.slice(1));
  if(!fs.existsSync(file))fail(`Missing Yoni icon: ${src}`);
  const dimensions=pngDimensions(file);
  const [width,height]=sizes.split('x').map(Number);
  if(dimensions.width!==width||dimensions.height!==height)fail(`Yoni icon dimensions do not match manifest: ${src}`);
}
const appleIcon=path.join(root,'app/assets/yoni/yoni-apple-touch-icon-180.png');
if(!fs.existsSync(appleIcon))fail('Missing Yoni Apple touch icon.');
const appleDimensions=pngDimensions(appleIcon);
if(appleDimensions.width!==180||appleDimensions.height!==180)fail('Yoni Apple touch icon must be 180x180.');

const appHtml=fs.readFileSync(path.join(root,'app/index.html'),'utf8');
for(const marker of '/app/manifest.webmanifest /app/assets/yoni/yoni-apple-touch-icon-180.png /app/assets/yoni/yoni-app-icon-192.png'.split(' ')){
  if(!appHtml.includes(marker))fail(`Yoni app shell is missing current install marker: ${marker}`);
}

const installPage=fs.readFileSync(path.join(root,'app/install/index.html'),'utf8');
const installScript=fs.readFileSync(path.join(root,'app/install/install.js'),'utf8');
if(!/rel="manifest"[^>]+\/app\/manifest\.webmanifest/.test(installPage))fail('Install campaign is not connected to the Yoni manifest.');
if(!installPage.includes('id="installNow"'))fail('Install campaign is missing its primary installation action.');
for(const marker of ['renderSteps','revealGuide','beforeinstallprompt','appinstalled','navigator.share']){
  if(!installScript.includes(marker))fail(`Install campaign is missing the current platform flow: ${marker}`);
}

const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const asset of '/app/ /app/index.html /app/install/ /app/install/index.html /app/install/install.css /app/install/install.js /app/assets/yoni/yoni-app-icon-192.png /app/assets/yoni/yoni-app-icon-512.png /app/assets/yoni/yoni-apple-touch-icon-180.png /app/assets/yoni/yoni-hero.webp /app/assets/yoni/yoni-theme-background.webp /app/assets/yoni/yoni-wordmark.png /assets/js/yoni-experience-loader.js /assets/js/yoni-native-libraries.js /assets/js/yoni-native-music.js /assets/js/yoni-native-ebooks.js'.split(' ')){
  if(!worker.includes(`'${asset}'`))fail(`Service worker is missing current Yoni cache asset: ${asset}`);
}

for(const fileName of ['yoni-hero.webp','yoni-theme-background.webp','yoni-wordmark.png']){
  const file=path.join(root,'app/assets/yoni',fileName);
  if(!fs.existsSync(file))fail(`Missing current Yoni visual: ${fileName}`);
}
for(const relative of [
  'assets/css/yoni-app-refresh.css',
  'assets/css/yoni-native-libraries.css',
  'assets/css/yoni-native-reader-compat.css',
  'assets/js/yoni-experience-loader.js',
  'assets/js/yoni-native-libraries.js',
  'assets/js/yoni-native-music.js',
  'assets/js/yoni-native-ebooks.js',
]){
  if(!fs.existsSync(path.join(root,relative)))fail(`Missing current Yoni experience module: ${relative}`);
}

console.log('Website and Yoni install experience, current identity, libraries, cache, and responsive shell checks passed.');
