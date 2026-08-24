/* ═══════════════════════════════════════════════════════════════════
   Yuniors Chill Zone — service worker (installability + offline fallback)

   Deliberately conservative: NETWORK FIRST for everything, always.
   The site's whole deploy story is "push to main, fresh in 80s with
   max-age=0" — this worker must never get in the way of that. The
   cache is only a fallback for when the network is down, filled
   opportunistically from successful responses.
   ═══════════════════════════════════════════════════════════════════ */
const CACHE='ycz-v1';
/* huge or streaming files stay out of the fallback cache */
const SKIP=/\.(mp4|sf2|zip)$/i;

self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;   /* never touch Supabase / CDN traffic */
  e.respondWith(
    fetch(req).then(res=>{
      if(res.ok&&res.type==='basic'&&!SKIP.test(url.pathname)){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      }
      return res;
    }).catch(async()=>{
      const hit=await caches.match(req);
      if(hit)return hit;
      if(req.mode==='navigate'){
        const home=await caches.match('/');
        if(home)return home;
      }
      return Response.error();
    })
  );
});
