import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const approved='/assets/images/fmb-approved';
const newsBrowserSafe=`${approved}/fmb-news-browser-safe.png`;
const protectedRoots=['app/','_sites/senz/','_sites/cognita/'];
const ebookRoutes=new Set([
  'coming-out-respect.html','dress-with-intention.html','men-can-cry.html','reading.html','skin-care-makeup.html','womens-health.html','herra.html'
]);
const principalChannels={
  'news/index.html':{type:'news',logo:newsBrowserSafe,socialLogo:`${approved}/fmb-news-official-transparent.webp`,width:909,height:210,label:'FMB News',href:'/news/'},
  'music/index.html':{type:'music',logo:`${approved}/fmb-music-official-transparent.webp`,socialLogo:`${approved}/fmb-music-official-transparent.webp`,width:916,height:212,label:'FMB Music',href:'/music/'},
  'ebooks/index.html':{type:'ebook',logo:`${approved}/fmb-ebook-official-transparent.webp`,socialLogo:`${approved}/fmb-ebook-official-transparent.webp`,width:939,height:210,label:'FMB eBook',href:'/ebooks/'}
};
const channelStyle=`<style data-fmb-exact-channel-bars>
.fmb-exact-channel-bar{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:24px;width:min(1180px,calc(100% - 32px));margin:18px auto 0;padding:14px 18px;border:1px solid rgba(255,255,255,.16);border-radius:22px;background:linear-gradient(135deg,rgba(20,4,34,.96),rgba(48,8,71,.94));box-shadow:0 18px 55px rgba(20,4,34,.2);color:#fff}
.fmb-exact-channel-bar img{display:block;width:min(360px,48vw);height:auto;max-height:82px;object-fit:contain;object-position:left center;filter:none!important;transform:none!important;background:transparent!important}
.fmb-exact-channel-bar div{display:flex;align-items:center;gap:18px;margin-left:auto}.fmb-exact-channel-bar span{font:600 11px/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.fmb-exact-channel-bar a{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border:1px solid rgba(255,255,255,.24);border-radius:999px;color:#fff;text-decoration:none;font:700 12px/1 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;white-space:nowrap}
.fmb-exact-channel-bar a:hover,.fmb-exact-channel-bar a:focus-visible{background:#fff;color:#26063b;outline:none}
.fmb-channel-title-sr{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.nc-publication-brand>img[src^="${approved}/fmb-"],.nc-channel-lockup>img[src^="${approved}/fmb-"],.nc-footer-brand>img[src^="${approved}/fmb-"]{display:block!important;width:min(100%,940px)!important;height:auto!important;max-height:112px!important;object-fit:contain!important;object-position:left center!important;filter:none!important;transform:none!important;background:transparent!important}
.nc-channel-lockup>img[src^="${approved}/fmb-"]{max-height:210px!important}
body.news-channel-route .nc-nav-shell{border-color:rgba(255,255,255,.13)!important;background:linear-gradient(135deg,#140a18,#251027 70%,#37101f)!important;box-shadow:0 18px 52px rgba(23,18,24,.24)!important}
body.news-channel-route .nc-site-header.is-condensed .nc-nav-shell{background:rgba(20,10,24,.96)!important}
body.news-channel-route .nc-site-links a{color:rgba(255,255,255,.74)!important}
body.news-channel-route .nc-site-links .nc-corporate-link{background:#c6a45d!important;color:#150b18!important}
body.news-channel-route .nc-publication-brand::before,body.news-channel-route .nc-channel-lockup::before,body.news-channel-route .nc-footer-brand::before{background-image:url("${newsBrowserSafe}")!important;background-color:transparent!important}
body.news-channel-route .nc-broadcast-identity{background:radial-gradient(circle at 18% 18%,rgba(126,36,59,.32),transparent 34%),linear-gradient(135deg,#140a18,#281027 72%,#3d1324)!important;color:#fff!important}
body.news-channel-route .nc-channel-promise{border-left-color:rgba(226,200,142,.32)!important}
body.news-channel-route .nc-channel-promise p{color:#fff!important}
body.news-channel-route .nc-channel-promise>span{color:rgba(255,255,255,.62)!important}
body.news-channel-route .nc-channel-service span{border-color:rgba(255,255,255,.18)!important;background:rgba(255,255,255,.06)!important;color:#efe3c5!important}
.nc-mobile-dock{display:none}
@media(max-width:680px){
  .fmb-exact-channel-bar{align-items:flex-start;flex-direction:column;gap:12px;margin-top:10px;padding:14px;border-radius:18px}.fmb-exact-channel-bar img{width:min(100%,330px);max-height:70px}.fmb-exact-channel-bar div{width:100%;justify-content:space-between;margin-left:0;gap:10px}.fmb-exact-channel-bar span{max-width:55%}.nc-publication-brand>img[src^="${approved}/fmb-"]{max-height:64px!important}.nc-channel-lockup>img[src^="${approved}/fmb-"]{max-height:116px!important}
  body.news-channel-route{padding-bottom:calc(74px + env(safe-area-inset-bottom))!important}
  body.news-channel-route .nc-channel-promise{border-left:0!important;padding-left:0!important}
  .nc-mobile-dock{position:fixed;left:10px;right:10px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:920;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:6px;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:rgba(20,10,24,.94);box-shadow:0 18px 55px rgba(20,4,34,.32);-webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px)}
  .nc-mobile-dock a{display:flex;min-height:48px;align-items:center;justify-content:center;padding:6px;border-radius:16px;color:rgba(255,255,255,.72);font:750 9px/1.15 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif;letter-spacing:.04em;text-align:center;text-decoration:none;text-transform:uppercase}
  .nc-mobile-dock a[aria-current="page"],.nc-mobile-dock a:hover,.nc-mobile-dock a:focus-visible{background:#c6a45d;color:#150b18;outline:none}
}
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
function setMetaImage(html,logo){
  const absolute=`https://www.francinemariebautista.com${logo}`;
  const og=`<meta property="og:image" content="${absolute}">`;
  const twitter=`<meta name="twitter:image" content="${absolute}">`;
  html=/<meta\s+property=["']og:image["'][^>]*>/i.test(html)?html.replace(/<meta\s+property=["']og:image["'][^>]*>/i,og):html.replace('</head>',`${og}\n</head>`);
  html=/<meta\s+name=["']twitter:image["'][^>]*>/i.test(html)?html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i,twitter):html.replace('</head>',`${twitter}\n</head>`);
  return html;
}
function exactLogoImage(spec,{priority=false}={}){
  return `<img src="${spec.logo}" width="${spec.width}" height="${spec.height}" loading="${priority?'eager':'lazy'}" decoding="async" alt="${spec.label}"${priority?' fetchpriority="high"':''}>`;
}
function ensureNewsMobileDock(html){
  if(html.includes('class="nc-mobile-dock"'))return html;
  const dock=`<nav class="nc-mobile-dock" aria-label="FMB News mobile navigation"><a href="/news/" aria-current="page">Top stories</a><a href="#rundown">Latest</a><a href="/news/good-news/">Good news</a><a href="/">FMB home</a></nav>`;
  return html.replace('</body>',`${dock}\n</body>`);
}
function enforcePrincipalChannel(html,spec){
  const navImage=exactLogoImage(spec);
  const heroImage=exactLogoImage(spec,{priority:true});
  html=injectStyle(html);
  html=exactFavicon(html);
  html=setMetaImage(html,spec.socialLogo||spec.logo);
  html=html.replace(/<a\s+class=["']nc-publication-brand["'][^>]*>[\s\S]*?<\/a>/i,`<a class="nc-publication-brand" href="${spec.href}" aria-label="${spec.label} home">${navImage}</a>`);
  html=html.replace(/<div\s+class=["']nc-channel-lockup["'][^>]*>[\s\S]*?<\/div>/i,`<div class="nc-channel-lockup" aria-label="${spec.label}">${heroImage}<h1 class="fmb-channel-title-sr">${spec.label}</h1></div>`);
  html=html.replace(/<a\s+class=["']nc-footer-brand["'][^>]*>[\s\S]*?<\/a>/i,`<a class="nc-footer-brand" href="${spec.href}" aria-label="${spec.label} home">${navImage}</a>`);
  if(spec.type==='news')html=ensureNewsMobileDock(html);
  return html;
}
function injectChannelBar(html,{type,logo,width,height,label,href,action}){
  if(html.includes(`data-fmb-exact-channel="${type}"`))return html;
  const bar=`<aside class="fmb-exact-channel-bar" data-fmb-exact-channel="${type}" aria-label="${label}"><img src="${logo}" width="${width}" height="${height}" loading="eager" decoding="async" alt="${label}"><div><span>${type==='news'?'Official newsroom':'Official digital publication'}</span><a href="${href}">${action}</a></div></aside>`;
  html=injectStyle(html);
  return /<main\b/i.test(html)?html.replace(/<main\b/i,`${bar}\n<main`):html.replace(/<body([^>]*)>/i,`<body$1>\n${bar}`);
}

let changed=0;
let injectedNews=0;
let injectedEbooks=0;
let correctedPrincipals=0;
for(const file of await walk(root)){
  const name=relative(file);
  if(protectedRoots.some(prefix=>name.startsWith(prefix)))continue;
  let html=await readFile(file,'utf8');
  const before=html;

  html=html.replace(/\/assets\/images\/fmb\/francine-founder-[^"'\s)]+\.(?:webp|png|jpe?g)/gi,`${approved}/francine-portrait-front.webp`);
  html=replaceImagePath(html,'/assets/images/home/fmb-home-logo.webp',`${approved}/fmb-master-transparent.webp`);
  html=replaceImagePath(html,'/assets/images/fmb-official-2026/fmb-master-square.webp',`${approved}/fmb-master-purple-square.webp`);
  html=exactFavicon(html);

  const principal=principalChannels[name];
  if(principal){html=enforcePrincipalChannel(html,principal);correctedPrincipals+=1;}

  if(name.startsWith('news/')){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/news/fmb-news-official.svg','/assets/images/fmb-official-2026/fmb-news-official.webp',`${approved}/fmb-news-official-transparent.webp`])html=replaceImagePath(html,oldPath,newsBrowserSafe);
    if(!html.includes(newsBrowserSafe)){html=injectChannelBar(html,{type:'news',logo:newsBrowserSafe,width:909,height:210,label:'FMB News',href:'/news/',action:'Back to newsroom'});injectedNews+=1;}
  }
  if(ebookRoutes.has(name)){
    for(const oldPath of ['/assets/images/fmbandco/fmbandco-primary-reversed.png','/assets/images/channels/fmb-ebook-official.svg'])html=replaceImagePath(html,oldPath,`${approved}/fmb-ebook-official-transparent.webp`);
    if(!html.includes(`${approved}/fmb-ebook-official-transparent.webp`)){html=injectChannelBar(html,{type:'ebook',logo:`${approved}/fmb-ebook-official-transparent.webp`,width:939,height:210,label:'FMB eBook',href:'/ebooks/',action:'Open the library'});injectedEbooks+=1;}
  }

  if(html!==before){await writeFile(file,html,'utf8');changed+=1;}
}
console.log(`Enforced transparent browser-safe News, Music and eBook lockups across ${correctedPrincipals} principal channels and ${changed} public routes, adding ${injectedNews} News mastheads and ${injectedEbooks} eBook mastheads without changing article content or volunteer assets.`);
