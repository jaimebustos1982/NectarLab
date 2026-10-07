// NectarLab · service worker
// Al publicar una versión nueva de index.html, cambia CACHE_NAME (por ejemplo, de -a a -b).
const CACHE_NAME = "nectarlab-2026.10.07-g";
const CORE = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js",
  "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/geometries/RoundedBoxGeometry.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE).then(() => Promise.all(CDN.map(u => fetch(u, {mode: "no-cors"}).then(r => c.put(u, r)).catch(() => {}))))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || req.url.includes("script.google.com") || req.url.includes("googleusercontent.com")) return;
  // la página: primero la red (para recibir actualizaciones), luego la copia guardada
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE_NAME).then(c => c.put("index.html", cp)); return r; }).catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(CACHE_NAME).then(c => c.put(req, cp)); }
    return r;
  })));
});
