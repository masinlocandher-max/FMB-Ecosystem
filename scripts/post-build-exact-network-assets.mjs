import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const ebookRoutes=new Set([
  'coming-out-respect.html',
  'dress-with-intention.html',
  'men-can-cry.html',
  'reading.html',
  'skin-care-makeup.html',
  'womens-health.html',
  'herra.html'
]);
const channelStyle=`<style data-fmb-exact-channel-bars>
.fmb-exact-channel-bar{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(1180px,calc(100% - 32px));margin:18px auto 0;padding:14px 18px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:linear-gradient(135deg,rgba(20,4,34,.96),rgba(48,8,71,.94));box-shadow:0 18px 55px rgba(20,4,34,.2);color:#fff}
.fmb-exact-channel-bar img{display:block;width:min(360px,48vw);height:auto;max-height:82px;object-fit:contain;object-position:left center;filter:none!important;transform:none!important;background:transparent!important}
.fmb-exact-channel-bar div{display:flex;align-items:center;gap:18px;margin-left:auto}.fmb-exact-channel-bar span{font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.fmb-exact-channel-bar a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid rgba(255,255,255,.24);border-radius:999px;color:#fff;text-decoration:none;font:700 12px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;white-space:nowrap}
.fmb-exact-channel-bar a:hover,.fmb-exact-channel-bar a:focus-visible{background:#fff;color:#26063b;outline:none}
@media(max-width:680px){.fmb-exact-channel-bar{align-items:flex-start;flex-direction:column;gap:12px;margin-top:10px;padding:14px;border-radius:18px}.fmb-exact-channel-bar img{width:min(100%,330px);max-height:70px}.fmb-exact-channel-bar div{width:100%;justify-content:space-between;margin-left:0;gap:10px}.fmb-exact-channel-bar span{max-width:55%}}
</style>`;

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else if(entry.name.endsWith('.html'))files.push(full);
  }
  return files;
}
function relative(file){return path.relative(root,file).replaceAll(path.sep,'/');}
function exactFavicon(html){
  const tag=`<link rel="icon" href="${approved}/fmb-master-purple-square.webp" type="image/webp">`;
  return /<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i.test(html)
    ? html.replace(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i,tag)
    : html.replace('</head>',`${tag}\n</head>`);
}
function replaceImagePath(html,oldPath,newPath){return html.replaceAll(oldPath,newPath);}
function injectStyle(html){return html.includes('data-fmb-exact-channel-bars')?html:html.replace('</head>',`${channelStyle}\n</head>`);}
function injectChannelBar(html,{type,logo,width,height,label,href,action}){
  if(html.includes(`data-fmb-exact-channel="${type}"`))return html;
  const bar=`<aside class="fmb-exact-channel-bar" data-fmb-exact-channel="${type}" aria-label="${label}"><img src="${logo}" width="${width}" height="${height}" loading="eager" decoding="async" alt="${label}"><div><span>${type==='news'?'Official newsroom':'Official digital publication'}</span><a href="${href}">${action}</a></div></aside>`;
  html=injectStyle(html);
  return /<main\b/i.test(html)?html.replace(/<main\b/i,`${bar}\n<main`):html.replace(/<body([^>]*)>/i,`<body$1>\n${bar}`);
}

let changed=0;
let injectedNews=0;
let injectedEbooks=0;
for(const file of await walk(root)){
  const name=relative(file);
  if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  let html=await readFile(file,'utf8');
  const before=html;

  html=html.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,`${approved}/francine-portrait-front.webp`);
  html=replaceImagePath(html,'/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`);
  html=replaceImagePath(html,'/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`);
  html=exactFavicon(html);

  if(name.startsWith('news/')){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/news/fmb-news-official.svg','/assets/images/fmb-official-2026/fmb-news-official.webp']){
      html=replaceImagePath(html,oldPath,`${approved}/fmb-news-official-transparent.webp`);
    }
    if(!html.includes(`${approved}/fmb-news-official-transparent.webp`)){
      html=injectChannelBar(html,{type:'news',logo:`${approved}/fmb-news-official-transparent.webp`,width:909,height:210,label:'FMB News',href:'/news/',action:'Back to newsroom'});
      injectedNews+=1;
    }
  }
  if(ebookRoutes.has(name)){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-ebook-official.svg']){
      html=replaceImagePath(html,oldPath,`${approved}/fmb-ebook-official-transparent.webp`);
    }
    if(!html.includes(`${approved}/fmb-ebook-official-transparent.webp`)){
      html=injectChannelBar(html,{type:'ebook',logo:`${approved}/fmb-ebook-official-transparent.webp`,width:939,height:210,label:'FMB eBook',href:'/ebooks/',action:'Open the library'});
      injectedEbooks+=1;
    }
  }

  if(html!==before){await writeFile(file,html,'utf8');changed+=1;}
}
console.log(`Extended exact FMB identities through ${changed} public routes, adding ${injectedNews} News mastheads and ${injectedEbooks} eBook mastheads while preserving all original content and volunteer assets.`);
