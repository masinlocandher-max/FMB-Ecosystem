import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const globalReplacements=new Map([
  ['/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`],
  ['/assets/images/home/francine-home-hero-hd.webp',`${approved}/francine-standing-landscape.webp`],
  ['/assets/images/home/francine-home-founder-hd.webp',`${approved}/francine-seated-landscape.webp`],
  ['/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`],
  ['/assets/images/fmb-official-2026/fmb-news-official.webp',`${approved}/fmb-news-official-transparent.webp`],
  ['/assets/images/fmb-official-2026/fmb-music-official.webp',`${approved}/fmb-music-official-transparent.webp`]
]);
const priorityAssetByPage={
  'index.html':`${approved}/francine-standing-landscape.webp`,
  'aboutfmb/index.html':`${approved}/francine-standing-landscape.webp`,
  'withlovefmb/index.html':`${approved}/francine-seated-landscape.webp`,
  'news/index.html':'/assets/images/news/fmb-news-official.svg',
  'music/index.html':'/assets/images/channels/fmb-music-official.svg',
  'ebooks/index.html':'/assets/images/channels/fmb-ebook-official.svg',
  'fmb&co/index.html':`${approved}/francine-standing-landscape.webp`
};
const exactLayout=`<style data-fmb-exact-asset-layout>
body.fmb-identity-v3 img[src^="${approved}/"]{filter:none!important;transform:none!important;animation:none!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait{display:grid!important;grid-template-columns:minmax(300px,42%) minmax(0,1fr);align-items:stretch;min-height:620px;background:linear-gradient(135deg,#10021d,#26063b)!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-media{position:relative!important;width:100%!important;height:100%!important;min-height:620px!important;aspect-ratio:auto!important;background:#d9d6da!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-media img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center bottom!important;background:#d9d6da!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-copy{position:relative!important;inset:auto!important;align-self:center;width:auto!important;max-width:720px;transform:none!important;margin:clamp(24px,5vw,80px)!important;padding:clamp(30px,5vw,64px)!important}
body.fmb-identity-v3 .fco-founder-card-portrait.fmb-official-portrait{width:min(100%,620px)!important;aspect-ratio:922/1152!important;margin-inline:auto!important;background:#d9d6da!important}
body.fmb-identity-v3 .fco-founder-card-portrait.fmb-official-portrait img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center bottom!important;background:#d9d6da!important}
body.fmb-identity-v3 :is(.nc-brand-mark,.nc-publication-brand,.nc-channel-lockup) img:is([src^="${approved}/fmb-"],[src$=".svg"]){width:min(100%,940px)!important;height:auto!important;max-height:212px!important;object-fit:contain!important;object-position:left center!important;background:transparent!important;border:0!important}
@media(max-width:820px){body.fmb-identity-v3 .fmb-identity-signature-portrait{grid-template-columns:1fr!important;min-height:0!important}body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-media{height:auto!important;min-height:0!important;aspect-ratio:4/5!important}body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-copy{margin:0!important;max-width:none!important}body.fmb-identity-v3 .fco-founder-card-portrait.fmb-official-portrait{max-width:100%!important;border-radius:26px!important}}
</style>`;

function normalizePriority(html,prioritySrc){
  html=html.replace(/\sfetchpriority=(['"])high\1/gi,'');
  if(!prioritySrc)return html;
  const escaped=prioritySrc.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return html.replace(new RegExp(`<img\\b[^>]*src=["']${escaped}(?:\\?[^"']*)?["'][^>]*>`,'i'),tag=>{
    let next=tag.replace(/\sloading=(['"])[^'"]*\1/i,'').replace(/\sfetchpriority=(['"])[^'"]*\1/i,'');
    return next.replace(/<img/i,'<img loading="eager" fetchpriority="high"');
  });
}

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  for(const [oldPath,newPath] of globalReplacements)html=html.replaceAll(oldPath,newPath);
  if(relative==='index.html')html=html.replace(/<link\s+rel="icon"\s+href="[^"]+"[^>]*>/i,`<link rel="icon" href="${approved}/fmb-master-purple-square.webp" type="image/webp">`);
  html=normalizePriority(html,priorityAssetByPage[relative]);
  if(!html.includes('data-fmb-exact-asset-layout'))html=html.replace('</head>',`${exactLayout}\n</head>`);
  await writeFile(file,html,'utf8');
}

const siteScriptPath=path.join(root,'assets','js','site.js');
let siteScript=await readFile(siteScriptPath,'utf8');
const absoluteRuntimePaths=new Map([
  ["'manifest.webmanifest'","'/manifest.webmanifest'"],
  ["'assets/images/apple-touch-icon.png'","'/assets/images/apple-touch-icon.png'"],
  ["'assets/js/config.js?v=20260715-member-launch'","'/assets/js/config.js?v=20260715-member-launch'"],
  ["'assets/js/supabase-client.js'","'/assets/js/supabase-client.js'"],
  ["'assets/css/icon-fix.css'","'/assets/css/icon-fix.css'"],
  ["'assets/css/repair.css'","'/assets/css/repair.css'"],
  ["'assets/css/fmb-polish.css?v=20260716-polish'","'/assets/css/fmb-polish.css?v=20260716-polish'"],
  ["'assets/css/fmb-content.css?v=20260716-content'","'/assets/css/fmb-content.css?v=20260716-content'"],
  ["'assets/css/fmb-mobile-clean.css?v=20260716-mobile-plan'","'/assets/css/fmb-mobile-clean.css?v=20260716-mobile-plan'"]
]);
for(const [relativePath,absolutePath] of absoluteRuntimePaths)siteScript=siteScript.replaceAll(relativePath,absolutePath);
await writeFile(siteScriptPath,siteScript,'utf8');

console.log(`Purged retired identities, preserved browser-safe channel wrappers, normalized nested runtime assets, and applied exact responsive composition across ${pages.length} pages.`);
