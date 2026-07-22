import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const channelAssets={
  news:{path:'/assets/images/news/fmb-news-official.svg',width:420,height:320,label:'FMB News'},
  music:{path:'/assets/images/channels/fmb-music-official.svg',width:1400,height:320,label:'FMB Music'},
  ebook:{path:'/assets/images/channels/fmb-ebook-official.svg',width:1400,height:320,label:'FMB eBook'}
};
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const ebookRoutes=new Set(['coming-out-respect.html','dress-with-intention.html','men-can-cry.html','reading.html','skin-care-makeup.html','womens-health.html','herra.html']);
const principalChannels={
  'news/index.html':{type:'news',logo:channelAssets.news.path,width:channelAssets.news.width,height:channelAssets.news.height,label:channelAssets.news.label,href:'/news/'},
  'music/index.html':{type:'music',logo:channelAssets.music.path,width:channelAssets.music.width,height:channelAssets.music.height,label:channelAssets.music.label,href:'/music/'},
  'ebooks/index.html':{type:'ebook',logo:channelAssets.ebook.path,width:channelAssets.ebook.width,height:channelAssets.ebook.height,label:channelAssets.ebook.label,href:'/ebooks/'}
};
const channelStyle=`<style data-fmb-exact-channel-bars>
.fmb-exact-channel-bar{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(1180px,calc(100% - 32px));margin:18px auto 0;padding:14px 18px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:linear-gradient(135deg,rgba(20,4,34,.96),rgba(48,8,71,.94));box-shadow:0 18px 55px rgba(20,4,34,.2);color:#fff}
.fmb-exact-channel-bar img{display:block;width:min(360px,48vw);height:auto;max-height:82px;object-fit:contain;object-position:left center;filter:none!important;transform:none!important;background:transparent!important}
.fmb-exact-channel-bar div{display:flex;align-items:center;gap:18px;margin-left:auto}.fmb-exact-channel-bar span{font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.fmb-exact-channel-bar a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid rgba(255,255,255,.24);border-radius:999px;color:#fff;text-decoration:none;font:700 12px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;white-space:nowrap}
.fmb-exact-channel-bar a:hover,.fmb-exact-channel-bar a:focus-visible{background:#fff;color:#26063b;outline:none}
.fmb-channel-title-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.nc-publication-brand>img,.nc-channel-lockup>img,.nc-footer-brand>img{display:block!important;width:min(100%,940px)!important;height:auto!important;max-height:112px!important;object-fit:contain!important;object-position:left center!important;filter:none!important;transform:none!important;background:transparent!important}
.nc-channel-lockup>img{max-height:210px!important}
@media(max-width:680px){.fmb-exact-channel-bar{align-items:flex-start;flex-direction:column;gap:12px;margin-top:10px;padding:14px;border-radius:18px}.fmb-exact-channel-bar img{width:min(100%,330px);max-height:70px}.fmb-exact-channel-bar div{width:100%;justify-content:space-between;margin-left:0;gap:10px}.fmb-exact-channel-bar span{max-width:55%}.nc-publication-brand>img{max-height:64px!important}.nc-channel-lockup>img{max-height:116px!important}}
</style>`;

