import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const globalReplacements=new Map([
  ['/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`],
  ['/assets/images/home/francine-home-hero-hd.webp',`${approved}/francine-standing-landscape.webp`],
  ['/assets/images/home/francine-home-founder-hd.webp',`${approved}/francine-seated-landscape.webp`],
  ['/assets/images/news/fmb-news-official.svg',`${approved}/fmb-news-official-transparent.webp`],
  ['/assets/images/channels/fmb-music-official.svg',`${approved}/fmb-music-official-transparent.webp`],
  ['/assets/images/channels/fmb-ebook-official.svg',`${approved}/fmb-ebook-official-transparent.webp`],
  ['/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`],
  ['/assets/images/fmb-official-2026/fmb-news-official.webp',`${approved}/fmb-news-official-transparent.webp`],
  ['/assets/images/fmb-official-2026/fmb-music-official.webp',`${approved}/fmb-music-official-transparent.webp`]
]);
const exactLayout=`<style data-fmb-exact-asset-layout>
body.fmb-identity-v3 img[src^="${approved}/"]{filter:none!important;transform:none!important;animation:none!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait{display:grid!important;grid-template-columns:minmax(300px,42%) minmax(0,1fr);align-items:stretch;min-height:620px;background:linear-gradient(135deg,#10021d,#26063b)!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-media{position:relative!important;width:100%!important;height:100%!important;min-height:620px!important;aspect-ratio:auto!important;background:#d9d6da!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-media img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center bottom!important;background:#d9d6da!important}
body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-copy{position:relative!important;inset:auto!important;align-self:center;width:auto!important;max-width:720px;transform:none!important;margin:clamp(24px,5vw,80px)!important;padding:clamp(30px,5vw,64px)!important}
body.fmb-identity-v3 .fco-founder-card-portrait.fmb-official-portrait{width:min(100%,620px)!important;aspect-ratio:922/1152!important;margin-inline:auto!important;background:#d9d6da!important}
body.fmb-identity-v3 .fco-founder-card-portrait.fmb-official-portrait img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center bottom!important;background:#d9d6da!important}
body.fmb-identity-v3 :is(.nc-brand-mark,.nc-publication-brand,.nc-channel-lockup) img[src^="${approved}/fmb-"]{width:min(100%,940px)!important;height:auto!important;max-height:212px!important;object-fit:contain!important;object-position:left center!important;background:transparent!important}
@media(max-width:820px){body.fmb-identity-v3 .fmb-identity-signature-portrait{grid-template-columns:1fr!important;min-height:0!important}body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-media{height:auto!important;min-height:0!important;aspect-ratio:4/5!important}body.fmb-identity-v3 .fmb-identity-signature-portrait .fmb-identity-signature-copy{margin:0!important;max-width:none!important}body.fmb-identity-v3 .fco-founder-card-portrait.fmb-official-portrait{max-width:100%!important;border-radius:26px!important}}
</style>`;

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  for(const [oldPath,newPath] of globalReplacements)html=html.replaceAll(oldPath,newPath);
  if(relative==='index.html')html=html.replace(/<link\s+rel="icon"\s+href="[^"]+"[^>]*>/i,`<link rel="icon" href="${approved}/fmb-master-purple-square.webp" type="image/webp">`);
  if(!html.includes('data-fmb-exact-asset-layout'))html=html.replace('</head>',`${exactLayout}\n</head>`);
  await writeFile(file,html,'utf8');
}
console.log(`Purged every retired identity path and applied exact responsive portrait composition across ${pages.length} rendered pages.`);
