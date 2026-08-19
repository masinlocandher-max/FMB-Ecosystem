const CACHE_NAME='fmb-site-shell-20260820-hygiene-v1';
const PUBLIC_PAGES=new Set([
  '/',
  '/index.html',
  '/aboutfmb/',
  '/projects/',
  '/withlovefmb/',
  '/communityengagements/',
  '/gethelp/',
  '/fmbandco/',
  '/news/',
  '/privacy-policy.html',
  '/membership-agreement.html',
  '/community-guidelines.html',
  '/data-rights.html'
]);
const APP_SHELL=['/','/index.html','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);await Promise.allSettled(APP_SHELL.map(url=>cache.add(new Request(url,{cache:'reload'}))));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));await self.clients.claim()})())});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
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
        return await caches.match(request,{ignoreSearch:true})||await caches.match('/index.html')||Response.error();
      }
    })());
    return;
  }
  if(!['style','script','image','font','audio','manifest'].includes(request.destination))return;
  if(['style','script','manifest'].includes(request.destination)){
    event.respondWith((async()=>{
      try{
        const response=await fetch(new Request(request,{cache:'no-store'}));
        if(response.ok){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone()).catch(()=>{})}
        return response;
      }catch{return await caches.match(request)||await caches.match(url.pathname)||Response.error()}
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(request,{ignoreSearch:true});
    const fresh=fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE_NAME);cache.put(request,response.clone()).catch(()=>{})}return response}).catch(()=>null);
    return cached||await fresh||Response.error();
  })());
});