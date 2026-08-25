const CACHE="strategisk-v6";
const RUNTIME="strategisk-v6-runtime";
const ASSETS=["./","./index.html","./style.css","./app.js","./chess-core.js","./manifest.json","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>![CACHE,RUNTIME].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  const runtimeAllowed=u.hostname==='unpkg.com'||u.hostname==='lichess1.org';
  if(runtimeAllowed){
    e.respondWith(caches.open(RUNTIME).then(async c=>{
      const cached=await c.match(e.request);
      try{const fresh=await fetch(e.request);if(fresh.ok)c.put(e.request,fresh.clone());return fresh}catch(_){return cached||Response.error()}
    }));return;
  }
  if(u.hostname==='lichess.org'&&u.pathname.startsWith('/api/puzzle/')){e.respondWith(fetch(e.request));return}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
