/* V FORMI — service worker. Network-first (da se posodobitve vedno pokažejo), s predpomnilnikom kot rezervo offline. */
const CACHE = "vformi-v7";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./foods.js", "./recipes.js", "./exercises.js", "./blog.js", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;             // zunanjih klicev ne prestrezamo
  e.respondWith(
    fetch(e.request).then((res) => {                       // najprej omrežje
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))   // rezerva: predpomnilnik
  );
});
