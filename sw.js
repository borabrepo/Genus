/* Offline cache. 202609131410 is replaced by the build script, so a new build
   installs a fresh cache and drops the old one. */
const VERSION = "202609131410";
const CACHE = `genus-${VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./app.css",
  "./words-de.txt",
  "./words-nl.txt",
  "./words-fr.txt",
  "./words-es.txt",
  "./words-it.txt",
  "./words-pt.txt",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // A page load always gets the cached shell first, so the app opens with no connection.
  if (request.mode === "navigate") {
    event.respondWith(caches.match("./index.html").then((hit) => hit || fetch(request)));
    return;
  }
  // Word-list updates from elsewhere must go to the network, never the cache.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
