const CACHE_NAME='fmb-app-shell-20260718-premium-member-app-v5-fmbandco-hero';
const PUBLIC_PAGES=new Set([
  '/',
  '/index.html',
  '/app/',
  '/app/index.html',
  '/about.html',
  '/auth.html',
  '/freedom-wall.html',
  '/ebooks/',
  '/music/',
  '/communityengagements/',
  '/aboutfmb/',
  '/fmb&co/',
  '/fmb&co/senz/',
  '/fmb&co/cognita/',
  '/fmbandco/',
  '/gethelp/',
  '/news/',
  '/news/cleopatra-barrera/',
  '/news/impeachment/',
  '/news/pax-silica/',
  '/news/good-news/',
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
  '/app/',
  '/app/index.html',
  '/app/app.css',
  '/app/app.js',
  '/app/access.js',
  '/app/manifest.webmanifest',
  '/freedom-wall.html',
  '/auth.html',
  '/news/cleopatra-barrera/',
  '/news/impeachment/',
  '/news/pax-silica/',
  '/news/good-news/',
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
  '/assets/css/fmbandco-brand.css',
  '/assets/css/fmb-content.css',
  '/assets/css/fmb-mobile-clean.css',
  '/assets/css/fmb-mobile-luxury.css',
  '/assets/css/website-responsive-parity.css',
  '/assets/css/centered-partner-marquee.css',
  '/assets/css/desktop-premium.css',
  '/assets/css/member-experience.css',
  '/assets/css/mobile-app.css',
  '/assets/css/az-assistant.css',
  '/assets/css/volunteer.css',
  '/assets/css/music-ui.css',
  '/assets/js/site.js',
  '/assets/js/config.js',
  '/assets/js/supabase-client.js',
  '/assets/js/live-hotfix.js',
  '/assets/js/volunteer.js',
  '/assets/js/music.js',
  '/assets/js/desktop-premium.js',
  '/assets/js/global-music.js',
  '/assets/js/az-assistant.js',
  '/assets/js/fmbandco-motion.js',
  '/assets/data/music-library.json',
  '/assets/images/music/fmb-calm-official-album-cover.jpg',
  '/assets/images/icon-transparent.png',
  '/assets/images/signature-transparent.png',
  '/assets/images/fmbandco/fmbandco-primary-transparent.png',
  '/assets/images/fmbandco/fmbandco-primary-clean.png',
  '/assets/images/fmbandco/fmbandco-primary-reversed.png',
  '/assets/images/fmbandco/fmbandco-ampersand-gold.png',
  '/assets/images/fmbandco/francine-founder-hero-640.webp',
  '/assets/images/fmbandco/francine-founder-hero-923.webp',
  '/assets/images/projects/senz-logo.png',
  '/assets/images/projects/cognita-logo.png',
  '/assets/images/projects/senz-logo-clean.png',
  '/assets/images/projects/cognita-logo-clean.png',
  '/assets/images/projects/senz-transparent.png',
  '/assets/images/projects/cognita-transparent.png',
  '/assets/images/news/cleopatra-barrera-zambales-ocean-feature.jpeg',
  '/assets/images/news/sara-duterte-impeachment.webp',
  '/assets/images/news/pax-silica-briefing.png',
  '/assets/images/news/good-news-briefing.png',
  '/assets/images/app-icon-192.png',
  '/assets/images/app-icon-512.png',
  '/assets/images/apple-touch-icon.png',
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

  // Audio is streamed with byte ranges. Never cache or rewrite these requests.
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
