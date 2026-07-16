const CACHE_NAME='fmb-app-shell-20260716-content-expansion';
const PUBLIC_PAGES=new Set([
  '/',
  '/index.html',
  '/about.html',
  '/auth.html',
  '/freedom-wall.html',
  '/ebooks/',
  '/music/',
  '/communityengagements/',
  '/aboutfmb/',
  '/fmbandco/',
  '/gethelp/',
  '/news/',
  '/reading.html',
  '/dress-with-intention.html',
  '/music.html',
  '/womens-health.html',
  '/coming-out-respect.html',
  '/men-can-cry.html',
  '/skin-care-makeup.html',
  '/privacy-policy.html',
  '/membership-agreement.html',
  '/community-guidelines.html',
  '/data-rights.html',
  '/volunteer.html'
]);
const APP_SHELL=[
  '/',
  '/index.html',
  '/freedom-wall.html',
  '/auth.html',
  '/manifest.webmanifest',
  '/assets/css/site.css',
  '/assets/css/icon-fix.css',
  '/assets/css/repair.css',
  '/assets/css/live-hotfix.css',
  '/assets/css/landing.css',
  '/assets/css/apple-mobile.css',
  '/assets/css/experience-refresh.css',
  '/assets/css/organized-pages.css',
  '/assets/css/fmb-polish.css',
  '/assets/css/fmb-content.css',
  '/assets/css/volunteer.css',
  '/assets/css/music-ui.css',
  '/assets/js/site.js',
  '/assets/js/live-hotfix.js',
  '/assets/js/volunteer.js',
  '/assets/js/music.js',
  '/assets/data/music-library.json',
  '/assets/images/music/fmb-calm-official-album-cover.jpg',
  '/assets/images/icon-transparent.png',
  '/assets/images/projects/senz-logo.png',
  '/assets/images/projects/cognita-logo.png',
  '/assets/images/app-icon-192.png',
  '/assets/images/app-icon-512.png',
  '/assets/images/volunteer/francine-leading-with-love-fmb.webp',
  '/assets/images/volunteer/community-and-volunteer-team.webp'
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
        return cached||await caches.match('/index.html')||Response.error();
      }
    })());
    return;
  }

  if(!['style','script','image','font','audio'].includes(request.destination))return;

  if(['style','script'].includes(request.destination)){
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