async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(full));else if(entry.name.endsWith('.html'))files.push(full);}return files;}
function relative(file){return path.relative(root,file).replaceAll(path.sep,'/');}
function exactFavicon(html){const tag=`<link rel="icon" href="${approved}/fmb-master-purple-square.webp" type="image/webp">`;return /<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i.test(html)?html.replace(/<link\s+[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i,tag):html.replace('</head>',`${tag}\n</head>`);}
function replaceImagePath(html,oldPath,newPath){return html.replaceAll(oldPath,newPath);}
function injectStyle(html){return html.includes('data-fmb-exact-channel-bars')?html:html.replace('</head>',`${channelStyle}\n</head>`);}
function setMetaImage(html,logo){const absolute=`https://www.francinemariebautista.com${logo}`;const og=`<meta property="og:image" content="${absolute}">`;const twitter=`<meta name="twitter:image" content="${absolute}">`;html=/<meta\s+property=["']og:image["'][^>]*>/i.test(html)?html.replace(/<meta\s+property=["']og:image["'][^>]*>/i,og):html.replace('</head>',`${og}\n</head>`);html=/<meta\s+name=["']twitter:image["'][^>]*>/i.test(html)?html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i,twitter):html.replace('</head>',`${twitter}\n</head>`);return html;}
function exactLogoImage(spec,{priority=false}={}){return `<img src="${spec.logo}" width="${spec.width}" height="${spec.height}" loading="${priority?'eager':'lazy'}" decoding="async" alt="${spec.label}"${priority?' fetchpriority="high"':''}>`;}
function enforcePrincipalChannel(html,spec){const navImage=exactLogoImage(spec);const heroImage=exactLogoImage(spec,{priority:true});html=injectStyle(html);html=exactFavicon(html);html=setMetaImage(html,spec.logo);html=html.replace(/<a\s+class=["']nc-publication-brand["'][^>]*>[\s\S]*?<\/a>/i,`<a class="nc-publication-brand" href="${spec.href}" aria-label="${spec.label} home">${navImage}</a>`);html=html.replace(/<div\s+class=["']nc-channel-lockup["'][^>]*>[\s\S]*?<\/div>/i,`<div class="nc-channel-lockup" aria-label="${spec.label}">${heroImage}<h1 class="fmb-channel-title-sr">${spec.label}</h1></div>`);html=html.replace(/<a\s+class=["']nc-footer-brand["'][^>]*>[\s\S]*?<\/a>/i,`<a class="nc-footer-brand" href="${spec.href}" aria-label="${spec.label} home">${navImage}</a>`);return html;}
function injectChannelBar(html,{type,logo,width,height,label,href,action}){if(html.includes(`data-fmb-exact-channel="${type}"`))return html;const bar=`<aside class="fmb-exact-channel-bar" data-fmb-exact-channel="${type}" aria-label="${label}"><img src="${logo}" width="${width}" height="${height}" loading="eager" decoding="async" alt="${label}"><div><span>${type==='news'?'Official newsroom':'Official digital publication'}</span><a href="${href}">${action}</a></div></aside>`;html=injectStyle(html);return /<main\b/i.test(html)?html.replace(/<main\b/i,`${bar}\n<main`):html.replace(/<body([^>]*)>/i,`<body$1>\n${bar}`);}

let changed=0,injectedNews=0,injectedEbooks=0,correctedPrincipals=0;
for(const file of await walk(root)){
  const name=relative(file);if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  let html=await readFile(file,'utf8');const before=html;
  html=html.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,`${approved}/francine-portrait-front.webp`);
  html=replaceImagePath(html,'/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`);
  html=replaceImagePath(html,'/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`);
  html=exactFavicon(html);
  const principal=principalChannels[name];if(principal){html=enforcePrincipalChannel(html,principal);correctedPrincipals+=1;}
  if(name.startsWith('news/')){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png',`${approved}/fmb-news-official-transparent.webp`,'/assets/images/fmb-official-2026/fmb-news-official.webp'])html=replaceImagePath(html,oldPath,channelAssets.news.path);
    if(!html.includes(channelAssets.news.path)){html=injectChannelBar(html,{type:'news',logo:channelAssets.news.path,width:channelAssets.news.width,height:channelAssets.news.height,label:channelAssets.news.label,href:'/news/',action:'Back to newsroom'});injectedNews+=1;}
  }
  if(ebookRoutes.has(name)){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png',`${approved}/fmb-ebook-official-transparent.webp`])html=replaceImagePath(html,oldPath,channelAssets.ebook.path);
    if(!html.includes(channelAssets.ebook.path)){html=injectChannelBar(html,{type:'ebook',logo:channelAssets.ebook.path,width:channelAssets.ebook.width,height:channelAssets.ebook.height,label:channelAssets.ebook.label,href:'/ebooks/',action:'Open the library'});injectedEbooks+=1;}
  }
  if(html!==before){await writeFile(file,html,'utf8');changed+=1;}
}
console.log(`Enforced browser-safe official News, Music and eBook lockups across ${correctedPrincipals} principal channels and ${changed} public routes, adding ${injectedNews} News mastheads and ${injectedEbooks} eBook mastheads without changing article content or volunteer assets.`);
