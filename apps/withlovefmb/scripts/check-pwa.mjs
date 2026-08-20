import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const fail=message=>{console.error(message);process.exit(1)};
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),'utf8'));
const exists=relative=>fs.existsSync(path.join(root,relative));
const pngDimensions=file=>{
  const data=fs.readFileSync(file);
  if(data.toString('hex',0,8)!=='89504e470d0a1a0a')fail(`Not a PNG: ${path.relative(root,file)}`);
  return {width:data.readUInt32BE(16),height:data.readUInt32BE(20)};
};

const manifest=readJson('manifest.webmanifest');
if(manifest.display!=='standalone')fail('Website manifest must use standalone display mode.');
if(manifest.scope!=='/')fail('Website manifest scope must cover the full website.');
if(manifest.id!=='/')fail('Website manifest must use the public website identity.');
if(!String(manifest.start_url||'').startsWith('/'))fail('Website manifest must start on the public website.');
if(!Array.isArray(manifest.icons)||manifest.icons.length<3)fail('Website manifest requires any and maskable icons.');
for(const icon of manifest.icons){
  const sizes=String(icon.sizes||'').match(/^(\d+)x(\d+)$/);
  if(!sizes)fail(`Invalid website icon size declaration: ${icon.sizes||'missing'}`);
  const file=path.join(root,String(icon.src||'').replace(/^\//,''));
  if(!fs.existsSync(file))fail(`Missing website icon: ${icon.src}`);
  const dimensions=pngDimensions(file);
  if(dimensions.width!==Number(sizes[1])||dimensions.height!==Number(sizes[2]))fail(`Website icon dimensions do not match manifest: ${icon.src}`);
}
for(const shortcut of manifest.shortcuts||[]){
  if(/music|ebook|reading/i.test(`${shortcut.name||''} ${shortcut.short_name||''} ${shortcut.url||''}`))fail('Website manifest still exposes a retired Music or eBook shortcut.');
}

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const workspaceBuild=fs.readFileSync(path.join(root,'build.mjs'),'utf8');
const releaseCompilerPath=path.resolve(root,'../../scripts/post-build-fmb-approved-launch.mjs');
const releaseCompiler=fs.existsSync(releaseCompilerPath)?fs.readFileSync(releaseCompilerPath,'utf8'):'';
const sourceHasManifest=/rel=["']manifest["'][^>]+manifest\.webmanifest/i.test(index);
const workspaceInjectsManifest=workspaceBuild.includes('/manifest.webmanifest');
const releaseInjectsManifest=releaseCompiler.includes('/manifest.webmanifest')&&releaseCompiler.includes('manifestLink');
if(!sourceHasManifest&&!workspaceInjectsManifest&&!releaseInjectsManifest)fail('Home page build is missing its manifest connection.');
if(!index.includes('/assets/images/fmb-approved/fmb-master-transparent.webp'))fail('Home page is missing the exact approved FMB master.');
if(!index.includes('https://yoni.francinemariebautista.com/'))fail('Home page must link to the independent Yoni destination.');
if(/href=["']\/app\//i.test(index))fail('Home page still links to an embedded local Yoni app.');

const liveHotfix=fs.readFileSync(path.join(root,'assets/js/live-hotfix.js'),'utf8');
const yoniPromo=fs.readFileSync(path.join(root,'assets/js/yoni-home-promo.js'),'utf8');
for(const text of [liveHotfix,yoniPromo]){
  if(!text.includes('https://yoni.francinemariebautista.com/'))fail('Public Yoni entry points must use the independent Yoni domain.');
}
for(const forbidden of ['yoni-native-music.js','yoni-native-ebooks.js','yoni-experience-loader.js','/music/','/ebooks/','/reading.html']){
  if(liveHotfix.includes(forbidden))fail(`Public runtime still references retired product code or route: ${forbidden}`);
}

const vercel=readJson('vercel.json');
const appRedirect=(vercel.redirects||[]).find(rule=>rule?.has?.some?.(condition=>condition.type==='host'&&condition.value==='app.francinemariebautista.com'));
if(!appRedirect)fail('Vercel config is missing the app-subdomain compatibility redirect.');
if(!String(appRedirect.destination||'').startsWith('https://yoni.francinemariebautista.com/'))fail('App-subdomain compatibility redirect must point to the independent Yoni domain.');

const retiredPaths=[
  'app/index.html',
  'app/manifest.webmanifest',
  'app/install',
  'music/index.html',
  'music.html',
  'ebooks/index.html',
  'reading.html',
  'api/music.js',
  'assets/data/music-library.json',
  'assets/js/global-music.js',
  'assets/js/music.js',
  'assets/js/fmb-reader-modern.js',
  'assets/js/yoni-experience-loader.js',
  'assets/js/yoni-native-music.js',
  'assets/js/yoni-native-ebooks.js',
];
for(const relative of retiredPaths){
  if(exists(relative))fail(`Retired product surface still exists: ${relative}`);
}

const worker=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const forbidden of ['/app/index.html','/app/install/','/music/','/ebooks/','/reading.html','yoni-native-music','yoni-native-ebooks','music-library.json']){
  if(worker.includes(forbidden))fail(`Service worker still caches or references a retired surface: ${forbidden}`);
}

for(const fileName of ['yoni-hero.webp','yoni-wordmark.png','yoni-app-icon-192.png','yoni-social-1200.jpg']){
  const file=path.join(root,'app/assets/yoni',fileName);
  if(!fs.existsSync(file))fail(`Missing retained Yoni cross-promo asset: ${fileName}`);
}

const supabaseClient=fs.readFileSync(path.join(root,'assets/js/supabase-client.js'),'utf8');
for(const marker of ['registrationOpen:false','Registration is closed.','event.stopImmediatePropagation()']){
  if(!supabaseClient.includes(marker))fail(`Registration guard is missing: ${marker}`);
}
for(const forbidden of ['get_membership_status','data?.registration_open===true']){
  if(supabaseClient.includes(forbidden))fail(`Registration guard can still open registration: ${forbidden}`);
}

console.log('FMB public install, registration guard, retired-product absence, and independent Yoni boundary checks passed.');
