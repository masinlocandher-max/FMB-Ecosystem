#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{console.error(message);process.exit(1)};
const read=textPath=>fs.readFileSync(path.join(root,textPath),'utf8');
const requireFile=relativePath=>{
  const file=path.join(root,relativePath.replace(/^\//,''));
  if(!fs.existsSync(file))fail(`Missing PWA file: /${relativePath.replace(/^\//,'')}`);
  return file;
};

function assertPng(relativePath,expectedWidth,expectedHeight){
  const file=requireFile(relativePath);
  const png=fs.readFileSync(file);
  if(png.toString('hex',0,8)!=='89504e470d0a1a0a')fail(`PWA icon is not a PNG: ${relativePath}`);
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  if(width!==expectedWidth||height!==expectedHeight)fail(`PWA icon dimensions do not match ${expectedWidth}x${expectedHeight}: ${relativePath}`);
}

function assertWebp(relativePath){
  const file=requireFile(relativePath);
  const webp=fs.readFileSync(file);
  if(webp.toString('ascii',0,4)!=='RIFF'||webp.toString('ascii',8,12)!=='WEBP')fail(`Yoni visual is not a WebP file: ${relativePath}`);
}

const manifest=JSON.parse(read('manifest.webmanifest'));
if(manifest.display!=='standalone')fail('PWA manifest must use standalone display mode.');
if(manifest.scope!=='/')fail('PWA manifest scope must cover the full website.');
if(!Array.isArray(manifest.icons)||manifest.icons.length<3)fail('PWA manifest requires any and maskable icons.');
for(const icon of manifest.icons){
  const sizes=String(icon.sizes||'').match(/^(\d+)x(\d+)$/);
  if(!sizes)fail(`Invalid icon size declaration: ${icon.sizes||'missing'}`);
  assertPng(icon.src,Number(sizes[1]),Number(sizes[2]));
}

const index=read('index.html');
if(!/rel="manifest"[^>]+manifest\.webmanifest/.test(index))fail('Home page is missing its manifest link.');
if(!/rel="icon"[^>]+fmb-home-logo\.webp/.test(index))fail('Home page is missing its current FMB browser icon.');

const appManifest=JSON.parse(read('app/manifest.webmanifest'));
if(appManifest.display!=='standalone')fail('Yoni manifest must use standalone display mode.');
if(appManifest.scope!=='/')fail('Yoni manifest must cover its dedicated subdomain root.');
if(appManifest.start_url!=='/app/#home')fail('Installed Yoni must open the current application home screen.');
if(appManifest.short_name!=='Yoni')fail('The companion app manifest must identify Yoni.');
for(const icon of appManifest.icons||[]){
  const sizes=String(icon.sizes||'').match(/^(\d+)x(\d+)$/);
  if(!sizes)fail(`Invalid Yoni icon size declaration: ${icon.sizes||'missing'}`);
  assertPng(icon.src,Number(sizes[1]),Number(sizes[2]));
}
assertPng('/app/assets/yoni/yoni-apple-touch-icon-180.png',180,180);
assertWebp('/app/assets/yoni/yoni-hero.webp');
assertWebp('/app/assets/yoni/yoni-theme-background.webp');
requireFile('/app/assets/yoni/yoni-wordmark.png');

const appHtml=read('app/index.html');
for(const marker of ('/app/assets/yoni/yoni-hero.webp /app/assets/yoni/yoni-app-icon-192.png id="accessGate" id="screen-home"').split(' ')){
  if(!appHtml.includes(marker))fail(`Yoni app is missing its current identity or entry marker: ${marker}`);
}

const installPage=read('app/install/index.html');
const installScript=read('app/install/install.js');
if(!/rel="manifest"[^>]+\/app\/manifest\.webmanifest/.test(installPage))fail('Install campaign is not connected to the Yoni manifest.');
if(!installPage.includes('id="installNow"'))fail('Install campaign is missing its primary installation action.');
if(!installScript.includes('beforeinstallprompt')||!installScript.includes('appinstalled'))fail('Install campaign is missing native installation event handling.');

const supabaseLoader=read('assets/js/supabase-client.js');
if(!supabaseLoader.includes('yoni.francinemariebautista.com')||!supabaseLoader.includes('/assets/js/yoni-experience-loader.js'))fail('Yoni host routing is not connected to the current experience loader.');
const experienceLoader=read('assets/js/yoni-experience-loader.js');
for(const marker of [
  '/assets/css/yoni-app-refresh.css',
  '/assets/css/yoni-native-libraries.css',
  '/assets/css/yoni-native-reader-compat.css',
  '/assets/js/yoni-native-libraries.js',
  '/assets/js/yoni-native-music.js',
  '/assets/js/yoni-native-ebooks.js',
])if(!experienceLoader.includes(marker))fail(`Current Yoni experience loader is missing: ${marker}`);

const combinedCss=['assets/css/yoni-app-refresh.css','assets/css/yoni-native-libraries.css','assets/css/yoni-native-reader-compat.css'].map(read).join('\n');
if(!combinedCss.includes('prefers-reduced-motion'))fail('Yoni CSS must support reduced motion.');

const worker=read('service-worker.js');
if(!worker.includes("addEventListener('fetch'"))fail('Service worker has no fetch handler.');
if(worker.includes('registration.unregister'))fail('Service worker unregisters itself and cannot support installation.');
const cachedAssets=[
  '/app/install/',
  '/app/install/index.html',
  '/app/install/install.css',
  '/app/install/install.js',
  '/app/assets/yoni/yoni-app-icon-192.png',
  '/app/assets/yoni/yoni-app-icon-512.png',
  '/app/assets/yoni/yoni-apple-touch-icon-180.png',
  '/app/assets/yoni/yoni-hero.webp',
  '/app/assets/yoni/yoni-theme-background.webp',
  '/app/assets/yoni/yoni-wordmark.png',
  '/assets/css/yoni-app-refresh.css',
  '/assets/css/yoni-native-libraries.css',
  '/assets/css/yoni-native-reader-compat.css',
  '/assets/js/yoni-experience-loader.js',
  '/assets/js/yoni-native-libraries.js',
  '/assets/js/yoni-native-music.js',
  '/assets/js/yoni-native-ebooks.js',
];
for(const asset of cachedAssets)if(!worker.includes(`'${asset}'`))fail(`Service worker is missing current Yoni asset: ${asset}`);

console.log('Website and current Yoni PWA identity, install flow, responsive experience, and cache checks passed.');
