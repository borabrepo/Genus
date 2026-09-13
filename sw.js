/* Offline cache. 202609132300 is replaced by the build script, so a new build
   installs a fresh cache and drops the old one. */
const VERSION = "202609132300";
const CACHE = `genus-${VERSION}`;
const SHELL = "./index.html";
const ASSETS = [
  "./",
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

/* Some hosts answer a request for /index.html with a redirect to /. A response
   carrying the redirected flag cannot be used to satisfy a page navigation —
   Safari rejects it outright — so the shell is rebuilt as a plain 200 before it
   is stored, and again on the way out if an old cache still holds a marked one. */
function plain(body, source) {
  const headers = new Headers();
  const type = source.headers.get("content-type");
  if (type) headers.set("content-type", type);
  return new Response(body, { status: 200, statusText: "OK", headers });
}

async function cacheShell(cache) {
  const res = await fetch(SHELL, { cache: "reload" });
  if (!res.ok) throw new Error(`shell request failed (${res.status})`);
  await cache.put(SHELL, plain(await res.blob(), res));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.all([c.addAll(ASSETS), cacheShell(c)]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
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
    event.respondWith(
      (async () => {
        const hit = await caches.match(SHELL);
        if (hit && !hit.redirected) return hit;
        if (hit) return plain(await hit.blob(), hit);
        try {
          return await fetch(request);
        } catch {
          return new Response("Genus is offline and has nothing cached yet.", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
      })()
    );
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