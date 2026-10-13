// BARKOD360 — internetsiz açılış için önbellek
const SURUM="983a602c76";
const DOSYALAR=["./","index.html","manifest.webmanifest","ikon-192.png","ikon-512.png","ikon-maskable-512.png","lib/barkod-motoru.js","lib/yazi-okuma-motoru.js"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(SURUM).then(c=>c.addAll(DOSYALAR)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SURUM).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
// sayfa: önce internetten dene (güncel sürüm), olmazsa önbellek; diğer dosyalar: önce önbellek
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const sayfa=r.mode==="navigate";
  if(sayfa){ e.respondWith(fetch(r).then(y=>{ const k=y.clone(); caches.open(SURUM).then(c=>c.put("index.html",k)); return y; }).catch(()=>caches.match("index.html"))); return; }
  e.respondWith(caches.match(r).then(v=>v||fetch(r).then(y=>{ if(y.ok&&new URL(r.url).origin===location.origin){ const k=y.clone(); caches.open(SURUM).then(c=>c.put(r,k)); } return y; })));
});
