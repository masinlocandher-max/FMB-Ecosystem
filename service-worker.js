const CACHE_NAME='with-love-fmb-v2';
const PUBLIC_SHELL=[
  './',
  './index.html',
  './404.html',
  './manifest.webmanifest',
  './assets/css/site.css',
  './assets/css/icon-fix.css',
  './assets/css/repair.css',
  './assets/js/site.js',
  './assets/icon.svg',
  './assets/signature.svg',
  './assets/hero-banner.svg'
];
const PRIVATE_PATHS=['/auth.html','/member.html','/admin.html','/reset-password.html'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PUBLIC_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const isPrivate=PRIVATE_PATHS.some(path=>url.pathname.endsWith(path));
  if(isPrivate){event.respondWith(fetch(request,{cache:'no-store'}));return}

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}
      return response;
    }).catch(async()=>await caches.match(request)||await caches.match('./index.html')));
    return;
  }

  event.respondWith(caches.match(request).then(cached=>{
    const network=fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}
      return response;
    });
    return cached||network;
  }));
});
