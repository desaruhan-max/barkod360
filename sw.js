// BARKOD360 — internetsiz açılış için önbellek
const SURUM="v1023c";
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

// STT/TETT uyarısı: program kapalıyken de (Chrome izin verirse) günde 1–2 kez kontrol
function sktOzetOku(){ return new Promise(res=>{ const r=indexedDB.open("barkod360DB",1); r.onupgradeneeded=()=>{ try{ r.result.createObjectStore("kv"); }catch(e){} }; r.onerror=()=>res(null);
  r.onsuccess=()=>{ try{ const g=r.result.transaction("kv","readonly").objectStore("kv").get("sktOzet"); g.onsuccess=()=>res(g.result||null); g.onerror=()=>res(null); }catch(e){ res(null); } }; }); }
function gunFark(iso){ const a=new Date(iso.slice(0,10)+"T00:00:00"), b=new Date(); b.setHours(0,0,0,0); return Math.round((a-b)/864e5); }
async function sktKontrol(){
  const o=await sktOzetOku(); if(!o||!o.liste) return; const gun=o.gun||7;
  const l=o.liste.filter(x=>x.skt&&gunFark(x.skt)<=gun); if(!l.length) return;
  const g=l.filter(x=>gunFark(x.skt)<0).length; const tr=s=>s.slice(8,10)+"."+s.slice(5,7)+"."+s.slice(0,4);
  await self.registration.showNotification("BARKOD360 · STT/TETT uyarısı",{body:(g?g+" ürünün tarihi geçti. ":"")+(l.length-g)+" ürünün tarihi "+gun+" gün içinde doluyor.\n"+l.slice(0,4).map(x=>tr(x.skt)+" · "+x.ad+" ("+x.kres+")").join("\n"),icon:"ikon-192.png",badge:"ikon-192.png",tag:"skt"});
}
self.addEventListener("periodicsync",e=>{ if(e.tag==="skt-kontrol") e.waitUntil(sktKontrol()); });
self.addEventListener("notificationclick",e=>{ e.notification.close(); e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{ for(const c of cs){ if("focus" in c) return c.focus(); } return self.clients.openWindow("./"); })); });
