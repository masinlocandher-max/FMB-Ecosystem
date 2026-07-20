const CACHE_NAME='fmb-app-shell-20260721-yoni-live-fix-v21';
const PUBLIC_PAGES=new Set([
  '/',
  '/index.html',
  '/app/',
  '/app/index.html',
  '/app/install/',
  '/app/install/index.html',
  '/aboutfmb/',
  '/ebooks/',
  '/music/',
  '/gethelp/',
  '/fmbandco/',
  '/news/',
  '/privacy-policy.html',
  '/membership-agreement.html',
  '/community-guidelines.html',
  '/data-rights.html'
]);
const APP_SHELL=[
  '/',
  '/index.html',
  '/app/',
  '/app/index.html',
  '/app/app.css',
  '/app/app.js',
  '/app/access.js',
  '/app/manifest.webmanifest',
  '/app/install/',
  '/app/install/index.html',
  '/app/install/install.css',
  '/app/install/install.js',
  '/manifest.webmanifest',
  '/assets/css/site.css',
  '/assets/css/yoni-experience.css',
  '/assets/css/yoni-visual-final.css',
  '/assets/css/yoni-human-taglish.css',
  '/assets/js/config.js',
  '/assets/js/supabase-client.js',
  '/assets/js/yoni-experience.js',
  '/assets/js/yoni-experience-loader.js',
  '/assets/js/yoni-reply-core.js',
  '/assets/js/yoni-human-taglish.js',
  '/assets/js/yoni-visual-final.js',
  '/app/assets/yoni/manifest.json',
  '/app/assets/yoni/yoni-master-static.png',
  '/app/assets/yoni/yoni-dancing.png',
  '/app/assets/yoni/yoni-happy-wave.png',
  '/app/assets/yoni/yoni-heart-hug.png',
  '/app/assets/yoni/yoni-sleepy-rest.png',
  '/app/assets/yoni/yoni-journal.png',
  '/app/assets/yoni/yoni-music.png',
  '/app/assets/yoni/yoni-meditation.png',
  '/assets/images/app-icon-192.png',
  '/assets/images/app-icon-512.png',
  '/assets/images/apple-touch-icon.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname==='/api/music'||request.headers.has('range'))return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok&&PUBLIC_PAGES.has(url.pathname)){
          const cache=await caches.open(CACHE_NAME);
          cache.put(request,response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        const cached=await caches.match(request,{ignoreSearch:true});
        return cached||await caches.match(url.pathname.startsWith('/app/')?'/app/index.html':'/index.html')||Response.error();
      }
    })());
    return;
  }

  if(!['style','script','image','font','audio','manifest'].includes(request.destination))return;
  if(['style','script','manifest'].includes(request.destination)){
    event.respondWith((async()=>{
      try{
        const response=await fetch(new Request(request,{cache:'no-store'}));
        if(response.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(request,response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return await caches.match(request)||await caches.match(url.pathname)||Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request,{ignoreSearch:true});
    const fresh=fetch(request).then(async response=>{
      if(response.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(request,response.clone()).catch(()=>{});
      }
      return response;
    }).catch(()=>null);
    return cached||await fresh||Response.error();
  })());
});
